const CurlyBracketParser = require('../src/curly-bracket-parser/curly-bracket-parser.js');
const LuckyCase = require('lucky-case');

const FileNotRetrievedError = require('../src/curly-bracket-parser/custom-errors/file-not-retrieved-error');
const FilterAlreadyRegisteredError = require('../src/curly-bracket-parser/custom-errors/filter-already-registered-error');
const InvalidFilterError = require('../src/curly-bracket-parser/custom-errors/invalid-filter-error');
const InvalidVariableError = require('../src/curly-bracket-parser/custom-errors/invalid-variable-error');
const UnresolvedVariablesError = require('../src/curly-bracket-parser/custom-errors/unresolved-variables-error');
const VariableAlreadyRegisteredError = require('../src/curly-bracket-parser/custom-errors/variable-already-registered-error');

const fs = require("fs");

const Tmp = require('tmp');

require('ruby-nice/object');

//----------------------------------------------------------------------------------------------------

describe('CurlyBracketParser.variables', function () {
    beforeEach(function () {
    });
    describe('extract variables from string', function () {
        it('parses a set of plain variables without filters', function () {
            const string = "Today {{one}} person walked {{two  }} times around {{ four_four}}";
            const expected_variables = ['{{one}}', '{{two  }}', '{{ four_four}}'];
            const variables = CurlyBracketParser.variables(string);
            expect(variables).toEqual(expected_variables);
        });
        it('parses a set of plain variables with filters', function () {
            const string = "Today {{one |snake_case}} person walked {{two| camel_case}} times around {{four_four  |  word_case}} big {{    cars  | train_case }}";
            const expected_variables = ['{{one |snake_case}}', '{{two| camel_case}}', '{{four_four  |  word_case}}', '{{    cars  | train_case }}'];
            const variables = CurlyBracketParser.variables(string);
            expect(variables).toEqual(expected_variables);
        });
    });
});

//----------------------------------------------------------------------------------------------------

describe('CurlyBracketParser.parse', function () {
    beforeEach(function () {
    });
    describe('plain variable parsing', function () {
        it('parses a set of plain variables without filters', function () {
            const variables = {
                one: "one",
                two: "Two",
                three: "FURY"
            };
            const string = "Today {{one}} person walked {{two}} times around {{three}}";
            const expected_string = "Today one person walked Two times around FURY";
            const parsed = CurlyBracketParser.parse(string, variables);
            expect(parsed).toEqual(expected_string);
        });
        it('parses a set of plain variables with spaces before or after name or filter without filters', function () {
            const variables = {
                one: "one",
                two: "Two",
                three: "FURY"
            };
            const string = "Today {{one }} person walked {{  two}} times around {{ three }}";
            const expected_string = "Today one person walked Two times around FURY";
            const parsed = CurlyBracketParser.parse(string, variables);
            expect(parsed).toEqual(expected_string);
        });
        it('parses a set of plain variables with filters', function () {
            const variables = {
                one: "one word case",
                two: "TwoPascalCase",
                three: "UPPER-DASH-CASE"
            };
            const string = "Today {{one|dash_case}} person walked {{two|snake_case}} times around {{three|camel_case}}";
            const expected_string = "Today one-word-case person walked two_pascal_case times around upperDashCase";
            const parsed = CurlyBracketParser.parse(string, variables);
            expect(parsed).toEqual(expected_string);
        });
        it('parses a set of plain variables with filters, spaces after/before names and filters', function () {
            const variables = {
                one: "one word case",
                two: "TwoPascalCase",
                three: "UPPER-DASH-CASE"
            };
            const string = "Today {{one|   dash_case}} person walked {{two    |   snake_case }} times around {{  three|camel_case  }}"
            const expected_string = "Today one-word-case person walked two_pascal_case times around upperDashCase"
            const parsed = CurlyBracketParser.parse(string, variables);
            expect(parsed).toEqual(expected_string);
        });
    });
    describe('use options for unresolved variables', function () {
        it('raises an error with one more variable in string', function () {
            const variables = {
                one: "one",
                two: "Two",
                three: "FURY"
            };
            const string = "Today {{one}} person walked {{two}} times around {{three}} {{four}}";
            expect(() => {
                CurlyBracketParser.parse(string, variables);
            }).toThrowError(UnresolvedVariablesError);
        });
        it('keeps the variable with one more variable in string', function () {
            const variables = {
                one: "one",
                two: "Two",
                three: "FURY"
            };
            const string = "Today {{one}} person walked {{two}} times around {{three}} {{four}}";
            const expected_string = "Today one person walked Two times around FURY {{four}}"
            const parsed = CurlyBracketParser.parse(string, variables, {unresolved_vars: "keep"});
            expect(parsed).toEqual(expected_string);
        });
        it('replaces the variable with one more variable in string by string', function () {
            const variables = {
                one: "one",
                two: "Two",
                three: "FURY"
            };
            const string = "Today {{one}} person walked {{two}} times around {{three}} {{four}}";
            const expected_string = "Today one person walked Two times around FURY ";
            const parsed = CurlyBracketParser.parse(string, variables, {
                unresolved_vars: "replace",
                replace_pattern: ''
            });
            expect(parsed).toEqual(expected_string);
        });
        it('replaces the variable with one more variable in string by pattern with var name', function () {
            const variables = {
                one: "one",
                two: "Two",
                three: "FURY"
            };
            const string = "Today {{one}} person walked {{two}} times around {{three}} {{four}}";
            const expected_string = "Today one person walked Two times around FURY ##four##";
            const parsed = CurlyBracketParser.parse(string, variables, {
                unresolved_vars: "replace",
                replace_pattern: '##$1##'
            });
            expect(parsed).toEqual(expected_string);
        });
        it('replaces the variable with one more variable in string by pattern with filter', function () {
            const variables = {
                one: "one",
                two: "Two",
                three: "FURY"
            };
            const string = "Today {{one}} person walked {{two}} times around {{three}} {{four|filtered}}";
            const expected_string = "Today one person walked Two times around FURY ##four:filtered##";
            const parsed = CurlyBracketParser.parse(string, variables, {
                unresolved_vars: "replace",
                replace_pattern: '##$1:$2##'
            });
            expect(parsed).toEqual(expected_string);
        });
    });
});

