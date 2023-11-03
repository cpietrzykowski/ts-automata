import { ElementSize, FrameAnimationProvider } from "../dom";
import { Scene } from "../scene";

export interface ScenePresenter {
  canvas: HTMLCanvasElement;
  doc: Document;
  wnd: EventTarget & FrameAnimationProvider;
  sceneControl?: HTMLElement;
}

function createResizeObserverFor(
  target: HTMLElement,
  sizeChanged: (size: ElementSize) => void,
) {
  const ro = new ResizeObserver(function (entries, observer) {
    for (const entry of entries) {
      const { width, height } = entry.contentRect;
      sizeChanged({
        width,
        height,
      });
    }
  });

  ro.observe(target);
  return ro;
}

/**
 * Stage is context agnostic
 */
export class Stage implements ScenePresenter {
  /**
   * presented scene
   */
  _scene?: Scene;

  public constructor(
    public readonly doc: Document,
    public readonly wnd: EventTarget & FrameAnimationProvider,
    public readonly canvas: HTMLCanvasElement,
    public readonly sceneControl?: HTMLElement,
  ) {
    //
  }

  /**
   * start the stage with `scene`
   */
  public present(scene: Scene) {
    this._scene = scene;

    const canvasParent = this.canvas.parentElement || undefined;
    if (canvasParent === undefined) {
      return;
    }

    const theCanvas = this.canvas;

    createResizeObserverFor(canvasParent, (size: ElementSize) => {
      theCanvas.width = size.width;
      theCanvas.height = size.height;
      scene.setSize(theCanvas, size);
    });

    scene.setup(this);

    // setup initial canvas size
    theCanvas.width = canvasParent.clientWidth;
    theCanvas.height = canvasParent.clientHeight;
    scene.setSize(theCanvas, {
      width: theCanvas.width,
      height: theCanvas.height,
    });

    const graphics = scene.getGraphics(this);
    graphics.start();
  }
}
