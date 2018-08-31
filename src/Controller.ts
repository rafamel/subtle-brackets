import * as vscode from 'vscode';
import Engine from './Engine';
import logger from './utils/logger';

class Controller {
  private disposable: vscode.Disposable;
  private engine: Engine;

  constructor() {
    this.engine = new Engine();
    this.engine.run();

    // Subscribe to selection change and editor activation events
    const subscriptions: vscode.Disposable[] = [];
    vscode.window.onDidChangeTextEditorSelection(
      (/* event */) => {
        logger.info('Fired: onDidChangeTextEditorSelection');
        this.engine.run();
      },
      this,
      subscriptions
    );
    vscode.window.onDidChangeActiveTextEditor(
      (/* event */) => {
        logger.info('Fired: onDidChangeActiveTextEditor');
        this.reset();
      },
      this,
      subscriptions
    );
    vscode.workspace.onDidChangeTextDocument(
      (/* event */) => {
        logger.info('Fired: onDidChangeTextDocument');
        this.reset();
      },
      this,
      subscriptions
    );

    // Create a combined disposable from both event subscriptions
    this.disposable = vscode.Disposable.from(...subscriptions);
  }
  public reset() {
    this.engine.reset();
    this.engine.run();
  }
  public dispose() {
    this.engine.reset();
    this.disposable.dispose();
  }
}

export default Controller;
