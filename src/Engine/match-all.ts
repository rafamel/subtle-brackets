import { IMatch } from '../types';

// Returns all matches for a regular expression on a string
// - startAt: inclusive
// - endAt: non-inclusive
export default function matchAll(
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
