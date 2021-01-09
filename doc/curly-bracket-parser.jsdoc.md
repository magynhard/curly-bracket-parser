<a name="CurlyBracketParser"></a>

## CurlyBracketParser
CurlyBracketParser

Convert and detect various letter cases in strings

* [CurlyBracketParser](#LuckyCase)
    * [.case(string, allow_prefixed_underscores)](#LuckyCase.case) &rarr; <code>string</code> \| <code>null</code>
    * [.cases(string, allow_prefixed_underscores)](#LuckyCase.cases) &rarr; <code>Array.&lt;string&gt;</code> \| <code>null</code>
    * [.convertCase(string, case_type, preserve_prefixed_underscores)](#LuckyCase.convertCase) &rarr; <code>string</code>
    * [.isValidCaseType(case_type)](#LuckyCase.isValidCaseType) &rarr; <code>boolean</code>
    * [.isValidCaseString(string)](#LuckyCase.isValidCaseString) &rarr; <code>boolean</code>
    * [.toUpperCase(string)](#LuckyCase.toUpperCase) &rarr; <code>string</code>
    * [.isUpperCase(string)](#LuckyCase.isUpperCase) &rarr; <code>boolean</code>
    * [.toLowerCase(string)](#LuckyCase.toLowerCase) &rarr; <code>string</code>
    * [.isLowerCase(string)](#LuckyCase.isLowerCase) &rarr; <code>boolean</code>
    * [.toSnakeCase(string, preserve_prefixed_underscores)](#LuckyCase.toSnakeCase) &rarr; <code>string</code>
    * [.isSnakeCase(string, allow_prefixed_underscores)](#LuckyCase.isSnakeCase) &rarr; <code>boolean</code>
    * [.toUpperSnakeCase(string, preserve_prefixed_underscores)](#LuckyCase.toUpperSnakeCase) &rarr; <code>string</code>
    * [.isUpperSnakeCase(string, allow_prefixed_underscores)](#LuckyCase.isUpperSnakeCase) &rarr; <code>boolean</code>
    * [.toPascalCase(string, preserve_prefixed_underscores)](#LuckyCase.toPascalCase) &rarr; <code>string</code>
    * [.isPascalCase(string, allow_prefixed_underscores)](#LuckyCase.isPascalCase) &rarr; <code>boolean</code>
    * [.toCamelCase(string, preserve_prefixed_underscores)](#LuckyCase.toCamelCase) &rarr; <code>string</code>
    * [.isCamelCase(string, allow_prefixed_underscores)](#LuckyCase.isCamelCase) &rarr; <code>boolean</code>
    * [.toDashCase(string, preserve_prefixed_underscores)](#LuckyCase.toDashCase) &rarr; <code>string</code>
    * [.isDashCase(string, allow_prefixed_underscores)](#LuckyCase.isDashCase) &rarr; <code>boolean</code>
    * [.toUpperDashCase(string, preserve_prefixed_underscores)](#LuckyCase.toUpperDashCase) &rarr; <code>string</code>
    * [.isUpperDashCase(string, allow_prefixed_underscores)](#LuckyCase.isUpperDashCase) &rarr; <code>boolean</code>
    * [.toTrainCase(string, preserve_prefixed_underscores)](#LuckyCase.toTrainCase) &rarr; <code>string</code>
    * [.isTrainCase(string, allow_prefixed_underscores)](#LuckyCase.isTrainCase) &rarr; <code>boolean</code>
    * [.toWordCase(string, preserve_prefixed_underscores)](#LuckyCase.toWordCase) &rarr; <code>string</code>
    * [.isWordCase(string, allow_prefixed_underscores)](#LuckyCase.isWordCase) &rarr; <code>boolean</code>
    * [.toUpperWordCase(string, preserve_prefixed_underscores)](#LuckyCase.toUpperWordCase) &rarr; <code>string</code>
    * [.isUpperWordCase(string, allow_prefixed_underscores)](#LuckyCase.isUpperWordCase) &rarr; <code>boolean</code>
    * [.toCapitalWordCase(string, preserve_prefixed_underscores)](#LuckyCase.toCapitalWordCase) &rarr; <code>string</code>
    * [.isCapitalWordCase(string, allow_prefixed_underscores)](#LuckyCase.isCapitalWordCase) &rarr; <code>boolean</code>
    * [.toSentenceCase(string, preserve_prefixed_underscores)](#LuckyCase.toSentenceCase) &rarr; <code>string</code>
    * [.isSentenceCase(string, allow_prefixed_underscores)](#LuckyCase.isSentenceCase) &rarr; <code>boolean</code>
    * [.toCapital(string, skip_prefixed_underscores)](#LuckyCase.toCapital) &rarr; <code>string</code>
    * [.capitalize(string, skip_prefixed_underscores)](#LuckyCase.capitalize) &rarr; <code>string</code>
    * [.isCapital(string, skip_prefixed_underscores)](#LuckyCase.isCapital) &rarr; <code>boolean</code>
    * [.isCapitalized(string, skip_prefixed_underscores)](#LuckyCase.isCapitalized) &rarr; <code>boolean</code>
    * [.toMixedCase(string, preserve_prefixed_underscores)](#LuckyCase.toMixedCase) &rarr; <code>string</code>
    * [.isMixedCase(string, allow_prefixed_underscores)](#LuckyCase.isMixedCase) &rarr; <code>boolean</code>
    * [.swapCase(string, preserve_prefixed_underscores)](#LuckyCase.swapCase) &rarr; <code>string</code>
    * [.constantize(string)](#LuckyCase.constantize) &rarr; <code>any</code>
    * [.deconstantize(constant, case_type)](#LuckyCase.deconstantize) &rarr; <code>string</code>
    * [.cutUnderscoresAtStart(string)](#LuckyCase.cutUnderscoresAtStart) &rarr; <code>string</code>
    * [.getUnderscoresAtStart(string)](#LuckyCase.getUnderscoresAtStart) &rarr; <code>string</code>
    * [.splitCaseString(string)](#LuckyCase.splitCaseString) &rarr; <code>Array.&lt;string&gt;</code>

<a name="CurlyBracketParser.case"></a>

### CurlyBracketParser.case(string, allow_prefixed_underscores) &rarr; <code>string</code> \| <code>null</code>
Get type of case of string (one key of CurlyBracketParser.CASES)

If more than one case matches, the first match wins.
Match prio is the order of the regex in CurlyBracketParser.CASES

If you want or need to know all cases, use plural version of this method

If you want to check explicitly for one case, use its check method,
e.g. isSnakeCase() for SNAKE_CASE, etc...
**Returns**: <code>string</code> \| <code>null</code> - symbol of type, null if no match  

| Param | Type | Default |
| --- | --- | --- |
| string | <code>string</code> |  | 
| allow_prefixed_underscores | <code>boolean</code> | <code>true</code> | 

<a name="CurlyBracketParser.cases"></a>

### CurlyBracketParser.cases(string, allow_prefixed_underscores) &rarr; <code>Array.&lt;string&gt;</code> \| <code>null</code>
Get types of cases of string (keys of CurlyBracketParser.CASES)
**Returns**: <code>Array.&lt;string&gt;</code> \| <code>null</code> - symbols of types, null if no one matches  

| Param | Type | Default |
| --- | --- | --- |
| string | <code>string</code> |  | 
| allow_prefixed_underscores | <code>boolean</code> | <code>true</code> | 

<a name="CurlyBracketParser.convertCase"></a>

### CurlyBracketParser.convertCase(string, case_type, preserve_prefixed_underscores) &rarr; <code>string</code>
Convert a string into the given case type

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| string | <code>string</code> |  | to convert |
| case_type | <code>string</code> |  |  |
| preserve_prefixed_underscores | <code>boolean</code> | <code>true</code> |  |

<a name="CurlyBracketParser.isValidCaseType"></a>

### CurlyBracketParser.isValidCaseType(case_type) &rarr; <code>boolean</code>
Check if given case type is a valid case type

| Param | Type | Description |
| --- | --- | --- |
| case_type | <code>string</code> | to check |

<a name="CurlyBracketParser.isValidCaseString"></a>

### CurlyBracketParser.isValidCaseString(string) &rarr; <code>boolean</code>
Check if the string matches any of the available cases

| Param | Type | Description |
| --- | --- | --- |
| string | <code>string</code> | to check |

<a name="CurlyBracketParser.toUpperCase"></a>

### CurlyBracketParser.toUpperCase(string) &rarr; <code>string</code>
Convert all characters inside the string
into upper case

| Param | Type | Description |
| --- | --- | --- |
| string | <code>string</code> | to convert |

**Example**  
```js
conversion
     'this-isAnExample_string' => 'THIS-ISANEXAMPLE_STRING'
```
<a name="CurlyBracketParser.isUpperCase"></a>

### CurlyBracketParser.isUpperCase(string) &rarr; <code>boolean</code>
Check if all characters inside the string are upper case

| Param | Type | Description |
| --- | --- | --- |
| string | <code>string</code> | to check |

<a name="CurlyBracketParser.toLowerCase"></a>

### CurlyBracketParser.toLowerCase(string) &rarr; <code>string</code>
Convert all characters inside the string
into lower case

| Param | Type | Description |
| --- | --- | --- |
| string | <code>string</code> | to convert |

**Example**  
```js
conversion
     'this-isAnExample_string' => 'this-isanexample_string'
```
<a name="CurlyBracketParser.isLowerCase"></a>

### CurlyBracketParser.isLowerCase(string) &rarr; <code>boolean</code>
Check if all characters inside the string are lower case

| Param | Type | Description |
| --- | --- | --- |
| string | <code>string</code> | to check |

<a name="CurlyBracketParser.toSnakeCase"></a>

### CurlyBracketParser.toSnakeCase(string, preserve_prefixed_underscores) &rarr; <code>string</code>
Convert the given string from any case
into snake case

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| string | <code>string</code> |  | to convert |
| preserve_prefixed_underscores | <code>boolean</code> | <code>true</code> |  |

**Example**  
```js
conversion
     'this-isAnExample_string' => 'this_is_an_example_string'
```
<a name="CurlyBracketParser.isSnakeCase"></a>

### CurlyBracketParser.isSnakeCase(string, allow_prefixed_underscores) &rarr; <code>boolean</code>
Check if the string is snake case

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| string | <code>string</code> |  | to check |
| allow_prefixed_underscores | <code>boolean</code> | <code>true</code> |  |

<a name="CurlyBracketParser.toUpperSnakeCase"></a>

### CurlyBracketParser.toUpperSnakeCase(string, preserve_prefixed_underscores) &rarr; <code>string</code>
Convert the given string from any case
into upper snake case

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| string | <code>string</code> |  | to convert |
| preserve_prefixed_underscores | <code>boolean</code> | <code>true</code> |  |

**Example**  
```js
conversion
     'this-isAnExample_string' => 'THIS_IS_AN_EXAMPLE_STRING'
```
<a name="CurlyBracketParser.isUpperSnakeCase"></a>

### CurlyBracketParser.isUpperSnakeCase(string, allow_prefixed_underscores) &rarr; <code>boolean</code>
Check if the string is upper snake case

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| string | <code>string</code> |  | to check |
| allow_prefixed_underscores | <code>boolean</code> | <code>true</code> |  |

<a name="CurlyBracketParser.toPascalCase"></a>

### CurlyBracketParser.toPascalCase(string, preserve_prefixed_underscores) &rarr; <code>string</code>
Convert the given string from any case
into pascal case

| Param | Default | Description |
| --- | --- | --- |
| string |  | to convert |
| preserve_prefixed_underscores | <code>true</code> |  |

**Example**  
```js
conversion
     'this-isAnExample_string' => 'ThisIsAnExampleString'
```
<a name="CurlyBracketParser.isPascalCase"></a>

### CurlyBracketParser.isPascalCase(string, allow_prefixed_underscores) &rarr; <code>boolean</code>
Check if the string is upper pascal case

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| string | <code>string</code> |  | to check |
| allow_prefixed_underscores | <code>boolean</code> | <code>true</code> |  |

<a name="CurlyBracketParser.toCamelCase"></a>

### CurlyBracketParser.toCamelCase(string, preserve_prefixed_underscores) &rarr; <code>string</code>
Convert the given string from any case
into camel case

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| string | <code>string</code> |  | to convert |
| preserve_prefixed_underscores | <code>boolean</code> | <code>true</code> |  |

**Example**  
```js
conversion
     'this-isAnExample_string' => 'thisIsAnExampleString'
```
<a name="CurlyBracketParser.isCamelCase"></a>

### CurlyBracketParser.isCamelCase(string, allow_prefixed_underscores) &rarr; <code>boolean</code>
Check if the string is camel case

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| string | <code>string</code> |  | to check |
| allow_prefixed_underscores | <code>boolean</code> | <code>true</code> |  |

<a name="CurlyBracketParser.toDashCase"></a>

### CurlyBracketParser.toDashCase(string, preserve_prefixed_underscores) &rarr; <code>string</code>
Convert the given string from any case
into dash case

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| string | <code>string</code> |  | to convert |
| preserve_prefixed_underscores | <code>boolean</code> | <code>true</code> |  |

**Example**  
```js
conversion
     'this-isAnExample_string' => 'this-is-an-example-string'
```
<a name="CurlyBracketParser.isDashCase"></a>

### CurlyBracketParser.isDashCase(string, allow_prefixed_underscores) &rarr; <code>boolean</code>
Check if the string is dash case

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| string | <code>string</code> |  | to check |
| allow_prefixed_underscores | <code>boolean</code> | <code>true</code> |  |

<a name="CurlyBracketParser.toUpperDashCase"></a>

### CurlyBracketParser.toUpperDashCase(string, preserve_prefixed_underscores) &rarr; <code>string</code>
Convert the given string from any case
into upper dash case

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| string | <code>string</code> |  | to convert |
| preserve_prefixed_underscores | <code>boolean</code> | <code>true</code> |  |

**Example**  
```js
conversion
     'this-isAnExample_string' => 'THIS-IS-AN-EXAMPLE-STRING'
```
<a name="CurlyBracketParser.isUpperDashCase"></a>

### CurlyBracketParser.isUpperDashCase(string, allow_prefixed_underscores) &rarr; <code>boolean</code>
Check if the string is upper dash case

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| string | <code>string</code> |  | to check |
| allow_prefixed_underscores | <code>boolean</code> | <code>true</code> |  |

<a name="CurlyBracketParser.toTrainCase"></a>

### CurlyBracketParser.toTrainCase(string, preserve_prefixed_underscores) &rarr; <code>string</code>
Convert the given string from any case
into train case

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| string | <code>string</code> |  | to convert |
| preserve_prefixed_underscores | <code>boolean</code> | <code>true</code> |  |

**Example**  
```js
conversion
     'this-isAnExample_string' => 'This-Is-An-Example-String'
```
<a name="CurlyBracketParser.isTrainCase"></a>

### CurlyBracketParser.isTrainCase(string, allow_prefixed_underscores) &rarr; <code>boolean</code>
Check if the string is train case

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| string | <code>string</code> |  | to check |
| allow_prefixed_underscores | <code>boolean</code> | <code>true</code> |  |

<a name="CurlyBracketParser.toWordCase"></a>

### CurlyBracketParser.toWordCase(string, preserve_prefixed_underscores) &rarr; <code>string</code>
Convert the given string from any case
into word case

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| string | <code>string</code> |  | to convert |
| preserve_prefixed_underscores | <code>boolean</code> | <code>true</code> |  |

**Example**  
```js
conversion
     'this-isAnExample_string' => 'this is an example string'
```
<a name="CurlyBracketParser.isWordCase"></a>

### CurlyBracketParser.isWordCase(string, allow_prefixed_underscores) &rarr; <code>boolean</code>
Check if the string is word case

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| string | <code>string</code> |  | to check |
| allow_prefixed_underscores |  | <code>true</code> |  |

<a name="CurlyBracketParser.toUpperWordCase"></a>

### CurlyBracketParser.toUpperWordCase(string, preserve_prefixed_underscores) &rarr; <code>string</code>
Convert the given string from any case
into upper word case

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| string | <code>string</code> |  | to convert |
| preserve_prefixed_underscores | <code>boolean</code> | <code>true</code> |  |

**Example**  
```js
conversion
     'this-isAnExample_string' => 'THIS IS AN EXAMPLE STRING'
```
<a name="CurlyBracketParser.isUpperWordCase"></a>

### CurlyBracketParser.isUpperWordCase(string, allow_prefixed_underscores) &rarr; <code>boolean</code>
Check if the string is upper word case

| Param | Default | Description |
| --- | --- | --- |
| string |  | to check |
| allow_prefixed_underscores | <code>true</code> |  |

<a name="CurlyBracketParser.toCapitalWordCase"></a>

### CurlyBracketParser.toCapitalWordCase(string, preserve_prefixed_underscores) &rarr; <code>string</code>
Convert the given string from any case
into capital word case

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| string | <code>string</code> |  | to convert |
| preserve_prefixed_underscores | <code>boolean</code> | <code>true</code> |  |

**Example**  
```js
conversion
     'this-isAnExample_string' => 'This Is An Example String'
```
<a name="CurlyBracketParser.isCapitalWordCase"></a>

### CurlyBracketParser.isCapitalWordCase(string, allow_prefixed_underscores) &rarr; <code>boolean</code>
Check if the string is capital word case

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| string | <code>string</code> |  | to check |
| allow_prefixed_underscores | <code>boolean</code> | <code>true</code> |  |

<a name="CurlyBracketParser.toSentenceCase"></a>

### CurlyBracketParser.toSentenceCase(string, preserve_prefixed_underscores) &rarr; <code>string</code>
Convert the given string from any case
into sentence case

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| string | <code>string</code> |  | to convert |
| preserve_prefixed_underscores | <code>boolean</code> | <code>true</code> |  |

**Example**  
```js
conversion
     'this-isAnExample_string' => 'This is an example string'
```
<a name="CurlyBracketParser.isSentenceCase"></a>

### CurlyBracketParser.isSentenceCase(string, allow_prefixed_underscores) &rarr; <code>boolean</code>
Check if the string is sentence case

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| string | <code>string</code> |  | to check |
| allow_prefixed_underscores | <code>boolean</code> | <code>true</code> |  |

<a name="CurlyBracketParser.toCapital"></a>

### CurlyBracketParser.toCapital(string, skip_prefixed_underscores) &rarr; <code>string</code>
Convert the first character to capital

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| string | <code>string</code> |  | to convert |
| skip_prefixed_underscores | <code>boolean</code> | <code>false</code> |  |

<a name="CurlyBracketParser.capitalize"></a>

### CurlyBracketParser.capitalize(string, skip_prefixed_underscores) &rarr; <code>string</code>
Convert the first character to capital

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| string | <code>string</code> |  | to convert |
| skip_prefixed_underscores | <code>boolean</code> | <code>false</code> |  |

<a name="CurlyBracketParser.isCapital"></a>

### CurlyBracketParser.isCapital(string, skip_prefixed_underscores) &rarr; <code>boolean</code>
Check if the strings first character is a capital letter

| Param | Type | Default |
| --- | --- | --- |
| string | <code>string</code> |  | 
| skip_prefixed_underscores | <code>boolean</code> | <code>false</code> | 

<a name="CurlyBracketParser.isCapitalized"></a>

### CurlyBracketParser.isCapitalized(string, skip_prefixed_underscores) &rarr; <code>boolean</code>
Check if the strings first character is a capital letter

| Param | Type | Default |
| --- | --- | --- |
| string | <code>string</code> |  | 
| skip_prefixed_underscores | <code>boolean</code> | <code>false</code> | 

<a name="CurlyBracketParser.toMixedCase"></a>

### CurlyBracketParser.toMixedCase(string, preserve_prefixed_underscores) &rarr; <code>string</code>
Convert the given string from any case
into mixed case.

The new string is ensured to be different from the input.

| Param | Type | Default |
| --- | --- | --- |
| string | <code>string</code> |  | 
| preserve_prefixed_underscores | <code>boolean</code> | <code>true</code> | 

**Example**  
```js
conversion
     'this-isAnExample_string' => 'This-Is_anExample-string'
```
<a name="CurlyBracketParser.isMixedCase"></a>

### CurlyBracketParser.isMixedCase(string, allow_prefixed_underscores) &rarr; <code>boolean</code>
Check if the string is a valid mixed case (without special characters!)

| Param | Type | Default |
| --- | --- | --- |
| string | <code>string</code> |  | 
| allow_prefixed_underscores | <code>boolean</code> | <code>true</code> | 

<a name="CurlyBracketParser.swapCase"></a>

### CurlyBracketParser.swapCase(string, preserve_prefixed_underscores) &rarr; <code>string</code>
Swaps character cases in string

lower case to upper case
upper case to lower case
dash to underscore
underscore to dash

| Param | Type | Default |
| --- | --- | --- |
| string | <code>string</code> |  | 
| preserve_prefixed_underscores | <code>boolean</code> | <code>false</code> | 

**Example**  
```js
conversion
     'this-isAnExample_string' => 'THIS_ISaNeXAMPLE-STRING'
```
<a name="CurlyBracketParser.constantize"></a>

### CurlyBracketParser.constantize(string) &rarr; <code>any</code>
Convert the string from any case
into pascal case and casts it into a constant

Does not work in all node js contexts because of scopes, where the constant is not available here.
Then you might use eval(CurlyBracketParser.toPascalCase) instead.
Or you may use it with global defined variables, global.<variable_name>

| Param | Type |
| --- | --- |
| string | <code>string</code> | 

**Example**  
```js
conversion
     'this-isAnExample_string' => ThisIsAnExampleString
     'this/is_an/example_path' => ThisIsAnExamplePath
```
<a name="CurlyBracketParser.deconstantize"></a>

### CurlyBracketParser.deconstantize(constant, case_type) &rarr; <code>string</code>
Deconverts the constant back into specified target type

Does not work in special scopes in node js

| Param | Type |
| --- | --- |
| constant | <code>function</code> | 
| case_type | <code>string</code> | 

**Example**  
```js
deconversion
     ThisAweSomeConstant => 'thisAweSomeConstant'
     function myFunction() {} => 'myFunction'
```
<a name="CurlyBracketParser.cutUnderscoresAtStart"></a>

### CurlyBracketParser.cutUnderscoresAtStart(string) &rarr; <code>string</code>
Return string without underscores at the start
**Returns**: <code>string</code> - string without prefixed underscores  

| Param | Type |
| --- | --- |
| string | <code>string</code> | 

<a name="CurlyBracketParser.getUnderscoresAtStart"></a>

### CurlyBracketParser.getUnderscoresAtStart(string) &rarr; <code>string</code>
Return the underscores at the start of the string
**Returns**: <code>string</code> - string of underscores or empty if none found  

| Param | Type |
| --- | --- |
| string | <code>string</code> | 

<a name="CurlyBracketParser.splitCaseString"></a>

### CurlyBracketParser.splitCaseString(string) &rarr; <code>Array.&lt;string&gt;</code>
Split the string into parts
It is splitted by all (different) case separators

| Param | Type |
| --- | --- |
| string | <code>string</code> | 

