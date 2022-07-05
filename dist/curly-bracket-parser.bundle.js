/**
 * curly-bracket-parser
 *
 * Simple parser to replace variables inside templates/strings and files
 *
 * @version 1.1.6
 * @date 2022-07-05T11:01:08.492Z
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
     * Get the version of the used library
     * @returns {string}
     */
    static getVersion() {
        const self = CurlyBracketParser;
        return self._version;
    }

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
    static parse(string, variables = {}, options = {unresolved_vars: "throw", replace_pattern: "##$1##"}) {
        const self = CurlyBracketParser;
        options = options ? options : {};
        const default_options = {
            unresolved_vars: "throw", replace_pattern: "##$1##"
        }
        options = Object.assign(default_options, options);
        variables = variables || {};
        let result_string = string;
        if (self.isAnyVariableIncluded(string)) {
            while (true) {
                for (let string_var of self.variables(result_string)) {
                    const decoded_var = self.decodeVariable(string_var);
                    const name = !decoded_var.name && decoded_var.name !== 0 ? "''" : decoded_var.name;
                    const filter = decoded_var.filter;
                    let value = null;
                    const is_single_quoted = name.startsWith("'") && name.endsWith("'");
                    const is_double_quoted = name.startsWith('"') && name.endsWith('"');
                    // When the name itself is quoted as string or is a number, we use it as a value itself
                    if (is_double_quoted || is_single_quoted) {
                        value = name.substring(1, name.length - 1);
                    } else if (Typifier.isNumberString(name)) {
                        value = eval(name);
                    } else if (variables[name]) {
                        value = variables[name];
                    } else if (self.isRegisteredDefaultVar(name)) {
                        value = self.processDefaultVar(name);
                    }
                    if (value !== null) {
                        if (filter) value = self.processFilter(filter, value);
                        result_string = self._replaceAll(result_string, string_var, value);
                    }
                }
                if (!(self.isAnyVariableIncluded(result_string) && self.includesOneVariableOf(Object.keys(variables), result_string))) {
                    break;
                }
            }
            switch (options.unresolved_vars) {
                case "throw":
                    if (self.isAnyVariableIncluded(result_string)) {
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
    static parseFile(path, variables = {}, options = {
        unresolved_vars: "throw",
        replace_pattern: "##$1##",
        success: null,
        write: false
    }) {
        const self = CurlyBracketParser;
        const default_options = {
            unresolved_vars: "throw", replace_pattern: "##$1##", success: null, write: false
        }
        options = options ? options : {};
        options = Object.assign(default_options, options);
        variables = variables || {};
        if (self._runByNode()) {
            const fs = require("fs");
            const file_content = fs.readFileSync(path, 'utf-8').toString();
            const parsed_content = self.parse(file_content, variables, options);
            if (options.write) {
                fs.writeFileSync(path, parsed_content);
            }
            return parsed_content;
        } else if (self._runByBrowser()) {
            const error_message = `Could not retrieve file '${path}' by GET.`;
            if (options.success && typeof options.success === 'function') {
                // async
                const request = new XMLHttpRequest();
                request.open('GET', path, true);
                request.onload = function (e) {
                    if (request.readyState === 4) {
                        if (request.status === 200) {
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
                if (request.status === 200) {
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
    static parseFileWrite(path, variables = {}, options = {unresolved_vars: "throw", replace_pattern: "##$1##"}) {
        const self = CurlyBracketParser;
        options = options ? options : {};
        options.write = true;
        if (self._runByNode()) {
            return self.parseFile(path, variables, options);
        } else {
            throw "This method can only be run on node js, not in browser.";
        }
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
    static registerFilter(name, filter_function, options = {raise_on_exist: true}) {
        const self = CurlyBracketParser;
        if (self.isValidFilter(name)) {
            throw new FilterAlreadyRegisteredError(`The given filter name '${name}' is already registered`);
        } else {
            if (typeof filter_function === 'function') {
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
        if (self.registered_filters[name]) {
            return self.registered_filters[name](value);
        } else if (typeof LuckyCase !== 'undefined' && self.VALID_DEFAULT_FILTERS().includes(LuckyCase.toUpperCase(name)) && LuckyCase.isValidCaseType(LuckyCase.toUpperCase(name))) {
            return LuckyCase.convertCase(value, LuckyCase.toUpperCase(name));
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
        const default_filters = self.VALID_DEFAULT_FILTERS();
        const registered_filters = Object.keys(self.registered_filters);
        const default_filters_lower_case = self.VALID_DEFAULT_FILTERS().map((e) => {
            return e.toLocaleLowerCase();
        });
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
    static registerDefaultVar(name, var_function, options = {overwrite: false}) {
        const self = CurlyBracketParser;
        options = options ? options : {};
        const default_options = {
            unresolved_vars: "throw", replace_pattern: "##$1##"
        }
        options = Object.assign(default_options, options);
        if (self.isRegisteredDefaultVar(name) && options.overwrite === false) {
            const error_message = `The given variable name '${name}' is already registered. If you want to override that variable explicitly, use option 'overwrite: true'!`;
            throw new VariableAlreadyRegisteredError(error_message)
        } else {
            if (typeof var_function === 'function') {
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
        if (self.registered_default_vars[name]) {
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
        if (self.registered_default_vars[name]) {
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
        while (true) {
            const res = self.VARIABLE_DECODER_REGEX.exec(string);
            if (res) {
                let val = {name: res[1].trim(), filter: res[2].trim() !== '' ? res[2].trim() : null};
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
        for (let val of self.decodedVariables(string)) {
            if (variable_names.includes(val.name)) {
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

}

/**
 * @type {string}
 * @private
 */
CurlyBracketParser._version = "1.1.6";

CurlyBracketParser.registered_filters = {};
CurlyBracketParser.registered_default_vars = {};

// constants for formats
CurlyBracketParser.VARIABLE_DECODER_REGEX = /{{([^{}\|]*)\|?([^{}\|]*)}}/gsm;
CurlyBracketParser.VARIABLE_REGEX = /{{[^{}]*}}/gsm;
CurlyBracketParser.VALID_DEFAULT_FILTERS = () => {
    if (typeof LuckyCase !== 'undefined') {
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

/**
 * lucky-case
 *
 * The lucky javascript library to identify and convert strings from any letter case to another
 *
 * @version 1.1.8
 * @date 2022-06-01T14:11:18.231Z
 * @link https://github.com/magynhard/lucky-case
 * @author Matthäus J. N. Beyrle
 * @copyright Matthäus J. N. Beyrle
 */

/**
 * LuckyCase
 *
 * Convert and detect various letter cases in strings
 *
 */
class LuckyCase {
    /**
     * Get the version of the used library
     * @returns {string}
     */
    static getVersion() {
        const self = LuckyCase;
        return self._version;
    }

    /**
     * Get type of case of string (one key of LuckyCase.CASES)
     *
     * If more than one case matches, the first match wins.
     * Match prio is the order of the regex in LuckyCase.CASES
     *
     * If you want or need to know all cases, use plural version of this method
     *
     * If you want to check explicitly for one case, use its check method,
     * e.g. isSnakeCase() for SNAKE_CASE, etc...
     *
     * @param {string} string
     * @param {boolean} allow_prefixed_underscores
     * @returns {string|null} symbol of type, null if no match
     */
    static case(string, allow_prefixed_underscores = true) {
        const self = LuckyCase;
        let s;
        if (allow_prefixed_underscores) {
            s = self.cutUnderscoresAtStart(string);
        } else {
            s = string;
        }
        let resulting_case = null;
        for (let case_type of Object.keys(self.CASES)) {
            // due js bug we need explicitly check twice, because the regex sometimes does only match each second time
            const regex = self.CASES[case_type.toString()];
            regex.lastIndex = 0; // In JavaScript, global regexen have state: you call them the first time, you get the first match in a given string. Call them again and you get the next match, and so on until you get no match and it resets to the start of the next string. You can also write regex.lastIndex= 0 to reset this state.
            if (self.CASES[case_type].test(s)) {
                resulting_case = case_type;
                break;
            }
        }
        return resulting_case;
    }

    /**
     * Get types of cases of string (keys of LuckyCase.CASES)
     *
     * @param {string} string
     * @param {boolean} allow_prefixed_underscores
     * @returns {string[]|null} symbols of types, null if no one matches
     */
    static cases(string, allow_prefixed_underscores = true) {
        const self = LuckyCase;
        let s;
        if (allow_prefixed_underscores) {
            s = self.cutUnderscoresAtStart(string);
        } else {
            s = string;
        }
        let matched_cases = [];
        for (let case_type of Object.keys(self.CASES)) {
            const regex = self.CASES[case_type];
            regex.lastIndex = 0; // reset state
            if (regex.test(s)) {
                matched_cases.push(case_type);
            }
        }
        if (matched_cases.length === 0) {
            return null;
        } else if (matched_cases.length > 1) {
            // reject MIXED_CASE if there are other matches
            // because it would always be included if one other case matches
            return matched_cases.filter((el) => {
                return el !== self.MIXED_CASE;
            });
        } else {
            return matched_cases;
        }
    }

    /**
     * Convert a string into the given case type
     *
     * @param {string} string to convert
     * @param {string} case_type can be UPPER_CASE or lower_case, e.g. 'SNAKE_CASE' or 'snake_case'
     * @param {boolean} preserve_prefixed_underscores
     * @returns {string}
     */
    static convertCase(string, case_type, preserve_prefixed_underscores = true) {
        const self = LuckyCase;
        case_type = self.toUpperCase(case_type);
        if (Object.keys(self.CASES).includes(case_type)) {
            return self['to' + self.toPascalCase(case_type)](string, preserve_prefixed_underscores);
        }
        const error_message = `Invalid case type '${case_type}'. Valid types are: ${Object.keys(self.CASES).join(', ')}`;
        throw new InvalidCaseError(error_message);
    }

    /**
     * Check if given case type is a valid case type
     *
     * @param {string} case_type to check
     * @returns {boolean}
     */
    static isValidCaseType(case_type) {
        const self = LuckyCase;
        if (Object.keys(self.CASES).includes(case_type)) {
            return true;
        } else {
            return false;
        }
    }

    /**
     * Check if the string matches any of the available cases
     *
     * @param {string} string to check
     * @returns {boolean}
     */
    static isValidCaseString(string) {
        const self = LuckyCase;
        return self.case(string) !== null;
    }

    //----------------------------------------------------------------------------------------------------
    // UPPER CASE
    //----------------------------------------------------------------------------------------------------

    /**
     * Convert all characters inside the string
     * into upper case
     *
     * @example conversion
     *      'this-isAnExample_string' => 'THIS-ISANEXAMPLE_STRING'
     *
     * @param {string} string to convert
     * @returns {string}
     */
    static toUpperCase(string) {
        return string.toLocaleUpperCase();
    }

    /**
     * Check if all characters inside the string are upper case
     *
     * @param {string} string to check
     * @returns {boolean}
     */
    static isUpperCase(string) {
        const self = LuckyCase;
        return string === self.toUpperCase(string);
    }

    //----------------------------------------------------------------------------------------------------
    // LOWER CASE
    //----------------------------------------------------------------------------------------------------

    /**
     * Convert all characters inside the string
     * into lower case
     *
     * @example conversion
     *      'this-isAnExample_string' => 'this-isanexample_string'
     *
     * @param {string} string to convert
     * @returns {string}
     */
    static toLowerCase(string) {
        return string.toLocaleLowerCase();
    }

    /**
     * Check if all characters inside the string are lower case
     *
     * @param {string} string to check
     * @returns {boolean}
     */
    static isLowerCase(string) {
        const self = LuckyCase;
        return string === self.toLowerCase(string);
    }

    //----------------------------------------------------------------------------------------------------
    // SNAKE CASE
    //----------------------------------------------------------------------------------------------------

    /**
     * Convert the given string from any case
     * into snake case
     *
     * @example conversion
     *      'this-isAnExample_string' => 'this_is_an_example_string'
     *
     * @param {string} string to convert
     * @param {boolean} preserve_prefixed_underscores
     * @returns {string}
     */
    static toSnakeCase(string, preserve_prefixed_underscores = true) {
        const self = LuckyCase;
        const a = self.splitCaseString(string);
        const converted = a.join('_');
        if(preserve_prefixed_underscores) {
            return self.getUnderscoresAtStart(string) + converted;
        } else {
            return converted;
        }
    }

    /**
     * Check if the string is snake case
     *
     * @param {string} string to check
     * @param {boolean} allow_prefixed_underscores
     * @returns {boolean}
     */
    static isSnakeCase(string, allow_prefixed_underscores = true) {
        const self = LuckyCase;
        let s;
        if(allow_prefixed_underscores) {
            s = self.cutUnderscoresAtStart(string);
        } else {
            s = string;
        }
        return self._isCaseMatch(s, self.SNAKE_CASE);
    }

    /**
     * Convert the given string from any case
     * into upper snake case
     *
     * @example conversion
     *      'this-isAnExample_string' => 'THIS_IS_AN_EXAMPLE_STRING'
     *
     * @param {string} string to convert
     * @param {boolean} preserve_prefixed_underscores
     * @returns {string}
     */
    static toUpperSnakeCase(string, preserve_prefixed_underscores = true) {
        const self = LuckyCase;
        const a = self.splitCaseString(string);
        const converted = a.map((e) => { return self.toUpperCase(e) }).join('_');
        if(preserve_prefixed_underscores) {
            return self.getUnderscoresAtStart(string) + converted;
        } else {
            return converted;
        }
    }

    /**
     * Check if the string is upper snake case
     *
     * @param {string} string to check
     * @param {boolean} allow_prefixed_underscores
     * @returns {boolean}
     */
    static isUpperSnakeCase(string, allow_prefixed_underscores = true) {
        const self = LuckyCase;
        let s;
        if(allow_prefixed_underscores) {
            s = self.cutUnderscoresAtStart(string);
        } else {
            s = string;
        }
        return self._isCaseMatch(s, self.UPPER_SNAKE_CASE);
    }

    //----------------------------------------------------------------------------------------------------
    // PASCAL CASE
    //----------------------------------------------------------------------------------------------------

    /**
     * Convert the given string from any case
     * into pascal case
     *
     * @example conversion
     *      'this-isAnExample_string' => 'ThisIsAnExampleString'
     *
     * @param string to convert
     * @param preserve_prefixed_underscores
     * @returns {string}
     */
    static toPascalCase(string, preserve_prefixed_underscores = true) {
        const self = LuckyCase;
        const a = self.splitCaseString(string);
        const converted = a.map((e) => { return self.toCapital(e); }).join('');
        if(preserve_prefixed_underscores) {
            return self.getUnderscoresAtStart(string) + converted;
        } else {
            return converted;
        }
    }

    /**
     * Check if the string is upper pascal case
     *
     * @param {string} string to check
     * @param {boolean} allow_prefixed_underscores
     * @returns {boolean}
     */
    static isPascalCase(string, allow_prefixed_underscores = true)  {
        const self = LuckyCase;
        let s;
        if(allow_prefixed_underscores) {
            s = self.cutUnderscoresAtStart(string);
        } else {
            s = string;
        }
        return self._isCaseMatch(s, self.PASCAL_CASE);
    }

    //----------------------------------------------------------------------------------------------------
    // CAMEL CASE
    //----------------------------------------------------------------------------------------------------

    /**
     * Convert the given string from any case
     * into camel case
     *
     * @example conversion
     *      'this-isAnExample_string' => 'thisIsAnExampleString'
     *
     * @param {string} string to convert
     * @param {boolean} preserve_prefixed_underscores
     * @returns {string}
     */
    static toCamelCase(string, preserve_prefixed_underscores = true) {
        const self = LuckyCase;
        const a = self.splitCaseString(string);
        const converted = a[0] + (a.slice(1).map((e) => { return self.toCapital(e); })).join('');
        if(preserve_prefixed_underscores) {
            return self.getUnderscoresAtStart(string) + converted;
        } else {
            return converted;
        }
    }

    /**
     * Check if the string is camel case
     *
     * @param {string} string to check
     * @param {boolean} allow_prefixed_underscores
     * @returns {boolean}
     */
    static isCamelCase(string, allow_prefixed_underscores = true) {
        const self = LuckyCase;
        let s;
        if(allow_prefixed_underscores) {
            s = self.cutUnderscoresAtStart(string);
        } else {
            s = string;
        }
        return self._isCaseMatch(s, self.CAMEL_CASE);
    }

    //----------------------------------------------------------------------------------------------------
    // DASH CASE
    //----------------------------------------------------------------------------------------------------

    /**
     * Convert the given string from any case
     * into dash case
     *
     * @example conversion
     *      'this-isAnExample_string' => 'this-is-an-example-string'
     *
     * @param {string} string to convert
     * @param {boolean} preserve_prefixed_underscores
     * @returns {string}
     */
    static toDashCase(string, preserve_prefixed_underscores = true) {
        const self = LuckyCase;
        const a = self.splitCaseString(string);
        const converted = a.join('-');
        if(preserve_prefixed_underscores) {
            return self.getUnderscoresAtStart(string) + converted;
        } else {
            return converted;
        }
    }

    /**
     * Check if the string is dash case
     *
     * @param {string} string to check
     * @param {boolean} allow_prefixed_underscores
     * @returns {boolean}
     */
    static isDashCase(string, allow_prefixed_underscores = true) {
        const self = LuckyCase;
        let s;
        if(allow_prefixed_underscores) {
            s = self.cutUnderscoresAtStart(string);
        } else {
            s = string;
        }
        return self._isCaseMatch(s, self.DASH_CASE);
    }

    /**
     * Convert the given string from any case
     * into upper dash case
     *
     * @example conversion
     *      'this-isAnExample_string' => 'THIS-IS-AN-EXAMPLE-STRING'
     *
     * @param {string} string to convert
     * @param {boolean} preserve_prefixed_underscores
     * @returns {string}
     */
    static toUpperDashCase(string, preserve_prefixed_underscores = true) {
        const self = LuckyCase;
        const s = self.toDashCase(string, preserve_prefixed_underscores);
        return self.toUpperCase(s);
    }

    /**
     * Check if the string is upper dash case
     *
     * @param {string} string to check
     * @param {boolean} allow_prefixed_underscores
     * @returns {boolean}
     */
    static isUpperDashCase(string, allow_prefixed_underscores = true) {
        const self = LuckyCase;
        let s;
        if(allow_prefixed_underscores) {
            s = self.cutUnderscoresAtStart(string);
        } else {
            s = string;
        }
        return self._isCaseMatch(s, self.UPPER_DASH_CASE);
    }

    //----------------------------------------------------------------------------------------------------
    // TRAIN CASE
    //----------------------------------------------------------------------------------------------------

    /**
     * Convert the given string from any case
     * into train case
     *
     * @example conversion
     *      'this-isAnExample_string' => 'This-Is-An-Example-String'
     *
     * @param {string} string to convert
     * @param {boolean} preserve_prefixed_underscores
     * @returns {string}
     */
    static toTrainCase(string, preserve_prefixed_underscores = true) {
        const self = LuckyCase;
        const a = self.splitCaseString(string);
        const converted = a.map((e) => { return self.toCapital(e); }).join('-');
        if(preserve_prefixed_underscores) {
            return self.getUnderscoresAtStart(string) + converted;
        } else {
            return converted;
        }
    }

    /**
     * Check if the string is train case
     *
     * @param {string} string to check
     * @param {boolean} allow_prefixed_underscores
     * @returns {boolean}
     */
    static isTrainCase(string, allow_prefixed_underscores = true) {
        const self = LuckyCase;
        let s;
        if(allow_prefixed_underscores) {
            s = self.cutUnderscoresAtStart(string);
        } else {
            s = string;
        }
        return self._isCaseMatch(s, self.TRAIN_CASE);
    }

    //----------------------------------------------------------------------------------------------------
    // WORD CASE
    //----------------------------------------------------------------------------------------------------

    /**
     * Convert the given string from any case
     * into word case
     *
     * @example conversion
     *      'this-isAnExample_string' => 'this is an example string'
     *
     * @param {string} string to convert
     * @param {boolean} preserve_prefixed_underscores
     * @returns {string}
     */
    static toWordCase(string, preserve_prefixed_underscores = true) {
        const self = LuckyCase;
        const a = self.splitCaseString(string);
        const converted = a.join(' ');
        if(preserve_prefixed_underscores) {
            return self.getUnderscoresAtStart(string) + converted;
        } else {
            return converted;
        }
    }

    /**
     * Check if the string is word case
     *
     * @param {string} string to check
     * @param allow_prefixed_underscores
     * @returns {boolean}
     */
    static isWordCase(string, allow_prefixed_underscores = true) {
        const self = LuckyCase;
        let s;
        if(allow_prefixed_underscores) {
            s = self.cutUnderscoresAtStart(string);
        } else {
            s = string;
        }
        return self._isCaseMatch(s, self.WORD_CASE);
    }

    /**
     * Convert the given string from any case
     * into upper word case
     *
     * @example conversion
     *      'this-isAnExample_string' => 'THIS IS AN EXAMPLE STRING'
     *
     * @param {string} string to convert
     * @param {boolean} preserve_prefixed_underscores
     * @returns {string}
     */
    static toUpperWordCase(string, preserve_prefixed_underscores = true) {
        const self = LuckyCase;
        const a = self.splitCaseString(string);
        const converted = a.map((e) => { return self.toUpperCase(e); }).join(' ');
        if(preserve_prefixed_underscores) {
            return self.getUnderscoresAtStart(string) + converted;
        } else {
            return converted;
        }
    }

    /**
     * Check if the string is upper word case
     *
     * @param string to check
     * @param allow_prefixed_underscores
     * @returns {boolean}
     */
    static isUpperWordCase(string, allow_prefixed_underscores = true) {
        const self = LuckyCase;
        let s;
        if(allow_prefixed_underscores) {
            s = self.cutUnderscoresAtStart(string);
        } else {
            s = string;
        }
        return self._isCaseMatch(s, self.UPPER_WORD_CASE);
    }

    /**
     * Convert the given string from any case
     * into capital word case
     *
     * @example conversion
     *      'this-isAnExample_string' => 'This Is An Example String'
     *
     * @param {string} string to convert
     * @param {boolean} preserve_prefixed_underscores
     * @returns {string}
     */
    static toCapitalWordCase(string, preserve_prefixed_underscores = true) {
        const self = LuckyCase;
        const a = self.splitCaseString(string);
        const converted = a.map((e) => { return self.toCapital(e); }).join(' ');
        if(preserve_prefixed_underscores) {
            return self.getUnderscoresAtStart(string) + converted;
        } else {
            return converted;
        }
    }

    /**
     * Check if the string is capital word case
     *
     * @param {string} string to check
     * @param {boolean} allow_prefixed_underscores
     * @returns {boolean}
     */
    static isCapitalWordCase(string, allow_prefixed_underscores = true) {
        const self = LuckyCase;
        let s;
        if(allow_prefixed_underscores) {
            s = self.cutUnderscoresAtStart(string);
        } else {
            s = string;
        }
        return self._isCaseMatch(s, self.CAPITAL_WORD_CASE);
    }

    //----------------------------------------------------------------------------------------------------
    // SENTENCE CASE
    //----------------------------------------------------------------------------------------------------

    /**
     * Convert the given string from any case
     * into sentence case
     *
     * @example conversion
     *      'this-isAnExample_string' => 'This is an example string'
     *
     * @param {string} string to convert
     * @param {boolean} preserve_prefixed_underscores
     * @returns {string}
     */
    static toSentenceCase(string, preserve_prefixed_underscores = true) {
        const self = LuckyCase;
        const a = self.splitCaseString(string);
        const converted = self.toCapital(a.join(' '));
        if(preserve_prefixed_underscores) {
            return self.getUnderscoresAtStart(string) + converted;
        } else {
            return converted;
        }
    }

    /**
     * Check if the string is sentence case
     *
     * @param {string} string to check
     * @param {boolean} allow_prefixed_underscores
     * @returns {boolean}
     */
    static isSentenceCase(string, allow_prefixed_underscores = true) {
        const self = LuckyCase;
        let s;
        if(allow_prefixed_underscores) {
            s = self.cutUnderscoresAtStart(string);
        } else {
            s = string;
        }
        return self._isCaseMatch(s, self.SENTENCE_CASE);
    }

    //----------------------------------------------------------------------------------------------------
    // CAPITALIZE
    //----------------------------------------------------------------------------------------------------

    /**
     * Convert the first character to capital
     *
     * @param {string} string to convert
     * @param {boolean} skip_prefixed_underscores
     * @returns {string}
     */
    static toCapital(string, skip_prefixed_underscores = false) {
        const self = LuckyCase;
        if(!string || string === '') {
            return string;
        }
        let s;
        if(skip_prefixed_underscores) {
            s = self.cutUnderscoresAtStart(string);
        } else {
            s = string;
        }
        s = self.toUpperCase(s[0]) + s.substr(1);
        if(skip_prefixed_underscores) {
            return self.getUnderscoresAtStart(string) + s;
        } else {
            return s;
        }
    }

    /**
     * Convert the first character to capital
     *
     * @param {string} string to convert
     * @param {boolean} skip_prefixed_underscores
     * @returns {string}
     */
    static capitalize(string, skip_prefixed_underscores = false) {
        const self = LuckyCase;
        return self.toCapital(string, skip_prefixed_underscores);
    }

    /**
     * Check if the strings first character is a capital letter
     *
     * @param {string} string
     * @param {boolean} skip_prefixed_underscores
     * @returns {boolean}
     */
    static isCapital(string, skip_prefixed_underscores = false) {
        const self = LuckyCase;
        let s;
        if(skip_prefixed_underscores) {
            s = self.cutUnderscoresAtStart(string);
        } else {
            s = string;
        }
        return self.isUpperCase(s[0]);
    }

    /**
     * Check if the strings first character is a capital letter
     *
     * @param {string} string
     * @param {boolean} skip_prefixed_underscores
     * @returns {boolean}
     */
    static isCapitalized(string, skip_prefixed_underscores = false) {
        const self = LuckyCase;
        return self.isCapital(string, skip_prefixed_underscores);
    }

    /**
     * Convert the first character to lower case
     *
     * @param {string} string to convert
     * @param {boolean} skip_prefixed_underscores
     * @returns {string}
     */
    static decapitalize(string, skip_prefixed_underscores = false) {
        const self = LuckyCase;
        if(!string || string === '') {
            return string;
        }
        let s;
        if(skip_prefixed_underscores) {
            s = self.cutUnderscoresAtStart(string);
        } else {
            s = string;
        }
        s = self.toLowerCase(s[0]) + s.substr(1);
        if(skip_prefixed_underscores) {
            return self.getUnderscoresAtStart(string) + s;
        } else {
            return s;
        }
    }

    /**
     * Check if the strings first character is a lower case letter
     *
     * @param {string} string
     * @param {boolean} skip_prefixed_underscores
     * @returns {boolean}
     */
    static isNotCapital(string, skip_prefixed_underscores = false) {
        const self = LuckyCase;
        return !self.isCapital(string, skip_prefixed_underscores);
    }

    /**
     * Check if the strings first character is a lower case letter
     *
     * @param {string} string
     * @param {boolean} skip_prefixed_underscores
     * @returns {boolean}
     */
    static isDecapitalized(string, skip_prefixed_underscores = false) {
        const self = LuckyCase;
        return self.isNotCapital(string, skip_prefixed_underscores);
    }

    //----------------------------------------------------------------------------------------------------
    // MIXED CASE
    //----------------------------------------------------------------------------------------------------

    /**
     * Convert the given string from any case
     * into mixed case.
     *
     * The new string is ensured to be different from the input.
     *
     * @example conversion
     *      'this-isAnExample_string' => 'This-Is_anExample-string'
     *
     * @param {string} string
     * @param {boolean} preserve_prefixed_underscores
     * @returns {string}
     */
    static toMixedCase(string, preserve_prefixed_underscores = true) {
        const self = LuckyCase;
        const a = self.splitCaseString(string);
        let converted = null;
        do {
            converted = '';
            for(let part of a) {
                converted += self.convertCase(part, self._sampleFromArray(Object.keys(self.CASES)), preserve_prefixed_underscores)
            }
            converted = self.convertCase(converted, self._sampleFromArray(Object.keys(self.CASES)), preserve_prefixed_underscores)
        } while (!(converted !== string && self.getUnderscoresAtStart(string) + converted !== string));
        if(preserve_prefixed_underscores) {
            return self.getUnderscoresAtStart(string) + converted;
        } else {
            return converted;
        }
    }

    /**
     * Check if the string is a valid mixed case (without special characters!)
     *
     * @param {string} string
     * @param {boolean} allow_prefixed_underscores
     * @returns {boolean}
     */
    static isMixedCase(string, allow_prefixed_underscores = true) {
        const self = LuckyCase;
        let s;
        if(allow_prefixed_underscores) {
            s = self.cutUnderscoresAtStart(string);
        } else {
            s = string;
        }
        return self._isCaseMatch(s, self.MIXED_CASE);
    }

    //----------------------------------------------------------------------------------------------------
    // SWAP CASE
    //----------------------------------------------------------------------------------------------------

    /**
     * Swaps character cases in string
     *
     * lower case to upper case
     * upper case to lower case
     * dash to underscore
     * underscore to dash
     *
     * @example conversion
     *      'this-isAnExample_string' => 'THIS_ISaNeXAMPLE-STRING'
     *
     * @param {string} string
     * @param {boolean} preserve_prefixed_underscores
     * @returns {string}
     */
    static swapCase(string, preserve_prefixed_underscores = false) {
        const self = LuckyCase;
        let s;
        if(preserve_prefixed_underscores) {
            s = self.cutUnderscoresAtStart(string);
        } else {
            s = string;
        }
        let sp = s.split('');
        for(let i = 0; i < sp.length; ++i) {
            let char = sp[i];
            if(char === '_') {
                sp[i] = '-';
            } else if(char === '-') {
                sp[i] = '_';
            } else if(self.isLowerCase(char)) {
                sp[i] = self.toUpperCase(char);
            } else if(self.isUpperCase(char)) {
                sp[i] = self.toLowerCase(char);
            }
        }
        sp = sp.join('');
        if(preserve_prefixed_underscores) {
            return self.getUnderscoresAtStart(string) + sp;
        } else {
            return sp;
        }
    }

    //----------------------------------------------------------------------------------------------------
    // CONSTANTIZE
    //----------------------------------------------------------------------------------------------------

    /**
     * Convert the string from any case
     * into pascal case and casts it into a constant
     *
     * Does not work in all node js contexts because of scopes, where the constant is not available here.
     * Then you might use eval(LuckyCase.toPascalCase) instead.
     * Or you may use it with global defined variables, global.<variable_name>
     *
     * @example conversion
     *      'this-isAnExample_string' => ThisIsAnExampleString
     *      'this/is_an/example_path' => ThisIsAnExamplePath
     *
     * @param {string} string
     * @returns {any}
     */
    static constantize(string) {
        const self = LuckyCase;
        let s = string.replace(/\//g,'_');
        let constant_string = self.toPascalCase(s, false);
        return eval(constant_string);
    }

    /**
     * Deconverts the constant back into specified target type
     *
     * Does not work in special scopes in node js
     *
     * @example deconversion
     *      ThisAweSomeConstant => 'thisAweSomeConstant'
     *      function myFunction() {} => 'myFunction'
     *
     * @param {function} constant
     * @param {string} case_type
     * @returns {string}
     */
    static deconstantize(constant, case_type = LuckyCase.CAMEL_CASE) {
        const self = LuckyCase;
        let s;
        if(typeof constant === 'function') {
            s = constant.name;
        } else {
            throw new InvalidConstantError("Constant must be of type 'function'");
        }
        return self.convertCase(s, case_type);
    }

    //----------------------------------------------------------------------------------------------------
    // HELPERS
    //----------------------------------------------------------------------------------------------------

    /**
     * Return string without underscores at the start
     *
     * @param {string} string
     * @returns {string} string without prefixed underscores
     */
    static cutUnderscoresAtStart(string) {
        let underscore_counter = 0;
        const characters = string.split('');
        for (let c of characters) {
            if (c === '_') {
                ++underscore_counter;
            } else {
                break;
            }
        }
        return string.substr(underscore_counter);
    }

    /**
     * Return the underscores at the start of the string
     *
     * @param {string} string
     * @returns {string} string of underscores or empty if none found
     */
    static getUnderscoresAtStart(string) {
        let underscores = '';
        for (let c of string.split('')) {
            if (c === '_') {
                underscores += '_';
            } else {
                break;
            }
        }
        return underscores;
    }

    /**
     * Split the string into parts
     * It is splitted by all (different) case separators
     *
     * @param {string} string
     * @returns {string[]}
     */
    static splitCaseString(string) {
        const self = LuckyCase;
        let s = self.cutUnderscoresAtStart(string);
        if (!self.isUpperCase(s)) {
            // prepend all upper characters with underscore
            s = s.replace(makeUpperLowerRegExp(`([::upper::])`), "_$1");
        }
        s = s.replace(/ /g,'_');  // replace all spaces with underscore
        s = s.replace(/\-/g,'_'); // replace all dashes with underscore
        s = self.cutUnderscoresAtStart(s);
        return s.toLocaleLowerCase().split('_').filter((el) => { return !!el; }); // split everything by underscore
    }

    /**
     * Check if the given case matches the string
     *
     * @param {string} string
     * @param {string} case_type
     * @returns {boolean}
     * @private
     */
    static _isCaseMatch(string, case_type) {
        const self = LuckyCase;
        if(self.isValidCaseType(case_type)) {
            const regex = self.CASES[case_type];
            regex.lastIndex = 0; // reset state
            return self.CASES[case_type].test(string);
        } else if(self.FORMATS[case_type]) {
            const regex = self.FORMATS[case_type];
            regex.lastIndex = 0;
            return self.FORMATS[case_type].test(string);
        } else {
            const error_message = `Invalid case type '${case_type}'. Valid types are: ${Object.keys(self.CASES).join(', ')}`;
            throw new InvalidCaseError(error_message);
        }
    }

    /**
     * Return a random sample from given array
     *
     * @param {Array} array
     * @returns {*} sample item of given array
     * @private
     */
    static _sampleFromArray(array) {
        return array[Math.floor(Math.random() * array.length)];
    }
}

/**
 * @type {string}
 * @private
 */
LuckyCase._version = "1.1.8";

// Last update @ 2020-11-23
LuckyCase._lower = "\\u0061-\\u007A\\u00B5\\u00DF-\\u00F6\\u00F8-\\u00FF\\u0101\\u0103\\u0105\\u0107\\u0109\\u010B\\u010D\\u010F\\u0111\\u0113\\u0115\\u0117\\u0119\\u011B\\u011D\\u011F\\u0121\\u0123\\u0125\\u0127\\u0129\\u012B\\u012D\\u012F\\u0131\\u0133\\u0135\\u0137-\\u0138\\u013A\\u013C\\u013E\\u0140\\u0142\\u0144\\u0146\\u0148-\\u0149\\u014B\\u014D\\u014F\\u0151\\u0153\\u0155\\u0157\\u0159\\u015B\\u015D\\u015F\\u0161\\u0163\\u0165\\u0167\\u0169\\u016B\\u016D\\u016F\\u0171\\u0173\\u0175\\u0177\\u017A\\u017C\\u017E-\\u0180\\u0183\\u0185\\u0188\\u018C-\\u018D\\u0192\\u0195\\u0199-\\u019B\\u019E\\u01A1\\u01A3\\u01A5\\u01A8\\u01AA-\\u01AB\\u01AD\\u01B0\\u01B4\\u01B6\\u01B9-\\u01BA\\u01BD-\\u01BF\\u01C6\\u01C9\\u01CC\\u01CE\\u01D0\\u01D2\\u01D4\\u01D6\\u01D8\\u01DA\\u01DC-\\u01DD\\u01DF\\u01E1\\u01E3\\u01E5\\u01E7\\u01E9\\u01EB\\u01ED\\u01EF-\\u01F0\\u01F3\\u01F5\\u01F9\\u01FB\\u01FD\\u01FF\\u0201\\u0203\\u0205\\u0207\\u0209\\u020B\\u020D\\u020F\\u0211\\u0213\\u0215\\u0217\\u0219\\u021B\\u021D\\u021F\\u0221\\u0223\\u0225\\u0227\\u0229\\u022B\\u022D\\u022F\\u0231\\u0233-\\u0239\\u023C\\u023F-\\u0240\\u0242\\u0247\\u0249\\u024B\\u024D\\u024F-\\u0293\\u0295-\\u02AF\\u0371\\u0373\\u0377\\u037B-\\u037D\\u0390\\u03AC-\\u03CE\\u03D0-\\u03D1\\u03D5-\\u03D7\\u03D9\\u03DB\\u03DD\\u03DF\\u03E1\\u03E3\\u03E5\\u03E7\\u03E9\\u03EB\\u03ED\\u03EF-\\u03F3\\u03F5\\u03F8\\u03FB-\\u03FC\\u0428-\\u045F\\u0461\\u0463\\u0465\\u0467\\u0469\\u046B\\u046D\\u046F\\u0471\\u0473\\u0475\\u0477\\u0479\\u047B\\u047D\\u047F\\u0481\\u048B\\u048D\\u048F\\u0491\\u0493\\u0495\\u0497\\u0499\\u049B\\u049D\\u049F\\u04A1\\u04A3\\u04A5\\u04A7\\u04A9\\u04AB\\u04AD\\u04AF\\u04B1\\u04B3\\u04B5\\u04B7\\u04B9\\u04BB\\u04BD\\u04BF\\u04C2\\u04C4\\u04C6\\u04C8\\u04CA\\u04CC\\u04CE-\\u04CF\\u04D1\\u04D3\\u04D5\\u04D7-\\u04FB\\u04FD\\u04FF\\u0501\\u0503\\u0505\\u0507\\u0509\\u050B\\u050D\\u050F\\u0511\\u0513\\u0515\\u0517\\u0519\\u051B\\u051D\\u051F\\u0521\\u0523\\u0525\\u0527\\u0529\\u052B\\u052D\\u052F\\u0560-\\u0588\\u0CC0-\\u0CF2\\u10D0-\\u10FA\\u10FD-\\u10FF\\u13F8-\\u13FD\\u18C0-\\u18DF\\u1C80-\\u1C88\\u1D00-\\u1D2B\\u1D6B-\\u1D77\\u1D79-\\u1D9A\\u1E01\\u1E03\\u1E05\\u1E07\\u1E09\\u1E0B\\u1E0D\\u1E0F\\u1E11\\u1E13\\u1E15\\u1E17\\u1E19\\u1E1B\\u1E1D\\u1E1F\\u1E21\\u1E23\\u1E25\\u1E27\\u1E29\\u1E2B\\u1E2D\\u1E2F\\u1E31\\u1E33\\u1E35\\u1E37\\u1E39\\u1E3B\\u1E3D\\u1E3F\\u1E41\\u1E43\\u1E45\\u1E47\\u1E49\\u1E4B\\u1E4D\\u1E4F\\u1E51\\u1E53\\u1E55\\u1E57\\u1E59\\u1E5B\\u1E5D\\u1E5F\\u1E61\\u1E63\\u1E65\\u1E67\\u1E69\\u1E6B\\u1E6D\\u1E6F\\u1E71\\u1E73\\u1E75\\u1E77\\u1E79\\u1E7B\\u1E7D\\u1E7F\\u1E81\\u1E83\\u1E85\\u1E87\\u1E89\\u1E8B\\u1E8D\\u1E8F\\u1E91\\u1E93\\u1E95-\\u1E9D\\u1E9F\\u1EA1\\u1EA3\\u1EA5\\u1EA7\\u1EA9\\u1EAB\\u1EAD\\u1EAF\\u1EB1\\u1EB3\\u1EB5\\u1EB7\\u1EB9\\u1EBB\\u1EBD\\u1EBF\\u1EC1\\u1EC3\\u1EC5\\u1EC7\\u1EC9\\u1ECB\\u1ECD\\u1ECF\\u1ED1\\u1ED3\\u1ED5\\u1ED7\\u1ED9\\u1EDB\\u1EDD\\u1EDF\\u1EE1\\u1EE3\\u1EE5\\u1EE7\\u1EE9\\u1EEB\\u1EED\\u1EEF\\u1EF1\\u1EF3\\u1EF5\\u1EF7\\u1EF9\\u1EFB\\u1EFD\\u1EFF-\\u1F07\\u1F10-\\u1F15\\u1F20-\\u1F27\\u1F30-\\u1F37\\u1F40-\\u1F45\\u1F50-\\u1F57\\u1F60-\\u1F67\\u1F70-\\u1F7D\\u1F80-\\u1F87\\u1F90-\\u1F97\\u1FA0-\\u1FA7\\u1FB0-\\u1FB4\\u1FB6-\\u1FB7\\u1FBE\\u1FC2-\\u1FC4\\u1FC6-\\u1FC7\\u1FD0-\\u1FD3\\u1FD6-\\u1FD7\\u1FE0-\\u1FE7\\u1FF2-\\u1FF4\\u1FF6-\\u1FF7\\u210A\\u210E-\\u210F\\u2113\\u212F\\u2134\\u2139\\u213C-\\u213D\\u2146-\\u2149\\u214E\\u2184\\u2C30-\\u2C5E\\u2C61\\u2C65-\\u2C66\\u2C68\\u2C6A\\u2C6C\\u2C71\\u2C73-\\u2C74\\u2C76-\\u2C7B\\u2C81\\u2C83\\u2C85\\u2C87\\u2C89\\u2C8B\\u2C8D\\u2C8F\\u2C91\\u2C93\\u2C95\\u2C97\\u2C99\\u2C9B\\u2C9D\\u2C9F\\u2CA1\\u2CA3\\u2CA5\\u2CA7\\u2CA9\\u2CAB\\u2CAD\\u2CAF\\u2CB1\\u2CB3\\u2CB5\\u2CB7\\u2CB9\\u2CBB\\u2CBD\\u2CBF\\u2CC1\\u2CC3\\u2CC5\\u2CC7\\u2CC9\\u2CCB\\u2CCD\\u2CCF\\u2CD1\\u2CD3\\u2CD5\\u2CD7\\u2CD9\\u2CDB\\u2CDD\\u2CDF\\u2CE1\\u2CE3-\\u2CE4\\u2CEC\\u2CEE\\u2CF3\\u2D00-\\u2D25\\u2D27\\u2D2D\\u6E60-\\u6E7F\\uA641\\uA643\\uA645\\uA647\\uA649\\uA64B\\uA64D\\uA64F\\uA651\\uA653\\uA655\\uA657\\uA659\\uA65B\\uA65D\\uA65F\\uA661\\uA663\\uA665\\uA667\\uA669\\uA66B\\uA66D\\uA681\\uA683\\uA685\\uA687\\uA689\\uA68B\\uA68D\\uA68F\\uA691\\uA693\\uA695\\uA697\\uA699\\uA69B\\uA723\\uA725\\uA727\\uA729\\uA72B\\uA72D\\uA72F-\\uA731\\uA733\\uA735\\uA737\\uA739\\uA73B\\uA73D\\uA73F\\uA741\\uA743\\uA745\\uA747\\uA749\\uA74B\\uA74D\\uA74F\\uA751\\uA753\\uA755\\uA757\\uA759\\uA75B\\uA75D\\uA75F\\uA761\\uA763\\uA765\\uA767\\uA769\\uA76B\\uA76D\\uA76F\\uA771-\\uA778\\uA77A\\uA77C\\uA77F\\uA781\\uA783\\uA785\\uA787\\uA78C\\uA78E\\uA791\\uA793-\\uA795\\uA797\\uA799\\uA79B\\uA79D\\uA79F\\uA7A1\\uA7A3\\uA7A5\\uA7A7\\uA7A9\\uA7AF\\uA7B5\\uA7B7\\uA7B9\\uA7BB\\uA7BD\\uA7BF\\uA7C3\\uA7FA\\uAB30-\\uAB5A\\uAB60-\\uAB67\\uAB70-\\uABBF\\uD41A-\\uD433\\uD44E-\\uD454\\uD456-\\uD467\\uD482-\\uD49B\\uD4B6-\\uD4B9\\uD4BB\\uD4BD-\\uD4C3\\uD4C5-\\uD4CF\\uD4EA-\\uD503\\uD51E-\\uD537\\uD552-\\uD56B\\uD586-\\uD59F\\uD5BA-\\uD5D3\\uD5EE-\\uD607\\uD622-\\uD63B\\uD656-\\uD66F\\uD68A-\\uD6A5\\uD6C2-\\uD6DA\\uD6DC-\\uD6E1\\uD6FC-\\uD714\\uD716-\\uD71B\\uD736-\\uD74E\\uD750-\\uD755\\uD770-\\uD788\\uD78A-\\uD78F\\uD7AA-\\uD7C2\\uD7C4-\\uD7C9\\uD7CB\\uE922-\\uE943\\uFB00-\\uFB06\\uFB13-\\uFB17\\uFF41-\\uFF5A";
LuckyCase._upper = "\\u0041-\\u005A\\u00C0-\\u00D6\\u00D8-\\u00DE\\u0100\\u0102\\u0104\\u0106\\u0108\\u010A\\u010C\\u010E\\u0110\\u0112\\u0114\\u0116\\u0118\\u011A\\u011C\\u011E\\u0120\\u0122\\u0124\\u0126\\u0128\\u012A\\u012C\\u012E\\u0130\\u0132\\u0134\\u0136\\u0139\\u013B\\u013D\\u013F\\u0141\\u0143\\u0145\\u0147\\u014A\\u014C\\u014E\\u0150\\u0152\\u0154\\u0156\\u0158\\u015A\\u015C\\u015E\\u0160\\u0162\\u0164\\u0166\\u0168\\u016A\\u016C\\u016E\\u0170\\u0172\\u0174\\u0176\\u0178-\\u0179\\u017B\\u017D\\u0181-\\u0182\\u0184\\u0186-\\u0187\\u0189-\\u018B\\u018E-\\u0191\\u0193-\\u0194\\u0196-\\u0198\\u019C-\\u019D\\u019F-\\u01A0\\u01A2\\u01A4\\u01A6-\\u01A7\\u01A9\\u01AC\\u01AE-\\u01AF\\u01B1-\\u01B3\\u01B5\\u01B7-\\u01B8\\u01BC\\u01C4\\u01C7\\u01CA\\u01CD\\u01CF\\u01D1\\u01D3\\u01D5\\u01D7\\u01D9\\u01DB\\u01DE\\u01E0\\u01E2\\u01E4\\u01E6\\u01E8\\u01EA\\u01EC\\u01EE\\u01F1\\u01F4\\u01F6-\\u01F8\\u01FA\\u01FC\\u01FE\\u0200\\u0202\\u0204\\u0206\\u0208\\u020A\\u020C\\u020E\\u0210\\u0212\\u0214\\u0216\\u0218\\u021A\\u021C\\u021E\\u0220\\u0222\\u0224\\u0226\\u0228\\u022A\\u022C\\u022E\\u0230\\u0232\\u023A-\\u023B\\u023D-\\u023E\\u0241\\u0243-\\u0246\\u0248\\u024A\\u024C\\u024E\\u0370\\u0372\\u0376\\u037F\\u0386\\u0388-\\u038A\\u038C\\u038E-\\u038F\\u0391-\\u03A1\\u03A3-\\u03AB\\u03CF\\u03D2-\\u03D4\\u03D8\\u03DA\\u03DC\\u03DE\\u03E0\\u03E2\\u03E4\\u03E6\\u03E8\\u03EA\\u03EC\\u03EE\\u03F4\\u03F7\\u03F9-\\u03FA\\u03FD-\\u042F\\u0460\\u0462\\u0464\\u0466\\u0468\\u046A\\u046C\\u046E\\u0470\\u0472\\u0474\\u0476\\u0478\\u047A\\u047C\\u047E\\u0480\\u048A\\u048C\\u048E\\u0490\\u0492\\u0494\\u0496\\u0498\\u049A\\u049C\\u049E\\u04A0\\u04A2\\u04A4\\u04A6\\u04A8\\u04AA\\u04AC\\u04AE\\u04B0-\\u04D4\\u04D6\\u04D8\\u04DA\\u04DC\\u04DE\\u04E0\\u04E2\\u04E4\\u04E6\\u04E8\\u04EA\\u04EC\\u04EE\\u04F0\\u04F2\\u04F4\\u04F6\\u04F8\\u04FA\\u04FC\\u04FE\\u0500\\u0502\\u0504\\u0506\\u0508\\u050A\\u050C\\u050E\\u0510\\u0512\\u0514\\u0516\\u0518\\u051A\\u051C\\u051E\\u0520\\u0522\\u0524\\u0526\\u0528\\u052A\\u052C\\u052E\\u0531-\\u0556\\u0C80-\\u0CB2\\u10A0-\\u10C5\\u10C7\\u10CD\\u13A0-\\u13F5\\u18A0-\\u18BF\\u1C90-\\u1CBA\\u1CBD-\\u1CBF\\u1E00\\u1E02\\u1E04\\u1E06\\u1E08\\u1E0A\\u1E0C\\u1E0E\\u1E10\\u1E12\\u1E14\\u1E16\\u1E18\\u1E1A\\u1E1C\\u1E1E\\u1E20\\u1E22\\u1E24\\u1E26\\u1E28\\u1E2A\\u1E2C\\u1E2E\\u1E30\\u1E32\\u1E34\\u1E36\\u1E38\\u1E3A\\u1E3C\\u1E3E\\u1E40\\u1E42\\u1E44\\u1E46\\u1E48\\u1E4A\\u1E4C\\u1E4E\\u1E50\\u1E52\\u1E54\\u1E56\\u1E58\\u1E5A\\u1E5C\\u1E5E\\u1E60\\u1E62\\u1E64\\u1E66\\u1E68\\u1E6A\\u1E6C\\u1E6E\\u1E70\\u1E72\\u1E74\\u1E76\\u1E78\\u1E7A\\u1E7C\\u1E7E\\u1E80\\u1E82\\u1E84\\u1E86\\u1E88\\u1E8A\\u1E8C\\u1E8E\\u1E90\\u1E92\\u1E94\\u1E9E\\u1EA0\\u1EA2\\u1EA4\\u1EA6\\u1EA8\\u1EAA\\u1EAC\\u1EAE\\u1EB0\\u1EB2\\u1EB4\\u1EB6\\u1EB8\\u1EBA\\u1EBC\\u1EBE\\u1EC0\\u1EC2\\u1EC4\\u1EC6\\u1EC8\\u1ECA\\u1ECC\\u1ECE\\u1ED0\\u1ED2\\u1ED4\\u1ED6\\u1ED8\\u1EDA\\u1EDC\\u1EDE\\u1EE0\\u1EE2\\u1EE4\\u1EE6\\u1EE8\\u1EEA\\u1EEC\\u1EEE\\u1EF0\\u1EF2\\u1EF4\\u1EF6\\u1EF8\\u1EFA\\u1EFC\\u1EFE\\u1F08-\\u1F0F\\u1F18-\\u1F1D\\u1F28-\\u1F2F\\u1F38-\\u1F3F\\u1F48-\\u1F4D\\u1F59\\u1F5B\\u1F5D\\u1F5F\\u1F68-\\u1F6F\\u1FB8-\\u1FBB\\u1FC8-\\u1FCB\\u1FD8-\\u1FDB\\u1FE8-\\u1FEC\\u1FF8-\\u1FFB\\u2102\\u2107\\u210B-\\u210D\\u2110-\\u2112\\u2115\\u2119-\\u211D\\u2124\\u2126\\u2128\\u212A-\\u212D\\u2130-\\u2133\\u213E-\\u213F\\u2145\\u2183\\u2C00-\\u2C2E\\u2C60\\u2C62-\\u2C64\\u2C67\\u2C69\\u2C6B\\u2C6D-\\u2C70\\u2C72\\u2C75\\u2C7E-\\u2C80\\u2C82\\u2C84\\u2C86\\u2C88\\u2C8A\\u2C8C\\u2C8E\\u2C90\\u2C92\\u2C94\\u2C96\\u2C98\\u2C9A\\u2C9C\\u2C9E\\u2CA0\\u2CA2\\u2CA4\\u2CA6\\u2CA8\\u2CAA\\u2CAC\\u2CAE\\u2CB0\\u2CB2\\u2CB4\\u2CB6\\u2CB8\\u2CBA\\u2CBC\\u2CBE\\u2CC0\\u2CC2\\u2CC4\\u2CC6\\u2CC8\\u2CCA\\u2CCC\\u2CCE\\u2CD0\\u2CD2\\u2CD4\\u2CD6\\u2CD8\\u2CDA\\u2CDC\\u2CDE\\u2CE0\\u2CE2\\u2CEB\\u2CED\\u2CF2\\u6E40-\\u6E5F\\uA640\\uA642\\uA644\\uA646\\uA648\\uA64A\\uA64C\\uA64E\\uA650\\uA652\\uA654\\uA656\\uA658\\uA65A\\uA65C\\uA65E\\uA660\\uA662\\uA664\\uA666\\uA668\\uA66A\\uA66C\\uA680\\uA682\\uA684\\uA686\\uA688\\uA68A\\uA68C\\uA68E\\uA690\\uA692\\uA694\\uA696\\uA698\\uA69A\\uA722\\uA724\\uA726\\uA728\\uA72A\\uA72C\\uA72E\\uA732\\uA734\\uA736\\uA738\\uA73A\\uA73C\\uA73E\\uA740\\uA742\\uA744\\uA746\\uA748\\uA74A\\uA74C\\uA74E\\uA750\\uA752\\uA754\\uA756\\uA758\\uA75A\\uA75C\\uA75E\\uA760\\uA762\\uA764\\uA766\\uA768\\uA76A\\uA76C\\uA76E\\uA779\\uA77B\\uA77D-\\uA77E\\uA780\\uA782\\uA784\\uA786\\uA78B\\uA78D\\uA790\\uA792\\uA796\\uA798\\uA79A\\uA79C\\uA79E\\uA7A0\\uA7A2\\uA7A4\\uA7A6\\uA7A8\\uA7AA-\\uA7AE\\uA7B0-\\uA7B4\\uA7B6\\uA7B8\\uA7BA\\uA7BC\\uA7BE\\uA7C2\\uA7C4-\\uA7C6\\uD400-\\uD419\\uD434-\\uD44D\\uD468-\\uD481\\uD49C\\uD49E-\\uD49F\\uD4A2\\uD4A5-\\uD4A6\\uD4A9-\\uD4AC\\uD4AE-\\uD4B5\\uD4D0-\\uD4E9\\uD504-\\uD505\\uD507-\\uD50A\\uD50D-\\uD514\\uD516-\\uD51C\\uD538-\\uD539\\uD53B-\\uD53E\\uD540-\\uD544\\uD546\\uD54A-\\uD550\\uD56C-\\uD585\\uD5A0-\\uD5B9\\uD5D4-\\uD5ED\\uD608-\\uD621\\uD63C-\\uD655\\uD670-\\uD689\\uD6A8-\\uD6C0\\uD6E2-\\uD6FA\\uD71C-\\uD734\\uD756-\\uD76E\\uD790-\\uD7A8\\uD7CA\\uE900-\\uE921\\uFF21-\\uFF3A";

function makeUpperLowerRegExp(regex_string) {
    return new RegExp(regex_string.replace(/::lower::/g, LuckyCase._lower).replace(/::upper::/g, LuckyCase._upper), 'g');
}

// regexp for cases
LuckyCase.CASES = {
    SNAKE_CASE: makeUpperLowerRegExp("^[::lower::]{1}[::lower::_0-9]+$"),
    UPPER_SNAKE_CASE: makeUpperLowerRegExp("^[::upper::]{1}[::upper::_0-9]+$"),
    PASCAL_CASE: makeUpperLowerRegExp("^[::upper::]{1}[::upper::::lower::0-9]+$"),
    CAMEL_CASE: makeUpperLowerRegExp("^[::lower::]{1}[::upper::::lower::0-9]+$"),
    DASH_CASE: makeUpperLowerRegExp("^([::lower::]){1}[::lower::\\-0-9]*[::lower::0-9]+$"),
    UPPER_DASH_CASE: makeUpperLowerRegExp("^([::upper::]){1}[::upper::\\-0-9]*[::upper::0-9]+$"),
    TRAIN_CASE: makeUpperLowerRegExp("^([::upper::][::lower::0-9]*\\-|[0-9]+\\-)*([::upper::][::lower::0-9]*)$"),
    WORD_CASE: makeUpperLowerRegExp("^[::lower::]{1}[::lower:: 0-9]+$"),
    UPPER_WORD_CASE: makeUpperLowerRegExp("^[::upper::]{1}[::upper:: 0-9]+$"),
    CAPITAL_WORD_CASE: makeUpperLowerRegExp("^([::upper::][::lower::0-9]*\\ |[0-9]+\\ )*([::upper::][::lower::0-9]*)$"),
    SENTENCE_CASE: makeUpperLowerRegExp("^[::upper::]{1}[::lower:: 0-9]+$"),
    MIXED_CASE: makeUpperLowerRegExp("^[::upper::::lower::][::upper::::lower::_\\-0-9 ]*$"),
}

// regexp for formats
LuckyCase.FORMATS = {
    CAPITAL: makeUpperLowerRegExp("^[::upper::]{1}.*$"),
    UPPER_CASE: makeUpperLowerRegExp("^[^::lower::]+$"),
    LOWER_CASE: makeUpperLowerRegExp("^[^::upper::]+$"),
}

// constants for case_types
LuckyCase.SNAKE_CASE = 'SNAKE_CASE';
LuckyCase.UPPER_SNAKE_CASE = 'UPPER_SNAKE_CASE';
LuckyCase.PASCAL_CASE = 'PASCAL_CASE';
LuckyCase.CAMEL_CASE = 'CAMEL_CASE';
LuckyCase.DASH_CASE = 'DASH_CASE';
LuckyCase.UPPER_DASH_CASE = 'UPPER_DASH_CASE';
LuckyCase.TRAIN_CASE = 'TRAIN_CASE';
LuckyCase.WORD_CASE = 'WORD_CASE';
LuckyCase.UPPER_WORD_CASE = 'UPPER_WORD_CASE';
LuckyCase.CAPITAL_WORD_CASE = 'CAPITAL_WORD_CASE';
LuckyCase.SENTENCE_CASE = 'SENTENCE_CASE';
LuckyCase.MIXED_CASE = 'MIXED_CASE';

// constants for formats
LuckyCase.CAPITAL = 'CAPITAL';
LuckyCase.UPPER_CASE = 'UPPER_CASE';
LuckyCase.LOWER_CASE = 'LOWER_CASE';




class InvalidCaseError extends Error {
    constructor(message) {
        super(message);
        this.name = "InvalidCaseError";
    }
}



class InvalidConstantError extends Error {
    constructor(message) {
        super(message);
        this.name = "InvalidConstantError";
    }
}



/**
 * typifier
 *
 * The javascript library to get or check the type of a given variable.
 *
 * @version 0.0.12
 * @date 2022-07-05T10:55:11.240Z
 * @link https://github.com/magynhard/typifier
 * @author Matthäus J. N. Beyrle
 * @copyright Matthäus J. N. Beyrle
 */


/**
 * Typifier
 *
 * The javascript library to get or check the type of a given variable.
 *
 */
class Typifier {
    /**
     * Get the version of the used library
     * @returns {string}
     */
    static getVersion() {
        const self = Typifier;
        return self._version;
    }

    /**
     * Check if given variable is of type Array
     *
     * @param {any} value
     * @returns {boolean} true if Array, otherwise false
     */
    static isArray(value) {
        return value instanceof Array && value.constructor.name === 'Array';
    }

    /**
     * Check if given variable is of type Object
     *
     * @param {any} value
     * @returns {boolean} true if Object, otherwise false
     */
    static isObject(value) {
        return value instanceof Object && value.constructor.name === 'Object';
    }

    /**
     * Check if given variable is of type string (primitive)
     *
     * @param {any} value
     * @returns {boolean} true if 'string', otherwise false
     */
    static isString(value) {
        return typeof value === 'string';
    }

    /**
     * Check if given variable is of type String (class instance)
     *
     * @param {any} value
     * @returns {boolean} true if instance of class 'String', otherwise false
     */
    static isStringClass(value) {
        return value instanceof Object && value.constructor.name === 'String';
    }

    /**
     * Check if given variable is of type number (primitive)
     *
     * @param {any} value
     * @returns {boolean} true if 'number', otherwise false
     */
    static isNumber(value) {
        return typeof value === 'number';
    }

    /**
     * Check if given variable is of type Number (class instance)
     *
     * @param {any} value
     * @returns {boolean} true if instance of class 'Number', otherwise false
     */
    static isNumberClass(value) {
        return value instanceof Object && value.constructor.name === 'Number';
    }

    /**
     * Check if given variable is a valid number inside a string that evaluates to a number in Javascript.
     *
     * @example
     *      // valid number strings
     *      '200'
     *      '25.75'
     *      '10.'
     *      '.5'
     *      '500_000'
     *      '0x12F'
     *
     * @param {any} value
     * @returns {boolean} true if valid JavaScript number inside string
     */
    static isNumberString(value) {
        const self = Typifier;
        if(!(self.isString(value) || self.isStringClass(value))) return false;
        const number_regex = /^[0-9._]+$/g;
        const hex_regex = /^0[xX][0-9A-Fa-f]+$/g;
        if(value.match(number_regex) || value.match(hex_regex)) {
            try {
                eval(value);
                return true;
            } catch (e) {
                return false;
            }
        } else {
            return false;
        }
    }

    /**
     * Check if given variable is of type Date
     *
     * @param {any} value
     * @returns {boolean} true if Date, otherwise false
     */
    static isDate(value) {
        return value instanceof Date;
    }

    /**
     * Check if given variable is of type RegExp
     *
     * @param {any} value
     * @returns {boolean} true if RegExp, otherwise false
     */
    static isRegExp(value) {
        return value instanceof RegExp;
    }

    /**
     * Check if given variable is of type NaN
     *
     * @param {any} value
     * @returns {boolean} true if NaN, otherwise false
     */
    static isNaN(value) {
        return typeof value === 'number' && (value).toString() === 'NaN';
    }

    /**
     * Check if given variable is of type Infinity
     *
     * @param {any} value
     * @returns {boolean} true if Infinity, otherwise false
     */
    static isInfinity(value) {
        return value === Infinity;
    }

    /**
     * Check if given variable is of type undefined
     *
     * @param {any} value
     * @returns {boolean} true if undefined, otherwise false
     */
    static isUndefined(value) {
        return typeof value === 'undefined';
    }

    /**
     * Check if given variable is of type null
     *
     * @param {any} value
     * @returns {boolean} true if null, otherwise false
     */
    static isNull(value) {
        return typeof value === null;
    }

    /**
     * Check if given variable is of type boolean (primitive)
     *
     * @param {any} value
     * @returns {boolean} true if 'boolean' or instance of class 'Boolean', otherwise false
     */
    static isBoolean(value) {
        return typeof value === 'boolean' || (value instanceof Object && value.constructor.name === 'Boolean');
    }

    /**
     * Check if given variable is of type Boolean (class instance)
     *
     * @param {any} value
     * @returns {boolean} true if instance of class 'Boolean', otherwise false
     */
    static isBooleanClass(value) {
        return value instanceof Object && value.constructor.name === 'Boolean';
    }

    /**
     * Check if given variable is of type function
     *
     * @param {any} value
     * @returns {boolean} true if function, otherwise false
     */
    static isFunction(value) {
        return typeof value === 'function';
    }

    /**
     * Check if the given value is of the given type.
     *
     * @example
     *  Typifier.is('Array',[1,2,3]) // => true
     *
     * @param {string} type
     * @param {any} value
     * @returns {boolean} true if the value is of the given type
     */
    static is(type, value) {
        const self = Typifier;
        return self.getType(value) === type;
    }

    /**
     * Get the type of the given value.
     * Primitive types are lower case.
     *
     * @example
     *  'Object'
     * @example
     *  'string'
     *
     * @param {any} value
     * @returns {string} type in pascal case format
     */
    static getType(value) {
        const self = Typifier;
        if (self.isArray(value)) {
            return 'Array';
        } else if (self.isObject(value)) {
            return 'Object';
        } else if (self.isString(value)) {
            return 'string';
        } else if (self.isStringClass(value)) {
            return 'String';
        } else if (self.isNumber(value)) {
            return 'number';
        } else if (self.isNumberClass(value)) {
            return 'Number';
        } else if (self.isDate(value)) {
            return 'Date';
        } else if (self.isRegExp(value)) {
            return 'RegExp';
        } else if (self.isNaN(value)) {
            return 'NaN';
        } else if (self.isInfinity(value)) {
            return 'Infinity';
        } else if (self.isUndefined(value)) {
            return 'undefined';
        } else if (self.isNull(value)) {
            return 'null';
        } else if (self.isBoolean(value)) {
            return 'boolean';
        } else if (self.isBooleanClass(value)) {
            return 'Boolean';
        } else if (self.isFunction(value)) {
            return 'function';
        } else {
            let type = 'Unknown';
            if (value && value.constructor) {
                type = value.constructor.name;
            } else if (value && value.prop && value.prop.constructor) {
                type = value.prop.constructor;
            } else {
                type = typeof value;
            }
            return LuckyCase.toPascalCase(type);
        }
    }
}

/**
 * @type {string}
 * @private
 */
Typifier._version = "0.0.12";



