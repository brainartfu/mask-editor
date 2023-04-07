import { DEFAULT_GRADIENTS } from "@/config/default-gradients";
import { tools } from "@/state/utils";
import { state } from "@/utils/utils";
import { Box } from "@mui/material";
import { fabric } from "fabric";
import { UploadedFile } from "@/tools/import/import-tool";
const colors = [
  "white",
  "black",
  "red",
  "green",
  "blue",
  "yellow",
  "orange",
  "purple",
  "pink",
];
export default function BackgroundToolbar() {
  return (
    <Box className="p-3">
      <div className="p-2">
        <label htmlFor="colors">Predifined Colors:</label>
        <div className="border p-3 rounded-md">
          {colors.map((color) => (
            <button
              key={color}
              className={`btn shadow w-8 h-8 m-1`}
              style={{ backgroundColor: color, borderColor: color }}
              onClick={() => {
                tools().canvas.setBackgroundColor(color);
                state().setDirty(true);
              }}
            />
          ))}
        </div>
        <div className="p-5">
          <label htmlFor="colors">Custom Color:</label>
          <input
            type="color"
            onChange={(e) => {
              tools().canvas.setBackgroundColor(e.target.value);
              state().setDirty(true);
            }}
          />
        </div>
        <div>
          {DEFAULT_GRADIENTS.map((gradient, i) => (
            <button
              key={i}
              className={`btn shadow w-8 h-8 m-1`}
              style={{
                backgroundImage: `${gradient.type}-gradient(
              ${gradient.colorStops
                .map((stop) => `${stop.color} ${stop.offset * 100}%`)
                .join(", ")}
            )`,
              }}
              onClick={() => {
                const gr = new fabric.Gradient(gradient);
                tools().canvas.setGradientBackground(gr);
                state().setDirty(true);
              }}
            />
          ))}
        </div>

        <label htmlFor="colors">Your Image:</label>
        <div className="border p-3 rounded-md">
          <input
            type="file"
            accept="image/*"
            onChange={async (e) => {
              const file = e.target.files[0];
              const data = new UploadedFile(file);
              fabric.util.loadImage(await data.data, (img) => {
                img.style.objectFit = "contain";
                const pattern = new fabric.Pattern({
                  source: img,
                  repeat: "no-repeat",
                });
                tools().canvas.setBackgroundPattern(pattern);
              });
              state().setDirty(true);
            }}
          />
        </div>
      </div>
    </Box>
  );
}
