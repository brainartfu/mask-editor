import { useStore } from "@/state/store";
import { state, tools } from "@/state/utils";
import {
  filterNameMessages,
  filterOptionMessages,
} from "@/tools/filter/filter-list";
import { Box, Divider, Drawer, Grid, Slider } from "@mui/material";
import { useEffect, useState } from "react";

const drawerWidth = 350;
export default function EffectsToolbar() {
  const filters = tools().filter.getAll();
  const [active, setActive] = useState(null);
  useEffect(() => {
    tools().filter.syncState();
  }, []);
  return (
    <>
      <Box sx={{ overflow: "auto" }}>
        <Grid container>
          {filters.map((filter) => (
            <Grid item xs={6} className="p-2" key={filter.name}>
              <FilterButton
                active={active}
                setActive={setActive}
                filter={filter}
              />
            </Grid>
          ))}
        </Grid>
        <Divider />
        <Box className="p-6">
          {tools().filter.hasOptions(active?.name) && (
            <FilterOptions filter={active} />
          )}
        </Box>
      </Box>
    </>
  );
}

const FilterButton = ({ filter, active, setActive }) => {
  const isActive = useStore((s) => s.filter.applied.includes(filter.name));
  const isActiveFilter = active?.name === filter.name;
  return (
    <button
      onClick={() => {
        setActive(filter);
        if (isActive) {
          tools().filter.remove(filter.name);
        } else {
          tools().filter.apply(filter.name);
        }
      }}
      className={`btn py-2 ${
        isActive
          ? isActiveFilter
            ? "btn-primary"
            : "btn-active"
          : "btn-outline"
      } w-full text-sm`}
    >
      {filterNameMessages[filter.name].name}
    </button>
  );
};

const FilterOptions = ({ filter }) => {
  const options = filter.options;
  return (
    <div>
      {Object.entries(options).map(([key, value]) => {
        return (
          <Option
            selectedFilter={filter.name}
            name={key}
            value={value}
            key={key}
          />
        );
      })}
    </div>
  );
};

const Option = ({ name, value, selectedFilter }) => {
  const applyValue = (optionName, value) => {
    tools().filter?.applyValue(selectedFilter, optionName, value);
    state().setDirty(true);
  };
  return (
    <div>
      <div>{filterOptionMessages[name]?.name || name}:</div>
      <Slider
        defaultValue={value.current}
        onChange={(e, v) => {
          applyValue(name, v);
        }}
        min={value.min}
        max={value.max}
        step={value.step || 1}
        valueLabelDisplay="auto"
      />
    </div>
  );
};
