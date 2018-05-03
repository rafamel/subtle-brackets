'use strict';
import * as vscode from 'vscode'; // VS Code extensibility API
import * as prism from 'prismjs';
import * as prismLanguages from 'prism-languages';
import * as deep from 'lodash.clonedeep';

interface IKeepParsingObj {
  open: number;
  aBracket: string;
  bBracket: string;
  line: number;
  lineText: string;
  direction: number;
  doc: vscode.TextDocument;
  lineCount: number;
  knownLanguage: string;
  typesFound: string[];
  parsedDocBrackets: object;
}

export class Runner {
  private bracketsDict: {
    all: string[];
    open: string[];
    close: string[];
    pairs: {};
  };
  private decorations: { [key: string]: vscode.TextEditorDecorationType };
  private past: vscode.TextEditor;
  private languages: string[];
  private regexp: RegExp;
  private parse: boolean;

  constructor(private settings: vscode.WorkspaceConfiguration) {
    const escape = (s) => s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');

    this.decorations = {};
    this.past = null;
    this.bracketsDict = { all: [], open: [], close: [], pairs: {} };
    this.languages = Object.keys(prismLanguages);
    this.parse = settings.parse;

    // Decorations
    const styles = deep(settings.styles);
    if (!styles.hasOwnProperty('global')) {
      styles.global = {
        borderWidth: '1px',
        borderStyle: 'none none solid none'
      };
    }
    for (const styleFor of Object.keys(styles)) {
      if (
        styleFor === 'global' ||
        settings.bracketPairs.indexOf(styleFor) !== -1
      ) {
        if (!styles[styleFor].hasOwnProperty('borderColor')) {
          styles[styleFor].borderColor = '#D4D4D4';
          styles[styleFor].light = { borderColor: '#333333' };
        }
        this.decorations[
          styleFor
        ] = vscode.window.createTextEditorDecorationType(styles[styleFor]);
      }
    }

    // Bracket Pairs
    settings.bracketPairs.forEach((x) => {
      if (x.length === 2) {
        // Safety Check
        const [open, close] = x.split('');
        this.bracketsDict.all.push(open, close);
        this.bracketsDict.open.push(open);
        this.bracketsDict.close.push(close);
        this.bracketsDict.pairs[open] = close;
        this.bracketsDict.pairs[close] = open;
      }
    });

    // Regexp
    this.regexp = new RegExp(
      '[' + escape(this.bracketsDict.all.join('')) + ']',
      'g'
    );
  }

  // PUBLIC
  public dispose() {
    if (this.past) {
      for (const decorationKey of Object.keys(this.decorations)) {
        const decoration = this.decorations[decorationKey];
        this.past.setDecorations(decoration, []);
      }
      this.past = null;
    }
  }

