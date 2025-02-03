// node tests/regexp-play.js 

const text = `hello world
this is a test
fred was here`;

const regex1 = /.*/;
const regex2 = /.*$/;

console.log(`Text: "${text}"`);

const match1 = text.match(regex1);
const match2 = text.match(regex2);

console.log(`Regex: ${regex1.source}`);
console.log(`Match: ${match1 ? match1[0] : "No match"}`);

console.log(`Regex: ${regex2.source}`);
console.log(`Match: ${match2 ? match2[0] : "No match"}`);
