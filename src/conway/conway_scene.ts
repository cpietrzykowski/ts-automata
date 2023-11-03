import {ConwaysWorld, ConwaysWrappedWorld, Dimension2D} from './conway_world';
import {FrameAnimationProvider} from '../dom';
import {Scene} from '../scene';
import {CellAddress} from './world';

type SimplePoint = {
  x: number;
  y: number;
};

type GridOffset = {
  x: number;
  y: number;
};

interface SceneBounds {
  readonly height: number;
  readonly width: number;
  readonly x: number;
  readonly y: number;
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
  readonly left: number;
}

function isCellAlive(ctx: CanvasRenderingContext2D, p: SimplePoint) {
  // using context image data
  const color = ctx.getImageData(p.x, p.y, 1, 1).data;
  // this.grid_offset.x + cell.x * this.cell_size.w + this.cell_size.w / 2.0,
  // this.grid_offset.y + cell.y * this.cell_size.h + this.cell_size.h / 2.0,

  return !(color[0] === 0 && color[1] === 0 && color[2] === 0);
}

interface ConwaySceneOptions {
  cell_margin: number;
  cell_size: Dimension2D;
}

export class ConwayScene extends Scene {
  protected options: ConwaySceneOptions = {
    cell_margin: 2.0,
    cell_size: {width: 16.0, height: 16.0},
  };

  /**
   * evolution counter
   */
  _step = 0;

  world = new ConwaysWrappedWorld();
  current_mouse_location: SimplePoint = {x: 0, y: 0};
  current_cell: CellAddress = {x: 0, y: 0};

  grid_offset: GridOffset = {x: 0.0, y: 0.0};

  t_since_last_update = 0;

  paused = false;

  bounds: SceneBounds = {
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  };

  constructor(
    protected readonly provider: FrameAnimationProvider,
    defaults?: ConwaySceneOptions,
  ) {
    super();
    if (defaults !== undefined) {
      this.options = Object.assign(this.options, defaults);
    }
  }

  protected wasPresented(presenter: ScenePresenter): void {
    const ctx = Scene.GetCanvasContext2D(presenter.canvas);
    this.draw(ctx, 0);
  }

  onMounted(canvas: HTMLCanvasElement): void {
    canvas.addEventListener(
      'wheel',
      (event) => {
        this.onWheel(event as WheelEvent);
      },
      {passive: true},
    );

    canvas.addEventListener('mousemove', (event) => {
      this.onMouseMove(event as MouseEvent);
    });

    canvas.addEventListener('mousedown', (event) =>
      this.onMouseDown(event as MouseEvent),
    );
    canvas.addEventListener('click', (event) =>
      this.onMouseClick(event as MouseEvent),
    );
    canvas.addEventListener('contextmenu', (event) => event.preventDefault());
  }

  onWheel(event: WheelEvent) {
    //
  }

  onMouseMove(event: MouseEvent) {
    if (this.bounds === undefined) {
      return;
    }

    const mouseX = event.x - this.bounds.left;
    const mouseY = event.y - this.bounds.top;

    this.current_mouse_location = {
      x: mouseX,
      y: mouseY,
    };
  }

  onMouseDown(event: MouseEvent): void {
    if (event.button === 2) {
      this.paused = !this.paused;
    }
  }

  onMouseClick(event: MouseEvent): void {
    const mouseX = event.x - this.bounds.left;
    const mouseY = event.y - this.bounds.top;

    const this_cell = this.getCellAt({x: mouseX, y: mouseY});
    this.world.setCell(this_cell, !this.world.cellAt(this_cell));
  }

  getCellAt(point: typeof this.current_mouse_location) {
    const {width: cell_width, height: cell_height} = this.options.cell_size;
    const x = Math.floor((point.x - this.grid_offset.x) / cell_width);
    const y = Math.floor((point.y - this.grid_offset.y) / cell_height);
    return {x, y};
  }

