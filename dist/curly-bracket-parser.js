/**
 * curly-bracket-parser
 *
 * Simple parser to replace variables inside templates/strings and files
 *
 * @version 1.0.1
 * @date 2021-01-10T23:56:01.213Z
 * @link https://github.com/magynhard/curly-bracket-parser
 * @author Matthäus J. N. Beyrle
 * @copyright Matthäus J. N. Beyrle
 */

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
                    let value = null;
                    if(variables[name]) {
                        if(filter) {
                            value = self.processFilter(filter, variables[name]);
                        } else {
                            value = variables[name];
                        }
                        result_string = self._replaceAll(result_string, string_var, value);
                    } else if(self.isRegisteredDefaultVar(name)) {
                        value = self.processDefaultVar(name);
                        result_string = self._replaceAll(result_string, string_var, value);
                    }
                }
                if(!(self.isAnyVariableIncluded(result_string) && self.includesOneVariableOf(Object.keys(variables), result_string))) {
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
                    result_string = result_string.replace(self.VARIABLE_DECODER_REGEX, options.replace_pattern);
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
            const fs = require("fs");
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
            throw new FilterAlreadyRegisteredError(`The given filter name '${name}' is already registered`);
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
        } else if(typeof LuckyCase !== 'undefined' && self.VALID_DEFAULT_FILTERS().includes(LuckyCase.toUpperCase(name)) && LuckyCase.isValidCaseType(LuckyCase.toUpperCase(name))) {
            return LuckyCase.convertCase(value, LuckyCase.toUpperCase(name));
        } else {
            const error_message = `Invalid filter '${name}'. Valid filters are: ${self.validFilters().join(' ')}`;
            throw new InvalidFilterError(error_message);
        }
        if(typeof LuckyCase !== 'undefined') {
            console.warn(`CurlyBracketParser: 'LuckyCase' is not defined. If you add LuckyCase, you can use all of its case transformers as filters!`);
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
        const default_filters = self.VALID_DEFAULT_FILTERS();
        const registered_filters = Object.keys(self.registered_filters);
        const default_filters_lower_case = self.VALID_DEFAULT_FILTERS().map((e) => { return e.toLocaleLowerCase();});
        return default_filters.concat(registered_filters).concat(default_filters_lower_case);
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
     * @param {string} name of the default var
     * @param {function} var_function function returning the variable value
     * @param {Object} options
     * @param {boolean} options.overwrite explicitly overwrite an existing default var without throwing an execption
     * @returns {function} var_function
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
        return self.registeredDefaultVars().includes(name);
    }

    //----------------------------------------------------------------------------------------------------

    /**
     * Return a object containing separated name and filter of a variable
     *
     * @example
     #   '{{var_name|filter_name}}' => { name: 'var_name', filter: 'filter_name' }
     *
     * @param {string} variable string to scan
     * @returns {Object} name, filter
     */
    static decodeVariable(variable) {
        const self = CurlyBracketParser;
        return self.decodedVariables(variable)[0];
    }

    //----------------------------------------------------------------------------------------------------

    /**
     * Scans the given url for variables with pattern '{{var|optional_filter}}'
     *
     * @example
     #   'The variable {{my_var|my_filter}} is inside this string' => [{ name: "my_var", filter: "my_filter"}]
     *
     * @param {string} string to scan
     * @returns {Array<Object>} array of variable names and its filters
     */
    static decodedVariables(string) {
        const self = CurlyBracketParser;
        let variables = [];
        self.VARIABLE_DECODER_REGEX.lastIndex = 0;
        while(true) {
            const res = self.VARIABLE_DECODER_REGEX.exec(string);
            if(res) {
                let val = { name: res[1].trim(), filter: res[2].trim() !== '' ? res[2].trim() : null };
                variables.push(val);
            } else {
                self.VARIABLE_DECODER_REGEX.lastIndex = 0;
                break;
            }
        }
        return variables;
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

    /**
     * Replace all search matches with replace variable
     *
     * @param {string} string
     * @param {string} search
     * @param {string} replace
     * @returns {string} resulting string
     * @private
     */
    static _replaceAll(string, search, replace) {
        return string.split(search).join(replace);
    }

    //----------------------------------------------------------------------------------------------------
}

CurlyBracketParser.registered_filters = {};
CurlyBracketParser.registered_default_vars = {};

// constants for formats
CurlyBracketParser.VARIABLE_DECODER_REGEX = /{{([^{}\|]+)\|?([^{}\|]*)}}/gsm;
CurlyBracketParser.VARIABLE_REGEX = /{{[^{}]+}}/gsm;
CurlyBracketParser.VALID_DEFAULT_FILTERS = () => {
    if(typeof LuckyCase !== 'undefined') {
        return Object.keys(LuckyCase.CASES);
    } else {
        return [];
    }
}




class FileNotRetrievedError extends Error {
    constructor(message) {
        super(message);
        this.name = "FileNotRetrievedError";
    }
}


class FilterAlreadyRegisteredError extends Error {
    constructor(message) {
        super(message);
        this.name = "FilterAlreadyRegisteredError";
    }
}


class InvalidFilterError extends Error {
    constructor(message) {
        super(message);
        this.name = "InvalidFilterError";
    }
}


class InvalidVariableError extends Error {
    constructor(message) {
        super(message);
        this.name = "InvalidVariableError";
    }
}


class UnresolvedVariablesError extends Error {
    constructor(message) {
        super(message);
        this.name = "UnresolvedVariablesError";
    }
}


class VariableAlreadyRegisteredError extends Error {
    constructor(message) {
        super(message);
        this.name = "VariableAlreadyRegisteredError";
    }
}

