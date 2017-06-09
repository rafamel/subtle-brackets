'use strict';
import * as vscode from 'vscode'; // VS Code extensibility API

const Prism = require('prismjs'),
    prismLanguages = require('prism-languages');

export class Runner {

    private bracketsDict: {'all': string[], 'open': string[], 'close': string[], 'pairs': {}};
    private decoration: vscode.TextEditorDecorationType;
    private past: boolean;
    private languages: string[];
    private regexp: RegExp;
    private parse: Boolean;

    constructor() {

        const escape = (s) => s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), // FIXME First parenthesis doesn't work with subtle brackets
            config = vscode.workspace.getConfiguration('subtleBrackets');

        let style = config.style;
        if (!config.style.hasOwnProperty('borderColor')) {
            style.borderColor = '#D4D4D4';
            style.light = { 'borderColor': '#333333' };
        }

        this.decoration = vscode.window.createTextEditorDecorationType(style);
        this.past = false;
        this.bracketsDict = {'all': [], 'open': [], 'close': [], 'pairs': {}};
        this.languages = Object.keys(prismLanguages);
        this.parse = config.parse;

        config.bracketPairs.forEach(x => {
            if (x.length === 2) { // Safety Check
                let [open, close] = x.split('');
                this.bracketsDict['all'].push(open, close);
                this.bracketsDict['open'].push(open);
                this.bracketsDict['close'].push(close);
                this.bracketsDict['pairs'][open] = close;
                this.bracketsDict['pairs'][close] = open;
            }
        });

