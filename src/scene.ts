import { ScenePresenter } from "./canvas_stage";

export type SceneSize = {
  width: number;
  height: number;
};

export interface FrameStats {
  frame: number;
  ts: number;
  elapsed: number;
}

export abstract class Scene {
  protected abstract wasPresented(presenter: ScenePresenter): void;
  public presented(presenter: ScenePresenter) {
    this.wasPresented(presenter);
  }

  protected size: SceneSize = {
    width: 0.0,
    height: 0.0,
  };

  protected sizeChanged(canvas: HTMLCanvasElement, size: SceneSize) {
    return;
  }

  public setSize(canvas: HTMLCanvasElement, size: SceneSize) {
    this.size = size;
    this.sizeChanged(canvas, size);
  }

  public static GetCanvasContext2D(
    canvas: HTMLCanvasElement,
    options?: Parameters<HTMLCanvasElement["getContext"]>[1]
  ) {
    const ctx = canvas.getContext("2d", options);
    if (ctx === null || ctx === undefined) {
      throw new Error("context init error");
    }

    if (!(ctx instanceof CanvasRenderingContext2D)) {
      throw new Error("context init error");
    }

    return ctx;
  }
}

export interface SceneRenderer2D {
  draw(context: CanvasRenderingContext2D, elapsed: number): void;
}

export class DebugScene extends Scene implements SceneRenderer2D {
  protected wasPresented(presenter: ScenePresenter): void {
    const ctx = Scene.GetCanvasContext2D(presenter.canvas);
    this.draw(ctx);
  }

  public draw(context: CanvasRenderingContext2D): void {
    context.clearRect(0.0, 0.0, this.size.width, this.size.height);
    context.fillStyle = "blue";
    context.fillRect(0.0, 0.0, this.size.width, this.size.height);
  }
}

// export abstract class CanvasRenderer2D {
//   public abstract render(ctx: CanvasRenderingContext2D, elapsed: number): void;

//   constructor(canvas: HTMLCanvasElement) {}

//   protected override wasPresented(presenter: ScenePresenter): void {
//     const ctx = getCanvasContext(presenter.canvas);
//     presenter.start((elapsed) => {
//       this.render(ctx, elapsed);
//     });
//   }
// }
