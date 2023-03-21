import { SimpleConwayOptions, SimpleConwayWorldAddress } from "./automata_world";
import { ScenePresenter } from "./canvas_stage";
import { SimpleConwayWorld } from "./conway_world";
import { FrameAnimationProvider } from "./dom";
import { Scene, SceneRenderer2D, SceneSize } from "./scene";

export interface SceneAnimator {
  requestRedraw(): void;
  update(ts: DOMHighResTimeStamp): void;
  cancel(): void;
}

function sceneAnimator(
  context: CanvasRenderingContext2D,
  renderer: SceneRenderer2D,
  provider: FrameAnimationProvider,
  maxUpdateInterval = 50
): SceneAnimator {
  let _redraw_requested = true;
  let _last_ts = 0;
  let _last_request_id = 0;

  function _frame(ts: DOMHighResTimeStamp) {
    if (_redraw_requested || ts - _last_ts > maxUpdateInterval) {
      renderer.draw(context, ts - _last_ts);
      _last_ts = ts;
      _redraw_requested = false;
    }

    _last_request_id = provider.requestAnimationFrame(_frame);
  }

  return {
    requestRedraw() {
      _redraw_requested = true;
    },
    update: _frame,
    cancel() {
      _last_ts = 0;
      _redraw_requested = false;
      provider.cancelAnimationFrame(_last_request_id);
      _last_request_id = 0;
    },
  };
}

export class OldSimpleConwayScene extends Scene implements SceneRenderer2D {
  _options: SimpleConwayOptions = {
    cell_size: {
      width: 250.0,
      height: 250.0,
    },
    cell_margin: {
      horizontal: 8.0,
      vertical: 8.0,
    },
  };

  _bounds: DOMRect = new DOMRect(0, 0, 0, 0);
  _grid_offset: SimpleConwayWorldAddress = {
    x: 0.0,
    y: 0.0,
  };

  _world: SimpleConwayWorld = {
    width: 0,
    height: 0,
    cells: [],
  };

  protected override sizeChanged(
    canvas: HTMLCanvasElement,
    size: SceneSize
  ): void {
    this._bounds = canvas.getBoundingClientRect();

    const { width: scene_width, height: scene_height } = size;

    const { width: cell_width, height: cell_height } = this._options.cell_size;

    function _offset_from_grid_center(a: number, b: number) {
      return a / 2.0 - Math.ceil(a / 2.0 / b) * b;
    }

    function _offset_from_middle_cell_center(gd: number, bd: number) {
      return gd * 0.5 + bd * 0.5 - Math.ceil((gd * 0.5 + bd * 0.5) / bd) * bd;
    }

    this._grid_offset.x = _offset_from_middle_cell_center(
      scene_width,
      cell_width
    );
    this._grid_offset.y = _offset_from_middle_cell_center(
      scene_height,
      cell_height
    );
    const x_cells = Math.ceil((scene_width - this._grid_offset.x) / cell_width);
    const y_cells = Math.ceil(
      (scene_height - this._grid_offset.y) / cell_height
    );

    this._world = {
      width: x_cells,
      height: y_cells,
      cells: new Array(y_cells * x_cells).fill(false).map(function (_) {
        return Math.random() > 0.9;
      }),
    };
    console.log(this._world);
  }

  protected onMounted(canvas: HTMLCanvasElement): void {
    // canvas.addEventListener(
    //   "wheel",
    //   (event) => {
    //     this.onWheel(event as WheelEvent);
    //   },
    //   { passive: true }
    // );
    // canvas.addEventListener("mousemove", (event) => {
    //   this.onMouseMove(event as MouseEvent);
    // });
    // canvas.addEventListener("mousedown", (event) =>
    //   this.onMouseDown(event as MouseEvent)
    // );
    canvas.addEventListener("click", (event) =>
      this.onMouseClick(canvas, event as MouseEvent)
    );
    // canvas.addEventListener("contextmenu", (event) => event.preventDefault());
  }