//----------------------------------------------------------------------------------------------------

describe('CurlyBracketParser.parseFile', function () {
    beforeEach(function () {
    });
    describe('plain variable parsing inside a file:', function () {
        it('parses a set of plain variables without filters inside a file', function () {
            const variables = {
                one: "one",
                two: "Two",
                three: "FURY"
            };
            const source_string = "Today {{one}} person walked {{two}} times around {{three}}";
            let tmp_file_object = Tmp.fileSync({prefix: 'jasmine-test-1-'});
            fs.writeFileSync(tmp_file_object.name, source_string);
            const expected_string = "Today one person walked Two times around FURY";
            const parsed = CurlyBracketParser.parseFile(tmp_file_object.name, variables);
            expect(parsed).toEqual(expected_string); // string parsed
            expect(fs.readFileSync(tmp_file_object.name, 'utf-8').toString()).toEqual(source_string); // source file remains unmodified
            Tmp.setGracefulCleanup();
        });
        it('parses a set of plain variables with spaces before or after name or filter without filters', function () {
            const variables = {
                one: "one",
                two: "Two",
                three: "FURY"
            };
            const source_string = "Today {{one }} person walked {{  two}} times around {{ three }}";
            let tmp_file_object = Tmp.fileSync({prefix: 'jasmine-test-2-'});
            fs.writeFileSync(tmp_file_object.name, source_string);
            const expected_string = "Today one person walked Two times around FURY";
            const parsed = CurlyBracketParser.parseFile(tmp_file_object.name, variables);
            expect(parsed).toEqual(expected_string); // string parsed
            expect(fs.readFileSync(tmp_file_object.name, 'utf-8').toString()).toEqual(source_string); // source file remains unmodified
            Tmp.setGracefulCleanup();
        });
        it('parses a set of plain variables with filters', function () {
            const variables = {
                one: "one word case",
                two: "TwoPascalCase",
                three: "UPPER-DASH-CASE"
            };
            const source_string = "Today {{one|dash_case}} person walked {{two|snake_case}} times around {{three|camel_case}}";
            let tmp_file_object = Tmp.fileSync({prefix: 'jasmine-test-3-'});
            fs.writeFileSync(tmp_file_object.name, source_string);
            const expected_string = "Today one-word-case person walked two_pascal_case times around upperDashCase";
            const parsed = CurlyBracketParser.parseFile(tmp_file_object.name, variables);
            expect(parsed).toEqual(expected_string); // string parsed
            expect(fs.readFileSync(tmp_file_object.name, 'utf-8').toString()).toEqual(source_string); // source file remains unmodified
            Tmp.setGracefulCleanup();
        });
        it('parses a set of plain variables with filters, spaces after/before names and filters', function () {
            const variables = {
                one: "one word case",
                two: "TwoPascalCase",
                three: "UPPER-DASH-CASE"
            };
            const source_string = "Today {{one|   dash_case}} person walked {{two    |   snake_case }} times around {{  three|camel_case  }}";
            let tmp_file_object = Tmp.fileSync({prefix: 'jasmine-test-4-'});
            fs.writeFileSync(tmp_file_object.name, source_string);
            const expected_string = "Today one-word-case person walked two_pascal_case times around upperDashCase";
            const parsed = CurlyBracketParser.parseFile(tmp_file_object.name, variables);
            expect(parsed).toEqual(expected_string); // string parsed
            expect(fs.readFileSync(tmp_file_object.name, 'utf-8').toString()).toEqual(source_string); // source file remains unmodified
            Tmp.setGracefulCleanup();
        });
    });
});

