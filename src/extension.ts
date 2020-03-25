import * as vscode from 'vscode';
import Controller from './Controller';
import options from './options';
import logger from './utils/logger';

function getSettings() {
  const settings = vscode.workspace.getConfiguration('subtleBrackets');
  return { settings, string: JSON.stringify(settings) };
}

function disableNative(settings) {
  if (!settings.disableNative) return;
  vscode.workspace
    .getConfiguration()
    .update('editor.matchBrackets', 'never', true);
}

export function activate(context: vscode.ExtensionContext) {
  let settings = getSettings();
  disableNative(settings.settings);
  options.set(settings.settings);
  const controller = new Controller();

  // Register Save Event
  const saveEv = vscode.workspace.onDidChangeConfiguration(() => {
    logger.debug('Configuration/settings changed.');
    const current = getSettings();
    if (settings.string === current.string) return;
    logger.debug('Subtle Brackets settings changed.');

    settings = current;
    disableNative(settings.settings);
    options.set(settings.settings);
    controller.reset();
  });

  // Add to a list of disposables which are disposed when this extension is deactivated.
  context.subscriptions.push(controller, saveEv);
}

// Method called when the extension is deactivated
export function deactivate(context: vscode.ExtensionContext) {
  // Dispose of subscriptions
  context.subscriptions.forEach((disposable) => disposable.dispose());

  // Reset native 'editor.matchBrackets'
  const disabledNative = vscode.workspace
    .getConfiguration()
    .get<boolean>('subtleBrackets.disableNative');
  const matchBrackets = vscode.workspace
    .getConfiguration()
    .get<boolean>('editor.matchBrackets');
  if (disabledNative && !matchBrackets) {
    vscode.workspace
      .getConfiguration()
      .update('editor.matchBrackets', true, true);
  }
}
