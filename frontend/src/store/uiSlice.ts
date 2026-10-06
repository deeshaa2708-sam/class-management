import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface Toast {
  id: string;
  type: "success" | "error" | "info";
  message: string;
}

interface UIState {
  darkMode: boolean;
  toasts: Toast[];
}

const initialState: UIState = {
  darkMode: localStorage.getItem("darkMode") === "true",
  toasts: [],
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    toggleDarkMode(state) {
      state.darkMode = !state.darkMode;
      localStorage.setItem("darkMode", String(state.darkMode));
    },
    addToast(state, action: PayloadAction<Omit<Toast, "id">>) {
      state.toasts.push({ id: crypto.randomUUID(), ...action.payload });
    },
    removeToast(state, action: PayloadAction<string>) {
      state.toasts = state.toasts.filter((t) => t.id !== action.payload);
    },
  },
});

export const { toggleDarkMode, addToast, removeToast } = uiSlice.actions;
export default uiSlice.reducer;
