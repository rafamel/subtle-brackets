'use strict';
import * as vscode from 'vscode';
import matchAll, { matchAdjacent } from './matches';
import options from '../options';
import config from '../config';
import { IAdjacentMatches, IMatch, IBracket, ITraversed } from '../types';

const data: any = {
  doc: null
};

function start() {
  // Get the current text editor
  const editor = vscode.window.activeTextEditor;
  if (!editor) return;

  // Clear previous styles
  clear();

  // Stop if there's an active selection range
  const selection = editor.selection;
  const range = new vscode.Range(selection.start, selection.end);
  if (!range.isEmpty) return;

  // Get position of cursor-adjacent bracket and forwards-backwards matches
  data.doc = editor.document;
  const position = {
    line: selection.start.line,
    char: selection.start.character
  };
  const adjacentMatches = matchAdjacent(
    data.doc.lineAt(position.line).text,
    options.get().regexp,
    position.char
  );
  // Stop if there's no adjacent bracket
  if (!adjacentMatches) return;

  traverse(position.line, adjacentMatches);
}

function traverse(line: number, adjacentMatches: IAdjacentMatches): ITraversed {
  // Prevent inifite loops/issues with large files
  let alive: boolean = true;
  setTimeout(() => {
    alive = false;
  }, config.traverseTimeout);

  // Initalize values
  const { brackets, regexp } = options.get();
  const forwards = adjacentMatches.forwards;
  // Open and close will be reverse when going backwards
  const [OPEN, CLOSE] = forwards ? ['open', 'close'] : ['close', 'open'];

  const stack: IMatch[] = [adjacentMatches.adjacent];
  let nextMatches: IMatch[] = adjacentMatches.matches;
  const state: ITraversed = {
    start: {
      ...adjacentMatches.adjacent,
      line
    }
  };

  // Using while loop to prevent stack overflows on large file
  pageWhile: while (alive && !state.end) {
    // Each line
    lineFor: for (const match of nextMatches) {
      // Each match
      const bracket: IBracket = brackets[match.str];
      if (!bracket) continue lineFor;

      if (bracket.type === OPEN) stack.push(match);
      else if (
        bracket.type === CLOSE &&
        stack[stack.length - 1].str === bracket.opposite
      ) {
        stack.pop();
        if (!stack.length) {
          state.end = { ...match, line };
          break lineFor;
        }
      }
    }

    // Get next line ready
    if (
      state.end ||
      (!forwards && line <= 0) ||
      (forwards && line >= data.doc.lineCount - 1)
    ) {
      break pageWhile;
    }

    line = forwards ? line + 1 : line - 1;
    nextMatches = matchAll(data.doc.lineAt(line).text, regexp);
    // Reverse next matches order from last to first when going backwards
    if (!forwards) nextMatches.reverse();
  }
  return state;
}

function clear() {
  // Clears previous decorations
  // @chc
  // if (this.past) {
  //   for (const decorationKey of Object.keys(this.decorations)) {
  //     const decoration = this.decorations[decorationKey];
  //     this.past.setDecorations(decoration, []);
  //   }
  //   this.past = undefined;
  // }
}

export default {
  start,
  clear
};
