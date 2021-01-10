//----------------------------------------------------------------------------------------------------
// Browser specific tests
//----------------------------------------------------------------------------------------------------



//----------------------------------------------------------------------------------------------------

describe('Browser-Test: CurlyBracketParser.parseFile', function () {
    beforeEach(function () {
        XHRMock.setup();
    });
    afterEach(function () {
       XHRMock.teardown();
    });
    describe('plain variable parsing inside a file:', function () {
        it('parses a set of plain variables without filters inside a file of type text/plain', function () {
            const source_string = "Today {{one}} person walked {{two}} times around {{three}}";
            const file_path = '/ajax/text.txt';
            XHRMock.get(file_path, {
                status: 200,
                reason: 'Created',
                body: source_string,
                headers: { "Content-Type": "text/plain"}
            });
            const variables = {
                one: "one",
                two: "Two",
                three: "FURY"
            };
            const expected_string = "Today one person walked Two times around FURY";
            const parsed = CurlyBracketParser.parseFile(file_path, variables);
            expect(parsed).toEqual(expected_string);
        });
        it('parses a set of plain variables without filters inside a file of type application/json', function () {
            const source_string = '{ "key": "Today {{one}} person walked {{two}} times around {{three}}" }';
            const file_path = '/ajax/text.json';
            XHRMock.get(file_path, {
                status: 200,
                reason: 'Created',
                body: source_string,
                headers: { "Content-Type": "application/json"}
            });
            const variables = {
                one: "one",
                two: "Two",
                three: "FURY"
            };
            const expected_string = '{ "key": "Today one person walked Two times around FURY" }';
            const parsed = CurlyBracketParser.parseFile(file_path, variables);
            expect(parsed).toEqual(expected_string);
        });
        it('parses a set of plain variables with spaces before or after name or filter without filters', function () {
            const source_string = "Today {{one }} person walked {{  two}} times around {{ three }}";
            const file_path = '/ajax/text2.txt';
            XHRMock.get(file_path, {
                status: 200,
                reason: 'Created',
                body: source_string,
                headers: { "Content-Type": "application/text"}
            });
            const variables = {
                one: "one",
                two: "Two",
                three: "FURY"
            };
            const expected_string = "Today one person walked Two times around FURY";
            const parsed = CurlyBracketParser.parseFile(file_path, variables);
            expect(parsed).toEqual(expected_string);
        });
        it('parses a set of plain variables with filters', function () {
            const source_string = "Today {{one|dash_case}} person walked {{two|snake_case}} times around {{three|camel_case}}";
            const file_path = '/ajax/text3.txt';
            XHRMock.get(file_path, {
                status: 200,
                reason: 'Created',
                body: source_string,
                headers: { "Content-Type": "application/text"}
            });
            const variables = {
                one: "one word case",
                two: "TwoPascalCase",
                three: "UPPER-DASH-CASE"
            };
            const expected_string = "Today one-word-case person walked two_pascal_case times around upperDashCase";
            const parsed = CurlyBracketParser.parseFile(file_path, variables);
            expect(parsed).toEqual(expected_string);
        });
        it('parses a set of plain variables with filters, spaces after/before names and filters', function () {
            const source_string = "Today {{one|   dash_case}} person walked {{two    |   snake_case }} times around {{  three|camel_case  }}";
            const file_path = '/ajax/text4.txt';
            XHRMock.get(file_path, {
                status: 200,
                reason: 'Created',
                body: source_string,
                headers: { "Content-Type": "application/text"}
            });
            const variables = {
                one: "one word case",
                two: "TwoPascalCase",
                three: "UPPER-DASH-CASE"
            };
            const expected_string = "Today one-word-case person walked two_pascal_case times around upperDashCase";
            const parsed = CurlyBracketParser.parseFile(file_path, variables);
            expect(parsed).toEqual(expected_string); // string parsed
        });
    });
});
//----------------------------------------------------------------------------------------------------

describe('Browser-Test: CurlyBracketParser.parseFileWrite', function () {
    beforeEach(function () {
        XHRMock.setup();
    });
    afterEach(function () {
       XHRMock.teardown();
    });
    describe('writing parsed string to file', function () {
        it('throws an error when trying to write to file with browser', function () {
            const source_string = "Today {{one}} person walked {{two}} times around {{three}}";
            const file_path = '/ajax/text.txt';
            XHRMock.get(file_path, {
                status: 200,
                reason: 'Created',
                body: source_string,
                headers: { "Content-Type": "text/plain"}
            });
            expect(() => {
                CurlyBracketParser.parseFileWrite(file_path, variables);
            }).toThrow();
        });
    });
});

//----------------------------------------------------------------------------------------------------
