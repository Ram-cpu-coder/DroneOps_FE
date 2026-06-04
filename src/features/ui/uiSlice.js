import { createSlice } from "@reduxjs/toolkit";

const getInitialThemeMode = () => {
  if (typeof window === "undefined") return "default";
  return window.localStorage.getItem("droneops-theme-mode") ?? "default";
};

const uiSlice = createSlice({
  name: "ui",
  initialState: {
    activeRoute: "dashboard",
    globalSearch: "",
    themeMode: getInitialThemeMode()
  },
  reducers: {
    routeChanged(state, action) {
      state.activeRoute = action.payload;
    },
    searchChanged(state, action) {
      state.globalSearch = action.payload;
    },
    themeModeChanged(state, action) {
      state.themeMode = action.payload;
    },
    uiReset(state) {
      state.activeRoute = "dashboard";
      state.globalSearch = "";
    }
  }
});

export const { routeChanged, searchChanged, themeModeChanged, uiReset } = uiSlice.actions;

export default uiSlice.reducer;