  public run() {
    // Get the current text editor
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;

    // Clean past styles
    this.dispose();

    const doc = editor.document;
    const selection = vscode.window.activeTextEditor.selection;
    const range = new vscode.Range(selection.start, selection.end);

    if (!range.isEmpty) return;
    // Fallthrough: Range empty, there's no selection, only the cursor on a position

    const line = selection.start.line;
    const startChar = selection.start.character;
    const lineText = doc.lineAt(line).text;
    const prevChar = Math.max(startChar - 1, 0);
    const postChar = Math.min(startChar + 1, lineText.length);
    // Left and right characters to the cursor
    const left = lineText.slice(prevChar, startChar);
    const right = lineText.slice(startChar, postChar);
    // Booleans, checking whether they are brackets
    const isRight = right && this.bracketsDict.all.indexOf(right) !== -1;
    const isLeft = left && this.bracketsDict.all.indexOf(left) !== -1;

    if (!(isRight || isLeft)) return; // If they're not brackets, return

    const {
      knownLanguage,
      parsedDocBrackets,
      typesFound
    } = this.parseDocBrackets(doc);
    const lineTillLeft = lineText.slice(0, prevChar);
    const lineTillRight = lineText.slice(0, startChar);

    // Let's see if any of `left` and `right` are brackets
    // Prioritizing `right`
    let aBracket: string;
    let startPosChar: number;
    let endPosChar: number;
    if (
      isRight &&
      this.isPunctuationType(
        knownLanguage,
        typesFound,
        parsedDocBrackets,
        line,
        right,
        lineTillRight
      )
    ) {
      aBracket = right;
      startPosChar = startChar;
      endPosChar = postChar;
    } else if (
      isLeft &&
      this.isPunctuationType(
        knownLanguage,
        typesFound,
        parsedDocBrackets,
        line,
        left,
        lineTillLeft
      )
    ) {
      aBracket = left;
      startPosChar = prevChar;
      endPosChar = startChar;
    } else {
      // If no valid bracket is found to left or right, return
      return;
    }

    // Range of the selected bracket
    const aBracketRange = new vscode.Range(
      new vscode.Position(line, startPosChar),
      new vscode.Position(line, endPosChar)
    );

    // Let's see if the bracket is an opening or closing bracket
    let lineRest: string;
    let parseDirection: number;
    if (this.bracketsDict.open.indexOf(aBracket) !== -1) {
      // Opening bracket. Parse forwards
      lineRest = lineText.slice(endPosChar);
      parseDirection = 1;
    } else if (this.bracketsDict.close.indexOf(aBracket) !== -1) {
      // Closing bracket. Parse backwards
      lineRest = lineText.slice(0, startPosChar);
      parseDirection = -1;
    }

    // Complement of `aBracket`
    const bBracket = this.bracketsDict.pairs[aBracket];
    const kpObj = {
      open: 1,
      aBracket,
      bBracket,
      line,
      lineText: lineRest,
      direction: parseDirection,
      doc,
      lineCount: doc.lineCount,
      knownLanguage,
      typesFound,
      parsedDocBrackets
    };

    // tslint:disable-next-line:prefer-const
    let [bLine, bChar] = this.parseUntilComplement(kpObj);

    // Verify the parsing didn't fail
    if (bLine < 0) return;

    // If it's closing at the same line, correct `bChar`
    if (line === bLine && parseDirection > 0) bChar += endPosChar;

    // Now we have `aBracketRange` and `bBracketRange`
    const bBracketRange = new vscode.Range(
      new vscode.Position(bLine, bChar),
      new vscode.Position(bLine, bChar + bBracket.length)
    );
    const bracketPair =
      parseDirection > 0 ? aBracket + bBracket : bBracket + aBracket;
    let decoration = this.decorations.global;
    if (this.decorations.hasOwnProperty(bracketPair)) {
      decoration = this.decorations[bracketPair];
    }
    this.past = editor;
    editor.setDecorations(decoration, [bBracketRange, aBracketRange]);
  }

  // PRIVATE

  private parseUntilComplement(
    kpObj: IKeepParsingObj,
    first: boolean = true
  ): number[] {
    let lastChar: number;

    for (let ii = 0; ii < kpObj.lineText.length; ii++) {
      if (kpObj.open === 0) break;
      // Parse line backwards if looking for opening bracket
      lastChar = kpObj.direction < 0 ? kpObj.lineText.length - ii - 1 : ii;
      // Add or remove brackets to open/close
      const char = kpObj.lineText[lastChar];
      let lineTill: string;
      if (first && kpObj.direction > 0) {
        lineTill = kpObj.doc.lineAt(kpObj.line).text;
        lineTill = lineTill.slice(
          0,
          lastChar + (lineTill.length - kpObj.lineText.length)
        );
      } else {
        lineTill = kpObj.lineText.slice(0, lastChar);
      }
      const [isA, isB] = [char === kpObj.aBracket, char === kpObj.bBracket];

      if (
        (isA || isB) &&
        this.isPunctuationType(
          kpObj.knownLanguage,
          kpObj.typesFound,
          kpObj.parsedDocBrackets,
          kpObj.line,
          char,
          lineTill
        )
      ) {
        if (isA) kpObj.open++;
        else if (isB) kpObj.open--;
      }
    }
    if (kpObj.open === 0) {
      // Found Complement
      return [kpObj.line, lastChar];
    }

    // Not found
    kpObj.line = kpObj.line + kpObj.direction;
    if (kpObj.line >= kpObj.lineCount || kpObj.line < 0) {
      // Out of bounds
      return [-1, -1];
    }

    // Keep looking on next line
    kpObj.lineText = kpObj.doc.lineAt(kpObj.line).text;
    return this.parseUntilComplement(kpObj, false);
  }

