import { fabric } from "fabric";
import { useStore } from "../../state/store";
import { staticObjectConfig } from "../../objects/static-object-config";
import { ObjectName } from "../../objects/object-name";
import { loadFabricImage } from "./load-fabric-image";
import { fabricCanvas, state, tools, ghostCanvas, drawerCanvas } from "../../state/utils";
import { canvasIsEmpty } from "./canvas-is-empty";
import { fetchStateJsonFromUrl } from "../import/fetch-state-json-from-url";
import pica from "pica";
import { getBrushWidth } from "@/utils/utils";
// import paper from 'paper'
// import ExtendPaperJs from 'paperjs-offset'

// paper.setup(new paper.Size(1, 1)); // creates a virtual canvas
// paper.view.autoUpdate = false; // disables drawing any shape automatically

// ExtendPaperJs(paper)

const MAX_IMAGE_PIXELS = 1000;

export class ImageCanvas {
  minWidth = 50;
  minHeight = 50;

  resize(width, height, { applyZoom = false, resizeHelper = true } = {}) {
    const currentZoom = state().zoom;
    fabricCanvas().setWidth(width * (applyZoom ? currentZoom : 1));
    fabricCanvas().setHeight(height * (applyZoom ? currentZoom : 1));
    state().setOriginal(width, height);
    if (resizeHelper) {
      tools().transform.resetStraightenAnchor();
    }
  }

