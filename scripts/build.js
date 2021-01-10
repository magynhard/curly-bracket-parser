/**
 * release build script
 */
const fs = require("fs");
const util = require('util');
const exec = require("child_process").exec;
const exec_prom = util.promisify(exec);
const { spawn } = require("child_process");
const LuckyCase = require('lucky-case');
const chalk = require('chalk');

const CurlyBracketParser = require('./../src/curly-bracket-parser/curly-bracket-parser');

const build_destination_dir = './dist/';

const build_exclusion_markers = [
    /\/\/<!-- MODULE -->\/\/(.*?)\/\/<!-- \/MODULE -->\/\//gs,
    /\/\/<!-- DOC -->\/\/(.*?)\/\/<!-- \/DOC -->\/\//gs,
]

const version_regex = /"version":\s*"([^"]*)"/sgm;

const release_header_template = `/**
 * curly-bracket-parser
 *
 * Simple parser to replace variables inside templates/strings and files
 *
 * @version {{version}}
 * @date {{date}}
 * @link https://github.com/magynhard/curly-bracket-parser
 * @author Matthäus J. N. Beyrle
 * @copyright Matthäus J. N. Beyrle
 */
`;

const builds = {
    default_build: {
        destination_file: build_destination_dir + 'curly-bracket-parser.js',
        destination_min_file: build_destination_dir + 'curly-bracket-parser.min.js',
        source_files: [
            './src/curly-bracket-parser/curly-bracket-parser.js',
            './src/curly-bracket-parser/custom-errors/file-not-retrieved-error.js',
            './src/curly-bracket-parser/custom-errors/filter-already-registered-error.js',
            './src/curly-bracket-parser/custom-errors/invalid-filter-error.js',
            './src/curly-bracket-parser/custom-errors/invalid-variable-error.js',
            './src/curly-bracket-parser/custom-errors/unresolved-variables-error.js',
            './src/curly-bracket-parser/custom-errors/variable-already-registered-error.js',
    ]},
    bundle_build: {
        destination_file: build_destination_dir + 'curly-bracket-parser.bundle.js',
        destination_min_file: build_destination_dir + 'curly-bracket-parser.bundle.min.js',
        source_files: [
            './src/curly-bracket-parser/curly-bracket-parser.js',
            './src/curly-bracket-parser/custom-errors/file-not-retrieved-error.js',
            './src/curly-bracket-parser/custom-errors/filter-already-registered-error.js',
            './src/curly-bracket-parser/custom-errors/invalid-filter-error.js',
            './src/curly-bracket-parser/custom-errors/invalid-variable-error.js',
            './src/curly-bracket-parser/custom-errors/unresolved-variables-error.js',
            './src/curly-bracket-parser/custom-errors/variable-already-registered-error.js',
            './node_modules/lucky-case/dist/lucky-case.js',
    ]}
}

function version() {
    const package_json = fs.readFileSync('./package.json','utf8');
    version_regex.lastIndex = 0;
    return version_regex.exec(package_json)[1];
}

function releaseTemplate() {
    return release_header_template.replace('{{version}}', version()).replace('{{date}}',(new Date).toISOString());
}

function prependToFile(file, string) {
    const org_file = fs.readFileSync(file,'utf8');
    fs.writeFileSync(file, string + org_file);
}

console.log(chalk.yellow('###################################'));
console.log(chalk.yellow('# CurlyBracketParser build script'));
console.log(chalk.yellow('###################################'));
console.log('Building JS ...');
for(let build_key of Object.keys(builds)) {
    const build = builds[build_key];
    console.log(` ${chalk.yellow('-')} ${LuckyCase.toSentenceCase(build_key)} ...`);
    if (fs.existsSync(build.destination_file)) {
        fs.unlinkSync(build.destination_file);
    }
    console.log(`${chalk.yellow('    - transpile and minify')} ...`);
    (function buildRawDestinationFile() {
        let final_file = "";
        build.source_files.forEach((source_file) => {
           final_file += fs.readFileSync(source_file, 'utf8') + "\n";
        });
        build_exclusion_markers.forEach((regex) => {
           final_file = final_file.replace(regex,'');
        });
        fs.writeFileSync(build.destination_file, releaseTemplate() + final_file);
    })();
    (async function createMinifiedBuilds() {
        const babel_command = `babel ${build.destination_file} --no-comments --out-file ${build.destination_min_file}`;
        const uglify_command = `uglifyjs ${build.destination_min_file} -m -c -o ${build.destination_min_file}`;
        console.log(babel_command + ' && ' + uglify_command);
        await exec_prom(babel_command + ' && ' + uglify_command).then(() => {
            prependToFile(build.destination_min_file, releaseTemplate());
        });
    })();
}

console.log(chalk.green('All done!'));
