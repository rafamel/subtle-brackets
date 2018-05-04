'use strict';
import * as vscode from 'vscode';
import * as deep from 'lodash.clonedeep';
import warn from '../utils/warn';

export default function parseStyles(settings: vscode.WorkspaceConfiguration) {
  const styles = deep(settings.styles);
  const { bracketPairs } = settings;
  // Define a global style if it's not set
  if (!styles.hasOwnProperty('global')) {
    styles.global = {
      borderWidth: '1px',
      borderStyle: 'none none solid none'
    };
  }
  Object.keys(styles).forEach((styleFor) => {
    // Discard any styles for pairs not declared in settings.bracketParis
    if (styleFor !== 'global' && bracketPairs.indexOf(styleFor) === -1) {
      return warn(
        `Styled pair "${styleFor}" doesn't exist in the "bracketPairs" definition`
      );
    }
    // Add default borderColor if the style lacks it
    if (!styles[styleFor].hasOwnProperty('borderColor')) {
      styles[styleFor].borderColor = '#D4D4D4';
      styles[styleFor].light = { borderColor: '#333333' };
    }
  });

  return styles;
}
