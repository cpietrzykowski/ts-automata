import { AutomataWorldScene } from "./automata_world";
import { CanvasStage } from "./canvas_stage";
import { getElementById, onDocumentReady } from "./dom";

onDocumentReady(function (doc, wnd) {
  const canvasId = "canvas";
  const canvasElement = getElementById<HTMLCanvasElement>(canvasId, doc);

  if (canvasElement === undefined) {
    throw new Error(`fatal: canvas (${canvasId}) not found`);
  }

  if (wnd === undefined) {
    throw new Error(`fatal: window unavailable`);
  }

  const stage = new CanvasStage(canvasElement, wnd);

  // delegate scene control to coordinator
  stage.present(new AutomataWorldScene());
});
