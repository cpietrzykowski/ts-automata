import {Scene2D} from '../scene';
import {SceneSize} from '../scene/scene';
import {Stage} from '../stage';

class AutomataCell {
  public constructor(
    public period: number,
    public createdAt?: number,
  ) {}
}

interface CellInspectorView {
  setCell(col: number, row: number, cell: AutomataCell): void;
}

class NullCellInspectorView implements CellInspectorView {
  setCell(col: number, row: number, cell: AutomataCell): void {}
}

class CellInspectorHTMLView implements CellInspectorView {
  constructor(
    protected addressValue: HTMLInputElement,
    protected createdAtValue: HTMLInputElement,
  ) {}

  public static build(doc: Document, node: HTMLElement) {
    const container = doc.createElement('div');
    node.appendChild(container);

    const addressLabel = doc.createElement('label');
    addressLabel.innerHTML = 'address:';
    container.appendChild(addressLabel);

    const addressValue = doc.createElement('input');
    addressValue.readOnly = true;
    addressLabel.appendChild(addressValue);

    const createdAtLabel = doc.createElement('label');
    createdAtLabel.innerHTML = 'createdAt';
    container.appendChild(createdAtLabel);

    const createdAtValue = doc.createElement('input');
    createdAtValue.readOnly = true;
    createdAtLabel.appendChild(createdAtValue);

    return new CellInspectorHTMLView(addressValue, createdAtValue);
  }

  public setCell(col: number, row: number, cell?: AutomataCell) {
    this.addressValue.value = `${col}, ${row}`;
    this.createdAtValue.value = `${cell?.createdAt}`;
  }
}

class AutomataWorld {
  private _generation = 0;
  public t = 0;
  private _last_generation = 0;

  get generation(): number {
    return this._generation;
  }

  private _width = 0;
  get width(): number {
    return this._width;
  }

  private _height = 0;
  get height(): number {
    return this._height;
  }

  private _cells: AutomataCell[] = [];

  constructor(public readonly config: {generationDuration: number}) {}

  public setSize(w: number, h: number) {
    this._width = w;
    this._height = h;
  }

  public populate() {
    const w = this._width;
    const h = this._height;

    this.t = 0;

    this._cells = [];
    for (let x = 0; x < w * h; ++x) {
      const alive = Math.random();
      let createdAt =
        2.0 * (0.5 - Math.random()) * this.config.generationDuration;

      // const alive = this.t + Math.random();
      this._cells[x] = new AutomataCell(
        Math.random(),
        alive > 0.5 ? this.t + createdAt : undefined,
      );
    }
  }

  public evolve() {
    this._generation += 1;
    for (let i = 0; i < this._cells.length; ++i) {
      const c = this._cells[i];
      const createdAt = c.createdAt;
      if (createdAt === undefined) {
        if (Math.random() > 0.5) {
          c.createdAt = this.t + Math.random() * this.config.generationDuration;
        }
        continue;
      }

      if (this.t - createdAt > this.config.generationDuration) {
        c.createdAt = undefined;
      }
    }
  }

  public update(elapsed: number) {
    this.t += elapsed;

    if (this.t - this._last_generation > this.config.generationDuration) {
      this.evolve();
      this._last_generation = this.t;
    }
  }

  public getCell(x: number, y: number) {
    return this._cells[y * this.width + x];
  }

  public createAtCell(x: number, y: number) {
    const cell = this._cells[y * this.width + x];
    cell.createdAt = this.t;
  }
}

export interface AutomataSceneConfig {
  cellSize: number;
  cellPadding: number;
  highlightColor: string;
}

class AutomataWorldRenderer {
  protected debugCellAddress(
    context: CanvasRenderingContext2D,
    col: number,
    row: number,
    atX: number,
    atY: number,
  ) {
    context.font = '12px monospace';
    context.fillStyle = 'black';
    context.textAlign = 'start';
    context.textBaseline = 'top';
    context.fillText(`${col},${row}`, atX + 4, atY + 4);
  }

  protected renderCellDebugView(
    context: CanvasRenderingContext2D,
    c: number,
    atX: number,
    atY: number,
    sz: number,
  ) {
    const formattedC = c.toFixed(2);
    const midX = sz / 2.0;
    const midY = midX;
    context.strokeText(`${formattedC}`, atX + midX, atY + midY);
    context.fillStyle = 'black';
    context.fillText(`${formattedC}`, atX + midX, atY + midY);

    // context.fillStyle = 'white';
    // context.textAlign = 'start';
    // context.textBaseline = 'bottom';
    // context.font = '8px monospace';
    // context.fillText(`${cellColor}`, atX, atY + sz);
  }

