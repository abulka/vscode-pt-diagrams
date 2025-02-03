const vscode = require('vscode');

function formatPtdSimple(text) {
    return '# hi andy\n' + text;
}

function formatPtd(text, outputChannel) {
    const lines = text.split('\n');
    let formattedLines = [];
    let state = {
        indentLevel: 0,
        currentSection: '',
        baseSequenceIndent: 1, // for Sequence section
        inDescription: false, // for Diagram section
        inClassDeclaration: false, // for Classes section
        lastNumLeadingSpaces: 0, // for Imports section
        sequenceBlockLevel: 0 // [if] and [try] blocks
    };

    function getIndentedLine(line, level) {
        return ' '.repeat(level * 2) + line.trim();
    }

    function processSection(line) {
        if (line.match(/^(Diagram|Files|Classes|Imports|Use Cases|Sequence):$/)) {
            state.currentSection = line.split(':')[0];
            state.indentLevel = 0;
            state.inDescription = false;
            state.inClassDeclaration = false;
            state.lastNumLeadingSpaces = 0;
            state.sequenceBlockLevel = 0;
            return true;
        }
        return false;
    }

    function processSequenceFlow(line) {
        const trimmedLine = line.trim();
        // outputChannel.appendLine(JSON.stringify(trimmedLine));

        // Handle sequence headers
        if (trimmedLine.startsWith('Sequence:')) {
            state.indentLevel = state.baseSequenceIndent;
            let result = getIndentedLine(line, state.indentLevel);
            state.indentLevel += 1; // for subsequent lines
            return result;
        }

        // function call (without arrow, only allowed after Sequence: line)
        if (trimmedLine.match(/^[a-zA-Z_$][a-zA-Z0-9_$]+\([^)]*\).*/) && state.indentLevel === state.baseSequenceIndent + 1) {
            state.indentLevel = state.baseSequenceIndent + 1;
            let result = getIndentedLine(line, state.indentLevel);
            state.indentLevel += 1; // for subsequent lines
            return result
        }

        // function call (with arrow)
        if (trimmedLine.match(/.*->\s*/)) {
            let result = getIndentedLine(line, state.indentLevel);
            state.indentLevel += 1; // for subsequent lines
            return result;
        }

        // Handle return statements
        if (trimmedLine.startsWith('<')) {
            let result = getIndentedLine(line, state.indentLevel);
            // if (state.sequenceBlockLevel <= 0) {
            //     state.indentLevel -= 1; // for subsequent lines
            // }
            state.indentLevel -= 1; // for subsequent lines
            return result
        }

        // Handle [if] and [try] blocks
        if (['[if', '[try', '[for', '[while', '[switch'].some(keyword => trimmedLine.startsWith(keyword))) {
            state.sequenceBlockLevel++;
            let result = getIndentedLine(line, state.indentLevel);
            state.indentLevel += 1; // for subsequent lines
            return result
        }

        if (['[else', '[finally', '[except'].some(keyword => trimmedLine.startsWith(keyword))) {
            if (state.sequenceBlockLevel <= 0) {
                outputChannel.appendLine(`unexpected ${keyword} found`);
            }
            // state.indentLevel -= 1; // for current line
            let result = getIndentedLine(line, state.indentLevel);
            state.sequenceBlockLevel++;
            state.indentLevel += 1; // for subsequent lines
            return result
        }

        if (['[end', '[endif', '[endtry', '[endfor', '[endwhile', '[endswitch'].some(keyword => trimmedLine.startsWith(keyword))) {
            state.sequenceBlockLevel--;
            // state.indentLevel -= 1; // for current line
            let result = getIndentedLine(line, state.indentLevel);
            return result
        }

        // For any other lines in the sequence
        return getIndentedLine(line, state.indentLevel);
    }

    // function processSequenceFlowBlankLine() {
    //     // A blank line resets state.inSequenceBlock
    //     if (state.currentSection === 'Sequence' || state.currentSection === 'Use Cases') {
    //         if (state.sequenceBlockLevel > 0) {
    //             outputChannel.appendLine(`blank line found - sequenceBlockLevel: ${state.sequenceBlockLevel}`);
    //             state.sequenceBlockLevel--;
    //             state.indentLevel -= 1;
    //         }
    //     }
    // }

    function processImportsSection(line) {
        const trimmedLine = line.trim();

        if (state.currentSection !== 'Imports') {
            return false;
        }

        const numLeadingSpaces = line.match(/^\s*/)[0].length;

        if (trimmedLine.startsWith('-->')) {
            if (numLeadingSpaces == 0 || numLeadingSpaces > state.lastNumLeadingSpaces) {
                state.indentLevel++;
            }
            else if (numLeadingSpaces < state.lastNumLeadingSpaces) {
                state.indentLevel--;
            }
            state.lastNumLeadingSpaces = numLeadingSpaces;
        }
        else {
            state.indentLevel = 1;
            state.lastNumLeadingSpaces = 0;
        }

        return getIndentedLine(line, state.indentLevel);
    }

    function processFileSection(line) {
        const trimmedLine = line.trim();

        if (trimmedLine.startsWith('file:')) {
            state.indentLevel = 1;
            return getIndentedLine(line, state.indentLevel);
        }

        if (state.currentSection === 'Files') {
            if (trimmedLine.match(/^(Variables|Functions|Classes|Interfaces):/)) {
                state.indentLevel = 2;
                return getIndentedLine(line, state.indentLevel);
            }
            if (!trimmedLine.endsWith(':') && trimmedLine !== '') {
                state.indentLevel = 3;
                return getIndentedLine(line, state.indentLevel);
            }
        }
        return false;
    }

    function processClassesSection(line) {
        const trimmedLine = line.trim();

        if (trimmedLine.match(/^(class:|interface:)/)) {
            state.indentLevel = 1;
            state.inClassDeclaration = true;
            return getIndentedLine(line, state.indentLevel);
        }

        if (state.currentSection === 'Classes') {
            if (trimmedLine.match(/^(Attributes|Methods):/)) {
                state.indentLevel = 2;
                state.inClassDeclaration = false;
                return getIndentedLine(line, state.indentLevel);
            }
            if (!trimmedLine.endsWith(':') && trimmedLine !== '') {

                // Try to get arrows to line up with each other, 15 is just a guess, it will do.
                if (state.inClassDeclaration && trimmedLine.match(/.*(▷|>)/)) {
                    return getIndentedLine(line, state.indentLevel * 15);
                }

                state.indentLevel = 3;
                return getIndentedLine(line, state.indentLevel);
            }
        }
        return false;
    }

    function processDiagramSection(line) {
        const trimmedLine = line.trim();

        if (state.currentSection === 'Diagram') {
            if (trimmedLine.startsWith('description:')) {
                let result = getIndentedLine(line, state.indentLevel);
                state.inDescription = true;
                return result;
            }
            if (state.inDescription && !trimmedLine.match(/^(files|version|version-ptd|name):/)) {
                return ' '.repeat(15) + line.trim();
            }
            if (trimmedLine.match(/^(files|version|version-ptd|name):/)) {
                state.inDescription = false;
            }
            state.indentLevel = 1;
            return getIndentedLine(line, state.indentLevel);
        }
        return false;
    }

    // Main processing loop
    lines.forEach((line) => {
        if (line.trim() === '') {
            formattedLines.push('');
            // processSequenceFlowBlankLine();
            return;
        }

        if (processSection(line)) {
            formattedLines.push(line.trim());
            return;
        }

        let formattedLine = false;

        if (state.currentSection === 'Sequence' || state.currentSection === 'Use Cases') {
            formattedLine = processSequenceFlow(line);
        } else if (state.currentSection === 'Imports') {
            formattedLine = processImportsSection(line);
        } else {
            formattedLine = processFileSection(line) ||
                processClassesSection(line) ||
                processDiagramSection(line);
        }

        if (formattedLine) {
            formattedLines.push(formattedLine);
        } else {
            formattedLines.push(getIndentedLine(line, state.indentLevel));
        }
    });

    return formattedLines.join('\n');
}

class PtdDocumentFormattingEditProvider {
    constructor(outputChannel) {
        this.outputChannel = outputChannel;
    }

    provideDocumentFormattingEdits(document, options, token) { // : vscode.TextEdit[]
        const start = new vscode.Position(0, 0);
        const end = new vscode.Position(document.lineCount - 1, document.lineAt(document.lineCount - 1).text.length);
        const range = new vscode.Range(start, end);
        const text = document.getText(range);
        const formattedText = formatPtd(text, this.outputChannel);
        this.outputChannel.appendLine('Formatting Plain Text Diagram document...');
        return [vscode.TextEdit.replace(range, formattedText)];
    }
}

module.exports = {
    PtdDocumentFormattingEditProvider
};
