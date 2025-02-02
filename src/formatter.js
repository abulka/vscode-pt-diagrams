const vscode = require('vscode');

function formatPtd(text) {
    return '# hi andy\n' + text;
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
