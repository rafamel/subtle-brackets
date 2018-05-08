'use strict';
import * as vscode from 'vscode';
import pairs from './pairs';
import decorations from './decorations';

export default class Bracket {
  public str: string;
  public opposite: string;
  public type: string;
  public parse: boolean;
  constructor(private pairId: string, open: boolean) {
    const pair = pairs.get()[pairId];
    this.type = open ? 'open' : 'close';
    this.str = pair[this.type];
    this.opposite = pair[open ? 'close' : 'open'];
    // tslint:disable-next-line
    this.parse = !!(pair.parse || pair.parse == undefined);
  }
  get decoration(): vscode.TextEditorDecorationType {
    return decorations.get()[this.pairId] || decorations.get().global;
  }
}
