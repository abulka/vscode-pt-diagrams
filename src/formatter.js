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
        arrowStack: [],
        baseSequenceIndent: 1,
        // conditionalStack: [] // Stack to track conditional blocks
    };

    function getIndentedLine(line, level) {
        return ' '.repeat(level * 2) + line.trim();
    }

    function processSection(line) {
        if (line.match(/^(Diagram|Files|Classes|Imports|Use Cases|Sequence):$/)) {
            state.currentSection = line.split(':')[0];
            state.indentLevel = 0;
            state.arrowStack = [];
            state.conditionalStack = []; // Reset conditional stack
            return true;
        }
        return false;
    }

    function processSequenceFlow(line) {
        const trimmedLine = line.trim();

        // Handle sequence headers
        if (trimmedLine.startsWith('Sequence:')) {
            state.indentLevel = state.baseSequenceIndent;
            state.arrowStack = [];
            // state.conditionalStack = []; // Reset conditional stack
            let result = getIndentedLine(line, state.indentLevel);
            state.indentLevel++; // for subsequent lines
            return result;
        }

        // Method declaration after sequence header
        if (trimmedLine.match(/^[a-zA-Z]+\([^)]*\)\s*\[.*\]$/)) {
            outputChannel.appendLine(`Method declaration: ${trimmedLine} at indent level ${state.indentLevel}`);
            state.indentLevel = state.baseSequenceIndent + 1;
            let result = getIndentedLine(line, state.indentLevel);
            state.indentLevel++; // for subsequent lines
            return result
        }

        // Handle arrow calls
        if (trimmedLine.startsWith('->')) {
            let result = getIndentedLine(line, state.indentLevel);
            // state.indentLevel++;
            state.arrowStack.push(state.indentLevel);
            state.indentLevel++; // for subsequent lines
            return result;
        }

        // Handle return statements
        if (trimmedLine.startsWith('<')) {
            let result = getIndentedLine(line, state.indentLevel);
            if (state.arrowStack.length > 0) {
                state.indentLevel = state.arrowStack.pop();
            }
            return result
        }

        // // Handle conditional blocks like [if ...] and [else]
        // if (trimmedLine.match(/^\[(if|else)\b/)) {
        //     if (trimmedLine.startsWith('[else]')) {
        //         // Align [else] with its corresponding [if]
        //         if (state.conditionalStack.length > 0) {
        //             state.indentLevel = state.conditionalStack[state.conditionalStack.length - 1];
        //         }
        //     } else {
        //         // Push the current indentation level for [if]
        //         state.conditionalStack.push(state.indentLevel);
        //     }
        //     return getIndentedLine(line, state.indentLevel);
        // }

        // // Handle nested blocks like [parallel], [try], [catch], [finally]
        // if (trimmedLine.match(/^\[(parallel|try|catch|finally)\]/)) {
        //     state.indentLevel++;
        //     return getIndentedLine(line, state.indentLevel - 1);
        // }

        // Handle description lines (lines after arrows or conditionals)
        // if ((state.arrowStack.length > 0 || state.conditionalStack.length > 0) && !trimmedLine.match(/^(->|<|\[|\])/)) {
        //     return getIndentedLine(line, state.indentLevel + 1);
        // }

        // For any other lines in the sequence
        return getIndentedLine(line, state.indentLevel);
    }

    function processImportsSection(line) {
        const trimmedLine = line.trim();
        
        if (state.currentSection !== 'Imports') {
            return false;
        }

        if (!trimmedLine.startsWith('-->')) {
            state.indentLevel = 1;
            return getIndentedLine(line, state.indentLevel);
        }

        const arrowDepth = (trimmedLine.match(/-->/g) || []).length;
        state.indentLevel = 2 + (arrowDepth - 1);
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
            return getIndentedLine(line, state.indentLevel);
        }
        
        if (state.currentSection === 'Classes') {
            if (trimmedLine.match(/^(Attributes|Methods):/)) {
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

    function processDiagramSection(line) {
        const trimmedLine = line.trim();
        
        if (state.currentSection === 'Diagram' && trimmedLine !== '') {
            state.indentLevel = 1;
            return getIndentedLine(line, state.indentLevel);
        }
        return false;
    }

    // Main processing loop
    lines.forEach((line) => {
        if (line.trim() === '') {
            formattedLines.push('');
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
        this.outputChannel.appendLine('Formatting document...');
        return [vscode.TextEdit.replace(range, formattedText)];
    }
}

module.exports = {
    PtdDocumentFormattingEditProvider
};