        this.regexp = new RegExp('[' + escape(this.bracketsDict['all'].join('')) + ']', 'g');
    }

    public run() {

        // Get the current text editor
        const editor = vscode.window.activeTextEditor;
        if (!editor) return;

        // Clean past styles
        if (this.past) {
            editor.setDecorations(this.decoration, []);
            this.past = false;
        }

        const doc = editor.document,
            selection = vscode.window.activeTextEditor.selection,
            range = new vscode.Range(selection.start, selection.end);

        if (!range.isEmpty) return;
        // There's no selection, only the cursor on a position

        const line = selection.start.line,
            startChar = selection.start.character,
            lineText = doc.lineAt(line).text,
            prevChar = Math.max(startChar-1, 0),
            postChar = Math.min(startChar+1, lineText.length),
            // Left and right characters to the cursor
            left = lineText.slice(prevChar, startChar),
            right = lineText.slice(startChar, postChar),
            // Booleans, checking whether they are brackets
            isRight = right && this.bracketsDict.all.indexOf(right) !== -1,
            isLeft = left && this.bracketsDict.all.indexOf(left) !== -1;

        if (!(isRight || isLeft)) return; // If they're not brackets, return

        const [knownLanguage, parsedDocBrackets, typesFound] = this.parseDocBrackets(doc),
            lineTillLeft = lineText.slice(0, prevChar),
            lineTillRight =  lineText.slice(0, startChar);

        // Let's see if any of `left` and `right` are brackets
        // Prioritizing `right`
        let aBracket: string,
            startPosChar: number,
            endPosChar: number;
        if (isRight && this.isPunctuationType(knownLanguage, typesFound,
                                        parsedDocBrackets, line, right, lineTillRight)) {
            aBracket = right;
            startPosChar = startChar;
            endPosChar = postChar;
        } else if (isLeft && this.isPunctuationType(knownLanguage, typesFound,
                                        parsedDocBrackets, line, left, lineTillLeft)) {
            aBracket = left;
            startPosChar = prevChar;
            endPosChar = startChar;
        } else {
            // If no valid bracket is found to left or right, return
            return;
        }

        // Range of the selected bracket
        let aBracketRange = new vscode.Range(
                new vscode.Position(line, startPosChar),
                new vscode.Position(line, endPosChar)
            );

        // Let's see if the bracket is an opening or closing bracket
        let lineRest: string,
            parseDirection: number;
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
        let bBracket = this.bracketsDict.pairs[aBracket],
            [bLine, bChar] = this.parseUntilComplement(1, aBracket, bBracket, line,
                                lineRest, parseDirection, doc, doc.lineCount,
                                knownLanguage, typesFound, parsedDocBrackets);

        // Verify the parsing didn't fail
        if (bLine < 0) return;

        // If it's closing at the same line, correct `bChar`
        if (line === bLine && parseDirection > 0) bChar += endPosChar;

        // Now we have `aBracketRange` and `bBracketRange`
        let bBracketRange = new vscode.Range(
                new vscode.Position(bLine, bChar),
                new vscode.Position(bLine, bChar+bBracket.length)
            );
        this.past = true;
        editor.setDecorations(this.decoration, [bBracketRange, aBracketRange]);
    }

    private parseUntilComplement(open: number, aBracket: string, bBracket: string,
                    line: number, lineText: string, direction: number,
                    doc: vscode.TextDocument, lineCount: number, knownLanguage: string,
                    typesFound: string[], parsedDocBrackets: Object): number[] {
        let lastChar: number;

        for (let ii = 0; ii < lineText.length; ii++) {
            if (open === 0) break;
            // Parse line backwards if looking for opening bracket
            if (direction < 0) lastChar = lineText.length - ii - 1;
            else lastChar = ii;
            // Add or remove brackets to open/close
            let char = lineText[lastChar],
                lineTill = lineText.slice(0, lastChar),
                isA = char === aBracket,
                isB = char === bBracket;

            if ((isA || isB) && this.isPunctuationType(knownLanguage, typesFound,
                                            parsedDocBrackets, line, char, lineTill)) {
                if (isA) open++;
                else if (isB) open--;
            }
        }
        if (open === 0) return [line, lastChar]; // Found Complement
        // Not found
        line = line+direction;
        if (line >= lineCount || line < 0) return [-1, -1]; // Out of bounds
        // Keep looking on next line
        lineText = doc.lineAt(line).text;
        return this.parseUntilComplement(open, aBracket, bBracket, line, lineText,
                 direction, doc, lineCount, knownLanguage, typesFound, parsedDocBrackets);
    }

    private isPunctuationType(knownLanguage: string, typesFound: string[],
            parsedDocBrackets: Object, line: number, bracket: string, lineTill: string) {
        if ((!knownLanguage) || ((!typesFound.indexOf(bracket))
                        && (!typesFound.indexOf(this.bracketsDict.pairs[bracket])))) {
            // Decorate all if language is not known or no bracket at all of that pair
            // is found to be of the punctuation type
            return true;
        }

        const nBracketInLine = (text, bracket) => text.split(bracket).length - 1;
        if (parsedDocBrackets.hasOwnProperty(line)
                            && parsedDocBrackets[line].hasOwnProperty(bracket)) {
            const char = nBracketInLine(lineTill, bracket);
            return parsedDocBrackets[line][bracket][char] === 'punctuation';
        } else return true; // Didn't find it in the parsed obj; swallow error and return true anyways
    }

    private parseDocBrackets(doc): any[] {
        const emptyAns = ['', {}, []],
            language = doc.languageId;
        if ((!this.parse) || (!this.languages.indexOf(language))) return emptyAns;

        const getContent = (lines, typesFound, tokenized, currentLine, currentLineAt) => {
            tokenized.forEach(token => {
                if (typeof token === 'string') {
                    let splits = token.split('\n');
                    currentLine = currentLine + splits.length-1;
                    currentLineAt = splits.slice(-1)[0].length;
                }
                else if (typeof token.content === 'string') {
                    const currentContent = token.content,
                        matches = currentContent.match(this.regexp);
                    if (matches) matches.forEach(bracket => {
                        if (!lines.hasOwnProperty(currentLine)) lines[currentLine] = {};
                        if (!lines[currentLine].hasOwnProperty(bracket)) lines[currentLine][bracket] = [];
                        lines[currentLine][bracket].push(token.type);
                        typesFound[bracket] = true;
                    });
                } else if (Array.isArray(token.content)){
                    [lines,
                    typesFound,
                    currentLine,
                    currentLineAt,
                    currentLineAt] = getContent(lines, typesFound, token.content,
                                                            currentLine, currentLineAt);
                }
            });
            return [lines, typesFound, currentLine, currentLineAt, currentLineAt];
        }

        // Known language, parse with Prism
        const fullText = doc.getText();
        let tokenized;
        try {
            tokenized = Prism.tokenize(fullText, Prism.languages[language]);
        } catch(err) {
            return emptyAns;
        }
        if (!tokenized) return emptyAns;

        const ansGetContent = getContent({}, {}, tokenized, 0, 0),
            lines = ansGetContent[0],
            typesFound = Object.keys(ansGetContent[1]);
        return [language, lines, typesFound];
    }

    dispose() {
    }
}