  protected sizeChanged(canvas: HTMLCanvasElement, size: SceneSize): void {
    this.bounds = canvas.getBoundingClientRect();

    const {width: scene_width, height: scene_height} = size;
    const {width: cell_width, height: cell_height} = this.options.cell_size;

    const half_res_w = scene_width / 2.0;
    const half_res_h = scene_height / 2.0;
    this.grid_offset.x =
      Math.floor(half_res_w / cell_width) * cell_width - half_res_w;
    this.grid_offset.y =
      Math.floor(half_res_h / cell_height) * cell_height - half_res_h;

    // initialize cell array
    const x_cells = Math.ceil((scene_width - this.grid_offset.x) / cell_width);
    const y_cells = Math.ceil(
      (scene_height - this.grid_offset.y) / cell_height,
    );
    this.world.setSize({
      width: x_cells,
      height: y_cells,
    });
  }

  renderWorld(ctx: CanvasRenderingContext2D, world: ConwaysWorld) {
    const {width: cell_width, height: cell_height} = this.options.cell_size;
    const x_margin = this.options.cell_margin;
    const y_margin = this.options.cell_margin;

    ctx.save();
    ctx.strokeStyle = 'blue';
    for (let y = this.grid_offset.y; y < this.size.height; y += cell_height) {
      for (let x = this.grid_offset.x; x < this.size.width; x += cell_width) {
        ctx.strokeRect(
          x + x_margin,
          y + y_margin,
          cell_width - x_margin * 2.0,
          cell_height - y_margin * 2.0,
        );
      }
    }
    ctx.restore();

    const cells = world.state();
    for (let y = 0; y < cells.length; ++y) {
      for (let x = 0; x < cells[y].length; ++x) {
        ctx.save();
        this.renderCell(ctx, {x, y}, cells[y][x]);
        ctx.restore();
      }
    }

    const trackedCell = this.getCellAt(this.current_mouse_location);
    if (trackedCell !== undefined) {
      this.renderTrackedCell(ctx, trackedCell);
    }

    ctx.fillStyle = 'rgba(255, 255, 255, 1.0)';
    ctx.font = '24px monospace';
    const stepCount = `${this._step}`;
    const statsMargin = 16.0;
    ctx.fillText(stepCount, statsMargin, this.bounds.height - statsMargin);
  }

  renderCell(
    ctx: CanvasRenderingContext2D,
    address: CellAddress,
    alive: boolean,
    debug = false,
  ) {
    const {width: cell_width, height: cell_height} = this.options.cell_size;
    const x_margin = this.options.cell_margin;
    const y_margin = this.options.cell_margin;

    const x = this.grid_offset.x + x_margin + address.x * cell_width;
    const y = this.grid_offset.y + y_margin + address.y * cell_height;

    if (alive) {
      ctx.fillStyle = 'rgba(255, 255, 0, 0.75)';
    } else {
      ctx.fillStyle = 'rgba(255, 0, 0, 0.25)';
    }

    ctx.fillRect(
      x,
      y,
      cell_width - x_margin * 2.0,
      cell_height - y_margin * 2.0,
    );

    if (debug) {
      ctx.fillStyle = 'rgba(255, 255, 255, 1.0)';
      ctx.font = '12px monospace';
      ctx.fillText(
        `${address.x},${address.y}`,
        x + x_margin * 2.0,
        y + cell_height - y_margin * 2.0 - 4.0,
      );
    }
  }

  renderTrackedCell(ctx: CanvasRenderingContext2D, address: CellAddress) {
    const {width: cell_width, height: cell_height} = this.options.cell_size;
    const x_margin = this.options.cell_margin;
    const y_margin = this.options.cell_margin;

    const x = this.grid_offset.x + x_margin + address.x * cell_width;
    const y = this.grid_offset.y + y_margin + address.y * cell_height;

    ctx.save();
    ctx.strokeStyle = 'rgba(255, 0, 0, 0.75)';
    ctx.lineWidth = 4.0;
    ctx.strokeRect(
      x,
      y,
      cell_width - x_margin * 2.0,
      cell_height - y_margin * 2.0,
    );
    ctx.restore();
  }

  update(elapsed: number): void {
    this.t_since_last_update += elapsed;
    if (!this.paused && this.t_since_last_update > 100) {
      this.t_since_last_update = 0;
      this.world.evolve();
      ++this._step;
    }
  }

