# curly-bracket-parser
[![npm package](https://img.shields.io/npm/v/curly-bracket-parser?color=default&style=plastic&logo=npm)](https://www.npmjs.com/package/curly-bracket-parser)
[![GitHub release (latest by date)](https://img.shields.io/github/v/release/magynhard/curly-bracket-parser?color=default&label=browser&logo=javascript&style=plastic)](https://github.com/magynhard/curly-bracket-parser/releases)
![downloads](https://img.shields.io/npm/dt/curly-bracket-parser?color=blue&style=plastic)
[![License: MIT](https://img.shields.io/badge/License-MIT-gold.svg?style=plastic&logo=mit)](LICENSE)

> Javascript library providing a simple parser to replace curly brackets `{{like_this}}` inside strings like URLs, texts or even files (node only) easily. Available for node js and browser!

#### Custom filters

Additional support for build-in filters and custom filters make them more powerful. `{{example|my_filter}}`

[LuckyCase](https://github.com/magynhard/lucky-case) case formats are supported as default filters by node js dependency, in browser optionally if `LuckyCase` is loaded as well (bundled version).

#### Variable trees

Support for variable trees, e.g.: `{{my.tree.variable}}`

#### Ruby version
It is a port my ruby gem [curly_bracket_parser](https://github.com/magynhard/curly_bracket_parser), but got already some additional features.




# Contents

* [Installation](#installation)
* [Usage examples](#usage)
* [Documentation](#documentation)
* [Contributing](#contributing)



<a name="installation"></a>
## Installation

### Option 1: node js - yarn

In your project root directory execute the following command:
```bash
yarn add curly-bracket-parser
```

### Option 2: node js - npm

In your project root directory execute the following command:
```bash
npm install curly-bracket-parser
```

### Option 3: Browser

There are two versions, default and bundled.

* The ***bundled version*** has [LuckyCase](https://github.com/magynhard/lucky-case) and its cases as default filters included. The dependencies [Typifier](https://github.com/magynhard/typifier) and [RubyNice](https://github.com/magynhard/ruby-nice) are included as well. (`curly-bracket-parser.bundle.js` and `curly-bracket-parser.bundle.min.js`)
* The ***default version*** comes without any predefined default filters, so you can only use your custom filters. But you need then to add [Typifier](https://github.com/magynhard/typifier) as isolated dependency as well. You can optionally embed the original LuckyCase to the document as well. CurlyBracketParser will recognize, if LuckyCase is available and then provide them as default filters. So if you don't need the LuckyCase case filters, you get a much smaller file size without the bundle. (`curly-bracket-parser.js` and `curly-bracket-parser.min.js`)

Download the `curly-bracket-parser.min.js` or `curly-bracket-parser.bundle.min.js` at the [release page](https://github.com/magynhard/curly-bracket-parser/releases) and
put it in an appropriate folder, e.g. `js/lib`
and reference it with an script tag in your project:
```html
<script type="text/javascript" src="js/lib/curly-bracket-parser.min.js"></script>
```

If you are using a packager, you should add the source file to your build pipeline.





<a name="usage"></a>
## Usage examples

You can either parse variables inside strings or even directly in files.

### Basic

```javascript
    const url = "https://my-domain.com/items/{{item_id}}";
    const final_url = CurlyBracketParser.parse(url, { item_id: 123 });
    // => "https://my-domain.com/items/123"
```

Nested variables inside variables are supported as well:
```javascript
    const tmpl = "This is my template with {{my_nested_variable}}";
    const my_nested_variable = "my {{nested}} variable"; 
    const parsed_tmpl = CurlyBracketParser.parse(tmpl, { my_nested_variable: my_nested_variable, nested: 'pizza'});
    // => "This is my template with my pizza variable"
```


### Filters

You can register your own filters, or if you use the bundled version, all cases of LuckyCase.

```javascript
    const url = "https://my-domain.com/catalog/{{item_name|snake_case}}";
    const final_url = CurlyBracketParser.parse(url, { item_name: 'MegaSuperItem' });
    // => "https://my-domain.com/catalog/mega_super_item"
```

For a list of built-in filters in the bundled version visit [LuckyCase](https://github.com/magynhard/lucky-case).

#### Define your custom filter

```javascript
    CurlyBracketParser.registerFilter('7times', (string) => {
        return string + string + string + string + string + string + string;
    })

    const text = "Paul went out and screamed: A{{scream|7times}}h";
    const final_text = CurlyBracketParser.parse(text, { scream: 'a' });
    // => "Paul went out and screamed: Aaaaaaaah"
```

### Value variables

For special cases you can directly define or set variables inside the template - usually it does only make sense, if you combine them with custom filters.

You can either use quotes to define a string or numbers (integer or floating point) directly.

Empty values are possible as well. They are equal to a empty string.

```javascript
    const tmpl = `This is a {{'string'|pascal_case}} and today is {{"today"|date_filter}}. Peter is {{'1990-10-05'|iso_date_age}} years old. His girlfriends name is {{girl|pascal_case}} and she is {{16|double_number}} years old. This article has been written at {{|date_now_formatted}}`;
    const parsed = CurlyBracketParser.parse(tmpl, { girl: "anna" });
    // => "This is a String and today is 2022-06-27. Peter is 32 years old. His girlfriends name is Anna and she is 32 years old. This article has been written at 6/28/2022, 12:46:40 PM."
```

### Files

<ins>test.html</ins>
```html
<h1>{{title|sentence_case}}</h1>
```

```javascript
    const parsed_file = CurlyBracketParser.parseFile('./test.html', { title: 'WelcomeAtHome' });
    // => "<h1>Welcome at home</h1>"
```

Use `.parseFileWrite` instead to write the parsed string directly into the file!

As browsers are not  allowed to write to to file system, `.parseFileWrite` is only available on node. Running `.parseFile`  in browser fires a `HTTP GET` request (ajax) with the given path to read the file.

### Default variables

You can define default variables, which will be replaced automatically without passing them by parameters, but can be overwritten with parameters.

Because of providing anonymous functions, your variables can dynamically depend on other states (e.g. current date).

```javascript
    CurlyBracketParser.registerDefaultVar('version', () => {
        return '1.0.2';  
    });

    const text = "You are running version {{version}}"
    CurlyBracketParser.parse(text);
    // => "You are running version 1.0.2"
    CurlyBracketParser.parse(text, { version: '0.7.0' });
    // => "You are running version 0.7.0"
```






  
<a name="documentation"></a>    
## Documentation
Check out the *jsdoc* documentation [here](doc/curly-bracket-parser.jsdoc.md).





<a name="contributing"></a>    
## Contributing

Bug reports and pull requests are welcome on GitHub at https://github.com/magynhard/curly-bracket-parser. This project is intended to be a safe, welcoming space for collaboration, and contributors are expected to adhere to the [Contributor Covenant](http://contributor-covenant.org) code of conduct.

