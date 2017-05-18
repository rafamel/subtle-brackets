'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
// import * as vscode from 'vscode';
import { workspace, window, commands, Disposable, ExtensionContext, TextDocument, Range, Position, TextEditorDecorationType } from 'vscode';

// This method is called when your extension is activated. Activation is
// controlled by the activation events defined in package.json.
export function activate(context: ExtensionContext) {
    // Use the console to output diagnostic information (console.log) and errors (console.error).
    // This line of code will only be executed once when your extension is activated.
    console.log('Subtle Brackets is now active!');
    
    let bracketParser = new BracketParser();
    let controller = new BracketParserController(bracketParser);

    // Add to a list of disposables which are disposed when this extension is deactivated.
    context.subscriptions.push(controller);
    context.subscriptions.push(bracketParser);

}

class BracketParser {

    private bracketsDict: {'all': string[], 'open': string[], 'close': string[], 'pairs': {}};
    private decoration: TextEditorDecorationType;
    private past: boolean;

    constructor() {

        let config = workspace.getConfiguration('subtleBrackets');
        this.decoration = window.createTextEditorDecorationType(config.style);
        this.past = false;
        this.bracketsDict = {'all': [], 'open': [], 'close': [], 'pairs': {}};

        config.bracketPairs.forEach(x => {
            if (x.length === 2) { // Safety Check
                let split = x.split('');
                this.bracketsDict['all'].push(split[0], split[1]);
                this.bracketsDict['open'].push(split[0]);
                this.bracketsDict['close'].push(split[1]);
                this.bracketsDict['pairs'][split[0]] = split[1];
                this.bracketsDict['pairs'][split[1]] = split[0];
            }
        });
    }

    public findBrackets() {

        // Get the current text editor
        let editor = window.activeTextEditor;
        if (!editor) {
            return;
        }

        // Clean past styles
        if (this.past) editor.setDecorations(this.decoration, []);

        let doc = editor.document,
            selection = window.activeTextEditor.selection,
            range = new Range(selection.start, selection.end);

        if (range.isEmpty) {
            // There's no selection, only the cursor on a position

            let line = selection.start.line,
                startChar = selection.start.character,
                prevChar = Math.max(0,startChar-1),
                postChar = startChar+1,
                lineText = doc.lineAt(line).text;

            // These are the left and right characters to the cursor
            let left = lineText.slice(prevChar, startChar),
                right = lineText.slice(startChar, postChar);

            // Let's see if any of `left` and `right` are brackets
            // Prioritizing `right`
            let aBracket: string,
                startPosChar: number,
                endPosChar: number;
            if (this.bracketsDict.all.indexOf(right) !== -1) {
                aBracket = right;
                startPosChar = startChar;
                endPosChar = postChar;
            } else if (this.bracketsDict.all.indexOf(left) !== -1) {
                aBracket = left;
                startPosChar = prevChar;
                endPosChar = startChar;
            } else {
                // If no bracket found to left or right, return
                return;
            }

            // Range of the selected bracket
            let aBracketRange = new Range(new Position(line, startPosChar), new Position(line, endPosChar));

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
                [bLine, bChar] = this.parseUntilComplement(1, aBracket, bBracket, line, lineRest, parseDirection, doc, doc.lineCount);

            // Verify the parsing was successful
            if (bLine >= 0) {
                // If it's closing at the same line, correct `bChar`
                if (line === bLine && parseDirection > 0) bChar += endPosChar;

                // Now we have `aBracketRange` and `bBracketRange`
                let bBracketRange = new Range(new Position(bLine, bChar), new Position(bLine, bChar+1));

                this.past = true;
                editor.setDecorations(this.decoration, [bBracketRange, aBracketRange]);
            }
        }

    }

    private parseUntilComplement(open: number, aBracket: string, bBracket: string, line: number, lineText: string, direction: number, doc: TextDocument, lineCount: number): number[] {
        let lastChar: number;

        for (let ii = 0; ii < lineText.length; ii++) {
            if (open === 0) break;
            // Parse line backwards if looking for opening bracket
            if (direction < 0) lastChar = lineText.length - ii - 1;
            else lastChar = ii;
            // Add or remove brackets to open/close
            let char = lineText[lastChar];

            if (char === aBracket) open++
            else if (char === bBracket) open--;
        }
        if (open === 0) return [line, lastChar]; // Found Complement
        // Not found
        line = line+direction;
        if (line >= lineCount || line < 0) return [-1, -1]; // Out of bounds
        // Keep looking on next line
        lineText = doc.lineAt(line).text;
        return this.parseUntilComplement(open, aBracket, bBracket, line, lineText, direction, doc, lineCount);
    }

    dispose() {
    }
}

class BracketParserController {

    private _bracketParser: BracketParser;
    private _disposable: Disposable;

    constructor(bracketParser: BracketParser) {
        this._bracketParser = bracketParser;
        this._bracketParser.findBrackets();

        // Subscribe to selection change and editor activation events
        let subscriptions: Disposable[] = [];
        window.onDidChangeTextEditorSelection(this._onEvent, this, subscriptions);
        window.onDidChangeActiveTextEditor(this._onEvent, this, subscriptions);

        // Update
        this._bracketParser.findBrackets();

        // Create a combined disposable from both event subscriptions
        this._disposable = Disposable.from(...subscriptions);
    }

    dispose() {
        this._disposable.dispose();
    }

    private _onEvent() {
        this._bracketParser.findBrackets();
    }
}
