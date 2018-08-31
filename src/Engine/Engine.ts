import Paper from './Paper';
import options from '../options';
import config from '../config';
import { IMatch, ILineMatch, IPairMatch } from '../types';
import logger from '../utils/logger';

class Engine {
  private paper: Paper;
  constructor() {
    this.paper = new Paper();
  }
  public run = () => {
    logger.debug('run: Engine.run()');
    // Clear the decorations
    this.paper.undecorate();

    // Stop if there's no adjacent bracket
    const adjacent = this.paper.getAdjacent();

    if (!adjacent) return;

    // Decorate starting and ending bracket positions.
    const pairMatch = this.traverse(adjacent);
    this.paper.decorate(pairMatch);
  };
  public reset = () => {
    logger.debug('begin: Engine.reset()');
    // Clears the decorations and will need to re-parse all matches
    this.paper.undecorate();
    this.paper = new Paper();
    logger.debug('end: Engine.reset()');
  };
  private traverse(entryMatch: ILineMatch): IPairMatch {
    const getForwards = (bracket: string) => brackets[bracket].type === 'open';

    // Prevent inifite loops/issues with large files
    let alive: boolean = true;
    setTimeout(() => {
      alive = false;
    }, config.traverseTimeout);

    // Initalize values
    const { brackets } = options.get();
    const forwards = getForwards(entryMatch.str);

    // Open and close will be reverse when going backwards
    const [OPEN, CLOSE] = forwards ? ['open', 'close'] : ['close', 'open'];

    const stack: IMatch[] = [entryMatch];
    const state: IPairMatch = {
      start: entryMatch
    };

    let line = entryMatch.line;
    let nextMatches: IMatch[] = forwards
      ? this.paper.getMatches(line, entryMatch.index + entryMatch.str.length)
      : this.paper.getMatches(line, false, entryMatch.index).reverse();

    // Using while loop to prevent stack overflows on large file
    pageWhile: while (alive && !state.end) {
      // Each line
      lineFor: for (const match of nextMatches) {
        // Each match
        const bracket = brackets[match.str];
        if (
          !bracket ||
          (bracket.opposite !== entryMatch.str &&
            bracket.str !== entryMatch.str)
        ) {
          continue lineFor;
        }

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
        (forwards && line >= this.paper.lines - 1)
      ) {
        break pageWhile;
      }

      line = forwards ? line + 1 : line - 1;
      nextMatches = this.paper.getMatches(line);
      // Reverse next matches order from last to first when going backwards
      if (!forwards) nextMatches.reverse();
    }

    return state;
  }
}

export default Engine;
