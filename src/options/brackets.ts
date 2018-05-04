'use strict';
import * as vscode from 'vscode';
import { IBrackets } from '../types';
import warn from '../utils/warn';
import config from '../config';

let brackets: IBrackets = {};

function pairExists(a: string, b: string, pair: string): boolean {
  const doesExist = (bracket): boolean => {
    warn(
      `"${bracket}" appears in several "bracketPairs" definitions. The pair "${pair}" will be ignored`
    );
    return true;
  };
  if (brackets.hasOwnProperty(a)) return doesExist(a);
  if (brackets.hasOwnProperty(b)) return doesExist(b);
  return false;
}

export default function parseBrackets(
  settings: vscode.WorkspaceConfiguration
): IBrackets {
  brackets = {};
  const { bracketPairs } = settings;

  bracketPairs.forEach((pair) => {
    if (pair.length < 2)
      return warn(`Bracket ${pair} couldn't be parsed and will be ignored.`);
    let open: string;
    let close: string;
    if (pair.length === 2) {
      open = pair[0];
      close = pair[1];
    } else {
      const { pairSeparation } = config;
      const splitted = pair.split(pairSeparation);
      if (splitted.length <= 1) {
        return warn(
          `Complex bracket pair ${pair} is not divided by "${pairSeparation}".`
        );
      }
      open = splitted[0];
      close = splitted.slice(1).join(pairSeparation);
    }
    if (pairExists(open, close, pair)) return;
    brackets[open] = { opposite: close, type: 'open', pair };
    brackets[close] = { opposite: open, type: 'close', pair };
  });

  return brackets;
}
