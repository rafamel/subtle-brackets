'use strict';
import * as vscode from 'vscode';
import { IMatch, ILineMatch, IPairMatch } from '../types';
import options from '../options';
import matchAll from './match-all';
import PrismParser from './PrismParser';

export default class Paper {
  public language: string;
  private editor?: vscode.TextEditor;
  private doc?: vscode.TextDocument;
  private decoration?: vscode.TextEditorDecorationType;
  private parser: PrismParser;
  private matches: { [key: number]: IMatch[] };
  constructor() {
    this.matches = [];
    this.editor = vscode.window.activeTextEditor;
    if (this.editor) this.doc = this.editor.document;
    this.language = this.getLanguage();
    this.parser = this.getParser();
  }
  public get text(): string {
    return (this.doc && this.doc.getText()) || '';
  }
  public get lines(): number {
    return (this.doc && this.doc.lineCount) || 0;
  }
  public getLine(n): string {
    return (this.doc && this.doc.lineAt(n).text) || '';
  }
  public getMatches(
    line: number,
    startAt?: number | false,
    endAt?: number | false
  ): IMatch[] {
    this.resetOnLanguage();
    if (!this.matches[line]) this.matches[line] = this._getMatches(line);

    if (!startAt && !endAt && endAt !== 0) return this.matches[line].concat();
    return this.matches[line].filter((match) => {
      if (startAt && match.index < startAt) return false;
      if ((endAt || endAt === 0) && match.index >= endAt) return false;
      return true;
    });
  }
  public getAdjacent(): ILineMatch | void {
    if (!this.editor || !this.doc || this.lines <= 0) return;

    const selection = this.editor.selection;
    const range = new vscode.Range(selection.start, selection.end);
    if (!range.isEmpty) return;

    const position = {
      line: selection.start.line,
      char: selection.start.character
    };

    // Try right side matches first for cursor-adjacent brackets
    const right = this.getMatches(position.line, position.char);
    if (right.length && right[0].index === position.char) {
      // We've got a right hand match!
      return { ...right[0], line: position.line };
    }

    // Right hand failed, try left hand
    const left = this.getMatches(position.line, false, position.char);
    const last = left.slice(-1)[0];
    if (left.length && last.index === position.char - last.str.length) {
      // We've got a left hand match!
      return { ...last, line: position.line };
    }
  }
  public decorate(pos: IPairMatch): void {
    if (!pos.end || !this.editor) return;

    // Set decoration
    const { brackets } = options.get();
    this.decoration = brackets[pos.start.str].decoration;

    // Set ranges
    const ranges = {
      start: new vscode.Range(
        new vscode.Position(pos.start.line, pos.start.index),
        new vscode.Position(
          pos.start.line,
          pos.start.index + pos.start.str.length
        )
      ),
      end: new vscode.Range(
        new vscode.Position(pos.end.line, pos.end.index),
        new vscode.Position(pos.end.line, pos.end.index + pos.end.str.length)
      )
    };

    this.editor.setDecorations(this.decoration, [ranges.start, ranges.end]);
  }
  public undecorate(): void {
    if (this.editor && this.decoration) {
      this.editor.setDecorations(this.decoration, []);
      this.decoration = undefined;
    }
  }
  private getLanguage(): string {
    return (this.doc && this.doc.languageId) || '';
  }
  private getParser() {
    return new PrismParser(this.text, this.language, this.lines);
  }
  private resetOnLanguage(): void {
    // If doc language has changed, parse the document again
    // and clear the matches
    const newLanguage = this.getLanguage();
    if (this.language !== newLanguage) {
      this.language = newLanguage;
      this.parser = this.getParser();
      this.matches = [];
    }
  }
  private _getMatches(line: number) {
    const matches = matchAll(this.getLine(line), options.get().regexp);
    if (!this.parser.matches.length) return matches;

    const { brackets } = options.get();
    const parsedLine = this.parser.matches[line];
    return matches.filter((match, i) => {
      // If it not should not be parsed, don't filter
      if (!brackets[match.str].parse) return true;
      // If it's not found on the parsed doc, don't filter
      if (!parsedLine[i] || parsedLine[i].str !== match.str) return true;

      // If type is not punctuation, then filter
      if (this.parser.strategy.indexOf(parsedLine[i].type) === -1) return false;
      // Don't filter in any other case
      return true;
    });
  }
}
