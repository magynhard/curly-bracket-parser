# curly-bracket-parser
[![Gem](https://img.shields.io/npm/v/curly-bracket-parser?color=default&style=plastic&logo=npm)](https://www.npmjs.com/package/curly-bracket-parser)
[![GitHub release (latest by date)](https://img.shields.io/github/v/release/magynhard/curly-bracket-parser?color=default&label=browser&logo=javascript&style=plastic)](https://github.com/magynhard/curly-bracket-parser/releases)
![Gem](https://img.shields.io/npm/dt/curly-bracket-parser?color=blue&style=plastic)
[![License: MIT](https://img.shields.io/badge/License-MIT-gold.svg?style=plastic&logo=mit)](LICENSE)

> Javascript library providing a simple parser to replace curly brackets `{{like_this}}` inside strings like URLs, texts or even files (node only) easily. Available for node js and browser!

Additional support for build-in filters and custom filters make them more powerful. `{{example|my_filter}}`

[LuckyCase](https://github.com/magynhard/lucky-case) case formats are supported as default filters by node js dependency, in browser optionally if `LuckyCase` is loaded as well (bundled version).

It is a port my ruby gem [curly_bracket_parser](https://github.com/magynhard/lucky_case).




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

* The ***bundled version*** has [LuckyCase](https://github.com/magynhard/lucky-case) and its cases as default filters included. (`curly-bracket-parser.js` and `curly-bracket-parser.min.js`)
* The ***default version*** comes without any predefined default filters, so you can only use your custom filters. But you can also use the default version and embed the original LuckyCase to the document. CurlyBracketParser will recognize, if LuckyCase is available and then provide them as default filters. So if you don't need the LuckyCase case filters, you get a much smaller file size without the bundle. (`curly-bracket-parser.bundle.js` and `curly-bracket-parser.bundle.min.js`)

Download the `curly-bracket-parser.min.js` or `curly-bracket-parser.bundle.min.js` at the [release page](https://github.com/magynhard/curly-bracket-parser/releases) and
put it in an appropriate folder, e.g. `js/lib`
and reference it with an script tag in your project:
```html
<script type="text/javascript" src="js/lib/curly-bracket-parser.min.js"></script>
```

Optionally you then should add the source file to your build pipeline, if you are using webpack, brunch or any other packager.





<a name="usage"></a>
## Usage examples

You can either parse variables inside strings or even directly in files.

### Basic

```javascript
    const url = "https://my-domain.com/items/{{item_id}}";
    const final_url = CurlyBracketParser.parse(url, { item_id: 123 });
    // => "https://my-domain.com/items/123"
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