  async addMainImage(url, loadStateName = "mainImage") {
    if (typeof url === "string") {
      state().toggleLoading(loadStateName);
    }
    let img;
    if (typeof url === "string") {
      img = await loadFabricImage(url);
      if (!img) return;
    } else {
      img = url;
    }

    let W = (document.body.clientWidth - 240 - 350) / 2;
    if (img.width > W || img.height > W) {
      const canvas = document.createElement("canvas");
      if (img.width > W) {
        canvas.width = W;
        canvas.height = img.height * (W / img.width);
      } else if (img.height > W) {
        canvas.height = W;
        canvas.width = img.width * (W / img.height);
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
          await this.addMainImage(img);
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
    img.set(staticObjectConfig);
    img.name = ObjectName.MainImage;
    fabricCanvas().add(img);
    fabricCanvas().requestRenderAll();
    if (state().replaced) {
      tools().objects.sendToBack(img);
    }
    this.resize(img.width, img.height);
    img.center();
    img.setCoords();
    tools().zoom.fitToScreen();
    state().toggleLoading(false);
    state().config.onMainImageLoaded?.(img);
    if (state().replaced) {
      tools().history.addHistoryItem({ name: "replaceImage" });
    }

    let drawer = new fabric.Canvas(document.getElementById('drawer'), { width: img.width, height: img.height });
    let ghost = new fabric.Canvas(document.getElementById('ghost'), { width: img.width, height: img.height });

    var brush = new fabric.PencilBrush(drawer);
    // var brush = new EraserBrush(fabricCanvas());
    brush.width = getBrushWidth();
    brush.color = '#00dd00';

    drawer.isDrawingMode = true;
    drawer.freeDrawingBrush = brush;
    let paths = [];
    drawer.on('path:created', function (opt) {
      ghostCanvas().clear();
      let path = new fabric.Path(opt.path.path, {
        fill: 'transparent',
        stroke: 'white',
        strokeWidth: getBrushWidth(),
        strokeLineCap: 'round',
        selectable: false,
      });
      paths.push(path);
      paths.map(p => ghostCanvas().add(p));

      fabric.Image.fromURL(img.toDataURL(), function (im) {
        im.set({
          left: img.left,
          top: img.top,
          scaleX: img.scaleX,
          scaleY: img.scaleY,
          hasControls: false,
          hasBorders: false,
          selectable: false,
          lockMovementX: true,
          lockMovementY: true,
          lockRotation: true,
          hoverCursor: 'default',
          // globalCompositeOperation: 'source-in'
        });
        ghost.add(im);
      });

      // fabric.Image.fromURL("./../../assets/images/cloth_mask.png", function (im) {
      //   im.set({
      //     left: ghost.width / 2,
      //     top: ghost.height / 2,
      //     scaleX: 0.3,
      //     scaleY: 0.3,
      //     hoverCursor: 'default',
      //     hasControls: false,
      //     hasBorders: false,
      //     selectable: false,
      //     lockMovementX: true,
      //     lockMovementY: true,
      //     lockRotation: true,
      //   });
      //   im.scaleToWidth(ghost.width);
      //   ghost.add(im);
      // });

      if (state().eraseMode) {
        // opt.path.globalCompositeOperation = 'destination-in';
        opt.path.globalCompositeOperation = 'destination-out';
      }
    });


    // fabric.Image.fromURL('./../../assets/images/cloth_mask_1.png', function (im) {

    //   // Apply a grayscale filter to the image
    //   im.filters.push(new fabric.Image.filters.Grayscale());
    //   im.applyFilters();
    //   // Apply a convolution filter to the image to extract the edge
    //   im.filters.push(new fabric.Image.filters.Convolute({
    //     matrix: [1, 1, 1,
    //       1, -8, 1,
    //       1, 1, 1]
    //   }));
    //   im.applyFilters();

    //   var tempCanvas = fabric.util.createCanvasElement();
    //   tempCanvas.width = im.width;
    //   tempCanvas.height = im.height;
    //   var ctx = tempCanvas.getContext('2d');
    //   ctx.drawImage(im.getElement(), 0, 0);

    //   // get the pixel data from the temporary canvas
    //   var alphaData = ctx.getImageData(0, 0, im.width, im.height).data;


    //   // Get the alpha channel data of the image as an array
    //   // var alphaData = im.getContext().getImageData(0, 0, im.width, im.height).data;
    //   // Create a new polygon object
    //   var polygon = new fabric.Polygon([], {
    //     left: 0,
    //     top: 0,
    //     stroke: '#fff', // set the stroke color of the polygon
    //     strokeWidth: 2, // set the stroke width of the polygon
    //     fill: '#000' // set the fill color of the polygon
    //   });
    //   // Set the polygon's points based on the alpha channel data
    //   var points = [];
    //   for (var y = 0; y < im.height; y++) {
    //     for (var x = 0; x < im.width; x++) {
    //       var index = (y * im.width + x) * 4 + 3; // get the alpha value of the pixel
    //       if (alphaData[index] > 0) {
    //         points.push({ x: x, y: y });
    //       }
    //     }
    //   } 
    //     polygon.set({ points: points });
    //     console.log(polygon.)
    //   // Add the polygon to the canvas
    //   ghostCanvas().add(polygon);

    //   return;



    //   // im.set({
    //   //   left: ghost.width / 2,
    //   //   top: ghost.height / 2,
    //   //   hoverCursor: 'default',
    //   //   hasControls: false,
    //   //   hasBorders: false,
    //   //   selectable: false,
    //   //   lockMovementX: true,
    //   //   lockMovementY: true,
    //   //   lockRotation: true,
    //   // });
    //   // im.scaleToWidth(ghost.width);
    //   // fabricCanvas().add(im);

    //   var tempCanvas = fabric.util.createCanvasElement();
    //   tempCanvas.width = im.width;
    //   tempCanvas.height = im.height;
    //   var ctx = tempCanvas.getContext('2d');
    //   ctx.drawImage(im.getElement(), 0, 0);

    //   // get the pixel data from the temporary canvas
    //   var imageData = ctx.getImageData(0, 0, im.width, im.height).data;

    //   // create a path object from the pixel data
    //   var pathString = ''; console.log(imageData)
    //   for (var i = 0; i < imageData.length; i += 4) {
    //     var x = (i / 4) % im.width;
    //     var y = Math.floor((i / 4) / im.width);
    //     var alpha = imageData[i + 3];
    //     if (alpha > 200) {
    //       pathString += (pathString === '' ? 'M' : 'L') + x + ',' + y;
    //     }
    //     i = i + 120;
    //   }
    //   // console.log(pathString)
    //   var path = new fabric.Path(pathString, {
    //     left: ghost.width / 2,
    //     top: ghost.height / 2,
    //     stroke: 'black',
    //     strokeWidth: 1,
    //     fill: 'red'
    //   });
    //   path.scaleToWidth(ghost.width);

    //   ghostCanvas().clear();
    //   ghostCanvas().add(path);
    //   console.log(path)
    // });





    // fabric.Image.fromURL(img.toDataURL(), function (im) {
    //   im.set({
    //     left: img.left,
    //     top: img.top,
    //     scaleX: img.scaleX,
    //     scaleY: img.scaleY,
    //     hasControls: false,
    //     hasBorders: false,
    //     selectable: false,
    //     lockMovementX: true,
    //     lockMovementY: true,
    //     lockRotation: true,
    //     hoverCursor: 'pointer'
    //   });
    //   ghost.add(im);
    // });
    useStore.setState({ drawer });
    useStore.setState({ ghost });
    return img;
  }

  drawGhostObject(target) {
    return;
    let ghost = new fabric.Canvas(document.getElementById('ghost'), {
      width: target.width,
      height: target.height,
    });
    fabric.Image.fromURL(target.toDataURL(), function (img) {
      img.set({
        left: target.left,
        top: target.top,
        scaleX: target.scaleX,
        scaleY: target.scaleY,
        hasControls: false,
        hasBorders: false,
        selectable: false,
        lockMovementX: true,
        lockMovementY: true,
        lockRotation: true,
        hoverCursor: 'pointer'
      });
      ghost.add(img);
    });

    ghost.isDrawingMode = true;

    var brush = new fabric.PencilBrush(ghost);
    brush.width = getBrushWidth();
    brush.color = '#00dd0088';
    ghost.freeDrawingBrush = brush;
    ghost.renderAll();
    let that = this;
    ghost.on('mouse:up', function (e) {
      // fabricCanvas().loadFromJSON(ghost.toJSON());
      that.getMainImage()
    });
    ghost.on('path:created', function (opt) {
      if (state().eraseMode) {
        // opt.path.globalCompositeOperation = 'destination-in';
        opt.path.globalCompositeOperation = 'destination-out';
      }
    });

    useStore.setState({ ghost });
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
    fabricCanvas().getObjects().map(v => console.log(v.name))


    return fabricCanvas()
      .getObjects()
      .find((obj) => {
        console.log(obj.name === ObjectName.MainImage)
        return obj.name === ObjectName.MainImage
      });
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
