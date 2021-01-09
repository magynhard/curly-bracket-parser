//<!-- MODULE -->//
if (typeof require === 'function') {
    var UnresolvedVariablesError = require('./custom-errors/unresolved-variables-error.js');
    var InvalidFilterError = require('./custom-errors/invalid-filter-error.js');
    var LuckyCase = require('lucky-case');
}
//<!-- /MODULE -->//
/**
 * CurlyBracketParser
 *
 * Parse variables with curly brackets within templates/strings or files
 *
 * Use filters for special cases
 *
 */
class CurlyBracketParser {
    /**
     * Parse given string and replace the included variables by the given variables
     *
     * @param {string} string
     * @param {object<string, string>} variables <key <-> value>
     * @param {object} options
     * @param {('throw'|'keep'|'replace')} options.unresolved_vars 'throw', 'keep', 'replace' => define how to act when unresolved variables within the string are found.
     * @param {string} options.replace_pattern pattern used when param unresolved_vars is set to 'replace'. You can include the var name $1 and filter $2. Empty string to remove unresolved variables.
     */
    static parse(string, variables = {}, options = { unresolved_vars: "throw", replace_pattern: "##$1##"}) {
        const self = CurlyBracketParser;
        const default_options = {
            unresolved_vars: "throw", replace_pattern: "##$1##"
        }
        options = Object.assign(default_options, options);
        variables = variables || {};
        let result_string = string;
        if(self.isAnyVariableIncluded(string)) {
            while(true) {
                for(let string_var of self.variables(string)) {
                    const decoded_var = self.decodeVariable(string_var);
                    const name = decoded_var.name;
                    const filter = decoded_var.filter;
                    let value = nil;
                    if(variables[name]) {
                        if(filter) {
                            value = self.processFilter(filter, variables[name]);
                        } else {
                            value = variables[name];
                        }
                        result_string = result_string.replaceAll(string_var, value);
                    } else if(self.isRegisteredDefaultVar(name)) {
                        value = self.processDefaultVar(name);
                        result_string = result_string.replaceAll(string_var, value);
                    }
                }
                if(!(self.isAnyVariableIncluded(string) && self.includesOneVariableOf(variables, string))) {
                    break;
                }
            }
            switch (options.unresolved_vars) {
                case "throw":
                    if(self.isAnyVariableIncluded(result_string)) {
                        throw new UnresolvedVariablesError(`There are unresolved variables in the given string: ${self.variables(result_string)}`);
                    }
                    break;
                case "replace":
                    result_string = result_string.replaceAll(self.VARIABLE_DECODER_REGEX, options.replace_pattern);
                    break;
            }
        }
        return result_string;
    }

    //----------------------------------------------------------------------------------------------------

    static parseFile(path, variables = {}, options = { unresolved_vars: "throw", replace_pattern: "##$1##"}) {
        const self = CurlyBracketParser;
        const default_options = {
            unresolved_vars: "throw", replace_pattern: "##$1##"
        }
        options = Object.assign(default_options, options);
        variables = variables || {};
        if(self._runByNode()) {
            const file_content = fs.readFileSync(path, 'utf-8').toString();
        } else if(self._runByBrowser()) {

        }
    }

    //----------------------------------------------------------------------------------------------------

    static _runByNode() {
        return (typeof module !== 'undefined' && module.exports);
    }

    //----------------------------------------------------------------------------------------------------

    static _runByBrowser() {
        const self = CurlyBracketParser;
        return !self._runByNode();
    }

    //----------------------------------------------------------------------------------------------------
}

// constants for formats
CurlyBracketParser.VARIABLE_DECODER_REGEX = /{{([^{}\|]+)\|?([^{}\|]*)}}/g;
CurlyBracketParser.VARIABLE_REGEX = /{{[^{}]+}}/g;
CurlyBracketParser.VALID_DEFAULT_FILTERS = () => {
    if(typeof LuckyCase !== 'undefined') {
        return Object.keys(LuckyCase.CASES);
    } else {
        return [];
    }
}


//<!-- MODULE -->//
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CurlyBracketParser;
}
//<!-- /MODULE -->//