  public renderCell(
    context: CanvasRenderingContext2D,
    cellX: number,
    cellY: number,
    cell: AutomataCell,
    t: number,
    atX: number,
    atY: number,
    config: AutomataSceneConfig,
  ) {
    const deadCellColor = 'rgb(100 100 100)';
    const {cellSize: sz, cellPadding: padding} = config;

    context.font = '18px monospace';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillStyle = 'black';
    context.strokeStyle = 'white';
    context.lineWidth = 2;

    context.fillStyle = deadCellColor;
    context.fillRect(
      atX + padding,
      atY + padding,
      sz - 2 * padding,
      sz - 2 * padding,
    );

    if (cell.createdAt !== undefined) {
      let c = (t - cell.createdAt) / 5000.0;
      if (c > 0.0) {
        c = 1.0 - Math.min(1.0, c);
        const r = (c * (255 - 100) + 100).toFixed(1);
        const g = (c * (255 - 100) + 100).toFixed(1);
        const b = (cell.period * (c * (255 - 100)) + 100).toFixed(1);

        const cellColor = `rgb(${r} ${g} ${b})`;
        context.fillStyle = cellColor;
        context.fillRect(
          atX + padding,
          atY + padding,
          sz - 2 * padding,
          sz - 2 * padding,
        );
      }
      // this.renderCellDebugView(context, c, atX, atY, sz);
    }

    // this.debugCellAddress(context, cellX, cellY, atX, atY);
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
}

export interface SceneBounds {
  left: number;
  top: number;
  width: number;
  height: number;
}

/**
 * - certain animations should be able to animate while the world is paused
 */

export class AutomataScene extends Scene2D {
  // ui
  protected cellInspector: CellInspectorView = new NullCellInspectorView();

  private _world = new AutomataWorld({
    generationDuration: 5000,
  });

  private _renderer = new AutomataWorldRenderer();
  private _last_cursor_position = [0.0, 0.0];
  private _bounds: SceneBounds = {left: 0, top: 0, width: 0, height: 0};

  constructor(
    public readonly config: AutomataSceneConfig = {
      cellSize: 64,
      cellPadding: 0.5,
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
    this._world.populate();
  }

  protected getCellAt(x: number, y: number) {
    const {cellSize} = this.config;
    const col = Math.floor(x / cellSize);
    const row = Math.floor(y / cellSize);
    return [col, row];
  }

  public draw(elapsed: number): void {
    const rect = this.size;
    const {cellSize} = this.config;
    const {context} = this;
    context.clearRect(0, 0, rect.width, rect.height);

    const world = this._world;
    world.update(elapsed);

    for (let y = 0; y < world.height; ++y) {
      for (let x = 0; x < world.width; ++x) {
        this._renderer.renderCell(
          context,
          x,
          y,
          world.getCell(x, y),
          world.t,
          x * cellSize,
          y * cellSize,
          this.config,
        );
      }
    }

    const [cursorX, cursorY] = this.getCursorPosition();
    // context.strokeStyle = "red";
    // context.beginPath();
    // context.arc(cursorX, cursorY, 20, 0, 2 * Math.PI);
    // context.closePath();
    // context.lineWidth = 3;
    // context.stroke();

    const cellAtCursor = this.getCellAt(cursorX, cursorY);
    this._renderer.highlightCell(
      context,
      cellAtCursor[0],
      cellAtCursor[1],
      this.config,
    );

    this.cellInspector.setCell(
      cellAtCursor[0],
      cellAtCursor[1],
      world.getCell(cellAtCursor[0], cellAtCursor[1]),
    );
  }

  protected onMouseMove(canvas: HTMLCanvasElement, event: MouseEvent): void {
    const {clientX, clientY} = event;
    this._last_cursor_position = [clientX, clientY];
  }

  protected onMouseClick(canvas: HTMLCanvasElement, event: MouseEvent): void {
    const [cursorX, cursorY] = this.getCursorPosition();
    const cellAtCursor = this.getCellAt(cursorX, cursorY);
    this._world.createAtCell(cellAtCursor[0], cellAtCursor[1]);
  }

  public setup(stage: Stage): void {
    super.setup(stage);
    const canvas = stage.canvas;
    stage.doc.addEventListener('mousemove', (event) => {
      this.onMouseMove(stage.canvas, event as MouseEvent);
    });

    // turn off context menu events
    canvas.addEventListener('contextmenu', (event) => event.preventDefault());

    // canvas.addEventListener("mousedown", (event) =>
    //   this.onMouseDown(event as MouseEvent)
    // );

    stage.canvas.addEventListener('click', (event) =>
      this.onMouseClick(stage.canvas, event as MouseEvent),
    );

    const sceneControls = stage.doc.createElement('div');
    stage.sceneDock?.appendChild(sceneControls);
    const stepButton = stage.doc.createElement('button');
    stepButton.innerText = 'Step';
    stepButton.addEventListener('click', () => {
      this._world.evolve();
      stage.redraw();
    });
    sceneControls.appendChild(stepButton);

    // setup cell inspector ui
    this.cellInspector = CellInspectorHTMLView.build(
      stage.doc,
      stage.sceneDock!,
    );
  }
}
