import { IBrackets } from '../types';
import pairs from './pairs';
import Bracket from './Bracket';

let brackets: IBrackets = {};

function setBrackets() {
  brackets = Object.keys(pairs.get()).reduce((acc, id) => {
    const pair = pairs.get()[id];
    acc[pair.open] = new Bracket(id, true);
    acc[pair.close] = new Bracket(id, false);
    return acc;
  }, {});
  return brackets;
}

function getBrackets() {
  return brackets;
}

export default {
  set: setBrackets,
  get: getBrackets
};
