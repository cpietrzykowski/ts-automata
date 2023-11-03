import { evolveWorld } from "./conway/conway_world";
import { Scene } from "./scene";

type AutomataWorldLayoutOptions = {
  cellSize: number;
  worldPadding: number;
};

class AutomataWorldRenderOptions {
  public static defaults: AutomataWorldLayoutOptions = {
    cellSize: 50.0,
    worldPadding: 10.0,
  };

  protected _options: typeof AutomataWorldRenderOptions.defaults;

  constructor(options?: Partial<AutomataWorldLayoutOptions>) {
    this._options = { ...AutomataWorldRenderOptions.defaults, ...options };
  }

  public cellSize() {
    return this._options.cellSize;
  }

  public worldPadding() {
    return this._options.worldPadding;
  }
}

export class AutomataWorldRenderer<CellStateType> {
  constructor(
    public readonly options: AutomataWorldRenderOptions,
    public readonly style: {
      cursorStrokeWidth: number;
      cursorStrokeStyle: string;
    } = {
      cursorStrokeStyle: "yellow",
      cursorStrokeWidth: 2,
    }
  ) {}

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

    const cellSize = this.options.cellSize();
    const worldPadding = this.options.worldPadding() * 2.0;
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
    const cellSize = this.options.cellSize();
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

        context.font = "10px monospace";
        context.fillText(`${col}, ${row}`, x + 4.0, y + cellSize - 4.0);
      }
    }

    // render cell under cursor
    const cellAtCursor = this.getCellAt(cursorPosition.x, cursorPosition.y);
    context.save();
    context.strokeStyle = this.style.cursorStrokeStyle;
    context.lineWidth = this.style.cursorStrokeWidth;
    context.strokeRect(
      colOffset + cellAtCursor[0] * cellSize,
      rowOffset + cellAtCursor[1] * cellSize,
      cellSize,
      cellSize
    );

    context.fillStyle = "red";
    context.font = "14px monospace";
    context.textAlign = "center";
    context.fillText(
      `${cellAtCursor[0]}, ${cellAtCursor[1]}`,
      colOffset + cellAtCursor[0] * cellSize + cellSize * 0.5,
      rowOffset + cellAtCursor[1] * cellSize + cellSize * 0.5
    );
    context.restore();
  }

  getCellAt(x: number, y: number) {
    const cellSize = this.options.cellSize();
    const { col: colOffset, row: rowOffset } = this._offsets;
    return [
      Math.floor((x - colOffset) / cellSize),
      Math.floor((rowOffset + y) / cellSize),
    ];
  }
}

// function sceneAnimator(
//   context: CanvasRenderingContext2D,
//   renderer: SceneRenderer2D,
//   provider: FrameAnimationProvider,
//   maxUpdateInterval = 50,
//   chronoProvider = performance.now
// ): SceneAnimator {
//   let _needs_update = true;
//   let _last_ts = 0;
//   let _last_request_id = 0;

//   function _frame(ts: DOMHighResTimeStamp) {
//     if (_needs_update || ts - _last_ts > maxUpdateInterval) {
//       renderer.draw(context, ts - _last_ts);
//       _last_ts = ts;
//       _needs_update = false;
//     }

//     _last_request_id = provider.requestAnimationFrame(_frame);
//   }

//   return {
//     setNeedsUpdate() {
//       _needs_update = true;
//     },
//     redraw() {
//       renderer.draw(context, 0);
//     },
//     play() {
//       _frame(0);
//     },
//     stop() {
//       _last_ts = 0;
//       _needs_update = false;
//       provider.cancelAnimationFrame(_last_request_id);
//       _last_request_id = 0;
//     },
//   };
// }

class AutomataWorldSceneView {
  constructor(bindings: {
    playButton: HTMLButtonElement;
    stopButton: HTMLButtonElement;
  }) {}
}

export class AutomataWorldScene {
  private _bounds = new DOMRect(0, 0, 0, 0);
  private _cursor_position = { x: 0.0, y: 0.0 };
  private _world: boolean[] = [];
  private _world_renderer = new AutomataWorldRenderer(
    new AutomataWorldRenderOptions()
  );

  private _last_mouse_event?: MouseEvent;

  protected wasPresented(presenter: ScenePresenter): void {
    const ctx = Scene.GetCanvasContext2D(presenter.canvas);

    const animator = sceneAnimator(ctx, this, presenter.wnd);

    if (presenter.sceneControl !== undefined) {
      const sceneControl = presenter.sceneControl;
      const stopButton = presenter.doc.createElement("button");
      stopButton.onclick = () => {
        animator.stop();
      };
      stopButton.innerHTML = "&#x23f9; Stop";
      sceneControl.appendChild(stopButton);

      const pauseButton = presenter.doc.createElement("button");
      pauseButton.innerHTML = "&#x23f8; Pause";
      sceneControl.appendChild(pauseButton);

      const playButton = presenter.doc.createElement("button");
      playButton.onclick = () => {
        animator.play();
      };

      playButton.innerHTML = "&#x23f5; Play";
      sceneControl.appendChild(playButton);
    }

    const debugPanel = presenter.doc.getElementById("scene-debug");
    if (debugPanel instanceof HTMLElement) {
      const mousePosition = presenter.doc.createElement("pre");
      debugPanel.appendChild(mousePosition);
      presenter.canvas.addEventListener("mousemove", (event) => {
        const b = presenter.canvas.getBoundingClientRect();
        mousePosition.innerHTML = [
          `${b.width} x ${b.height}`,
          `${b.left} x ${b.top}`,
          `${event.clientX} x ${event.clientY}`,
          `${event.clientX - b.left} x ${event.clientY - b.top}`,
        ].join("\n");
      });
    }

    presenter.canvas.addEventListener("mousemove", (event) => {
      this.onMouseMove(event as MouseEvent);
    });
  }

  onMouseMove(event: MouseEvent) {
    this._last_mouse_event = event;
    this._cursor_position = {
      x: event.clientX - this._bounds.left,
      y: event.clientY - this._bounds.top,
    };
  }

  // returns a new "world" of `size` and activates cell's with `activity`
  protected static randomWorld(
    size: {
      width: number;
      height: number;
    },
    activity: number = 0.1
  ) {
    return new Array(size.width * size.height).fill(false).map(function (_) {
      return activity > Math.random();
    });
  }

  protected sizeChanged(canvas: HTMLCanvasElement, size: SceneSize): void {
    this._bounds = canvas.getBoundingClientRect();
    const ctx = Scene.GetCanvasContext2D(canvas);
    this._world_renderer.setDisplaySize(size.width, size.height);
    const worldSize = this._world_renderer.worldSize();
    this._world = AutomataWorldScene.randomWorld({
      width: worldSize.cols,
      height: worldSize.rows,
    });
    this.draw(ctx, 0);
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
    this._world_renderer.draw(context, this._world, this._cursor_position);

    if (this._last_mouse_event !== undefined) {
      // helper for painting cursor
      function cursorAt(x: number, y: number, color: string) {
        context.save();

        context.strokeStyle = color;
        context.beginPath();
        context.arc(x, y, 3.0, 0.0, 2.0 * Math.PI);
        context.closePath();
        context.stroke();

        context.restore();
      }

      const lme = this._last_mouse_event;
      cursorAt(lme.clientX, lme.clientY, "blue");
      cursorAt(this._cursor_position.x, this._cursor_position.y, "green");
    }

    context.save();
    context.lineWidth = 10;
    context.strokeStyle = "black";
    context.strokeRect(0.0, 0.0, width, height);
    context.restore();
  }
}
