'use strict';
import * as vscode from 'vscode'; // VS Code extensibility API
import * as path from 'path'; // VS Code extensibility API
import * as delay from 'timeout-as-promise'; // VS Code extensibility API
import { Runner } from './runner';

// This method is called when your extension is activated. Activation is
// controlled by the activation events defined in package.json.
export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error).
  // This line of code will only be executed once when your extension is activated.

  let settings = vscode.workspace.getConfiguration('subtleBrackets');
  let settingsStr = JSON.stringify(settings);

  let runner = new Runner(settings);
  let controller = new Controller(runner);

  // Register Save Event
  const saveEv = vscode.workspace.onDidSaveTextDocument((saved) => {
    delay(2000) // Changes are not immediately applied, set a delay
      .then(() => {
        const fileName = path.basename(saved.fileName);
        if (fileName !== 'settings.json') return;

        settings = vscode.workspace.getConfiguration('subtleBrackets');
        const newSettingsStr = JSON.stringify(settings);
        if (settingsStr === newSettingsStr) return;

        settingsStr = newSettingsStr;
        // Reset runner and controller
        runner.dispose();
        runner = new Runner(settings);
        controller.dispose();
        controller = new Controller(runner);
      });
  });

  // Disable matchBrackets
  const disableNative = vscode.workspace
    .getConfiguration()
    .get<boolean>('subtleBrackets.disableNative');
  if (disableNative) {
    vscode.workspace
      .getConfiguration()
      .update('editor.matchBrackets', false, true);
  }

  // Add to a list of disposables which are disposed when this extension is deactivated.
  context.subscriptions.push(controller, runner, saveEv);
}

// Method called when the extension is deactivated
export function deactivate(context: vscode.ExtensionContext) {
  const disableNative = vscode.workspace
    .getConfiguration()
    .get<boolean>('subtleBrackets.disableNative');
  const matchBrackets = vscode.workspace
    .getConfiguration()
    .get<boolean>('editor.matchBrackets');
  if (disableNative && !matchBrackets) {
    vscode.workspace
      .getConfiguration()
      .update('editor.matchBrackets', true, true);
  }
}

class Controller {
  private _runner: Runner;
  private _disposable: vscode.Disposable;

  constructor(runner: Runner) {
    this._runner = runner;
    this._runner.run();

    // Subscribe to selection change and editor activation events
    const subscriptions: vscode.Disposable[] = [];
    vscode.window.onDidChangeTextEditorSelection(
      this._onEvent,
      this,
      subscriptions
    );
    vscode.window.onDidChangeActiveTextEditor(
      this._onEvent,
      this,
      subscriptions
    );

    // Create a combined disposable from both event subscriptions
    this._disposable = vscode.Disposable.from(...subscriptions);
  }

  public dispose() {
    this._disposable.dispose();
  }

  private _onEvent() {
    this._runner.run();
  }
}