//----------------------------------------------------------------------------------------------------

describe('CurlyBracketParser.parseFileWrite', function () {
    beforeEach(function () {
    });
    describe('plain variable parsing inside a file:', function () {
        it('parses a set of plain variables without filters inside a file', function () {
            const variables = {
                one: "one",
                two: "Two",
                three: "FURY"
            };
            const source_string = "Today {{one}} person walked {{two}} times around {{three}}";
            let tmp_file_object = Tmp.fileSync({prefix: 'jasmine-test-1-'});
            fs.writeFileSync(tmp_file_object.name, source_string);
            const expected_string = "Today one person walked Two times around FURY";
            const parsed = CurlyBracketParser.parseFileWrite(tmp_file_object.name, variables);
            expect(parsed).toEqual(expected_string); // string parsed
            expect(fs.readFileSync(tmp_file_object.name, 'utf-8').toString()).toEqual(expected_string); // source file remains unmodified
            Tmp.setGracefulCleanup();
        });
        it('parses a set of plain variables with spaces before or after name or filter without filters', function () {
            const variables = {
                one: "one",
                two: "Two",
                three: "FURY"
            };
            const source_string = "Today {{one }} person walked {{  two}} times around {{ three }}";
            let tmp_file_object = Tmp.fileSync({prefix: 'jasmine-test-2-'});
            fs.writeFileSync(tmp_file_object.name, source_string);
            const expected_string = "Today one person walked Two times around FURY";
            const parsed = CurlyBracketParser.parseFileWrite(tmp_file_object.name, variables);
            expect(parsed).toEqual(expected_string); // string parsed
            expect(fs.readFileSync(tmp_file_object.name, 'utf-8').toString()).toEqual(expected_string); // source file remains unmodified
            Tmp.setGracefulCleanup();
        });
        it('parses a set of plain variables with filters', function () {
            const variables = {
                one: "one word case",
                two: "TwoPascalCase",
                three: "UPPER-DASH-CASE"
            };
            const source_string = "Today {{one|dash_case}} person walked {{two|snake_case}} times around {{three|camel_case}}";
            let tmp_file_object = Tmp.fileSync({prefix: 'jasmine-test-3-'});
            fs.writeFileSync(tmp_file_object.name, source_string);
            const expected_string = "Today one-word-case person walked two_pascal_case times around upperDashCase";
            const parsed = CurlyBracketParser.parseFileWrite(tmp_file_object.name, variables);
            expect(parsed).toEqual(expected_string); // string parsed
            expect(fs.readFileSync(tmp_file_object.name, 'utf-8').toString()).toEqual(expected_string); // source file remains unmodified
            Tmp.setGracefulCleanup();
        });
        it('parses a set of plain variables with filters, spaces after/before names and filters', function () {
            const variables = {
                one: "one word case",
                two: "TwoPascalCase",
                three: "UPPER-DASH-CASE"
            };
            const source_string = "Today {{one|   dash_case}} person walked {{two    |   snake_case }} times around {{  three|camel_case  }}";
            let tmp_file_object = Tmp.fileSync({prefix: 'jasmine-test-4-'});
            fs.writeFileSync(tmp_file_object.name, source_string);
            const expected_string = "Today one-word-case person walked two_pascal_case times around upperDashCase";
            const parsed = CurlyBracketParser.parseFileWrite(tmp_file_object.name, variables);
            expect(parsed).toEqual(expected_string); // string parsed
            expect(fs.readFileSync(tmp_file_object.name, 'utf-8').toString()).toEqual(expected_string); // source file remains unmodified
            Tmp.setGracefulCleanup();
        });
    });
});

