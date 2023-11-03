import { Scene2D } from "../scene";
import { Stage } from "../stage";

export abstract class Graphics {
  constructor(public readonly stage: Stage) {}

  public abstract start(): void;
  public abstract stop(): void;
}

export class Graphics2D extends Graphics {
  protected last_frame = 0; // in ms
  protected last_ticket? = 0; // raf request ticket

  constructor(
    public readonly stage: Stage,
    public readonly scene: Scene2D,
    public readonly context: CanvasRenderingContext2D,
  ) {
    super(stage);
  }

  public static get2DContext(
    canvas: HTMLCanvasElement,
    options?: Parameters<HTMLCanvasElement["getContext"]>[1],
  ) {
    const ctx = canvas.getContext("2d", options);
    if (ctx === null || ctx === undefined) {
      throw new Error("context init error");
    }

    if (!(ctx instanceof CanvasRenderingContext2D)) {
      throw new Error("context init error (unexpected type)");
    }

    return ctx;
  }

  public render() {
    if (this.last_ticket !== undefined) {
      this.last_ticket = this.stage.wnd.requestAnimationFrame((ts) => {
        this.scene.draw(this.context, ts - this.last_frame);
        this.last_frame = ts;
        this.last_ticket = undefined;
      });
    }
  }

  public play() {
    const tick = (ts: number) => {
      this.scene.draw(this.context, ts - this.last_frame);
      this.last_frame = ts;
      this.last_ticket = this.stage.wnd.requestAnimationFrame(tick);
    };

    this.last_ticket = this.stage.wnd.requestAnimationFrame(tick);
  }

  public start() {
    this.scene.addEventListener("invalidated", (e) => {
      this.render();
    });

    this.scene.addEventListener("play", (e) => {
      this.play();
    });

    this.scene.addEventListener("stop", (e) => {
      this.stop();
    });

    this.play();
  }

  public stop() {
    if (this.last_ticket !== undefined) {
      this.stage.wnd.cancelAnimationFrame(this.last_ticket);
    }
  }
}

export abstract class Graphics3D extends Graphics {}
export class GraphicsWebGL extends Graphics3D {
  protected getWebGLContext(
    options?: Parameters<HTMLCanvasElement["getContext"]>[1],
  ) {
    const ctx = this.stage.canvas.getContext("webgl", options);
    if (ctx === null || ctx === undefined) {
      throw new Error("context init error");
    }

    if (!(ctx instanceof WebGL2RenderingContext)) {
      throw new Error("context init error (unexpected type)");
    }

    return ctx;
  }

  public start(): void {
    throw new Error("Method not implemented.");
  }

  public stop(): void {
    throw new Error("Method not implemented.");
  }
}
