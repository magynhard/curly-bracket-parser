/**
 * Test isolated common js import dependencies (cjs)
 */

const CurlyBracketParser = require("../../src/curly-bracket-parser/curly-bracket-parser.js");

describe('CurlyBracketParser', function () {
    it('parse recursive', function () {
        expect(CurlyBracketParser.parse("This is a module {{test}}",{ test: 'JavaScript test' }, 'throw')).toEqual("This is a module JavaScript test");
    })
})