//----------------------------------------------------------------------------------------------------

describe('CurlyBracketParser.registerFilter', function () {
    beforeEach(function () {
        CurlyBracketParser.registered_filters = {};
    });
    describe('register and use custom filters', function () {
        it('includes a registered filter after registration', function () {
            const filter_name = 'my_one';
            CurlyBracketParser.registerFilter(filter_name, (string) => {
                return string;
            });
            expect(CurlyBracketParser.validFilters()).toContain(filter_name);
        });
        it('can not register/overwrite a default filter', function () {
            expect(() => {
                const filter_name = 'SNAKE_CASE';
                CurlyBracketParser.registerFilter(filter_name, (string) => {
                    return string;
                });
            }).toThrowError(FilterAlreadyRegisteredError);
        });
        it('can not register/overwrite a default filter lower case', function () {
            expect(() => {
                const filter_name = 'snake_case';
                CurlyBracketParser.registerFilter(filter_name, (string) => {
                    return string;
                });
            }).toThrowError(FilterAlreadyRegisteredError);
        });
        it('can not register/overwrite a new registered filter', function () {
            const filter_name = 'my_second';
            CurlyBracketParser.registerFilter(filter_name, (string) => {
                return string;
            });
            expect(() => {
                CurlyBracketParser.registerFilter(filter_name, (string) => {
                    return string;
                });
            }).toThrowError(FilterAlreadyRegisteredError);
        });
        it('can use a registered filter #1', function () {
            const filter_name = 'duplicate';
            CurlyBracketParser.registerFilter(filter_name, (string) => {
                return string + "" + string;
            });
            expect(CurlyBracketParser.processFilter(filter_name, "hooray")).toEqual("hoorayhooray");
        });
        it('can use a registered filter #2', function () {
            const filter_name = 'snake_cake';
            CurlyBracketParser.registerFilter(filter_name, (string) => {
                return LuckyCase.toSnakeCase(string);
            });
            expect(CurlyBracketParser.processFilter(filter_name, "TheSaladTastesSour")).toEqual("the_salad_tastes_sour");
        });
        it('can not use a unknown filter', function () {
            const filter_name = 'unknown_filter';
            expect(() => {
                CurlyBracketParser.processFilter(filter_name, "someString");
            }).toThrowError(InvalidFilterError);
        });
    });
});

//----------------------------------------------------------------------------------------------------

describe('CurlyBracketParser.registerDefaultVar', function () {
    beforeEach(function () {
        CurlyBracketParser.registered_default_vars = {};
    });
    describe('register and use default variables', function () {
        it('includes a registered variable automatically after registration', function () {
            const variable_name = 'my_default1';
            const variable_value = 'MySuperValue1';
            CurlyBracketParser.registerDefaultVar(variable_name, () => {
                return variable_value;
            });
            expect(CurlyBracketParser.registeredDefaultVars()).toContain(variable_name);
        });
        it('includes a registered variable automatically after registration #2', function () {
            const variable_name = 'my_default11';
            const variable_value = 'MySuperValue11';
            CurlyBracketParser.registerDefaultVar(variable_name, () => {
                return variable_value;
            });
            expect(CurlyBracketParser.isRegisteredDefaultVar(variable_name)).toEqual(true);
        });
        it('can not register/overwrite a existing registered variable', function () {
            const variable_name = 'my_default2';
            const variable_value = 'MySuperValue2';
            CurlyBracketParser.registerDefaultVar(variable_name, () => {
                return variable_value;
            });
            expect(() => {
                CurlyBracketParser.registerDefaultVar(variable_name, () => {
                    return variable_value;
                });
            }).toThrowError(VariableAlreadyRegisteredError);
        });
        it('can process default variable', function () {
            const variable_name = 'my_default7';
            const variable_value = 'MySuperValue7';
            CurlyBracketParser.registerDefaultVar(variable_name, () => {
                return variable_value;
            });
            expect(CurlyBracketParser.processDefaultVar(variable_name)).toEqual(variable_value);
        });
        it('can use a registered default value #1', function () {
            const variable_name = 'my_default3';
            const variable_value = 'MySuperValue3';
            CurlyBracketParser.registerDefaultVar(variable_name, () => {
                return variable_value;
            });
            expect(CurlyBracketParser.parse(`Some{{${variable_name}}}Good`)).toEqual(`Some${variable_value}Good`);
        });
        it('can overwrite a registered default value by parameter', function () {
            const variable_name = 'my_default9';
            const variable_value = 'MySuperValue9';
            CurlyBracketParser.registerDefaultVar(variable_name, () => {
                return variable_value;
            });
            expect(CurlyBracketParser.parse(`Some{{${variable_name}}}Good`, {my_default9: 'Overwritten'})).toEqual("SomeOverwrittenGood");
        });
        it('can overwrite a registered default value by function', function () {
            const variable_name = 'my_default22';
            const variable_value = 'MySuperValue22';
            const variable_overwrite_value = 'MySuperValue77';
            CurlyBracketParser.registerDefaultVar(variable_name, () => {
                return variable_value;
            });
            CurlyBracketParser.registerDefaultVar(variable_name, () => {
                return variable_overwrite_value;
            }, {overwrite: true});
            expect(CurlyBracketParser.parse(`Some{{${variable_name}}}Good`)).toEqual(`Some${variable_overwrite_value}Good`);
        });
    });
});