  draw(ctx: CanvasRenderingContext2D, elapsed: number) {
    // this.update(elapsed);

    const {width: w, height: h} = this.size;
    ctx.clearRect(0.0, 0.0, w, h);
    ctx.save();
    ctx.fillStyle = 'black';
    ctx.fillRect(0.0, 0.0, w, h);
    ctx.restore();

    this.renderWorld(ctx, this.world);
  }

  // public onAnimatorReady(control: ScenePresenter): void {
  //   if (this.canvas === undefined) {
  //     return;
  //   }

  //   const ctx = getCanvasContext(this.canvas);
  //   control.start((elapsed) => this.draw(ctx, elapsed));
  //   // control.stop();
  // }
}

// /**
//  * pixel game of life implementation
//  */
// export class PixelConwayScene extends Scene {
//   protected onSizeChanged(canvas: HTMLCanvasElement, size: SceneSize): void {
//     // if (this.canvas !== undefined) {
//     //   this.bounds = this.canvas.getBoundingClientRect();
//     // }
//     // const { width: scene_width, height: scene_height } = size;
//     // const { width: cell_width, height: cell_height } = this.options.cell_size;
//     // const half_res_w = scene_width / 2.0;
//     // const half_res_h = scene_height / 2.0;
//     // this.grid_offset.x =
//     //   Math.floor(half_res_w / cell_width) * cell_width - half_res_w;
//     // this.grid_offset.y =
//     //   Math.floor(half_res_h / cell_height) * cell_height - half_res_h;
//     // // initialize cell array
//     // const x_cells = Math.ceil((scene_width - this.grid_offset.x) / cell_width);
//     // const y_cells = Math.ceil(
//     //   (scene_height - this.grid_offset.y) / cell_height
//     // );
//     // this.world.setSize({
//     //   width: x_cells,
//     //   height: y_cells,
//     // });
//     const ctx = getCanvasContext(canvas);
//     this._image = ctx.getImageData(0, 0, size.width, size.height);
//   }

//   protected onMounted(canvas: HTMLCanvasElement): void {
//     // canvas.addEventListener(
//     //   "wheel",
//     //   (event) => {
//     //     this.onWheel(event as WheelEvent);
//     //   },
//     //   { passive: true }
//     // );
//     // canvas.addEventListener("mousemove", (event) => {
//     //   this.onMouseMove(event as MouseEvent);
//     // });
//     // canvas.addEventListener("mousedown", (event) =>
//     //   this.onMouseDown(event as MouseEvent)
//     // );
//     // canvas.addEventListener("click", (event) =>
//     //   this.onMouseClick(event as MouseEvent)
//     // );
//     // canvas.addEventListener("contextmenu", (event) => event.preventDefault());
//   }

//   _image: ImageData = new ImageData(new Uint8ClampedArray([0, 0, 0, 0]), 1);

//   static options = {
//     _x_len: 100,
//     _y_len: 50,
//   };

//   draw(ctx: CanvasRenderingContext2D, elapsed: number) {
//     const { _x_len: x_len, _y_len: y_len } = PixelConwayScene.options;

//     const { width: w, height: h } = this.size;
//     const data = this._image.data;
//     for (let y = 0; y < h; ++y) {
//       for (let x = 0; x < w; ++x) {
//         const px = y * (w * 4) + x * 4;
//         data[px + 0] = 255;
//         data[px + 1] = (((x % x_len) + (y % y_len)) / (x_len + y_len)) * 255;
//         data[px + 2] = 0;
//         data[px + 3] = 255;
//       }
//     }
//     ctx.putImageData(this._image, 0, 0);
//   }

//   public onAnimatorReady(control: ScenePresenter): void {
//     if (this.canvas === undefined) {
//       return;
//     }

//     const ctx = getCanvasContext(this.canvas);
//     control.start((elapsed) => this.draw(ctx, elapsed));
//   }
// }

// export interface SimpleConwayOptions {
//   cell_size: {
//     width: number;
//     height: number;
//   };
//   cell_margin: {
//     horizontal: number;
//     vertical: number;
//   };
// }

// export interface SimpleConwayGridOffset {
//   x: number;
//   y: number;
// }

// export interface SimpleConwayWorld {
//   width: number;
//   height: number;
//   cells: boolean[];
// }
