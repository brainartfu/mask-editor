import { useStore } from "@/state/store";
import { state, tools } from "@/state/utils";
import deepmerge from "deepmerge";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
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
import { FaDownload, FaUndo } from 'react-icons/fa';

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
  const editCanvasRef = useRef(null);
  const bgCanvasRef = useRef(null);
  const mainRef = useRef(null);
  const activeTool = useStore((s) => s.activeTool);
  const canUndo = useStore((s) => s.history.canUndo);
  const canRedo = useStore((s) => s.history.canRedo);
  const activeToolOverlay = useStore((s) => s.activeToolOverlay);
  const [restore, setRestore] = useState(false);
  const [brushWidth, setBrushWidth] = useState(10);
  const panContainerRef = useRef(null);
  const canvasRefSub = useRef(null);
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
      // console.log('openBackgroundImage')
      tools().import.openBackgroundImage(uploadedFile);
    } else {
      // console.log('openUploadedFile')
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
    // editor already booted
    if (state().fabric) return;
    initTools(canvasRef.current, editCanvasRef.current, bgCanvasRef.current, mainRef.current);
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
  const handleRestore = () => {
    const state = !restore;
    setRestore(state)
    tools().brush.setRestore(state);
  }
  const handleBrushWidth = (val) => {
    setBrushWidth(val);
    tools().brush.setBrushWidth(val)
  }
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
        <>
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
                // tools().brush.undoErasing();
                if (tools().history.canUndo()) {
                  tools().history.undo();
                } else {
                  // toast.error("Nothing to undo");
                }
              }}
              disabled={!canUndo}
              className="btn btn-secondary"
            >
              Undo
            </button>
            <button
              onClick={() => {
                // tools.brush.redoErasing();
                if (tools().history.canRedo()) {
                  tools().history.redo();
                } else {
                  // toast.error("Nothing to redo");
                }
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
              className="btn btn-outline"
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
            <button 
              onClick={() => handleRestore()} 
              className={restore?"btn btn-primary":"btn"}
            >
              Restore
            </button>   
            <button 
              onClick={() => tools().brush.download()} 
              className="btn btn-primary"
            >
              Download
            </button>               
          </MuiToolbar>
          <div style={{display: 'flex', alignItem: 'center'}}>
            <div style={{marginBottom: 20, marginTop: 20, marginRight: 20}}>
              <label className="pr-10">Brush Width:</label>
              <input
                type="range"
                min="1"
                max="50"
                value={brushWidth}
                onChange={(e) => handleBrushWidth(e.target.value)}
                 
              />
            </div>
            {/*  <button onClick={() => {
              const canvas = canvasRef.current;
              const dataURL = canvas.toDataURL("image/png");
              const downloadLink = document.createElement("a");
              downloadLink.href = dataURL;
              downloadLink.download = "erased-background.png";
              downloadLink.click();
            }}
            className="btn btn-outline"
            >
             <FaDownload size="20" />
            </button>  */}  
            <button onClick={() => {
              tools().brush.undoErasing();
            }}
            className="btn btn-outline ml-5"
            >
             <FaUndo size="20" />
            </button>            
            
          </div>
        </>
        )}
        <main
          ref={mainRef}
          style={{
            backgroundImage: `url('/assets/images/empty-canvas-bg.png')`,
          }}
          className="relative max-h-screen flex-1 flex overflow-hidden outline-none"
        >
          {/* @ts-ignore */}
          <CanvasWrapper panContainerRef={panContainerRef} ref={canvasRef} editCanvasRef={editCanvasRef} bgCanvasRef={bgCanvasRef} editing={acceptedFiles[0]?true:false} />
          <LoadingIndicator />
        </main>
        <Toaster />
      </div>
      <Toolbar />
    </div>
  );
}
