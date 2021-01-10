const CurlyBracketParser = require('../src/curly-bracket-parser/curly-bracket-parser.js');
const UnresolvedVariablesError = require('../src/curly-bracket-parser/custom-errors/unresolved-variables-error');

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
            const string          = "Today {{one}} person walked {{two}} times around {{three}}";
            const expected_string = "Today one person walked Two times around FURY";
            const parsed = CurlyBracketParser.parse(string, variables);
            expect(parsed).toEqual(expected_string);
        });
    });
});

//----------------------------------------------------------------------------------------------------


//----------------------------------------------------------------------------------------------------