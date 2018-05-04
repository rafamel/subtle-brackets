export interface IBracket {
  opposite: string;
  pair: string;
  type: 'open' | 'close';
}

export interface IBrackets {
  [key: string]: IBracket;
}

export interface IOptions {
  brackets: IBrackets;
  regexp: RegExp;
  styles: {
    [key: string]: object;
  };
}

export interface IMatch {
  str: string;
  index: number;
}

export interface IAdjacentMatches {
  adjacent: IMatch;
  forwards: boolean;
  matches: IMatch[];
}

export interface ITraversed {
  start: {
    str: string;
    index: number;
    line: number;
  };
  end?: {
    str: string;
    index: number;
    line: number;
  };
}
