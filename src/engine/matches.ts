'use strict';
import { IMatch, IAdjacentMatches } from '../types';
import options from '../options';

// Returns all matches for a regular expression on a string
// - startAt: inclusive
// - endAt: non-inclusive
function matchAll(
  str: string,
  regex: RegExp,
  startAt?: number | false,
  endAt?: number | false
): IMatch[] {
  // Restart regex exec
  regex.lastIndex = 0;

  let current;
  const next = () => (current = regex.exec(str));
  next();

  const all: IMatch[] = [];
  while (current) {
    const index = current.index;

    // Return for endAt; find next for startAt
    if ((endAt || endAt === 0) && index >= endAt) return all;
    if ((startAt || startAt === 0) && index < startAt) {
      next();
      continue;
    }

    all.push({ str: current[0], index });
    next();
  }
  return all;
}

// Gets the adjacent bracket to the index, if it exists.
// Prioritizes the right hand adjacent
function matchAdjacent(
  str: string,
  regex: RegExp,
  index: number
): IAdjacentMatches | void {
  const { brackets } = options.get();
  const getForwards = (bracket: string) => brackets[bracket].type === 'open';

  // Try right side first
  const right = matchAll(str, regex, index);
  if (right.length && right[0].index === index) {
    // We've got a right hand match!
    const forwards = getForwards(right[0].str);
    return {
      adjacent: right[0],
      forwards,
      matches: forwards
        ? right.slice(1)
        : matchAll(str, regex, 0, index).reverse()
    };
  }

  // Right hand failed, try left hand
  const left = matchAll(str, regex, false, index);
  const last = left.slice(-1)[0];
  if (left.length && last.index === index - last.str.length) {
    // We've got a left hand match!
    const forwards = getForwards(last.str);
    return {
      adjacent: last,
      forwards,
      matches: forwards
        ? matchAll(str, regex, index)
        : left.slice(0, -1).reverse()
    };
  }
}

export { matchAll as default, matchAdjacent };
