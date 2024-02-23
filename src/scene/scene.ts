import {Graphics2D, GraphicsWebGL} from '../graphics';
import {Stage} from '../stage';

export type SceneSize = {
  width: number;
  height: number;
};

export abstract class Scene {
  protected size: SceneSize = {
    width: 0.0,
    height: 0.0,
  };

  public setSize(canvas: HTMLCanvasElement, size: SceneSize) {
    this.size = size;
  }

  public abstract draw(elapsed: number): void;
  public abstract setup(stage: Stage): void;
}

export abstract class Scene2D extends Scene {
  protected context!: CanvasRenderingContext2D;

  public setup(stage: Stage) {
    this.context = Graphics2D.getContext(stage.canvas);
  }
}

// TODO: implement 3d scene
export abstract class Scene3D extends Scene {
  protected context!: WebGL2RenderingContext;

  public setup(stage: Stage) {
    this.context = GraphicsWebGL.getContext(stage.canvas);
  }
}
