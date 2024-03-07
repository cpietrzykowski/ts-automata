import {Scene2D} from '../scene';
import {SceneSize} from '../scene/scene';
import {Stage} from '../stage';
import {evolveWorld} from './conway_world';

export interface AutomataSceneConfig {
  cellSize: number;
  cellPadding: number;
  highlightColor: string;
}

interface RendererOptions {
  growthPeriod: number;
  decayPeriod: number;
}

const RendererOptionsDefaults: RendererOptions = {
  decayPeriod: 1000,
  growthPeriod: 500,
};

class AutomataWorldRenderer {
  public options: RendererOptions;

  public constructor(options: Partial<RendererOptions> = {}) {
    this.options = Object.assign(RendererOptionsDefaults, options);
  }

  protected debugCellValue(
    context: CanvasRenderingContext2D,
    val: string,
    atX: number,
    atY: number,
  ) {
    context.save();
    context.font = '12px monospace';
    context.fillStyle = 'black';
    context.textAlign = 'start';
    context.textBaseline = 'top';
    context.fillText(`${val}`, atX + 4, atY + 4);
    context.restore();
  }

  public renderCell(
    context: CanvasRenderingContext2D,
    x: number,
    y: number,
    cell: AutomataCell,
    livingNeighbours: number,
    config: AutomataSceneConfig,
  ) {
    const deadCellColor = 'rgb(100 100 100 / 1.0)';

    context.font = '18px monospace';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillStyle = 'black';
    context.strokeStyle = 'white';
    context.lineWidth = 2;

    const xpos = x * config.cellSize;
    const ypos = y * config.cellSize;
    const cellWidth = config.cellSize - 2 * config.cellPadding;
    const cellHeight = config.cellSize - 2 * config.cellPadding;
    context.fillStyle = deadCellColor;
    context.fillRect(xpos, ypos, cellWidth, cellHeight);

    if (cell.state === 'alive') {
      const cellColor = `rgb(0 255 0 / 1.0)`;
      context.fillStyle = cellColor;
      context.fillRect(xpos, ypos, cellWidth, cellHeight);
    } else {
      context.fillStyle = deadCellColor;
      context.fillRect(xpos, ypos, cellWidth, cellHeight);
    }
    this.debugCellValue(context, `${livingNeighbours}`, xpos, ypos);
  }

  public highlightCell(
    context: CanvasRenderingContext2D,
    atCol: number,
    atRow: number,
    config: AutomataSceneConfig,
  ) {
    const {cellSize: sz, cellPadding: padding, highlightColor} = config;
    context.strokeStyle = highlightColor;
    context.lineWidth = 5;
    context.strokeRect(
      atCol * sz - 2.0 * padding,
      atRow * sz - 2.0 * padding,
      sz + 4.0 * padding,
      sz + 4.0 * padding,
    );
  }

  public render(
    context: CanvasRenderingContext2D,
    world: AutomataWorld,
    config: AutomataSceneConfig,
  ) {
    for (let y = 0; y < world.height(); ++y) {
      for (let x = 0; x < world.width(); ++x) {
        const cur = world.getCell(x, y);
        if (cur === undefined) {
          continue;
        }

        let livingNeighbours = world
          .getNeighboursFor(x, y)
          .filter((val) => val.state === 'alive').length;
        this.renderCell(context, x, y, cur, livingNeighbours, config);
      }
    }
  }
}

export interface SceneBounds {
  left: number;
  top: number;
  width: number;
  height: number;
}

type AutomataCellState = 'alive' | 'dead';
class AutomataCell {
  constructor(
    public generation: number,
    public state: AutomataCellState,
  ) {}
}

class AutomataWorld {
  protected _generation = 0;
  protected _state: Array<AutomataCell> = [];
  protected _width: number = 0;
  protected _height: number = 0;

  public generation() {
    return this._generation;
  }

  public width() {
    return this._width;
  }

  public height() {
    return this._height;
  }

  public setSize(width: number, height: number) {
    this._width = width;
    this._height = height;
  }

  public getCell(x: number, y: number) {
    if (x < 0 || x >= this._width || y < 0 || y >= this._height) {
      return undefined;
    }

    return this._state[y * this._width + x];
  }

  public toggleCellAt(x: number, y: number) {
    const cell = this.getCell(x, y);
    if (cell === undefined) {
      return;
    }

    if (cell.state == 'alive') {
      cell.state = 'dead';
    } else {
      cell.state = 'alive';
    }
  }

  public getNeighboursFor(x: number, y: number) {
    return [
      [x - 1, y - 1],
      [x, y - 1],
      [x + 1, y - 1],
      [x - 1, y],
      [x + 1, y],
      [x - 1, y + 1],
      [x, y + 1],
      [x + 1, y + 1],
    ]
      .map((val) => this.getCell(val[0], val[1]))
      .filter((val): val is AutomataCell => val !== undefined);
  }

