import { getElementById, onDocumentReady } from "./dom";
import { Stage } from "./stage";
import { AutomataScene } from "./conway/automata_scene";

function main(doc: Document, container: HTMLElement) {
  const canvasElement = doc.createElement("canvas");
  container.appendChild(canvasElement);

  // Optional<NonNullable<(typeof window)["document"]["defaultView"]>>
  const window = document.defaultView ?? undefined;
  if (window === undefined) {
    throw new Error(`fatal: window unavailable`);
  }

  const sceneControlId = "scene-control";
  const sceneControlContainer = getElementById(sceneControlId, doc);
  const stage = new Stage(doc, window, canvasElement, sceneControlContainer);
  return stage.present(new AutomataScene());
}

onDocumentReady(function (doc) {
  const canvasId = "scene-canvas";
  const canvasContainer = getElementById(canvasId, doc);
  if (canvasContainer === undefined) {
    throw new Error(`fatal: scene canvas not found`);
  }

  main(doc, canvasContainer);
});
