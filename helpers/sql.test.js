const { BadRequestError } = require("../expressError");
const { sqlForPartialUpdate } = require("./sql");

describe("sqlForPartialUpdate", function() {
    test("bad request on empty object", function () {
        expect(() => sqlForPartialUpdate({}, {})).toThrow(BadRequestError)
    })
    test("works", function() {
        const data = {
            foo: 1,
            bar: "two"
        };
        const translations = {
            bar: "grill"
        };
        const output = sqlForPartialUpdate(data, translations);
        expect(output.setCols).toEqual('"foo"=$1, "grill"=$2')
        expect(output.values).toEqual([1, "two"])
    })
})