  private isPunctuationType(
    knownLanguage: string,
    typesFound: string[],
    parsedDocBrackets: object,
    line: number,
    bracket: string,
    lineTill: string
  ) {
    if (
      !knownLanguage ||
      (!typesFound.indexOf(bracket) &&
        !typesFound.indexOf(this.bracketsDict.pairs[bracket]))
    ) {
      // Decorate all if language is not known or no bracket at all of that pair
      // is found to be of the punctuation type
      return true;
    }

    const nBracketInLine = (text, brkt) => text.split(brkt).length - 1;
    if (
      parsedDocBrackets.hasOwnProperty(line) &&
      parsedDocBrackets[line].hasOwnProperty(bracket)
    ) {
      const char = nBracketInLine(lineTill, bracket);
      return parsedDocBrackets[line][bracket][char] === 'punctuation';
    }

    // Didn't find it in the parsed obj; swallow error and return true anyways
    return true;
  }

  private parseDocBrackets(
    doc
  ): {
    knownLanguage: string;
    parsedDocBrackets: object;
    typesFound: string[];
  } {
    // Helper Function
    const getContent = (
      lines,
      typesFound,
      tokenized,
      currentLine,
      currentLineAt: string[]
    ) => {
      /* tslint:disable-next-line:no-shadowed-variable */
      const countStringLines = (str, currentLine, currentLineAt) => {
        str = str.trim();
        if (!str) return [currentLine, currentLineAt];
        if (currentLine >= doc.lineCount)
          throw Error('Line count higher than doc.');
        let docAtLine = doc.lineAt(currentLine).text;
        currentLineAt.forEach((s) => {
          docAtLine = docAtLine.replace(s, '');
        });
        if (docAtLine === docAtLine.replace(str, '')) {
          return countStringLines(str, currentLine + 1, []);
        }
        currentLineAt.push(str);
        return [currentLine, currentLineAt];
      };
      tokenized.forEach((token) => {
        if (typeof token.content === 'string') {
          token.content.split('\n').forEach((currentContent) => {
            [currentLine, currentLineAt] = countStringLines(
              currentContent,
              currentLine,
              currentLineAt
            );
            const matches = currentContent.match(this.regexp);
            if (matches)
              matches.forEach((bracket) => {
                if (!lines.hasOwnProperty(currentLine)) {
                  lines[currentLine] = {};
                }
                if (!lines[currentLine].hasOwnProperty(bracket)) {
                  lines[currentLine][bracket] = [];
                }
                lines[currentLine][bracket].push(token.type);
                typesFound[bracket] = true;
              });
          });
        } else if (Array.isArray(token.content)) {
          [
            lines,
            typesFound,
            tokenized,
            currentLine,
            currentLineAt
          ] = getContent(
            lines,
            typesFound,
            token.content,
            currentLine,
            currentLineAt
          );
        }
      });
      return [lines, typesFound, tokenized, currentLine, currentLineAt];
    };

    const emptyAns = {
      knownLanguage: '',
      parsedDocBrackets: {},
      typesFound: []
    };
    const language = doc.languageId;
    if (!this.parse || !this.languages.indexOf(language)) return emptyAns;

    // Known language, parse with Prism
    const fullText = doc.getText();
    let tokenized;
    try {
      tokenized = prism.tokenize(fullText, prism.languages[language]);
    } catch (err) {
      return emptyAns;
    }
    if (!tokenized) return emptyAns;

    try {
      const ansGetContent = getContent({}, {}, tokenized, 0, []);
      return {
        knownLanguage: language,
        parsedDocBrackets: ansGetContent[0],
        typesFound: Object.keys(ansGetContent[1])
      };
    } catch (err) {
      // tslint:disable-next-line
      console.log(`Parsing without Prism: ${err}`);
      return emptyAns;
    }
  }
}
