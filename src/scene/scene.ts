import { Graphics, Graphics2D, GraphicsWebGL } from "../graphics";
import { Stage } from "../stage";
export type SceneSize = {
  width: number;
  height: number;
};

export abstract class Scene extends EventTarget {
  protected size: SceneSize = {
    width: 0.0,
    height: 0.0,
  };

  public invalidate(): void {
    this.dispatchEvent(new Event("invalidated"));
  }

  public setSize(canvas: HTMLCanvasElement, size: SceneSize) {
    this.size = size;
  }

  public play(): void {
    this.dispatchEvent(new Event("play"));
  }

  public stop(): void {
    this.dispatchEvent(new Event("stop"));
  }

  /**
   * get `Graphics` for the scene
   * - the scene is responsible for its own rendering system
   */
  public abstract getGraphics(stage: Stage): Graphics;
  public abstract setup(stage: Stage): void;
}

export abstract class Scene2D extends Scene {
  public getGraphics(stage: Stage) {
    return new Graphics2D(stage, this, Graphics2D.get2DContext(stage.canvas));
  }

  public abstract draw(
    context: CanvasRenderingContext2D,
    elapsed: number,
  ): void;
}

// TODO: implement 3d scene
export abstract class Scene3D extends Scene {
  public getGraphics(stage: Stage): Graphics {
    return new GraphicsWebGL(stage);
  }
}