  public evolve(): void {
    const newState: Array<AutomataCell> = [];
    for (let y = 0; y < this._height; ++y) {
      for (let x = 0; x < this._width; ++x) {
        let livingNeighbours = this.getNeighboursFor(x, y).filter(
          (val) => val.state === 'alive',
        ).length;

        const cur = this.getCell(x, y);
        if (cur === undefined) {
          continue;
        }

        const nextCell = new AutomataCell(cur.generation, cur.state);

        if (cur.state === 'alive') {
          if (livingNeighbours < 2 || livingNeighbours > 3) {
            nextCell.generation = this._generation;
            nextCell.state = 'dead';
          }
        } else {
          if (livingNeighbours === 3) {
            nextCell.generation = this._generation;
            nextCell.state = 'alive';
          }
        }

        newState.push(nextCell);
      }
    }

    this._generation += 1;
    this._state = newState;
  }

  public clear() {
    // clear world
    for (let y = 0; y < this._height; ++y) {
      for (let x = 0; x < this._width; ++x) {
        this._state[y * this._width + x] = new AutomataCell(
          this._generation,
          'dead',
        );
      }
    }
  }

  public random() {
    this.clear();
    for (let y = 0; y < this._height; ++y) {
      for (let x = 0; x < this._width; ++x) {
        if (Math.random() > 0.75) {
          this._state[y * this._width + x].state = 'alive';
        } else {
          this._state[y * this._width + x].state = 'dead';
        }
      }
    }
  }

  public glider() {
    const glider = [
      [false, false, true, false],
      [true, false, true, false],
      [false, true, true, false],
      [false, false, false, false],
    ];

    const atX = 2;
    const atY = 2;

    for (let y = 0; y < glider.length; ++y) {
      for (let x = 0; x < glider[y].length; ++x) {
        this._state[(atY + y) * this._width + (atX + x)].state =
          glider[y][x] === true ? 'alive' : 'dead';
      }
    }
  }
}

export class AutomataScene extends Scene2D {
  private _t = 0;
  private _last_t = 0;

  private _renderer = new AutomataWorldRenderer();
  private _last_cursor_position = [0.0, 0.0];
  private _bounds: SceneBounds = {left: 0, top: 0, width: 0, height: 0};

  private _world = new AutomataWorld();

  constructor(
    public readonly config: AutomataSceneConfig = {
      cellSize: 32,
      cellPadding: 0.2,
      highlightColor: 'yellow',
    },
  ) {
    super();
  }

  protected getCursorPosition() {
    const x = this._last_cursor_position[0];
    const y = this._last_cursor_position[1];

    const {left, top, width, height} = this._bounds;

    return [
      Math.round(((x - left) / width) * this.size.width),
      Math.round(((y - top) / height) * this.size.height),
    ];
  }

  public setSize(canvas: HTMLCanvasElement, size: SceneSize): void {
    super.setSize(canvas, size);
    const r = canvas.getBoundingClientRect();
    this._bounds = {
      left: r.left,
      top: r.top,
      width: r.width,
      height: r.height,
    };

    const {cellSize} = this.config;
    this._world.setSize(
      Math.ceil(size.width / cellSize),
      Math.ceil(size.height / cellSize),
    );
    this._world.clear();
  }

  protected getCellAt(x: number, y: number) {
    return [
      Math.floor(x / this.config.cellSize),
      Math.floor(y / this.config.cellSize),
    ];
  }

  public draw(elapsed: number): void {
    this._t += elapsed;
    const rect = this.size;
    const {context} = this;
    context.clearRect(0, 0, rect.width, rect.height);

    if (this._t - this._last_t > 100) {
      this._last_t = this._t;
      this._world.evolve();
    }

    this._renderer.render(context, this._world, this.config);

    const [cursorX, cursorY] = this.getCursorPosition();
    const cellAtCursor = this.getCellAt(cursorX, cursorY);
    this._renderer.highlightCell(
      context,
      cellAtCursor[0],
      cellAtCursor[1],
      this.config,
    );
  }

  protected onMouseMove(canvas: HTMLCanvasElement, event: MouseEvent): void {
    this._last_cursor_position = [event.clientX, event.clientY];
  }

  protected onMouseClick(canvas: HTMLCanvasElement, event: MouseEvent): void {
    const [cursorX, cursorY] = this.getCursorPosition();
    const cellAtCursor = this.getCellAt(cursorX, cursorY);
    this._world.toggleCellAt(cellAtCursor[0], cellAtCursor[1]);
  }

  public setup(stage: Stage): void {
    super.setup(stage);
    const canvas = stage.canvas;

    // turn off context menu events
    canvas.addEventListener('contextmenu', (event) => event.preventDefault());

    stage.doc.addEventListener('mousemove', (event) => {
      this.onMouseMove(stage.canvas, event as MouseEvent);
    });

    stage.canvas.addEventListener('click', (event) =>
      this.onMouseClick(stage.canvas, event as MouseEvent),
    );

    const sceneControls = stage.doc.createElement('div');
    stage.sceneDock?.appendChild(sceneControls);
    const stepButton = stage.doc.createElement('button');
    stepButton.innerText = 'Step';
    stepButton.addEventListener('click', () => {
      stage.stop();
      this._world.random();
      stage.redraw();
    });
    sceneControls.appendChild(stepButton);

    this._world.random();
  }
}
