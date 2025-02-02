const vscode = require('vscode');

function formatPtdSimple(text) {
    return '# hi andy\n' + text;
}

function formatPtd(text) {
    const lines = text.split('\n');
    let formattedLines = [];
    let state = {
        indentLevel: 0,
        inUseCase: false,
        currentSection: '',
        blockStack: []
    };

    function getIndentedLine(line, level) {
        return ' '.repeat(level * 2) + line.trim();
    }

    function processSection(line) {
        if (line.match(/^(Diagram|Files|Classes|Imports|Use Cases):$/)) {
            state.currentSection = line.split(':')[0];
            state.indentLevel = 0;
            state.inUseCase = state.currentSection === 'Use Cases';
            state.blockStack = [];
            return true;
        }
        return false;
    }

    function processUseCaseFlow(line) {
        const trimmedLine = line.trim();
        
        // Handle scenario headers
        if (trimmedLine.startsWith('Scenario:')) {
            state.indentLevel = 1;
            return true;
        }

        // Handle method calls and blocks
        if (state.inUseCase) {
            // Method declaration line after scenario
            if (trimmedLine.match(/^[a-zA-Z]+\([^)]*\)\s*\[.*\]$/)) {
                state.indentLevel = 1;
                return true;
            }

            // Block starts
            if (trimmedLine.match(/^\[(?!\/)/)) {
                state.blockStack.push(state.indentLevel);
                state.indentLevel++;
                return true;
            }

            // Method calls with arrows
            if (trimmedLine.startsWith('->')) {
                state.indentLevel++;
                return true;
            }

            // Return statements
            if (trimmedLine.startsWith('<')) {
                if (state.blockStack.length > 0) {
                    state.indentLevel = state.blockStack[state.blockStack.length - 1];
                } else {
                    state.indentLevel = Math.max(1, state.indentLevel - 1);
                }
                return true;
            }

            // Block ends
            if (trimmedLine.match(/^\[\/|^\]$/)) {
                state.blockStack.pop();
                state.indentLevel = Math.max(1, state.indentLevel - 1);
                return true;
            }

            // Description lines after arrows
            if (state.indentLevel > 1 && !trimmedLine.match(/^(->|<|\[|\])/)) {
                return true;
            }
        }
        return false;
    }

    function processFileSection(line) {
        const trimmedLine = line.trim();
        
        if (trimmedLine.startsWith('file:')) {
            state.indentLevel = 1;
            return true;
        }
        
        if (state.currentSection === 'Files') {
            if (trimmedLine.match(/^(Variables|Functions|Classes|Interfaces):/)) {
                state.indentLevel = 2;
                return true;
            }
            if (state.indentLevel >= 2 && trimmedLine !== '') {
                state.indentLevel = 3;
                return true;
            }
        }
        return false;
    }

    function processClassesSection(line) {
        const trimmedLine = line.trim();
        
        if (trimmedLine.match(/^(class:|interface:)/)) {
            state.indentLevel = 1;
            return true;
        }
        
        if (state.currentSection === 'Classes') {
            if (trimmedLine.match(/^(Attributes|Methods):/)) {
                state.indentLevel = 2;
                return true;
            }
            if (state.indentLevel >= 2 && trimmedLine !== '') {
                state.indentLevel = 3;
                return true;
            }
        }
        return false;
    }

    function processImportsSection(line) {
        const trimmedLine = line.trim();
        
        if (state.currentSection === 'Imports') {
            if (trimmedLine.startsWith('-->')) {
                state.indentLevel = 1;
                return true;
            } else if (trimmedLine !== '') {
                state.indentLevel = 0;
                return true;
            }
        }
        return false;
    }

    function processDiagramSection(line) {
        const trimmedLine = line.trim();
        
        if (state.currentSection === 'Diagram' && trimmedLine !== '') {
            state.indentLevel = 1;
            return true;
        }
        return false;
    }

    lines.forEach((line) => {
        if (line.trim() === '') {
            formattedLines.push('');
            return;
        }

        if (processSection(line)) {
            formattedLines.push(line.trim());
            return;
        }

        let handled = false;
        handled = handled || processUseCaseFlow(line);
        handled = handled || processFileSection(line);
        handled = handled || processClassesSection(line);
        handled = handled || processImportsSection(line);
        handled = handled || processDiagramSection(line);

        if (!handled) {
            // Default handling for unmatched lines
            formattedLines.push(getIndentedLine(line, state.indentLevel));
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
        const formattedText = formatPtd(text);
        this.outputChannel.appendLine('Formatting document...');
        return [vscode.TextEdit.replace(range, formattedText)];
    }
}

module.exports = {
    PtdDocumentFormattingEditProvider
};
