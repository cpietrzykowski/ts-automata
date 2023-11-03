import { Stage } from "../stage";
import { Scene2D, SceneSize } from "./scene";

export class DemoScene extends Scene2D {
  public setSize(size: SceneSize): void {
    super.setSize(size);
    this.invalidate();
  }

  public draw(context: CanvasRenderingContext2D): void {
    // context.clearRect(0.0, 0.0, this.size.width, this.size.height);
    context.fillStyle = "blue";
    context.fillRect(0.0, 0.0, this.size.width, this.size.height);
  }

  public setup(stage: Stage): void {
    /** noop  */
  }
}