  onMouseClick(canvas: HTMLCanvasElement, event: MouseEvent): void {
    const { left, top } = this._bounds;
    const mouseX = event.x - left;
    const mouseY = event.y - top;

    function _get_cell(
      x: number,
      y: number,
      cell_size_x: number,
      cell_size_y: number,
      offset_x: number,
      offset_y: number
    ) {
      return {
        x: Math.floor((x - offset_x) / cell_size_x),
        y: Math.floor((y - offset_y) / cell_size_y),
      };
    }

    const this_cell = _get_cell(
      mouseX,
      mouseY,
      this._options.cell_size.width,
      this._options.cell_size.height,
      this._grid_offset.x,
      this._grid_offset.y
    );

    this._world.cells[this_cell.y * this._world.width + this_cell.x] = true;
  }

  protected wasPresented(presenter: ScenePresenter): void {
    const ctx = Scene.GetCanvasContext2D(presenter.canvas);
    const animator = sceneAnimator(ctx, this, presenter.doc);
    animator.update(0);
  }

  public draw(context: CanvasRenderingContext2D, elapsed: number): void {
    const { width: sceneWidth, height: sceneHeight } = this.size;

    // draw cell grid
    const { width: cell_width, height: cell_height } = this._options.cell_size;
    const { horizontal: x_margin, vertical: y_margin } =
      this._options.cell_margin;
    const { width: world_width, height: world_height, cells } = this._world;
    const { x: x_offset, y: y_offset } = this._grid_offset;

    context.clearRect(0, 0, context.canvas.width, context.canvas.height);

    for (let y = 0; y < world_height; ++y) {
      for (let x = 0; x < world_width; ++x) {
        // draw cell background
        context.strokeStyle = "black";
        context.lineWidth = 3.0;
        context.strokeRect(
          x_offset + cell_width * x,
          y_offset + cell_height * y,
          cell_width,
          cell_height
        );

        context.fillStyle = "#0aa";
        context.fillRect(
          x_offset + x_margin + cell_width * x,
          y_offset + y_margin + cell_height * y,
          cell_width - x_margin * 2.0,
          cell_height - y_margin * 2.0
        );

        const c = cells[y * world_width + x];
        if (c) {
          context.fillStyle = "yellow";
          context.fillRect(
            x_offset + x_margin + cell_width * x,
            y_offset + y_margin + cell_height * y,
            cell_width - x_margin * 2.0,
            cell_height - y_margin * 2.0
          );
        }
      }
    }

    // scene border
    context.save();
    context.strokeStyle = "blue";
    context.lineWidth = 10.0;
    context.strokeRect(0, 0, this.size.width, this.size.height);
    context.restore();

    // debug overlay
    const sceneOrigin = {
      midX: sceneWidth * 0.5,
      midY: sceneHeight * 0.5,
    };

    context.save();
    context.strokeStyle = "red";
    context.lineWidth = 5.0;
    const crosshairLength = 50.0;
    const halfCrosshairLength = 0.5 * crosshairLength;
    context.beginPath();
    context.moveTo(sceneOrigin.midX - halfCrosshairLength, sceneOrigin.midY);
    context.lineTo(sceneOrigin.midX + halfCrosshairLength, sceneOrigin.midY);
    context.stroke();
    context.beginPath();
    context.moveTo(sceneOrigin.midX, sceneOrigin.midY - halfCrosshairLength);
    context.lineTo(sceneOrigin.midX, sceneOrigin.midY + halfCrosshairLength);
    context.stroke();
    context.restore();
  }
}

export class SimpleConwayScene extends Scene implements SceneRenderer2D {
  protected wasPresented(presenter: ScenePresenter): void {
    throw new Error("Method not implemented.");
  }

  draw(context: CanvasRenderingContext2D, elapsed: number): void {
    throw new Error("Method not implemented.");
  }
}
