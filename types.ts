export interface SentencePart {
  id: string;
  text: string;
  pinyin: string;
  order: number; // The correct index in the sentence
}

export interface GameLevel {
  id: string;
  fullSentence: string;
  translation: string;
  parts: SentencePart[];
  grammarPoint: string;
}

export enum GameState {
  INIT = 'INIT',
  LOBBY = 'LOBBY',
  LOADING_LEVEL = 'LOADING_LEVEL',
  PLAYING = 'PLAYING',
  LEVEL_COMPLETE = 'LEVEL_COMPLETE',
  GAME_OVER = 'GAME_OVER',
}

export interface MotionZone {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  callback: () => void;
  lastTriggered: number;
}
