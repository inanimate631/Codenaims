export interface MasterWords {
  blueWords: number[];
  redWords: number[];
  blackWords: number;
}

export interface Timer {
  time: string;
  teamColor: string;
}

export interface colorOnCart {
  color: string;
  id: number;
  user: number;
}

export interface WordsShowed extends MasterWords {
  whiteWords: number[];
}
