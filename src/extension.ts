'use strict';
import * as vscode from 'vscode';
import * as path from 'path';
import Controller from './Controller';
import ResetableTimeout from './utils/ResetableTimeout';
import options from './options';

function getSettings() {
  const settings = vscode.workspace.getConfiguration('subtleBrackets');
  return { settings, string: JSON.stringify(settings) };
}

function disableNative(settings) {
  if (!settings.disableNative) return;
  vscode.workspace
    .getConfiguration()
    .update('editor.matchBrackets', false, true);
}

export function activate(context: vscode.ExtensionContext) {
  let settings = getSettings();
  disableNative(settings.settings);
  options.set(settings.settings);
  let controller = new Controller();

  // Register Save Event
  const timeout = new ResetableTimeout();
  const saveEv = vscode.workspace.onDidSaveTextDocument((saved) => {
    timeout
      .reset(2000)
      .then(() => {
        const fileName = path.basename(saved.fileName);
        if (fileName !== 'settings.json') return;

        const current = getSettings();
        if (settings.string === current.string) return;

        settings = current;
        disableNative(settings.settings);
        options.set(settings.settings);
      })
      .catch((e) => {});
  });

  // Add to a list of disposables which are disposed when this extension is deactivated.
  context.subscriptions.push(controller, saveEv);
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
