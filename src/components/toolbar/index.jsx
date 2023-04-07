import { ToolName } from "@/tools/tool-name";
import React from "react";
import EffectsToolbar from "./EffectsToolbar";
import { useStore } from "@/state/store";
import { Drawer } from "@mui/material";
import TextToolbar from "./TextToolbar";
import BackgroundToolbar from "./BackgroundToolbar";
import ImageToolbar from "./ImageToolbar";
import ShadowToolbar from "./ShadowToolbar";
import { drawerCanvas, ghostCanvas } from "@/state/utils";
const drawerWidth = 350;
export default function Toolbar() {
  const activeTool = useStore((s) => s.activeTool);
  const loading = useStore((s) => s.loading);
  // console.log(loading);
  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: {
          width: drawerWidth,
          boxSizing: "border-box",
        },
      }}
      anchor="right"
    >
      {!loading && activeTool && getToolNav(activeTool)}
    </Drawer>
  );
}

function getToolNav(active) {
  drawerCanvas().isDrawingMode = active === ToolName.IMAGE;

  switch (active) {
    case ToolName.EFFECTS:
      return <EffectsToolbar />;
    case ToolName.TEXT:
      return <TextToolbar />;
    case ToolName.BACKGROUND:
      return <BackgroundToolbar />;
    case ToolName.IMAGE:
      return <ImageToolbar />;
    case ToolName.SHADOW:
      return <ShadowToolbar />;
    default:
      return null;
  }
}
