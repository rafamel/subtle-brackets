'use strict';
import * as vscode from 'vscode';
import matchAll, { matchAdjacent } from './matches';
import options from '../options';
import config from '../config';
import { IAdjacentMatches, IMatch, IBracket, IPositionMatch } from '../types';

let store: {
  editor?: vscode.TextEditor;
  doc?: vscode.TextDocument;
  decoration?: any;
} = {};

function start() {
  // Clear previous decorations
  clear();

  // Get the current text editor
  store.editor = vscode.window.activeTextEditor;
  if (!store.editor) return;

  // Stop if there's an active selection range
  const selection = store.editor.selection;
  const range = new vscode.Range(selection.start, selection.end);
  if (!range.isEmpty) return;

  // Get position of cursor-adjacent bracket and forwards-backwards matches
  store.doc = store.editor.document;
  const position = {
    line: selection.start.line,
    char: selection.start.character
  };
  const adjacentMatches = matchAdjacent(
    store.doc.lineAt(position.line).text,
    options.get().regexp,
    position.char
  );
  // Stop if there's no adjacent bracket
  if (!adjacentMatches) return;

  // Get starting and ending bracket positions. Stop if there's not an end.
  const positions = traverse(position.line, adjacentMatches);

  decorate(positions);
}

function traverse(
  line: number,
  adjacentMatches: IAdjacentMatches
): IPositionMatch {
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
  const state: IPositionMatch = {
    start: {
      ...adjacentMatches.adjacent,
      line
    }
  };

  if (!store.doc) throw Error('traverse() was called before populating store');
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
      (forwards && line >= store.doc.lineCount - 1)
    ) {
      break pageWhile;
    }

    line = forwards ? line + 1 : line - 1;
    nextMatches = matchAll(store.doc.lineAt(line).text, regexp);
    // Reverse next matches order from last to first when going backwards
    if (!forwards) nextMatches.reverse();
  }

  return state;
}

function decorate(pos: IPositionMatch): void {
  if (!pos.end) return;
  if (!store.editor)
    throw Error('decorate() was called before populating store');

  // Set decoration
  const { brackets, decorations } = options.get();
  store.decoration =
    decorations[brackets[pos.start.str].pair] || decorations.global;

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

  store.editor.setDecorations(store.decoration, [ranges.start, ranges.end]);
}

function clear() {
  if (store.editor && store.decoration) {
    store.editor.setDecorations(store.decoration, []);
    store = {};
  }
}

export default {
  start,
  clear
};