//----------------------------------------------------------------------------------------------------

describe('CurlyBracketParser.unregisterDefaultVar', function () {
    beforeEach(function () {
        CurlyBracketParser.registered_default_vars = {};
    });
    describe('unregister default variables', function () {
        it('registers and unregisters a default variable', function () {
            const variable_name = 'my_default_un';
            const variable_value = 'MySuperValueUn';
            CurlyBracketParser.registerDefaultVar(variable_name, () => {
                return variable_value;
            });
            expect(CurlyBracketParser.registeredDefaultVars()).toContain(variable_name);
            CurlyBracketParser.unregisterDefaultVar(variable_name);
            expect(CurlyBracketParser.registeredDefaultVars()).not.toContain(variable_name);
        });
    });
});

//----------------------------------------------------------------------------------------------------

describe('CurlyBracketParser.decodedVariables', function () {
    beforeEach(function () {
    });
    describe('decode a string and get its variables', function () {
        it('decode string with several variables, with and without filters', function () {
            const string = 'This is my {{var1}} super string, containing {{count|filter_some}} variables and a lot of {{fun}}';
            const decoded_variables = CurlyBracketParser.decodedVariables(string)
            expect(decoded_variables.map((e) => {
                return e.name
            }).flat()).toEqual(['var1', 'count', 'fun']);
            expect(decoded_variables.map((e) => {
                return e.filter
            }).flat()).toEqual([null, 'filter_some', null]);
        });
    });
});

//----------------------------------------------------------------------------------------------------
// Bugfix endless loop when using nested variables
//----------------------------------------------------------------------------------------------------
describe('CurlyBracketParser.parse', function () {
    beforeEach(function () {
    });
    describe('Using nested variables', function () {
        it('loops not endless', function () {
            const test_map = {
                animal: 'bug',
                this_animal: 'This is a {{animal}}',
                which_animal: 'Which animal? {{this_animal}}'
            };
            expect(CurlyBracketParser.parse(test_map['animal'], test_map)).toEqual('bug');
            expect(CurlyBracketParser.parse(test_map['this_animal'], test_map)).toEqual('This is a bug');
            console.log(" If you see this for more than a few seconds and no more (green) dots after this text appear, this test is for sure failing in an endless loop!");
            expect(CurlyBracketParser.parse(test_map['which_animal'], test_map)).toEqual('Which animal? This is a bug');
        });
    });
});

//----------------------------------------------------------------------------------------------------

