import produce, { castDraft } from "immer";
import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { DEFAULT_CONFIG } from "../config/default-config";
import { mergeConfig } from "../config/merge-config";
import { createObjectsSlice } from "../objects/state/objects-slice";
import { createCropSlice } from "../tools/crop/crop-slice";
import { createFilterSlice } from "../tools/filter/filter-slice";
import { createHistorySlice } from "../tools/history/state/history-slice";
import { ToolName } from "../tools/tool-name";
import { ActiveToolOverlay } from "./editor-state";

const EMPTY_PLAIN_RECT = {
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
  width: 0,
  height: 0,
};

const immer = (config) => (set, get, api) =>
  config(
    (partial, replace) => {
      const nextState =
        typeof partial === "function" ? produce(partial) : partial;
      return set(nextState, replace);
    },
    get,
    api
  );

export const useStore = create(
  subscribeWithSelector(
    immer((set, get) => ({
      editor: null,
      fabric: null,
      drawer: null,
      ghost: null,
      eraseMode: false,
      brushWidth: 20,
      config: DEFAULT_CONFIG,
      zoom: 1,
      dirty: false,
      original: {
        width: window.innerHeight,
        height: window.innerHeight,
      },
      stageSize: EMPTY_PLAIN_RECT,
      canvasSize: EMPTY_PLAIN_RECT,
      activeTool: null,
      activeToolOverlay: null,
      loading: false,
      replaced: false,
      panel: "default",
      bottomNav: false,
      openPanels: {
        newImage: false,
        history: false,
        objects: false,
        export: false,
      },
      ...createHistorySlice(set, get),
      ...createObjectsSlice(set, get),
      ...createFilterSlice(set, get),
      ...createCropSlice(set, get),
      // actions

      setBrushWidth: v => set(state => { state.brushWidth = v }),
      setEraseMode: v => set(state => { state.eraseMode = v }),

      setZoom: (newZoom) =>
        set((state) => {
          state.zoom = newZoom;
        }),
      setBottomNav: (bottomNav) =>
        set((state) => {
          state.bottomNav = bottomNav;
        }),
      setOriginal: (width, height) =>
        set((state) => {
          state.original = { width, height };
        }),
      setDirty: (isDirty) =>
        set((state) => {
          state.dirty = isDirty;
        }),
      toggleLoading: (isLoading) =>
        set((state) => {
          state.loading = isLoading;
        }),
      setReplaced: (replaced) =>
        set((state) => {
          state.replaced = replaced;
        }),
      setPanel: (panel) => {
        set((state) => {
          state.panel = panel;
        });
      },
      setStageSize: (size) =>
        set((state) => {
          state.stageSize = size;
        }),
      setCanvasSize: (size) =>
        set((state) => {
          state.canvasSize = size;
        }),
      setActiveTool: (toolName, overlay) =>
        set((state) => {
          state.activeTool = toolName;
          state.activeToolOverlay = overlay;
        }),
      setConfig: (partialConfig) =>
        set((state) => {
          state.config = castDraft(mergeConfig(partialConfig, get().config));
        }),
      togglePanel: (panelName, isOpen) =>
        set((state) => {
          state.openPanels[panelName] = isOpen ?? !state.openPanels[panelName];
        }),

      applyChanges: async () => {
        let activeToolName = get().activeTool;
        if (get().activeToolOverlay === ActiveToolOverlay.Crop) {
          activeToolName = "crop";
        }
        if (activeToolName === ToolName.CHANGE_IMAGE) {
          const activeToolOverlay = get().activeToolOverlay;
          if (activeToolOverlay === ActiveToolOverlay.Crop) {
            activeToolName = "crop";
          } else if (activeToolOverlay === ActiveToolOverlay.Resize) {
            activeToolName = "resize";
          }
        }
        if (!activeToolName) return;

        // @ts-ignore
        const toolSlice = get()[activeToolName];

        const result = await toolSlice?.apply?.();

        set((state) => {
          state.dirty = false;
          state.activeTool = null;
          state.activeToolOverlay = null;
        });

        // allow tools to prevent history item addition
        if (result !== false) {
          get().editor.tools.history.addHistoryItem({ name: activeToolName });
        }

        toolSlice?.reset();
      },
      cancelChanges: async () => {
        const activeToolName = get().activeTool;
        if (!activeToolName) return;
        const wasDirty = get().dirty;
        set((state) => {
          state.dirty = false;
          state.activeTool = null;
          state.activeToolOverlay = null;
        });

        if (
          wasDirty &&
          get().editor.state.history.items.at(-1)?.name !== "replaceImage"
        ) {
          await get().editor.tools.history.reload();
        }

        // @ts-ignore
        const toolSlice = get()[activeToolName];
        // run reset after history is loaded so too state can perform any needed changes.
        // Removing straighten anchor for example.
        toolSlice?.reset();
      },
      reset: () => {
        get().editor.tools.transform.resetStraightenAnchor();
        set({
          activeTool: null,
          activeToolOverlay: null,
          zoom: 1,
          dirty: false,
          loading: false,
          openPanels: {
            newImage: false,
            history: false,
            objects: false,
            export: false,
          },
        });
        get().history.reset();
        get().objects.reset();
        get().filter.reset();
        get().crop.reset();
      },
    }))
  )
);
