'use strict';
import * as vscode from 'vscode';
import { IOptions } from '../types';
import parseStyles from './styles';
import parseBrackets from './brackets';

let options: IOptions;

function getOptions(): IOptions {
  return options;
}

function setOptions(settings: vscode.WorkspaceConfiguration): IOptions {
  // this.languages = Object.keys(prismLanguages); // @chc readd
  // this.parse = settings.parse; // @chc readd

  // Set styles for retrieval on brackets
  const styles = parseStyles(settings);

  // Get Bracket Pairs
  const brackets = parseBrackets(settings);

  // Regexp
  // Sort them by length (longer will be checked for first)
  const sorted = Object.keys(brackets).sort((a, b) => b.length - a.length);
  // Build regexp
  const escape = (s) => s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
  const regexp = new RegExp('(' + sorted.map(escape).join('|') + ')', 'g');

  options = { styles, brackets, regexp };
  return options;
}

export default {
  get: getOptions,
  set: setOptions
};
