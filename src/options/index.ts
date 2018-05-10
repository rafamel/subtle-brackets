'use strict';
import * as vscode from 'vscode';
import { IOptions } from '../types';
import pairs from './pairs';
import brackets from './brackets';
import decorations from './decorations';

let options: IOptions;
function setOptions(settings: vscode.WorkspaceConfiguration): IOptions {
  // Pairs must be set/parsed first
  pairs.set(settings);
  // We can now parse decorations and brackets
  decorations.set(settings);
  brackets.set();

  // Regexp
  // Sort them by length (longer will be checked for first)
  const sorted = Object.keys(brackets.get()).sort(
    (a, b) => b.length - a.length
  );
  // Build regexp
  const escape = (s) => s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
  const regexp = new RegExp('(' + sorted.map(escape).join('|') + ')', 'g');

  options = {
    brackets: brackets.get(),
    regexp,
    parse: settings.parse
  };

  return options;
}

function getOptions(): IOptions {
  return options;
}

export default {
  set: setOptions,
  get: getOptions
};
