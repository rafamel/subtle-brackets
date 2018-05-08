'use strict';
import * as vscode from 'vscode';
import * as deep from 'lodash.clonedeep';
import pairs from './pairs';

let decorations: { [key: string]: vscode.TextEditorDecorationType } = {};
function setDecorations(settings: vscode.WorkspaceConfiguration) {
  const styles = {
    global: deep(settings.style),
    ...Object.keys(pairs.get()).reduce((acc, id) => {
      const pair = pairs.get()[id];
      if (pair && pair.style && typeof pair.style === 'object') {
        acc[id] = pair.style;
      }
      return acc;
    }, {})
  };

  // Build decorations
  decorations = Object.keys(styles).reduce((acc, styleFor) => {
    // Add default borderColor if the style lacks it
    if (!styles[styleFor].hasOwnProperty('borderColor')) {
      styles[styleFor].borderColor = '#D4D4D4';
      styles[styleFor].light = { borderColor: '#333333' };
    }

    acc[styleFor] = vscode.window.createTextEditorDecorationType(
      styles[styleFor]
    );
    return acc;
  }, {});

  return decorations;
}

function getDecorations() {
  return decorations;
}

export default {
  set: setDecorations,
  get: getDecorations
};
