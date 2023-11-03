
export interface SceneAnimator {
    setNeedsUpdate(): void;
    redraw(): void;
    play(): void;
    stop(): void;
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