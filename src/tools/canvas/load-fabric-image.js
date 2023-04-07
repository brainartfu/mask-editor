import { fabric } from "fabric";
import { state } from "../../state/utils";
/**
 *
 * @param {string} data
 * @returns {Promise<fabric.Image>}
 */
export function loadFabricImage(data) {
  return new Promise((resolve) => {
    fabric.util.loadImage(
      data,
      (img) =>
        resolve(
          new fabric.Image(img, {
            hasControls: false,
            hasBorders: false,
            selectable: false,
            lockMovementX: true,
            lockMovementY: true,
          })
        ),
      null,
      state().config.crossOrigin ? "anonymous" : undefined
    );
  });
}
