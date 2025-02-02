const vscode = require('vscode');

let outputChannel;

function activate(context) {
    outputChannel = vscode.window.createOutputChannel('Plain Text Diagrams');
    outputChannel.appendLine('Congratulations, your extension "plain-text-diagrams" is now active!');
    outputChannel.show(true);
}

function deactivate() {
    if (outputChannel) {
        outputChannel.dispose();
    }
}

module.exports = {
    activate,
    deactivate
};
