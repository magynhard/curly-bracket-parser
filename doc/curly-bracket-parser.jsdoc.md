<a name="CurlyBracketParser"></a>

## CurlyBracketParser
CurlyBracketParserParse variables with curly brackets within templates/strings or filesUse filters for special cases

* [CurlyBracketParser](#CurlyBracketParser)
    * [.getVersion()](#CurlyBracketParser.getVersion) &rarr; <code>string</code>
    * [.parse(string, variables, options)](#CurlyBracketParser.parse) &rarr; <code>string</code>
    * [.parseFile(path, variables, options)](#CurlyBracketParser.parseFile) &rarr; <code>string</code> \| <code>null</code>
    * [.parseFileWrite(path, variables, options)](#CurlyBracketParser.parseFileWrite) &rarr; <code>string</code> \| <code>null</code>
    * [.registerFilter(name, filter_function, options)](#CurlyBracketParser.registerFilter)
    * [.processFilter(name, value)](#CurlyBracketParser.processFilter) &rarr; <code>string</code>
    * [.validFilters()](#CurlyBracketParser.validFilters) &rarr; <code>Array.&lt;string&gt;</code>
    * [.isValidFilter(name)](#CurlyBracketParser.isValidFilter) &rarr; <code>boolean</code>
    * [.registerDefaultVar(name, var_function, options)](#CurlyBracketParser.registerDefaultVar) &rarr; <code>function</code>
    * [.processDefaultVar(name)](#CurlyBracketParser.processDefaultVar) &rarr; <code>string</code>
    * [.unregisterDefaultVar(name)](#CurlyBracketParser.unregisterDefaultVar) &rarr; <code>boolean</code>
    * [.registeredDefaultVars()](#CurlyBracketParser.registeredDefaultVars) &rarr; <code>Array.&lt;string&gt;</code>
    * [.isRegisteredDefaultVar(name)](#CurlyBracketParser.isRegisteredDefaultVar) &rarr; <code>boolean</code>
    * [.decodeVariable(variable)](#CurlyBracketParser.decodeVariable) &rarr; <code>Object</code>
    * [.decodedVariables(string)](#CurlyBracketParser.decodedVariables) &rarr; <code>Array.&lt;Object&gt;</code>
    * [.variables(string)](#CurlyBracketParser.variables) &rarr; <code>Array.&lt;string&gt;</code>
    * [.isAnyVariableIncluded(string)](#CurlyBracketParser.isAnyVariableIncluded) &rarr; <code>boolean</code>
    * [.includesOneVariableOf(variable_names, string)](#CurlyBracketParser.includesOneVariableOf) &rarr; <code>boolean</code>

<a name="CurlyBracketParser.getVersion"></a>

### CurlyBracketParser.getVersion() &rarr; <code>string</code>
Get the version of the used library
<a name="CurlyBracketParser.parse"></a>

### CurlyBracketParser.parse(string, variables, options) &rarr; <code>string</code>
Parse given string and replace the included variables by the given variables.Given variable values of type null, undefined, NaN or Infinity are processed as empty strings.
**Returns**: <code>string</code> - parsed string  

| Param | Type | Description |
| --- | --- | --- |
| string | <code>string</code> |  |
| variables | <code>Object.&lt;string, string&gt;</code> | <key <-> value> |
| options | <code>Object</code> |  |
| options.unresolved_vars | <code>&#x27;throw&#x27;</code> \| <code>&#x27;keep&#x27;</code> \| <code>&#x27;replace&#x27;</code> | 'throw', 'keep', 'replace' => define how to act when unresolved variables within the string are found. |
| options.replace_pattern | <code>string</code> | pattern used when param unresolved_vars is set to 'replace'. You can include the var name $1 and filter $2. Empty string to remove unresolved variables. |

<a name="CurlyBracketParser.parseFile"></a>

### CurlyBracketParser.parseFile(path, variables, options) &rarr; <code>string</code> \| <code>null</code>
Parse given path content and replace the included variables by the given variables
**Returns**: <code>string</code> \| <code>null</code> - parsed string. In case of given 'success' parameter, the success() function will be called as callback and this function will return null instead.  

| Param | Type | Description |
| --- | --- | --- |
| path | <code>string</code> | to file to parse |
| variables | <code>Object.&lt;string, string&gt;</code> | <key <-> value> |
| options | <code>Object</code> |  |
| options.unresolved_vars | <code>&#x27;throw&#x27;</code> \| <code>&#x27;keep&#x27;</code> \| <code>&#x27;replace&#x27;</code> | 'throw', 'keep', 'replace' => define how to act when unresolved variables within the string are found. |
| options.replace_pattern | <code>string</code> | pattern used when param unresolved_vars is set to 'replace'. You can include the var name $1 and filter $2. Empty string to remove unresolved variables. |
| options.success | <code>function</code> | only affects when running inside a browser. If given, the file of the given path will be requested asynchronous and the parsed string will be passed to this function. |
| options.write | <code>boolean</code> | write parsed content of the file directly into the file. Only available when running by node js. |

<a name="CurlyBracketParser.parseFileWrite"></a>

### CurlyBracketParser.parseFileWrite(path, variables, options) &rarr; <code>string</code> \| <code>null</code>
Parse given path content and replace the included variables by the given variablesAlias method of .parseFile with option write: trueOnly available when running on node js (not in browser)
**Returns**: <code>string</code> \| <code>null</code> - parsed string. In case of given 'success' parameter, the success() function will be called as callback and this function will return null instead.  

| Param | Type | Description |
| --- | --- | --- |
| path | <code>string</code> | to file to parse |
| variables | <code>Object.&lt;string, string&gt;</code> | <key <-> value> |
| options | <code>Object</code> |  |
| options.unresolved_vars | <code>&#x27;throw&#x27;</code> \| <code>&#x27;keep&#x27;</code> \| <code>&#x27;replace&#x27;</code> | 'throw', 'keep', 'replace' => define how to act when unresolved variables within the string are found. |
| options.replace_pattern | <code>string</code> | pattern used when param unresolved_vars is set to 'replace'. You can include the var name $1 and filter $2. Empty string to remove unresolved variables. |

<a name="CurlyBracketParser.registerFilter"></a>

### CurlyBracketParser.registerFilter(name, filter_function, options)
Register your custom filter to the filter list
**Throws**:

- <code>FilterAlreadyRegisteredError</code> if filter does already exist


| Param | Type | Description |
| --- | --- | --- |
| name | <code>string</code> |  |
| filter_function | <code>function</code> |  |
| options | <code>Object</code> |  |
| options.raise_on_exist | <code>boolean</code> | raise exception if filter does already exist, default: true |

<a name="CurlyBracketParser.processFilter"></a>

### CurlyBracketParser.processFilter(name, value) &rarr; <code>string</code>
Process the given value with the given filter
**Returns**: <code>string</code> - converted string with applied filter  
**Throws**:

- <code>InvalidFilterError</code> if the given filter name is invalid


| Param | Type | Description |
| --- | --- | --- |
| name | <code>string</code> | of the filter to apply on the value, e.g. {{var_name|my_filter_name}} |
| value | <code>string</code> | string to apply the specified filter on |

<a name="CurlyBracketParser.validFilters"></a>

### CurlyBracketParser.validFilters() &rarr; <code>Array.&lt;string&gt;</code>
Retrieve array with valid filters
<a name="CurlyBracketParser.isValidFilter"></a>

### CurlyBracketParser.isValidFilter(name) &rarr; <code>boolean</code>
Check if a given filter is valid
**Returns**: <code>boolean</code> - true if filter exists, otherwise false  

| Param | Type |
| --- | --- |
| name | <code>string</code> | 

<a name="CurlyBracketParser.registerDefaultVar"></a>

### CurlyBracketParser.registerDefaultVar(name, var_function, options) &rarr; <code>function</code>
Register a default variable to be replaced automatically by the given block value in futureIf the variable exists already, it will throw an VariableAlreadyRegisteredError
**Returns**: <code>function</code> - var_function  

| Param | Type | Description |
| --- | --- | --- |
| name | <code>string</code> | of the default var |
| var_function | <code>function</code> | function returning the variable value |
| options | <code>Object</code> |  |
| options.overwrite | <code>boolean</code> | explicitly overwrite an existing default var without throwing an execption |

<a name="CurlyBracketParser.processDefaultVar"></a>

### CurlyBracketParser.processDefaultVar(name) &rarr; <code>string</code>
Return the given default variable by returning the result of its function
**Returns**: <code>string</code> - the result of the given default variable function  

| Param | Type |
| --- | --- |
| name | <code>string</code> | 

<a name="CurlyBracketParser.unregisterDefaultVar"></a>

### CurlyBracketParser.unregisterDefaultVar(name) &rarr; <code>boolean</code>
Unregister / remove an existing default variable
**Returns**: <code>boolean</code> - true if variable existed and was unregistered, false if it didn't exist  

| Param | Type | Description |
| --- | --- | --- |
| name | <code>string</code> | of the variable |

<a name="CurlyBracketParser.registeredDefaultVars"></a>

### CurlyBracketParser.registeredDefaultVars() &rarr; <code>Array.&lt;string&gt;</code>
Return an array of registered default variables
<a name="CurlyBracketParser.isRegisteredDefaultVar"></a>

### CurlyBracketParser.isRegisteredDefaultVar(name) &rarr; <code>boolean</code>
Check if the given variable is a registered default variable
**Returns**: <code>boolean</code> - true if variable is registered, otherwise false  

| Param | Type | Description |
| --- | --- | --- |
| name | <code>string</code> | of the variable |

<a name="CurlyBracketParser.decodeVariable"></a>

### CurlyBracketParser.decodeVariable(variable) &rarr; <code>Object</code>
Return a object containing separated name and filter of a variable
**Returns**: <code>Object</code> - name, filter  

| Param | Type | Description |
| --- | --- | --- |
| variable | <code>string</code> | string to scan |

**Example**  
```js
#   '{{var_name|filter_name}}' => { name: 'var_name', filter: 'filter_name' }
```
<a name="CurlyBracketParser.decodedVariables"></a>

### CurlyBracketParser.decodedVariables(string) &rarr; <code>Array.&lt;Object&gt;</code>
Scans the given url for variables with pattern '{{var|optional_filter}}'
**Returns**: <code>Array.&lt;Object&gt;</code> - array of variable names and its filters  

| Param | Type | Description |
| --- | --- | --- |
| string | <code>string</code> | to scan |

**Example**  
```js
#   'The variable {{my_var|my_filter}} is inside this string' => [{ name: "my_var", filter: "my_filter"}]
```
<a name="CurlyBracketParser.variables"></a>

### CurlyBracketParser.variables(string) &rarr; <code>Array.&lt;string&gt;</code>
Scans the given url for variables with pattern '{{var|optional_filter}}'
**Returns**: <code>Array.&lt;string&gt;</code> - array of variable names and its filters  

| Param | Type | Description |
| --- | --- | --- |
| string | <code>string</code> | to scan |

<a name="CurlyBracketParser.isAnyVariableIncluded"></a>

### CurlyBracketParser.isAnyVariableIncluded(string) &rarr; <code>boolean</code>
Check if any variable is included in the given string
**Returns**: <code>boolean</code> - true if any variable is included in the given string, otherwise false  

| Param | Type | Description |
| --- | --- | --- |
| string | <code>string</code> | name of variable to check for |

<a name="CurlyBracketParser.includesOneVariableOf"></a>

### CurlyBracketParser.includesOneVariableOf(variable_names, string) &rarr; <code>boolean</code>
Check if one of the given variable names is included in the given string
**Returns**: <code>boolean</code> - true if one given variable name is included in given the string, otherwise false  

| Param | Type | Description |
| --- | --- | --- |
| variable_names |  |  |
| string | <code>string</code> | name of variable to check for |

