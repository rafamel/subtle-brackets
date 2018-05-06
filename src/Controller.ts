'use strict';
import * as vscode from 'vscode';
import Engine from './Engine';

class Controller {
  private disposable: vscode.Disposable;
  private engine: Engine;

  constructor() {
    this.engine = new Engine();
    this.engine.run();

    // Subscribe to selection change and editor activation events
    const subscriptions: vscode.Disposable[] = [];
    vscode.window.onDidChangeTextEditorSelection(
      this.engine.run,
      this,
      subscriptions
    );
    vscode.window.onDidChangeActiveTextEditor(
      (/* event */) => {
        this.engine.reset();
        this.engine.run();
      },
      this,
      subscriptions
    );
    vscode.workspace.onDidChangeTextDocument(
      (/* event */) => {
        this.engine.reset();
        this.engine.run();
      },
      this,
      subscriptions
    );

    // Create a combined disposable from both event subscriptions
    this.disposable = vscode.Disposable.from(...subscriptions);
  }
  public dispose() {
    this.engine.reset();
    this.disposable.dispose();
  }
}

export default Controller;
