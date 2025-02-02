const vscode = require('vscode');
const { PtdDocumentFormattingEditProvider } = require('./formatter');

let outputChannel;

function activate(context) {
    outputChannel = vscode.window.createOutputChannel('Plain Text Diagrams');
    outputChannel.appendLine('Congratulations, your extension "plain-text-diagrams" is now active!');
    outputChannel.show(true);
    context.subscriptions.push(outputChannel); // for disposal

    try {
        context.subscriptions.push(
            vscode.languages.registerDocumentFormattingEditProvider(
                { scheme: 'file', language: 'ptd' },
                new PtdDocumentFormattingEditProvider(outputChannel)
            )
        );        
    }
    catch (error) {
        outputChannel.appendLine(`Error: ${error}`);
    }
}

function deactivate() {
     // No need to manually dispose of outputChannel here since we have context.subscriptions.push
}

module.exports = {
    activate,
    deactivate
};
