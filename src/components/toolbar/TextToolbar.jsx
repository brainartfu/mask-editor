import { Box, Select, Slider, MenuItem, TextField } from "@mui/material";
import React, { useEffect, useState } from "react";
import {
  AiOutlineAlignLeft,
  AiOutlineAlignRight,
  AiOutlineAlignCenter,
  AiOutlineBold,
  AiOutlineUnderline,
  AiOutlineItalic,
} from "react-icons/ai";

import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import { state, tools } from "@/state/utils";
import { useStore } from "@/state/store";
import { loadFonts } from "@/tools/history/history-tool";

function ToggleButtons() {
  const [alignment, setAlignment] = useState("left");

  const handleAlignment = (_event, newAlignment) => {
    setAlignment(newAlignment);
    tools().objects.setValues({
      textAlign: newAlignment,
    });
    state().setDirty(true);
  };

  return (
    <ToggleButtonGroup
      value={alignment}
      exclusive
      onChange={handleAlignment}
      aria-label="text alignment"
      id="alignment"
    >
      <ToggleButton value="left" aria-label="left aligned">
        <AiOutlineAlignLeft />
      </ToggleButton>
      <ToggleButton value="center" aria-label="centered">
        <AiOutlineAlignCenter />
      </ToggleButton>
      <ToggleButton value="right" aria-label="right aligned">
        <AiOutlineAlignRight />
      </ToggleButton>
    </ToggleButtonGroup>
  );
}

export default function TextToolbar() {
  const fontSize = useStore((s) => s.objects?.active?.editableProps?.fontSize);
  const fill = useStore((s) => s.objects?.active?.editableProps?.fill);
  const fontFamily = useStore(
    (s) => s.objects?.active?.editableProps?.fontFamily
  );
  const fonts = useStore((s) => s.config.tools.text.fonts);
  useEffect(() => {
    loadFonts(fonts);
  }, [fonts]);
  return (
    <Box className="p-2">
      <div className="p-2">
        <button
          onClick={() => {
            tools().text.add();
            state().setDirty(true);
          }}
          className="btn btn-primary"
        >
          Add Text Block
        </button>
      </div>
      <div className="p-2">
        <label className="block pb-1" htmlFor="fontFamily">
          Font Family
        </label>
        <Select
          onChange={(e) => {
            tools().objects.setValues({
              fontFamily: e.target.value,
            });
            state().setDirty(true);
          }}
          style={{
            fontFamily: `${fontFamily}, sans-serif`,
          }}
          fullWidth
          placeholder="Choose a Font Family"
          name="fontFamily"
          id="fontFamily"
          className="form-select"
        >
          {fonts.map((font) => (
            <MenuItem
              key={font.family}
              style={{
                fontFamily: font.family,
              }}
              value={font.family}
            >
              {font.family}
            </MenuItem>
          ))}
        </Select>
      </div>
      <div className="p-2">
        <label className="block pb-1" htmlFor="alignment">
          Alignment
        </label>
        <ToggleButtons />
      </div>
      <div className="p-2">
        <label className="block pb-1" htmlFor="alignment">
          Style
        </label>
        <StyleButtons />
      </div>
      <div className="p-2">
        <label className="block pb-1" htmlFor="fontSize">
          Font Size
        </label>
        <TextField
          value={fontSize || 20}
          onChange={(e) => {
            tools().objects.setValues({
              fontSize: e.target.value,
            });
            state().setDirty(true);
          }}
          type="number"
          id="fontSize"
          name="fontSize"
          className="form-control"
        />
      </div>
      <div className="p-2">
        <label className="block pb-1" htmlFor="color">
          Color
        </label>
        <input
          onChange={(e) => {
            state().setDirty(true);
            tools().objects.setValues({ fill: e.target.value });
          }}
          value={fill}
          type="color"
          name="color"
          id="color"
        />
      </div>
    </Box>
  );
}

const StyleButtons = () => {
  const fontStyle = useStore((s) => s.objects.active.editableProps.fontStyle);
  const underline = useStore((s) => s.objects.active.editableProps.underline);
  const fontWeight = useStore((s) => s.objects.active.editableProps.fontWeight);
  const [formats, setFormats] = useState([
    fontStyle,
    fontWeight === "bold" && "bold",
    underline && "underline",
  ]);
  const handleFormat = (event, newStyles) => {
    setFormats(newStyles);
    tools().objects.setValues({
      underline: newStyles.includes("underline"),
      fontStyle: newStyles.includes("italic") ? "italic" : "",
      fontWeight: newStyles.includes("bold") ? "bold" : "normal",
    });
    state().setDirty(true);
  };
  return (
    <ToggleButtonGroup
      value={formats}
      onChange={handleFormat}
      aria-label="text formatting"
    >
      <ToggleButton value="bold" aria-label="bold">
        <AiOutlineBold />
      </ToggleButton>
      <ToggleButton value="italic" aria-label="italic">
        <AiOutlineItalic />
      </ToggleButton>
      <ToggleButton value="underline" aria-label="underline">
        <AiOutlineUnderline />
      </ToggleButton>
    </ToggleButtonGroup>
  );
};
