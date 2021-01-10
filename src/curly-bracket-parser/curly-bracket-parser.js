//<!-- MODULE -->//
if (typeof require === 'function') {
    var FileNotRetrievedError = require('./custom-errors/file-not-retrieved-error.js');
    var FilterAlreadyRegisteredError = require('./custom-errors/filter-already-registered-error.js');
    var InvalidFilterError = require('./custom-errors/invalid-filter-error.js');
    var InvalidVariableError = require('./custom-errors/invalid-variable-error.js');
    var UnresolvedVariablesError = require('./custom-errors/unresolved-variables-error.js');
    var VariableAlreadyRegisteredError = require('./custom-errors/variable-already-registered-error.js');
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
     * @returns {string} parsed string
     */
    static parse(string, variables = {}, options = { unresolved_vars: "throw", replace_pattern: "##$1##"}) {
        const self = CurlyBracketParser;
        options = options ? options : {};
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

    /**
     * Parse given path content and replace the included variables by the given variables
     *
     * @param {string} path to file to parse
     * @param {object<string, string>} variables <key <-> value>
     * @param {object} options
     * @param {('throw'|'keep'|'replace')} options.unresolved_vars 'throw', 'keep', 'replace' => define how to act when unresolved variables within the string are found.
     * @param {string} options.replace_pattern pattern used when param unresolved_vars is set to 'replace'. You can include the var name $1 and filter $2. Empty string to remove unresolved variables.
     * @param {function} options.success only affects when running inside a browser. If given, the file of the given path will be requested asynchronous and the parsed string will be passed to this function.
     * @param {boolean} options.write write parsed content of the file directly into the file. Only available when running by node js.
     * @returns {string|null} parsed string. In case of given 'success' parameter, the success() function will be called as callback and this function will return null instead.
     */
    static parseFile(path, variables = {}, options = { unresolved_vars: "throw", replace_pattern: "##$1##", success: null, write: false }) {
        const self = CurlyBracketParser;
        const default_options = {
            unresolved_vars: "throw", replace_pattern: "##$1##", success: null, write: false
        }
        options = options ? options : {};
        options = Object.assign(default_options, options);
        variables = variables || {};
        if(self._runByNode()) {
            const file_content = fs.readFileSync(path, 'utf-8').toString();
            const parsed_content = self.parse(file_content, variables, options);
            if(options.write) {
                fs.writeFileSync(path, parsed_content);
            }
            return parsed_content;
        } else if(self._runByBrowser()) {
            const error_message = `Could not retrieve file '${path}' by GET.`;
            if(options.success && typeof options.success === 'function') {
                // async
                const request = new XMLHttpRequest();
                request.open('GET', path, true);
                request.onload = function (e) {
                    if (request.readyState === 4) {
                        if(request.status === 200) {
                            const parsed_content = self.parse(request.responseText, variables, options);
                            options.success(parsed_content);
                        } else {
                            throw new FileNotRetrievedError(error_message + "\n" + request.statusText);
                        }
                    } else {
                        throw new FileNotRetrievedError(error_message);
                    }
                };
                request.send(null);
                return null;
            } else {
                // sync
                const request = new XMLHttpRequest();
                request.open('GET', path, false);
                request.send(null);
                if(request.status === 200) {
                    return self.parse(request.responseText, variables, options);
                } else {
                    throw new FileNotRetrievedError(error_message + "\n" + request.statusText);
                }
            }
        }
    }

    //----------------------------------------------------------------------------------------------------

    /**
     * Parse given path content and replace the included variables by the given variables
     * Alias method of .parseFile with option write: true
     *
     * Only available when running on node js (not in browser)
     *
     * @param {string} path to file to parse
     * @param {object<string, string>} variables <key <-> value>
     * @param {object} options
     * @param {('throw'|'keep'|'replace')} options.unresolved_vars 'throw', 'keep', 'replace' => define how to act when unresolved variables within the string are found.
     * @param {string} options.replace_pattern pattern used when param unresolved_vars is set to 'replace'. You can include the var name $1 and filter $2. Empty string to remove unresolved variables.
     * @returns {string|null} parsed string. In case of given 'success' parameter, the success() function will be called as callback and this function will return null instead.
     */
    static parseFileWrite(path, variables = {}, options = { unresolved_vars: "throw", replace_pattern: "##$1##"}) {
        const self = CurlyBracketParser;
        options = options ? options : {};
        options.write = true;
        if(self._runByNode()) {
            return self.parseFile(path, variables, options);
        } else {
            throw "This method can only be run on node js, not in browser.";
        }
    }

    //----------------------------------------------------------------------------------------------------

    /**
     * Check if this javascript is running in node js
     *
     * @returns {boolean} true if running with node js (not browser)
     * @private
     */
    static _runByNode() {
        return (typeof module !== 'undefined' && module.exports);
    }

    //----------------------------------------------------------------------------------------------------

    /**
     * Check if this javascript is running in a browser
     *
     * @returns {boolean} true if running with browser
     * @private
     */
    static _runByBrowser() {
        const self = CurlyBracketParser;
        return !self._runByNode();
    }

    //----------------------------------------------------------------------------------------------------

    /**
     * Register your custom filter to the filter list
     *
     * @param {string} name
     * @param {function} filter_function
     * @param {Object} options
     * @param {boolean} options.raise_on_exist raise exception if filter does already exist, default: true
     * @throws {FilterAlreadyRegisteredError} if filter does already exist
     */
    static registerFilter(name, filter_function, options = { raise_on_exist: true}) {
        const self = CurlyBracketParser;
        if(self.isValidFilter(name)) {
            throw new FilterAlreadyRegisteredError(`The given filter name '${filter}' is already registered`);
        } else {
            if(typeof filter_function === 'function') {
                self.registered_filters[name] = filter_function;
            } else {
                throw `Given parameter 'filter_function' must be of type 'function'. It is of type '${typeof filter_function}'.`;
            }
        }
    }

    //----------------------------------------------------------------------------------------------------

    /**
     * Process the given value with the given filter
     *
     * @param {string} name of the filter to apply on the value, e.g. {{var_name|my_filter_name}}
     * @param {string} value string to apply the specified filter on
     * @throws {InvalidFilterError} if the given filter name is invalid
     * @returns {string} converted string with applied filter
     */
    static processFilter(name, value) {
        const self = CurlyBracketParser;
        if(self.registered_filters[name]) {
            return self.registered_filters[name](value);
        } else if(self.VALID_DEFAULT_FILTERS().includes(name) && LuckyCase.isValidCaseType(name)) {
            return LuckyCase.convertCase(value, name);
        } else {
            const error_message = `Invalid filter '${name}'. Valid filters are: ${self.validFilters().join(' ')}`;
            throw new InvalidFilterError(error_message);
        }
    }

    //----------------------------------------------------------------------------------------------------

    /**
     * Retrieve array with valid filters
     *
     * @returns {Array<string>}
     */
    static validFilters() {
        const self = CurlyBracketParser;
        return self.VALID_DEFAULT_FILTERS().concat(Object.keys(self.registered_filters));
    }

    //----------------------------------------------------------------------------------------------------

    /**
     * Check if a given filter is valid
     *
     * @param {string} name
     * @returns {boolean} true if filter exists, otherwise false
     */
    static isValidFilter(name) {
        const self = CurlyBracketParser;
        return self.validFilters().includes(name);
    }

    //----------------------------------------------------------------------------------------------------

    /**
     * Register a default variable to be replaced automatically by the given block value in future
     * If the variable exists already, it will throw an VariableAlreadyRegisteredError
     *
     * @param name
     * @param var_function
     * @param options
     * @returns {*}
     */
    static registerDefaultVar(name, var_function, options = { overwrite: false }) {
        const self = CurlyBracketParser;
        options = options ? options : {};
        const default_options = {
            unresolved_vars: "throw", replace_pattern: "##$1##"
        }
        options = Object.assign(default_options, options);
        if(self.isRegisteredDefaultVar(name) && options.overwrite === false) {
            const error_message = `The given variable name '${name}' is already registered. If you want to override that variable explicitly, use option 'overwrite: true'!`;
            throw new VariableAlreadyRegisteredError(error_message)
        } else {
            if(typeof var_function === 'function') {
                return self.registered_default_vars[name] = var_function;
            } else {
                throw `Given parameter 'var_function' must be of type 'function'. It is of type '${typeof var_function}'.`;
            }
        }
    }

    //----------------------------------------------------------------------------------------------------

    /**
     * Return the given default variable by returning the result of its function
     *
     * @param {string} name
     * @returns {string} the result of the given default variable function
     */
    static processDefaultVar(name) {
        const self = CurlyBracketParser;
        if(self.registered_default_vars[name]) {
            return self.registered_default_vars[name]();
        } else {
            const error_message = `Invalid default variable '${name}'. Valid registered default variables are: ${Object.keys(self.registered_default_vars).join(' ')}`;
            throw new InvalidVariableError(error_message);
        }
    }

    //----------------------------------------------------------------------------------------------------

    /**
     * Unregister / remove an existing default variable
     *
     * @param {string} name of the variable
     * @returns {boolean} true if variable existed and was unregistered, false if it didn't exist
     */
    static unregisterDefaultVar(name) {
        const self = CurlyBracketParser;
        if(self.registered_default_vars[name]) {
            delete self.registered_default_vars[name];
            return true;
        } else {
            return false;
        }
    }

    //----------------------------------------------------------------------------------------------------

    /**
     * Return an array of registered default variables
     *
     * @returns {Array<string>}
     */
    static registeredDefaultVars() {
        const self = CurlyBracketParser;
        return Object.keys(self.registered_default_vars);
    }

    //----------------------------------------------------------------------------------------------------

    /**
     * Check if the given variable is a registered default variable
     *
     * @param {string} name of the variable
     * @returns {boolean} true if variable is registered, otherwise false
     */
    static isRegisteredDefaultVar(name) {
        const self = CurlyBracketParser;
        return self.registerDefaultVar().includes(name);
    }

    //----------------------------------------------------------------------------------------------------

    /**
     * Scans the given url for variables with pattern '{{var|optional_filter}}'
     *
     * @param {string} variable string to scan
     * @returns {Array<Object<string, string>>}
     */
    static decodeVariable(variable) {
        const self = CurlyBracketParser;
        const vals = self.decodedVariables(variable)[0];
        return [Object.keys(vals)[0], Object.values(vals)[0]];
    }

    //----------------------------------------------------------------------------------------------------

    /**
     * Scans the given url for variables with pattern '{{var|optional_filter}}'
     *
     * @param {string} string to scan
     * @returns {Array<Object<string,string>>} array of variable names and its filters
     */
    static decodedVariables(string) {
        const self = CurlyBracketParser;
        const var_name_index = 0;
        const var_filter_index = 1;
        return string.match(self.VARIABLE_DECODER_REGEX).map((e) => { const key = "" + e[var_name_index].trim() + ""; return { key: e[var_filter_index].trim() !== '' ? e[var_filter_index].trim() : null } }).flat();
    }

    //----------------------------------------------------------------------------------------------------

    /**
     * Scans the given url for variables with pattern '{{var|optional_filter}}'
     *
     * @param {string} string to scan
     * @returns {Array<string>} array of variable names and its filters
     */
    static variables(string) {
        const self = CurlyBracketParser;
        return string.match(self.VARIABLE_REGEX).flat();
    }

    //----------------------------------------------------------------------------------------------------

    /**
     * Check if any variable is included in the given string
     *
     * @param {string} string name of variable to check for
     * @returns {boolean} true if any variable is included in the given string, otherwise false
     */
    static isAnyVariableIncluded(string) {
        const self = CurlyBracketParser;
        return string.match(self.VARIABLE_REGEX) !== null
    }

    //----------------------------------------------------------------------------------------------------

    /**
     * Check if one of the given variable names is included in the given string
     *
     * @param variable_names
     * @param {string} string name of variable to check for
     * @returns {boolean} true if one given variable name is included in given the string, otherwise false
     */
    static includesOneVariableOf(variable_names, string) {
        const self = CurlyBracketParser;
        for(let val of self.decodedVariables(string)) {
            if(variable_names.includes(val.name)) {
                return true;
            }
        }
        return false;
    }

    //----------------------------------------------------------------------------------------------------
}

CurlyBracketParser.registered_filters = {};
CurlyBracketParser.registered_default_vars = {};

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