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
        blockStack: [],
        arrowStack: [],
        lastArrowIndent: 0
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
            state.arrowStack = [];
            return true;
        }
        return false;
    }

    function processUseCaseFlow(line) {
        const trimmedLine = line.trim();
        
        // Handle scenario headers
        if (trimmedLine.startsWith('Scenario:')) {
            state.indentLevel = 1;
            state.arrowStack = [];
            state.lastArrowIndent = 0;
            return getIndentedLine(line, state.indentLevel);
        }

        // Method declaration line after scenario
        if (trimmedLine.match(/^[a-zA-Z]+\([^)]*\)\s*\[.*\]$/)) {
            state.indentLevel = 2;
            return getIndentedLine(line, state.indentLevel);
        }

        // Block starts [if], [else], etc.
        if (trimmedLine.match(/^\[(?!\/)/)) {
            state.indentLevel = 3;
            state.blockStack.push(state.indentLevel);
            return getIndentedLine(line, state.indentLevel);
        }

        // Method calls with arrows
        if (trimmedLine.startsWith('->')) {
            state.indentLevel = state.blockStack.length > 0 ? 
                state.blockStack[state.blockStack.length - 1] + 1 : 3;
            state.arrowStack.push(state.indentLevel);
            state.lastArrowIndent = state.indentLevel;
            return getIndentedLine(line, state.indentLevel);
        }

        // Description lines after arrows
        if (state.lastArrowIndent > 0 && !trimmedLine.match(/^(->|<|\[|\])/)) {
            return getIndentedLine(line, state.lastArrowIndent + 1);
        }

        // Return statements
        if (trimmedLine.startsWith('<')) {
            if (state.arrowStack.length > 0) {
                const currentArrowIndent = state.arrowStack[state.arrowStack.length - 1];
                state.arrowStack.pop();
                return getIndentedLine(line, currentArrowIndent);
            }
            return getIndentedLine(line, state.blockStack[state.blockStack.length - 1] || 2);
        }

        // Block ends
        if (trimmedLine.match(/^\[\/|^\]$/)) {
            state.blockStack.pop();
            state.indentLevel = Math.max(2, state.indentLevel - 1);
            return getIndentedLine(line, state.indentLevel);
        }

        return getIndentedLine(line, state.indentLevel);
    }

    function processImportsSection(line) {
        const trimmedLine = line.trim();
        
        if (state.currentSection !== 'Imports') {
            return false;
        }

        // Main import declarations
        if (!trimmedLine.startsWith('-->')) {
            state.indentLevel = 1;
            return getIndentedLine(line, state.indentLevel);
        }

        // Handle nested arrows
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

        if (state.currentSection === 'Use Cases') {
            formattedLine = processUseCaseFlow(line);
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
        const formattedText = formatPtd(text);
        this.outputChannel.appendLine('Formatting document...');
        return [vscode.TextEdit.replace(range, formattedText)];
    }
}

module.exports = {
    PtdDocumentFormattingEditProvider
};
