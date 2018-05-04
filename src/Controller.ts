'use strict';
import * as vscode from 'vscode';
import engine from './engine';

class Controller {
  private disposable: vscode.Disposable;

  constructor() {
    engine.start();

    // Subscribe to selection change and editor activation events
    const subscriptions: vscode.Disposable[] = [];
    vscode.window.onDidChangeTextEditorSelection(
      engine.start,
      this,
      subscriptions
    );
    vscode.window.onDidChangeActiveTextEditor(
      engine.start,
      this,
      subscriptions
    );

    // Create a combined disposable from both event subscriptions
    this.disposable = vscode.Disposable.from(...subscriptions);
  }
  public dispose() {
    engine.clear();
    this.disposable.dispose();
  }
}

export default Controller;
