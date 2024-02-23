import {Scene2D} from './scene';

export class DemoScene extends Scene2D {
  public draw(): void {
    const {context} = this;
    // context.clearRect(0.0, 0.0, this.size.width, this.size.height);
    context.fillStyle = 'blue';
    context.fillRect(0.0, 0.0, this.size.width, this.size.height);

    context.fillStyle = 'white';
    context.font = 'bold 48px sans-serif';
    context.textAlign = 'center';
    context.fillText(
      'DEMO',
      Math.round(this.size.width / 2.0),
      Math.round(this.size.height / 2.0),
    );
  }
}
