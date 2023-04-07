import { setActiveTool } from "@/objects/bind-to-fabric-selection-events";
import { useStore } from "@/state/store";
import { state, tools } from "@/state/utils";
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
} from "@mui/material";
import { toast } from "react-hot-toast";
const drawerWidth = 240;
export default function Sidebar() {
  const navItems = useStore((s) => s.config.ui?.nav?.items) || [];
  const activeTool = useStore((s) => s.activeTool);
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
    >
      <Toolbar />
      <Box sx={{ overflow: "auto" }}>
        <List>
          {navItems.map((item) => (
            <ListItem key={item.name} disablePadding>
              <ListItemButton
                selected={activeTool === item.name}
                onClick={async () => {
                  if (!tools().canvas.getMainImage()) {
                    toast.error("Please add an image first...");
                    return;
                  }
                  await state().applyChanges();
                  if (activeTool === item.name) {
                    state().setActiveTool(null, null);
                  } else {
                    if (typeof item.action === "string") {
                      setActiveTool(item.action);
                    }
                  }
                }}
              >
                <ListItemIcon>
                  <item.icon size={20} />
                </ListItemIcon>
                <ListItemText
                  primary={<span className="capitalize">{item.name}</span>}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Box>
    </Drawer>
  );
}
