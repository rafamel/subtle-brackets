'use strict';
import * as vscode from 'vscode';
import { v4 as uuid } from 'uuid';
import warn from '../utils/warn';
import * as deep from 'lodash.clonedeep';
import { IPairs } from '../types';

let pairs: IPairs = {};
function setPairs(settings: vscode.WorkspaceConfiguration): IPairs {
  const defArr: string[] = [];
  pairs = settings.pairs.reduce((acc, pair) => {
    if (!pair.open || !pair.close) {
      warn(
        `Each bracket pair must have an "open" and "close" key. Otherwise they'll be ignored.`
      );
      return acc;
    }
    if (
      pair.open === pair.close ||
      defArr.indexOf(pair.open) !== -1 ||
      defArr.indexOf(pair.close) !== -1
    ) {
      warn(
        `Opening and closing clauses for bracket pairs must be unique. Otherwise they'll be ignored.`
      );
      return acc;
    }

    // Avoid duplicates
    defArr.push(pair.open);
    defArr.push(pair.close);

    // Generate id and save pair settings
    acc[uuid()] = deep(pair);
    return acc;
  }, {});
  return pairs;
}

function getPairs(): IPairs {
  return pairs;
}

export default { get: getPairs, set: setPairs };
