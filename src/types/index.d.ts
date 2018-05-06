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
  parse: boolean;
  brackets: IBrackets;
  regexp: RegExp;
  decorations: {
    [key: string]: vscode.TextEditorDecorationType;
  };
}

export interface IPrismMatch {
  str: string;
  type: string;
}

export interface IMatch {
  str: string;
  index: number;
}

export interface ILineMatch extends IMatch {
  line: number;
}

export interface IPairMatch {
  start: ILineMatch;
  end?: ILineMatch;
}
