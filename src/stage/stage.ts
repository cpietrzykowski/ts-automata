import {
  ElementSize,
  FrameAnimationProvider,
  getElementById,
  onDocumentReady,
} from '../dom';
import {Scene} from '../scene';

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
      const {width, height} = entry.contentRect;
      sizeChanged({
        width,
        height,
      });
    }
  });

  ro.observe(target);
  return ro;
}

function createSceneAnimator(
  scene: Scene,
  animationProvider: FrameAnimationProvider,
) {
  const {requestAnimationFrame, cancelAnimationFrame} = animationProvider;

  let state: 'running' | 'stopped' = 'stopped';
  let last_frame = 0;
  let last_ticket:
    | ReturnType<FrameAnimationProvider['requestAnimationFrame']>
    | undefined;

  const frame = (ts: DOMHighResTimeStamp) => {
    scene.draw(ts - last_frame);
    last_frame = ts;
    last_ticket = undefined;
    last_ticket = requestAnimationFrame(frame);
  };

  return {
    state() {
      return state;
    },
    stop() {
      state = 'stopped';
      if (last_ticket === undefined) {
        return;
      }

      cancelAnimationFrame(last_ticket);
    },
    start() {
      if (state === 'running') {
        this.stop();
      }

      if (last_ticket !== undefined) {
        cancelAnimationFrame(last_ticket);
      }

      state = 'running';
      last_ticket = requestAnimationFrame(frame);
    },
    redraw() {
      last_ticket = requestAnimationFrame((ts) => {
        scene.draw(ts - last_frame);
        last_frame = ts;
        last_ticket = undefined;
      });
    },
  };
}

/**
 * Stage is context agnostic
 */
export class Stage implements ScenePresenter {
  /**
   * presented scene
   */
  protected _scene?: Scene;

  public animator!: ReturnType<typeof createSceneAnimator>;

  public constructor(
    public readonly doc: Document,
    public readonly wnd: EventTarget & FrameAnimationProvider,
    public readonly canvas: HTMLCanvasElement,
    public readonly sceneDock?: HTMLElement,
  ) {}

  public play() {
    this.animator.start();
  }

  public stop() {
    this.animator.stop();
  }

  public redraw() {
    this.animator.redraw();
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

    this.animator = createSceneAnimator(scene, this.wnd);

    const theCanvas = this.canvas;

    // setup initial canvas size
    let lastSize: ElementSize = {
      width: canvasParent.clientWidth,
      height: canvasParent.clientHeight,
    };

    theCanvas.width = lastSize.width;
    theCanvas.height = lastSize.height;
    scene.setSize(theCanvas, lastSize);

    scene.setup(this);

    createResizeObserverFor(canvasParent, (size: ElementSize) => {
      if (size.width === lastSize.width && size.height === lastSize.height) {
        return;
      }

      lastSize = size;

      theCanvas.width = size.width;
      theCanvas.height = size.height;
      scene.setSize(theCanvas, size);
      this.animator.redraw();
    });
    this.animator.redraw();
  }

  private static buildSceneInterface(stageId: string, doc: Document) {
    const stageContainer = getElementById(stageId, doc);
    if (stageContainer === undefined) {
      throw new Error(`stage container not found`);
    }

    const sceneContainer = doc.createElement('div');
    stageContainer.appendChild(sceneContainer);

    const stageHeading = doc.createElement('h1');
    stageHeading.innerHTML = 'Automata';
    sceneContainer.appendChild(stageHeading);

    const canvasContainer = doc.createElement('div');
    canvasContainer.id = `${stageId}-canvas`;
    sceneContainer.appendChild(canvasContainer);

    const canvasElement = doc.createElement('canvas');
    canvasContainer.appendChild(canvasElement);

    const stageDock = doc.createElement('div');
    stageDock.id = `${stageId}-dock`;
    sceneContainer.appendChild(stageDock);

    const stageControls = doc.createElement('div');
    stageControls.id = `${stageId}-dock-controls`;
    stageDock.appendChild(stageControls);

    const sceneDock = doc.createElement('div');
    sceneDock.id = `${stageId}-scene-dock`;
    stageDock.appendChild(sceneDock);

    const stageDebug = doc.createElement('div');
    stageDebug.id = `${stageId}-debug`;
    sceneContainer.appendChild(stageDebug);

    return {
      canvasElement,
      stageControls,
      sceneDock,
    };
  }

  static start(scene: Scene, stageId = 'stage') {
    onDocumentReady(function (doc) {
      // Optional<NonNullable<(typeof window)["document"]["defaultView"]>>
      const window = document.defaultView ?? undefined;
      if (window === undefined) {
        throw new Error(`window unavailable`);
      }

      const sceneInterface = Stage.buildSceneInterface(stageId, doc);

      const stage = new Stage(
        doc,
        window,
        sceneInterface.canvasElement,
        sceneInterface.sceneDock,
      );

      // stage play (start animating evolution) button
      const stagePlay = doc.createElement('button');
      stagePlay.innerText = 'Play';
      stagePlay.addEventListener('click', () => stage.play());
      sceneInterface.stageControls.appendChild(stagePlay);

      // stage stop (stop animating) button
      const stageStop = doc.createElement('button');
      stageStop.innerText = 'Stop';
      stageStop.addEventListener('click', () => stage.stop());
      sceneInterface.stageControls.appendChild(stageStop);

      stage.present(scene);
    });
  }
}
