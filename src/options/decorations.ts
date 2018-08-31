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
    const style = styles[styleFor];
    // Add default borderColor if the style lacks it
    if (!style.hasOwnProperty('borderColor')) {
      style.borderColor = '#D4D4D4';
      style.light = { borderColor: '#333333' };
    }
    if (!style.hasOwnProperty('borderStyle')) {
      style.borderStyle = 'none none solid none';
    }
    if (!style.hasOwnProperty('borderWidth')) {
      style.borderWidth = '1px';
    }

    acc[styleFor] = vscode.window.createTextEditorDecorationType(style);
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
