import { useStore } from "./store";

export function state() {
  return useStore.getState();
}

export function tools() {
  return state().editor.tools;
}

export function fabricCanvas() {
  return state().fabric;
}

export function getEditCanvas() {
  return state().editCanvas;
}

export function getBgCanvas() {
  return state().bgCanvas;
}
