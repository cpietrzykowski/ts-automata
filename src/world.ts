import { Optional } from "./types";

export type CellAddress = {
  readonly x: number;
  readonly y: number;
};

export type CellState = Optional<boolean>;

export interface AutomataCell {
  readonly address: CellAddress;
  readonly state: CellState;
  update(elapsed: number): void;
}

export interface IAutomataWorld {
  evolve(elapsed: number): void;
}

export abstract class AutomataWorld implements IAutomataWorld {
  abstract evolve(elapsed: number): void;
}
