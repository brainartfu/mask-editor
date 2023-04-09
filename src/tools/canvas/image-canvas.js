import { useStore } from "@/state/store";
import { fabric } from "fabric";
import { staticObjectConfig } from "../../objects/static-object-config";
import { ObjectName } from "../../objects/object-name";
import { loadFabricImage } from "./load-fabric-image";
import { fabricCanvas, state, tools, getEditCanvas, getBgCanvas } from "../../state/utils";
import { canvasIsEmpty } from "./canvas-is-empty";
import { fetchStateJsonFromUrl } from "../import/fetch-state-json-from-url";
import pica from "pica";
let MAX_IMAGE_PIXELS = 300;
// const loading = useStore((s) => s.loading);
export class ImageCanvas {

  resize(width, height, { applyZoom = false, resizeHelper = true } = {}) {
    // tools().brush.resize(width, height);
    const currentZoom = state().zoom;
    fabricCanvas().setWidth(width * (applyZoom ? currentZoom : 1));
    fabricCanvas().setHeight(height * (applyZoom ? currentZoom : 1));
    state().setOriginal(width, height);
    if (resizeHelper) {
      tools().transform.resetStraightenAnchor();
    }
    console.log(currentZoom, width, height)
  }

  async addMainImage(url, loadStateName = "mainImage") {
    MAX_IMAGE_PIXELS = (tools().brush.mainRef.clientWidth || tools().brush.mainRef.offsetWidth) / 2;
    console.log(MAX_IMAGE_PIXELS)
    if (typeof url === "string") {
      // state().toggleLoading(loadStateName);
    }
    let img;
    if (typeof url === "string") {
      img = await loadFabricImage(url);
      if (!img) return;
    } else {
      img = url;
    }
    if (loadStateName == 'mainImage') {
      tools().brush.setOriginalImage(img);
    }
    if ((img.width > MAX_IMAGE_PIXELS || img.height > MAX_IMAGE_PIXELS) && loadStateName !== 'drawImage') {
      const canvas = document.createElement("canvas");
      if (img.width > MAX_IMAGE_PIXELS) {
        canvas.width = MAX_IMAGE_PIXELS;
        canvas.height = img.height * (MAX_IMAGE_PIXELS / img.width);
      } else if (img.height > MAX_IMAGE_PIXELS) {
        canvas.height = MAX_IMAGE_PIXELS;
        canvas.width = img.width * (MAX_IMAGE_PIXELS / img.height);
      } else {
        canvas.width = img.width;
        canvas.height = img.height;
      }
      const base64 = await pica().resize(img.toCanvasElement(), canvas, {
        unsharpRadius: 0.5,
        unsharpThreshold: 0.5,
      });
      // console.log(base64);
      return new Promise((resolve) => {
        fabric.Image.fromURL(base64.toDataURL(), async (img) => {
          await this.addMainImage(img, loadStateName==="mainImage"?'resize':loadStateName);
          resolve(img);
        });
      });
    }

    if (!state().replaced) {
      this.clear();
    } else {
      state().setConfig({ image: undefined, blankCanvasSize: undefined });
      tools().objects.delete(tools().objects.get(ObjectName.MainImage));
    }
    if (loadStateName == 'mainImage' || loadStateName == 'resize') {
      console.log(img)
      console.log(img.width)
      tools().brush.drawImage(img);
    }
    img.set(staticObjectConfig);
    img.name = ObjectName.MainImage;
    // if (loadStateName === 'drawImage') {
      // console.log('drawImage')
      fabricCanvas().add(img);
      fabricCanvas().requestRenderAll();
    // }
    if (state().replaced) {
      tools().objects.sendToBack(img);
    }
    this.resize(img.width, img.height);
    img.center();
    img.setCoords();
    tools().zoom.fitToScreen();
    // state().toggleLoading(false);
    state().config.onMainImageLoaded?.(img);
    if (state().replaced) {
      tools().history.addHistoryItem({ name: "replaceImage" });
    }
    return img;
  }

  openNew(width, height, bgColor) {
    width = Math.max(this.minWidth, width);
    height = Math.max(this.minHeight, height);

    if (!state().replaced) {
      this.clear();
    }
    this.resize(width, height);
    fabricCanvas().backgroundColor = bgColor;

    tools().zoom.fitToScreen();
    state().toggleLoading("newCanvas");
    requestAnimationFrame(() => {
      state().toggleLoading(false);
    });
    return Promise.resolve({ width, height });
  }

  /**
   * Get main image object, if it exists.
   */
  getMainImage() {
    return fabricCanvas()
      .getObjects()
      .find((obj) => obj.name === ObjectName.MainImage);
  }

  render() {
    fabricCanvas().requestRenderAll();
  }

  async loadInitialContent() {
    const image = state().config.image;
    const size = state().config.blankCanvasSize;
    const stateJson = state().config.state;
    if (image && image.endsWith("json")) {
      const stateObj = await fetchStateJsonFromUrl(image);
      await tools().import.loadState(stateObj);
    } else if (image && image.startsWith('{"canvas')) {
      await tools().import.loadState(image);
    } else if (image) {
      await this.addMainImage(image);
    } else if (stateJson) {
      await tools().import.loadState(stateJson);
    } else if (size) {
      await this.openNew(size.width, size.height);
    }
    if (canvasIsEmpty() && state().config.ui?.imageOverlay?.show) {
      state().togglePanel("newImage", true);
    }
    // delay adding initial so changes made in the returned promise are caught
    return new Promise((resolve) => {
      setTimeout(() => {
        tools().history.addInitial();
        resolve();
      }, 10);
    });
  }
  setBackgroundColor(color) {
    console.log( fabricCanvas())
    fabricCanvas().backgroundColor = color;
    fabricCanvas().requestRenderAll();
  }
  setGradientBackground(gradient) {
    fabricCanvas().backgroundColor = gradient;
    fabricCanvas().requestRenderAll();
  }
  setBackgroundPattern(pattern) {
    fabricCanvas().backgroundColor = pattern;
    fabricCanvas().requestRenderAll();
  }
  clear() {
    fabricCanvas().clear();
    tools().transform.resetStraightenAnchor();
  }
}