describe('CurlyBracketParser.parse', function () {
    beforeEach(function () {
    });
    describe('Using embedded variables', function () {
        it('embeds a single quoted string', function () {
            expect(CurlyBracketParser.parse("This is a normal {{variable}} and a {{'embedded'}} one.", {variable: 'variable'}))
                .toEqual('This is a normal variable and a embedded one.');
        });
        it('embeds a single quoted string with filter', function () {
            expect(CurlyBracketParser.parse("This is a normal {{variable}} and a {{'embedded'|pascal_case}} one.", {variable: 'variable'}))
                .toEqual('This is a normal variable and a Embedded one.');
        });
        it('embeds a single quoted string with filter and white spaces', function () {
            expect(CurlyBracketParser.parse("This is a normal {{variable}} and a {{ 'embedded'   | pascal_case  }} one.", {variable: 'variable'}))
                .toEqual('This is a normal variable and a Embedded one.');
        });
        it('embeds a double quoted string', function () {
            expect(CurlyBracketParser.parse(`This is a normal {{variable}} and a {{"embedded"}} one.`, {variable: 'variable'}))
                .toEqual('This is a normal variable and a embedded one.');
        });
        it('embeds a double quoted string with filter', function () {
            expect(CurlyBracketParser.parse(`This is a normal {{variable}} and a {{"embedded"|pascal_case}} one.`, {variable: 'variable'}))
                .toEqual('This is a normal variable and a Embedded one.');
        });
        it('embeds integers without filters', function () {
            expect(CurlyBracketParser.parse("Peter is {{3}} years old.")).toEqual("Peter is 3 years old.");
            expect(CurlyBracketParser.parse("Peter is {{77}} years old.")).toEqual("Peter is 77 years old.");
            expect(CurlyBracketParser.parse("Peter is {{500_000}} years old.")).toEqual("Peter is 500000 years old.");
        });
        it('embeds integers without with filters', function () {
            CurlyBracketParser.registerFilter('double', (val) => {
               return val*2;
            });
            expect(CurlyBracketParser.parse("Peter is {{3|double}} years old.")).toEqual("Peter is 6 years old.");
            expect(CurlyBracketParser.parse("Peter is {{77|double}} years old.")).toEqual("Peter is 154 years old.");
            expect(CurlyBracketParser.parse("Peter is {{500_000|double}} years old.")).toEqual("Peter is 1000000 years old.");
        });
        it('embeds floating point numbers without filters', function () {
            expect(CurlyBracketParser.parse("Peter is {{3.0}} years old.")).toEqual("Peter is 3 years old.");
            expect(CurlyBracketParser.parse("Peter is {{7.}} years old.")).toEqual("Peter is 7 years old.");
            expect(CurlyBracketParser.parse("Peter is {{7.5}} years old.")).toEqual("Peter is 7.5 years old.");
            expect(CurlyBracketParser.parse("Peter is {{0.8}} years old.")).toEqual("Peter is 0.8 years old.");
            expect(CurlyBracketParser.parse("Peter is {{.9}} years old.")).toEqual("Peter is 0.9 years old.");
            expect(CurlyBracketParser.parse("Peter is {{500_0.00}} years old.")).toEqual("Peter is 5000 years old.");
        });
        it('does not embed invalid integers', function () {
            expect(() => {
                CurlyBracketParser.parse("Peter is {{3_}} years old.");
            }).toThrowError(UnresolvedVariablesError);
        });
        it('embeds a single quoted string without content', function () {
            expect(CurlyBracketParser.parse("This is a normal {{variable}} and a {{''}} one.", {variable: 'variable'}))
                .toEqual('This is a normal variable and a  one.');
        });
        it('embeds a single quoted string with white space content', function () {
            expect(CurlyBracketParser.parse("This is a normal {{variable}} and a {{' '}} one.", {variable: 'variable'}))
                .toEqual('This is a normal variable and a   one.');
        });
        it('embeds a double quoted string without content', function () {
            expect(CurlyBracketParser.parse(`This is a normal {{variable}} and a {{""}} one.`, {variable: 'variable'}))
                .toEqual('This is a normal variable and a  one.');
        });
        it('embeds a double quoted string with white space content', function () {
            expect(CurlyBracketParser.parse(`This is a normal {{variable}} and a {{" "}} one.`, {variable: 'variable'}))
                .toEqual('This is a normal variable and a   one.');
        });
        it('embeds a single quoted string without content and filter', function () {
            expect(CurlyBracketParser.parse(`This is a normal {{variable}} and a {{''|pascal_case}} one.`, {variable: 'variable'}))
                .toEqual('This is a normal variable and a  one.');
        });
        it('embeds a double quoted string without content and filter', function () {
            expect(CurlyBracketParser.parse(`This is a normal {{variable}} and a {{""|pascal_case}} one.`, {variable: 'variable'}))
                .toEqual('This is a normal variable and a  one.');
        });
        it('embeds a empty content with filter', function () {
            expect(CurlyBracketParser.parse(`This is a normal {{variable}} and a {{|pascal_case}} one.`, {variable: 'variable'}))
                .toEqual('This is a normal variable and a  one.');
        });
        it('embeds a empty content without filter', function () {
            expect(CurlyBracketParser.parse(`This is a normal {{variable}} and a {{}} one.`, {variable: 'variable'}))
                .toEqual('This is a normal variable and a  one.');
        });
        it('embeds a empty content with empty filter', function () {
            expect(CurlyBracketParser.parse(`This is a normal {{variable}} and a {{|}} one.`, {variable: 'variable'}))
                .toEqual('This is a normal variable and a  one.');
        });
        it('embeds a single quoted content without filter', function () {
            expect(CurlyBracketParser.parse(`This is a normal {{'variable'}}.`, {variable: 'variable'}))
                .toEqual('This is a normal variable.');
        });
        it('embeds a double quoted content without filter', function () {
            expect(CurlyBracketParser.parse(`This is a normal {{"variable"}}.`, {variable: 'variable'}))
                .toEqual('This is a normal variable.');
        });
        it('embeds a integer number written in hex', function () {
            expect(CurlyBracketParser.parse("Peter is {{0x111}} years old.")).toEqual("Peter is 273 years old.");
            expect(CurlyBracketParser.parse("Peter is {{0xFf}} years old.")).toEqual("Peter is 255 years old.");
        });
    });
});

