'use strict';
import * as vscode from 'vscode'; // VS Code extensibility API
import { Runner } from './runner';

// This method is called when your extension is activated. Activation is
// controlled by the activation events defined in package.json.
export function activate(context: vscode.ExtensionContext) {
    // Use the console to output diagnostic information (console.log) and errors (console.error).
    // This line of code will only be executed once when your extension is activated.
    
    let runner = new Runner();
    let controller = new Controller(runner);
    
    // Add to a list of disposables which are disposed when this extension is deactivated.
    context.subscriptions.push(controller, runner);

}

class Controller {

    private _runner: Runner;
    private _disposable: vscode.Disposable;

    constructor(runner: Runner) {
        this._runner = runner;
        this._runner.run();

        // Subscribe to selection change and editor activation events
        let subscriptions: vscode.Disposable[] = [];
        vscode.window.onDidChangeTextEditorSelection(this._onEvent, this, subscriptions);
        vscode.window.onDidChangeActiveTextEditor(this._onEvent, this, subscriptions);

        // Create a combined disposable from both event subscriptions
        this._disposable = vscode.Disposable.from(...subscriptions);
    }

    dispose() {
        this._disposable.dispose();
    }

    private _onEvent() {
        this._runner.run();
    }
}
