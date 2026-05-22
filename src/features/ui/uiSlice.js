import { createSlice } from "@reduxjs/toolkit";

const uiSlice = createSlice({
  name: "ui",
  initialState: {
    activeRoute: "dashboard",
    globalSearch: ""
  },
  reducers: {
    routeChanged(state, action) {
      state.activeRoute = action.payload;
    },
    searchChanged(state, action) {
      state.globalSearch = action.payload;
    },
    uiReset(state) {
      state.activeRoute = "dashboard";
      state.globalSearch = "";
    }
  }
});

export const { routeChanged, searchChanged, uiReset } = uiSlice.actions;

export default uiSlice.reducer;
