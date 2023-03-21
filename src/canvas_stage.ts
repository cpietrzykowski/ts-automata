import { ElementSize, FrameAnimationProvider } from "./dom";
import { Scene } from "./scene";

export type CanvasResizerCallback = (
  canvas: HTMLCanvasElement,
  size: ElementSize
) => void;

function canvasSizer(
  canvas: HTMLCanvasElement,
  sizeChanged: (canvas: HTMLCanvasElement, size: ElementSize) => void
) {
  return function () {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;

    sizeChanged(canvas, {
      width: canvas.width,
      height: canvas.height,
    });
  };
}

export interface SceneAnimator {
  setNeedsUpdate(): void;
  redraw(): void;
  play(): void;
  cancel(): void;
}

// function sceneAnimator(
//   scene: Scene,
//   provider: FrameAnimationProvider,
//   maxUpdateInterval = 50
// ): SceneAnimator {
//   let _redraw_requested = true;
//   let _last_ts = 0;
//   let _last_request_id = 0;

//   function _frame(ts: DOMHighResTimeStamp) {
//     if (_redraw_requested || ts - _last_ts > maxUpdateInterval) {
//       scene.draw(ts, ts - _last_ts);
//       _last_ts = ts;
//       _redraw_requested = false;
//     }

//     _last_request_id = provider.requestAnimationFrame(_frame);
//   }

//   return {
//     requestRedraw() {
//       _redraw_requested = true;
//     },
//     update: _frame,
//     cancel() {
//       _last_ts = 0;
//       _redraw_requested = false;
//       provider.cancelAnimationFrame(_last_request_id);
//       _last_request_id = 0;
//     },
//   };
// }

export interface ScenePresenter {
  canvas: HTMLCanvasElement;
  doc: EventTarget & FrameAnimationProvider;
}

export class CanvasStage implements ScenePresenter {
  /**
   * presented scene
   */
  _scene?: Scene;

  public constructor(
    public readonly canvas: HTMLCanvasElement,
    public readonly doc: EventTarget & FrameAnimationProvider
  ) {}

  public present(scene: Scene) {
    this._scene = scene;
    const resizeListener = canvasSizer(
      this.canvas,
      (canvas: HTMLCanvasElement, size: ElementSize) => {
        scene.setSize(canvas, size);
      }
    );

    this.doc.addEventListener("resize", resizeListener, {
      passive: true,
    });

    resizeListener(); // initial trigger
    scene.presented(this);
  }
}
