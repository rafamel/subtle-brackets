import * as vscode from 'vscode';

export interface IBracket {
  opposite: string;
  pair: string;
  type: 'open' | 'close';
}

export interface IBrackets {
  [key: string]: IBracket;
}

export interface IOptions {
  brackets: IBrackets;
  regexp: RegExp;
  decorations: {
    [key: string]: vscode.TextEditorDecorationType;
  };
}

export interface IMatch {
  str: string;
  index: number;
}

export interface IAdjacentMatches {
  adjacent: IMatch;
  forwards: boolean;
  matches: IMatch[];
}

export interface IPosition {
  str: string;
  index: number;
  line: number;
}
export interface IPositionMatch {
  start: IPosition;
  end?: IPosition;
}
