import {Scene, Scene2D} from '../scene';
import {Stage} from '../stage';

export abstract class Graphics {
  protected last_frame = 0; // in ms
  protected last_ticket?: ReturnType<Stage['wnd']['requestAnimationFrame']>; // raf request ticket

  constructor(
    public readonly stage: Stage,
    public readonly scene: Scene,
  ) {}


  public render() {
    if (this.last_ticket !== undefined) {
      this.last_ticket = this.stage.wnd.requestAnimationFrame((ts) => {
        this.scene.draw(ts - this.last_frame);
        this.last_frame = ts;
        this.last_ticket = undefined;
      });
    }
  }
}

export class Graphics2D extends Graphics {
  constructor(
    public readonly stage: Stage,
    public readonly scene: Scene2D,
    public readonly context: CanvasRenderingContext2D,
  ) {
    super(stage, scene);
  }

  public static getContext(
    canvas: HTMLCanvasElement,
    options?: Parameters<HTMLCanvasElement['getContext']>[1],
  ) {
    const ctx = canvas.getContext('2d', options);
    if (ctx === null || ctx === undefined) {
      throw new Error('context init error');
    }

    if (!(ctx instanceof CanvasRenderingContext2D)) {
      throw new Error('context init error (unexpected type)');
    }

    return ctx;
  }

  public play() {
    const tick = (ts: number) => {
      this.scene.draw(ts - this.last_frame);
      this.last_frame = ts;
      this.last_ticket = this.stage.wnd.requestAnimationFrame(tick);
    };

    this.last_ticket = this.stage.wnd.requestAnimationFrame(tick);
  }

  public start() {
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
  public static getContext(
    canvas: HTMLCanvasElement,
    options?: Parameters<HTMLCanvasElement['getContext']>[1],
  ) {
    const ctx = canvas.getContext('webgl', options);
    if (ctx === null || ctx === undefined) {
      throw new Error('context init error');
    }

    if (!(ctx instanceof WebGL2RenderingContext)) {
      throw new Error('context init error (unexpected type)');
    }

    return ctx;
  }
}
