// Example usage of getIndentedLine function
// node tests/indents.js

const { getIndentedLine } = require('../src/getIndentLevel');

const line = "example line";

for (let indentLevel = 1; indentLevel < 6; indentLevel++) {
    const result = getIndentedLine(line, indentLevel);
    const numLeadingSpacesBeforeLine = result.match(/^\s*/)[0].length;
    console.log(indentLevel, result, numLeadingSpacesBeforeLine);
}

function padLine(result) {
    const replacedLine = result.replace(/^\s*/, (match) => {
        let numbers = '';
        for (let i = 1; i <= match.length; i++) {
            numbers += i % 10;
        }
        return numbers;
    });
    return replacedLine;
}

for (let indentLevel = 1; indentLevel < 6; indentLevel++) {
    const result = getIndentedLine(line, indentLevel);
    console.log(padLine(result));
}

function assert(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}

assert(1>0, "1 is greater than 0");

function testGetIndentedLine() {
    const line = "|";
    let result
    const options = { increaseIndentAfter: 2 };
    console.log("Testing getIndentedLine function");

    result = padLine(getIndentedLine(line, 1, options));
    assert(result === "12|", `Expected "12|", but got "${result}"`);

    result = padLine(getIndentedLine(line, 2, options));
    assert(result === "1234|", `Expected "1234|", but got "${result}"`);

    result = padLine(getIndentedLine(line, 3, options));
    assert(result === "12345678|", `Expected "12345678|", but got "${result}"`);

    result = padLine(getIndentedLine(line, 4, options));
    assert(result === "123456789012|", `Expected "123456789012|", but got "${result}"`);

    result = padLine(getIndentedLine(line, 5, options));
    assert(result === "1234567890123456|", `Expected "1234567890123456|", but got "${result}"`);
    console.log('All tests passed');
}

testGetIndentedLine()
