import React, { useState, useEffect, useRef } from "react";
import {ImageCanvas} from "../../tools/canvas/image-canvas";
import { ToolName } from "@/tools/tool-name";
import { StageOverlays } from "./stage-overlays";
import { createUseGesture, dragAction, pinchAction } from "@use-gesture/react";
import { fabricCanvas, state, tools } from "@/state/utils";
const useGesture = createUseGesture([dragAction, pinchAction]);

export const CanvasWrapper = React.forwardRef((props, canvasRef) => {

  const editCanvasRef = props.editCanvasRef;
  const bgCanvasRef = props.bgCanvasRef;
  const [brushWidth, setBrushWidth] = useState(10);
  const [restore, setRestore] = useState(false);
  const minWidth = fabricCanvas()?fabricCanvas().getWidth():0;
  const minHeight = fabricCanvas()?fabricCanvas().getHeight():0;

  const startErasing = (e) => {
    tools().brush.startErasing(e)
  }
  const stopErasing = (e) => {
    tools().brush.stopErasing()
  }
  const erase = (e) => {
    tools().brush.erase(e)
  }  
  const undoErasing = () => {
    tools().brush.undoErasing()
  }  
  const handleBrushWidth = (val) => {
    setBrushWidth(val);
    tools().brush.setBrushWidth(val)
  }
  return (
      <PanContainer ref={props.panContainerRef}>

        <div className="relative m-auto w-full flex justify-center align-center">
          <StageOverlays />
            <div className="grid grid-cols-2">
              <div style={{position: 'relative'}}>
                <canvas  ref={editCanvasRef} width={0} height={0} 
                  style={{
                    top: 0,
                    left: 0,
                  }}
                />
                <canvas
                  ref={bgCanvasRef}
                  onMouseDown={startErasing}
                  onMouseUp={stopErasing}
                  onMouseMove={erase}
                  width={0}
                  height={0}
                  style={{
                    backgroundColor: "rgba(0, 0, 0, 0)", 
                    position: 'absolute',
                    opacity: 0.5,
                    top: 0,
                    left: 0,
                  }}
                />
              </div>
              <div>
                <canvas
                  ref={canvasRef}
                  style={{
                    backgroundColor: "rgba(0, 0, 0, 0)", 
                    border: props.editing?'1px solid black':'none'
                  }}
                />
              </div>
            </div>     
        </div>
      </PanContainer>
  );
});
          // {!!props.editing && (
          // )}

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
