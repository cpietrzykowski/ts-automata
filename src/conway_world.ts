import { CellAddress } from "./world";

export type Dimension2D = {
  width: number;
  height: number;
};

export interface SimpleConwayWorld {
  width: number;
  height: number;
  cells: boolean[];
}

/**
 * reference game of life cell evolution impl
 */
export function evolveCell(
  isAlive: boolean,
  livingNeighbours: number
): boolean {
  // Any live cell with fewer than two live neighbours dies, as if by underpopulation.
  // Any live cell with two or three live neighbours lives on to the next generation.
  // Any live cell with more than three live neighbours dies, as if by overpopulation.
  // Any dead cell with exactly three live neighbours becomes a live cell, as if by reproduction.
  if (isAlive === true) {
    return !(livingNeighbours < 2 || livingNeighbours > 3);
  }

  return livingNeighbours === 3;
}

/**
 * returns a list of cell neighbor addresses
 * @param x
 * @param y
 * @param w world width
 * @param h world height
 * @param d neighbour distance
 * @returns list of number tuples
 */
export function cellNeighbors(
  x: number,
  y: number,
  w: number,
  h: number,
  d = 1
) {
  const n: [number, number][] = [];
  const min_offsety = -Math.min(y, d);
  const max_offsety = Math.min(h - y - 1, d);
  const min_offsetx = -Math.min(x, d);
  const max_offsetx = Math.min(w - x - 1, d);
  for (let dy = min_offsety; dy < max_offsety + 1; ++dy) {
    for (let dx = min_offsetx; dx < max_offsetx + 1; ++dx) {
      if (dy === 0 && dx === 0) {
        continue;
      }

      n.push([x + dx, y + dy]);
    }
  }

  return n;
}

export function evolveWorld(state: boolean[], size: Dimension2D) {
  console.assert(
    state.length === size.height * size.width,
    `world size invalid (got ${size.width * size.height} expected ${
      state.length
    })`
  );

  const next: boolean[] = [];
  for (let y = 0; y < size.height; ++y) {
    for (let x = 0; x < size.width; ++x) {
      const livingNeighbours = cellNeighbors(x, y, size.width, size.height)
        .map(function (n) {
          return state[n[1] * size.width + n[0]];
        })
        .filter(function (alive) {
          return alive === true;
        }).length;

      next.push(evolveCell(state[y * size.width + x], livingNeighbours));
    }
  }

  return next;
}

export interface IConwaysWorld<StateType = boolean> {
  // document testable api

  setSize(size: Dimension2D): void;
  setCell(address: CellAddress, state: StateType): void;
  neighbors(address: CellAddress): Iterable<StateType>;
  state(): Array<Array<StateType>>;
}

export interface IConwaysWorldRenderer {
  render(elapsed: number): void;
}

/**
 * "reference" implementation
 * - world is implemented as a matrix of booleans
 */
export class ConwaysWorld implements IConwaysWorld {
  protected _cells: boolean[][] = [];

  setSize(size: Dimension2D): void {
    for (let y = 0; y < size.height; ++y) {
      if (y > this._cells.length - 1) {
        this._cells.push(new Array(size.width).fill(false));
        continue;
      }

      const row = this._cells[y];
      if (row.length - 1 > size.width) {
        this._cells[y] = row.slice(0, size.width);
        continue;
      }

      for (let x = row.length - 1; x < size.width; ++x) {
        row.push(false);
      }
    }
  }

  state(): boolean[][] {
    return this._cells;
  }

  public neighbors(cell: CellAddress) {
    return [
      { x: cell.x - 1, y: cell.y - 1 },
      { x: cell.x, y: cell.y - 1 },
      { x: cell.x + 1, y: cell.y - 1 },
      { x: cell.x - 1, y: cell.y },
      { x: cell.x + 1, y: cell.y },
      { x: cell.x - 1, y: cell.y + 1 },
      { x: cell.x, y: cell.y + 1 },
      { x: cell.x + 1, y: cell.y + 1 },
    ]
      .map((a) => this.cellAt(a))
      .filter((c): c is boolean => c !== undefined);
  }

  public evolve() {
    function next(
      world: ConwaysWorld["_cells"],
      neighborProvider: ConwaysWorld["neighbors"]
    ) {
      const nextState: typeof world = [];

      for (let y = 0; y < world.length; ++y) {
        nextState.push([]);
        for (let x = 0; x < world[y].length; ++x) {
          nextState[y].push();
          const livingNeighbors = neighborProvider({ x, y }).filter(function (
            c
          ) {
            return c;
          });

          let cur = world[y][x];
          if (cur) {
            if (livingNeighbors.length < 2 || livingNeighbors.length > 3) {
              cur = false;
            }
          } else {
            if (livingNeighbors.length === 3) {
              cur = true;
            }
          }
          nextState[y][x] = cur;
        }
      }

      return nextState;
    }

    this._cells = next(this.state(), this.neighbors.bind(this));
  }

  public cellAt(address: CellAddress) {
    const rows = this._cells;
    if (address.y >= 0 && address.y < rows.length) {
      if (address.x >= 0 && address.x < rows[address.y].length) {
        return rows[address.y][address.x];
      }
    }

    return undefined;
  }

  public setCell(address: CellAddress, alive: boolean) {
    this._cells[address.y][address.x] = alive;
  }

  // public static fromPattern(
  //   pattern: ConwaysWorld["_cells"],
  //   size?: Dimension2D
  // ): IConwaysWorld {
  //   const w = new ConwaysWorld();
  //   w.setSize(
  //     size ?? {
  //       width: pattern.length,
  //       height: pattern[0].length,
  //     }
  //   );

  //   for (let y = 0; y < pattern.length; ++y) {
  //     for (let x = 0; x < pattern[y].length; ++x) {
  //       w.setCell({ x, y }, pattern[y][x]);
  //     }
  //   }

  //   return w;
  // }

  public static fromPattern(pattern: ConwaysWorld["_cells"]) {
    const world: boolean[] = [];
    for (let y = 0; y < pattern.length; ++y) {
      for (let x = 0; x < pattern[y].length; ++x) {
        world.push(pattern[y][x]);
      }
    }

    return world;
  }
}

export class ConwaysWrappedWorld extends ConwaysWorld {
  /**
   * will accept negative addresses and "wrap" the access
   */
  public cellAt(address: CellAddress) {
    const rows = this._cells;
    const rows_length = rows.length;
    const y = (rows_length + address.y) % rows_length;
    const x = (rows[y].length + address.x) % rows[y].length;
    return rows[y][x];
  }
}
