import * as vscode from 'vscode';
export default function warn(msg: string) {
  vscode.window.showWarningMessage(msg);
}