//----------------------------------------------------------------------------------------------------
// Bugfix error when undefined (or NaN or Infinity or null) variables are passed
//----------------------------------------------------------------------------------------------------
describe('CurlyBracketParser.parse', function () {
    beforeEach(function () {
    });
    describe('Using empty variables', function () {
        it('uses an undefined variable parameter', function () {
            console.log(" If you see this for more than a few seconds and no more (green) dots after this text appear, this test is for sure failing in an endless loop!");
            expect(CurlyBracketParser.parse("See my {{variable}} here!", { variable: undefined })).toEqual('See my  here!');
        });
        it('uses a null variable parameter', function () {
            expect(CurlyBracketParser.parse("See my {{variable}} here!", { variable: null })).toEqual('See my  here!');
        });
        it('uses an NaN variable parameter', function () {
            expect(CurlyBracketParser.parse("See my {{variable}} here!", { variable: NaN })).toEqual('See my  here!');
        });
        it('uses a Infinity variable parameter', function () {
            expect(CurlyBracketParser.parse("See my {{variable}} here!", { variable: Infinity })).toEqual('See my  here!');
        });
        it('uses an empty string variable parameter', function () {
            expect(CurlyBracketParser.parse("See my {{variable}} here!", { variable: '' })).toEqual('See my  here!');
        });
    });
});

//----------------------------------------------------------------------------------------------------
// Performance test, thanks to Manfred Steiniger for reporting
//----------------------------------------------------------------------------------------------------
describe('CurlyBracketParser.parse', function () {
    beforeEach(function () {
    });
    describe('Check the common parse performance', function () {
        it('parses 25_000 templates below 1 second', function () {
            let variables = {};
            for(let i = 0; i < 250; ++i) {
                variables["variable.key.performance.test" + i] = [1,"one",false,null,"{{sub_variable}}","{{'SomeString'|snake_case}}"].getSample();
            }
            const benchmark_begin = Date.now();
            for(let i = 0; i < 25_000; ++i) {
                let template = ["{{variable}}",'','0',"{{'SomeString'|dash_case}}"].getSample();
                CurlyBracketParser.parse(template, variables, { unresolved_vars: 'replace' });
            }
            const benchmark_end = Date.now();
            const duration_ms = benchmark_end - benchmark_begin;
            console.log("Common parse benchmark took " + duration_ms + "ms.");
            expect(duration_ms).toBeLessThan(1000, `Benchmark should have been taken less than 1000ms but took ${duration_ms}ms`);
        });
    });
});

//----------------------------------------------------------------------------------------------------

describe('CurlyBracketParser._isTreeVariableString', function () {
    beforeEach(function () {
    });
    describe('Check tree variable string', function () {
        it('detects valid tree variable strings', function () {
            const variables = [
              'this.is.valid',
              '1this8.8is8.8valid8',
              'lökijThis8._is8.8valid8_',
              '_Thisss8.is.valid',
            ];
            variables.forEach((val) => {
                expect(CurlyBracketParser._isTreeVariableString(val)).toEqual(true);
            });
        });
        it('detects invalid tree variable strings', function () {
            const variables = [
              'this_is_not_a_tree',
              'this.has.two..dots',
              '.dot.at.the.beginning',
              'dot.at.the.end.',
              '.dot.at.the.end.and.begin.',
              '..',
              '...',
              '.',
            ];
            variables.forEach((val) => {
                expect(CurlyBracketParser._isTreeVariableString(val)).toEqual(false);
            });
        });
    });
});

