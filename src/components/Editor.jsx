import { fabric } from "fabric";
import { useStore } from "@/state/store";
import { drawerCanvas, ghostCanvas, state, tools } from "@/state/utils";
import deepmerge from "deepmerge";
import { useCallback, useEffect, useLayoutEffect, useRef } from "react";
import { useDropzone } from "react-dropzone";
import { Toaster, toast } from "react-hot-toast";
import {
  UploadedFile,
  buildUploadInputAccept,
  imgContentTypes,
  stateContentType,
} from "../tools/import/import-tool";
import { initTools } from "../tools/init-tools";
import { LoadingIndicator } from "./Loader";
import Sidebar from "./Sidebar";
import { CanvasWrapper } from "./stage/canvas-wrapper";
import Toolbar from "./toolbar";
import { ActiveToolOverlay } from "@/state/editor-state";
import { Toolbar as MuiToolbar } from "@mui/material";
import useResizeObserver from "use-resize-observer";
import { fabricCanvas } from "@/utils/utils";
/**
 *
 * @param {HTMLElement} el
 * @param {(e: DOMRectReadOnly) => void} callback
 * @returns {() => void}
 */
export function observeSize(el, callback) {
  const observer = new ResizeObserver((entries) => {
    const rect = entries[0].contentRect;
    callback(rect);
  });
  observer.observe(el);
  return () => observer.unobserve(el);
}

export function ImageEditor() {
  const canvasRef = useRef(null);
  const activeTool = useStore((s) => s.activeTool);
  const canUndo = useStore((s) => s.history.canUndo);
  const canRedo = useStore((s) => s.history.canRedo);
  const activeToolOverlay = useStore((s) => s.activeToolOverlay);
  const brushWidth = useStore((s) => s.brushWidth);
  const eraseMode = useStore((s) => s.eraseMode);

  const panContainerRef = useRef(null);
  const { width, height } = useResizeObserver({
    ref: panContainerRef,
  });
  const { width: canvasWidth, height: canvasHeight } = useResizeObserver({
    ref: canvasRef,
  });
  useEffect(() => {
    state().setStageSize({ ...state().stageSize, width, height });
  }, [width, height]);
  useEffect(() => {
    state().setCanvasSize({
      ...state().canvasSize,
      width: canvasWidth,
      height: canvasHeight,
    });
  }, [canvasWidth, canvasHeight]);
  const isDirty = useStore((s) => s.dirty);
  const onDrop = useCallback((files) => {
    if (state().activeTool || state().dirty || !files.length) return;
    if (tools().canvas.getMainImage()) return;
    const uploadedFile = new UploadedFile(files[0]);
    if (state().config.tools?.import?.openDroppedImageAsBackground ?? false) {
      tools().import.openBackgroundImage(uploadedFile);
    } else {
      tools().import.openUploadedFile(uploadedFile);
    }
  }, []);

  const { acceptedFiles, getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: buildUploadInputAccept(
      deepmerge(imgContentTypes(), stateContentType)
    ),
  });

  useEffect(() => {
    if (brushWidth && drawerCanvas()) {
      let brush = new fabric.PencilBrush(drawerCanvas());
      brush.width = brushWidth;
      brush.color = eraseMode ? '#ff000088' : '#00dd0088';
      drawerCanvas().freeDrawingBrush = brush;
      drawerCanvas().renderAll();
    }
  }, [brushWidth, eraseMode]);

  useEffect(() => {
    // editor already booted
    if (state().fabric) return;
    initTools(document.getElementById('canvas'));//(canvasRef.current);
    if (state().config.ui?.defaultTool) {
      state().setActiveTool(state().config.ui?.defaultTool, null);
    }

    tools()
      .canvas.loadInitialContent()
      .then(() => {
        state().config.onLoad?.(state().editor);
      });
  }, []);
  const dimensions = useStore((s) => s.original);
  // make sure css variables are added before editor ui is rendered
  useLayoutEffect(() => {
    if (activeTool) {
      tools().zoom.fitToScreen();
    }
  }, [dimensions, activeTool]);

  return (
    <div className="flex h-full w-full">
      <Sidebar />
      <div className="w-full flex justify-center flex-col items-center flex-1 overflow-hidden relative">
        {!acceptedFiles[0] ? (
          <div
            {...getRootProps({
              className:
                "dropzone z-10 cursor-pointer w-3/4 pointer text-center border border-dashed p-10 rounded shadows absolute w-full top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2",
            })}
          >
            <input className="hidden" id="upload" {...getInputProps()} />
            <h3 className="text-lg font-bold">
              Drag 'n' drop some files here, or click to select files
            </h3>
            <em className="text-sm">
              (Only *.jpeg and *.png images will be accepted)
            </em>
          </div>
        ) : (
          <MuiToolbar>
            <button
              onClick={async () => {
                await state().cancelChanges();
                state().setActiveTool(null, null);
              }}
              className="btn btn-primary"
              disabled={!isDirty}
            >
              Cancel
            </button>
            <button
              onClick={() => {
                if (tools().history.canUndo()) {
                  tools().history.undo();
                } else toast.error("Nothing to undo");
              }}
              disabled={!canUndo}
              className="btn btn-secondary"
            >
              Undo
            </button>
            <button
              onClick={() => {
                if (tools().history.canRedo()) {
                  tools().history.redo();
                } else toast.error("Nothing to redo");
              }}
              disabled={!canRedo}
              className="btn btn-secondary"
            >
              Redo
            </button>
            <button
              onClick={() => {
                state().setActiveTool(null, ActiveToolOverlay.Crop);
                state().setDirty(true);
              }}
              className="btn btn-primary"
              disabled={activeToolOverlay === ActiveToolOverlay.Crop}
            >
              Crop
            </button>
            <button
              onClick={async () => {
                await state().applyChanges();
                state().setActiveTool(null, null);
              }}
              className="btn btn-primary"
              disabled={!isDirty}
            >
              Done
            </button>
          </MuiToolbar>
        )}
        <main id="canvasWrapper" style={{ backgroundImage: `url('/assets/images/empty-canvas-bg.png')` }}
          className="relative max-h-screen flex overflow-hidden outline-none">
          {/* @ts-ignore */}
          <CanvasWrapper panContainerRef={panContainerRef} ref={canvasRef} />
          <div>
            <canvas id="ghost" />
          </div>
          <LoadingIndicator />
        </main>
        <div className="p-5">
          <label htmlFor="eraseChk">Eraser:&nbsp;</label>
          <input id="eraseChk" type="checkbox" checked={eraseMode} onChange={e => state().setEraseMode(!eraseMode)} />
          &nbsp;&nbsp;&nbsp;&nbsp;
          <label>Brush width:&nbsp;</label>
          <input type="range" style={{ marginTop: 3 }} min={5} max={50} value={brushWidth} onChange={e => state().setBrushWidth(e.target.value)} />
        </div>
        <Toaster />
      </div>
      <Toolbar />
    </div>
  );
}
