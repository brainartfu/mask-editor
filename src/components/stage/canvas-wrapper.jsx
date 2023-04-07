import React, { useRef } from "react";
import { StageOverlays } from "./stage-overlays";
import { createUseGesture, dragAction, pinchAction } from "@use-gesture/react";
import { fabricCanvas, state, tools } from "@/state/utils";

const useGesture = createUseGesture([dragAction, pinchAction]);

export const CanvasWrapper = React.forwardRef((props, canvasRef) => {
  return (
    // @ts-ignore
    <PanContainer ref={props.panContainerRef}>
      <div className="relative m-auto w-full flex justify-center align-center">
        <StageOverlays />
        <canvas id="canvas" ref={canvasRef} />
        <div style={{ position: 'absolute' }}>
          <canvas id="drawer" />
        </div>
      </div>
    </PanContainer>
  );
});

const PanContainer = React.forwardRef(
  // @ts-ignore
  ({ children }, ref) => {
    const bind = useGesture({
      onPinch: (e) => {
        if (!tools().zoom.allowUserZoom || !shouldHandleGesture(e)) {
          return e.cancel();
        }
        if (e.direction[0] === 1) {
          tools().zoom.zoomIn(0.01);
        } else {
          tools().zoom.zoomOut(0.01);
        }
        e.event.stopPropagation();
        e.event.preventDefault();
      },
      onDrag: (e) => {
        if (e.pinching || !shouldHandleGesture(e)) {
          return e.cancel();
        }
        // @ts-ignore
        ref.current.scrollLeft -= e.delta[0];
        // @ts-ignore
        ref.current.scrollTop -= e.delta[1];
      },
    });

    return (
      <div
        ref={ref}
        className="flex items-center justify-center flex-col w-full h-full overflow-hidden touch-none"
        // @ts-ignore
        {...bind()}
      >
        {children}
      </div>
    );
  }
);

function shouldHandleGesture(e) {
  return !fabricCanvas().findTarget(e.event, false);
}
