import { SceneAnimator, ScenePresenter } from "./canvas_stage";
import { evolveWorld } from "./conway_world";
import { FrameAnimationProvider } from "./dom";
import { Scene, SceneRenderer2D, SceneSize } from "./scene";

// cell alignment options
// - center
// - edge

export interface SimpleConwayOptions {
  cell_size: {
    width: number;
    height: number;
  };

  cell_margin: {
    horizontal: number;
    vertical: number;
  };
}

export interface SimpleConwayWorldAddress {
  x: number;
  y: number;
}

export type AutomataWorldLayoutOptions = {
  cellSize: number;
  worldPadding: number;
};

export class AutomataWorldLayout {
  public static defaults: AutomataWorldLayoutOptions = {
    cellSize: 50.0,
    worldPadding: 10.0,
  };
  protected _options: typeof AutomataWorldLayout.defaults;

  constructor(options?: Partial<AutomataWorldLayoutOptions>) {
    this._options = { ...AutomataWorldLayout.defaults, ...options };
  }

  public visibleWorldFromCanvas(width: number, height: number) {
    return {
      columns: 0,
      rows: 0,
    };
  }

  public cellSize() {
    return this._options.cellSize;
  }

  public worldPadding() {
    return this._options.worldPadding;
  }

  public getOffsets() {
    return [0.0, 0.0];
  }
}

export class AutomataWorldRenderer<CellStateType> {
  constructor(public readonly layout: AutomataWorldLayout) {}

  protected displayWidth = 0;
  protected displayHeight = 0;

  protected _visibleSize = {
    x: 0,
    y: 0,
  };
  protected _offsets = {
    col: 0,
    row: 0,
  };

  public setDisplaySize(width: number, height: number) {
    this.displayWidth = width;
    this.displayHeight = height;

    const cellSize = this.layout.cellSize();
    const worldPadding = this.layout.worldPadding() * 2.0;
    const xcount = Math.floor((width - worldPadding) / cellSize);
    const ycount = Math.floor((height - worldPadding) / cellSize);
    this._visibleSize = {
      x: xcount,
      y: ycount,
    };

    this._offsets = {
      col: (width - xcount * cellSize) * 0.5 - cellSize,
      row: (height - ycount * cellSize) * 0.5 - cellSize,
    };
  }

  public visibleSize() {
    return this._visibleSize;
  }

  public worldSize() {
    return {
      cols: this._visibleSize.x + 2,
      rows: this._visibleSize.y + 2,
    };
  }

  public draw(
    context: CanvasRenderingContext2D,
    state: CellStateType[],
    cursorPosition: { x: number; y: number }
  ) {
    const cellSize = this.layout.cellSize();
    const { cols, rows } = this.worldSize();
    const { col: colOffset, row: rowOffset } = this._offsets;

    for (let row = 0; row < rows; ++row) {
      const y = rowOffset + row * cellSize;
      for (let col = 0; col < cols; ++col) {
        const x = colOffset + col * cellSize;
        context.strokeStyle = "black";
        context.strokeRect(x, y, cellSize, cellSize);

        context.save();
        if (state[row * cols + col] === true) {
          context.fillStyle = "blue";
          context.fillRect(x, y, cellSize, cellSize);
        }
        context.restore();

        context.font = "6px monospace";
        context.fillText(`${col}, ${row}`, x + 4.0, y + cellSize - 4.0);
      }
    }

    // render cell under cursor
    const cellAtCursor = this.getCellAt(cursorPosition.x, cursorPosition.y);

    context.save();
    context.strokeStyle = "yellow";
    context.lineWidth = 8;
    context.strokeRect(
      colOffset + cellAtCursor[0] * cellSize,
      rowOffset + cellAtCursor[1] * cellSize,
      cellSize,
      cellSize
    );
    context.restore();
  }

  getCellAt(x: number, y: number) {
    const cellSize = this.layout.cellSize();
    const { col: colOffset, row: rowOffset } = this._offsets;
    return [
      Math.floor((x - colOffset) / cellSize),
      Math.floor((y - rowOffset) / cellSize),
    ];
  }
}

function sceneAnimator(
  context: CanvasRenderingContext2D,
  renderer: SceneRenderer2D,
  provider: FrameAnimationProvider,
  maxUpdateInterval = 50
): SceneAnimator {
  let _needs_update = true;
  let _last_ts = 0;
  let _last_request_id = 0;

  function _frame(ts: DOMHighResTimeStamp) {
    if (_needs_update || ts - _last_ts > maxUpdateInterval) {
      renderer.draw(context, ts - _last_ts);
      _last_ts = ts;
      _needs_update = false;
    }

    _last_request_id = provider.requestAnimationFrame(_frame);
  }

  return {
    setNeedsUpdate() {
      _needs_update = true;
    },
    redraw() {
      renderer.draw(context, 0);
    },
    play() {
      _frame(0);
    },
    cancel() {
      _last_ts = 0;
      _needs_update = false;
      provider.cancelAnimationFrame(_last_request_id);
      _last_request_id = 0;
    },
  };
}

export class AutomataWorldScene extends Scene implements SceneRenderer2D {
  private _bounds = new DOMRect(0, 0, 0, 0);
  private _cursor_position = [0.0, 0.0];
  private _world: boolean[] = [];
  private _world_renderer = new AutomataWorldRenderer(
    new AutomataWorldLayout()
  );

  constructor() {
    super();
  }

  protected wasPresented(presenter: ScenePresenter): void {
    const ctx = Scene.GetCanvasContext2D(presenter.canvas);
    const animator = sceneAnimator(ctx, this, presenter.doc);
    animator.play();

    presenter.canvas.addEventListener("mousemove", (event) => {
      this.onMouseMove(event as MouseEvent);
    });
  }

  onMouseMove(event: MouseEvent) {
    const mouseX = event.x - this._bounds.left;
    const mouseY = event.y - this._bounds.top;

    this._cursor_position = [mouseX, mouseY];
  }

  protected static newWorld(width: number, height: number) {
    return new Array(width * height).fill(false).map(function (_) {
      return Math.random() > 0.9;
    });
  }

  protected sizeChanged(canvas: HTMLCanvasElement, size: SceneSize): void {
    this._bounds = canvas.getBoundingClientRect();
    const ctx = Scene.GetCanvasContext2D(canvas);
    this.draw(ctx, 0);
    this._world_renderer.setDisplaySize(size.width, size.height);
    const worldSize = this._world_renderer.worldSize();
    this._world = AutomataWorldScene.newWorld(worldSize.cols, worldSize.rows);
  }

  private _since_last_evolution: number = 0;
  draw(context: CanvasRenderingContext2D, elapsed: number): void {
    const { width, height } = this.size;
    this._since_last_evolution += elapsed;
    if (this._since_last_evolution > 100) {
      this._since_last_evolution = 0;
      const worldSize = this._world_renderer.worldSize();
      this._world = evolveWorld(this._world, {
        width: worldSize.cols,
        height: worldSize.rows,
      });
    }

    context.clearRect(0.0, 0.0, width, height);
    this._world_renderer.draw(context, this._world, {
      x: this._cursor_position[0],
      y: this._cursor_position[1],
    });

    context.save();
    context.lineWidth = 10;
    context.strokeStyle = "black";
    context.strokeRect(0.0, 0.0, width, height);
    context.restore();
  }
}
