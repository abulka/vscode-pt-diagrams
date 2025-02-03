/*
The algorithm is that for the first `increaseIndentAfter` indent levels we
indent by 2 spaces per indent level. At indent level `increaseIndentAfter + 1`
and above we indent 2 spaces per indent level for the first
`increaseIndentAfter` levels, then 4 spaces per indent for the remaining levels.
This is to make the indentation more readable as the levels get deeper. 

e.g. options = { increaseIndentAfter: 2 }
*/
function getIndentedLine(line, level, options) {
    if (!options) {
        options = { increaseIndentAfter: 999};
    }
    const increaseIndentAfter = options.increaseIndentAfter;
    let spaces;
    if (level > increaseIndentAfter) {  // indent deeper levels a bit more for readability
        spaces = (increaseIndentAfter * 2) + ((level - increaseIndentAfter) * 4);
    } else {
        spaces = level * 2;
    }
    return ' '.repeat(spaces) + line.trim();
}

module.exports = {
    getIndentedLine,
}