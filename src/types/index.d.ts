import * as vscode from 'vscode';
import Bracket from '../options/Bracket';

export interface IPair {
  open: string;
  close: string;
  parse?: boolean;
  style?: object;
}

export interface IPairs {
  [key: string]: IPair;
}

export interface IBrackets {
  [key: string]: Bracket;
}

export interface IOptions {
  brackets: IBrackets;
  regexp: RegExp;
  parse: boolean;
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