//----------------------------------------------------------------------------------------------------

describe('CurlyBracketParser.parse', function () {
    beforeEach(function () {
    });
    describe('Using tree variables', function () {
        it('uses valid tree variable', function () {
            const variables = {
                var1: {
                    sub1: {
                        last: "tree value"
                    }
                }
            }
            expect(CurlyBracketParser.parse("See my {{var1.sub1.last}} here!", variables)).toEqual('See my tree value here!');
        });
        it('uses a non existing tree variable', function () {
            const variables = {
                var1: {
                    sub1: {
                        last: "tree value"
                    }
                }
            }
            expect(() => {
                CurlyBracketParser.parse("See my {{does.not.exist}} here!", variables);
            }).toThrowError(UnresolvedVariablesError);
            expect(CurlyBracketParser.parse("See my {{does.not.exist}} here!", variables, { unresolved_vars: "keep"}))
                .toEqual("See my {{does.not.exist}} here!");
        });
        it('uses a non existing tree sub variable', function () {
            const variables = {
                var1: {
                    sub1: {
                        last: "tree value"
                    }
                }
            }
            expect(() => {
                CurlyBracketParser.parse("See my {{var1.does.not.exist}} here!", variables);
            }).toThrowError(UnresolvedVariablesError);
        });
        it('uses a tree variable containing a object', function () {
            const variables = {
                first: {
                    second: {
                        third: "third value"
                    }
                }
            }
            expect(CurlyBracketParser.parse("See my {{first.second}} here!", variables)).toEqual('See my [object Object] here!');
        });
    });
});

//----------------------------------------------------------------------------------------------------
// BENCHMARK PLAYGROUND
//----------------------------------------------------------------------------------------------------

describe('CurlyBracketParser benchmark playground', function () {
    beforeEach(function () {
    });
    describe('benchmark two functions', function () {
        it('benchmarks _extractTreeVariable', function () {
            return; // SKIP BENCHMARK
            let variables = { test: {}};
            variables.test.one = [1,"one",false,null,"{{sub_variable}}","{{'SomeString'|snake_case}}"].getSample();
            variables.test.two = [1,"one",false,null,"{{sub_variable}}","{{'SomeString'|snake_case}}"].getSample();
            variables.test.three = [1,"one",false,null,"{{sub_variable}}","{{'SomeString'|snake_case}}"].getSample();
            const benchmark_begin = Date.now();
            for(let i = 0; i < 250_000; ++i) {
                let name = ['test.one','test.two','test.three'].getSample();
                CurlyBracketParser._extractTreeVariable(variables, name);
            }
            const benchmark_end = Date.now();
            const duration_ms = benchmark_end - benchmark_begin;
            console.log("Benchmark for _extractTreeVariable took " + duration_ms + "ms.");
            expect(duration_ms).toBeLessThan(1000, `Benchmark should have been taken less than 1000ms but took ${duration_ms}ms`);
        });
        it('benchmarks _extractTreeVariable', function () {
            return; // SKIP BENCHMARK
            let variables = { test: {}};
            variables.test.one = [1,"one",false,null,"{{sub_variable}}","{{'SomeString'|snake_case}}"].getSample();
            variables.test.two = [1,"one",false,null,"{{sub_variable}}","{{'SomeString'|snake_case}}"].getSample();
            variables.test.three = [1,"one",false,null,"{{sub_variable}}","{{'SomeString'|snake_case}}"].getSample();
            const benchmark_begin = Date.now();
            for(let i = 0; i < 250_000; ++i) {
                let name = ['test.one','test.two','test.three'].getSample();
                CurlyBracketParser._extractTreeVariable(variables, name);
            }
            const benchmark_end = Date.now();
            const duration_ms = benchmark_end - benchmark_begin;
            console.log("Benchmark for _extractTreeVariable took " + duration_ms + "ms.");
            expect(duration_ms).toBeLessThan(1000, `Benchmark should have been taken less than 1000ms but took ${duration_ms}ms`);
        });
    });
});