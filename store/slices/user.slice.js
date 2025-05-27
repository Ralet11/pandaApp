// ─────────────────────────────────────────────────────────────────────────────
// frontend/redux/slices/user.slice.js
// ─────────────────────────────────────────────────────────────────────────────
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  userInfo: null,
  token:     null,
  isAuthenticated: false,
  addresses: [],
  currentAddress: null,
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    /* payload: { user, token }  ó  solo user */
    setUser: (state, action) => {
      if (action.payload?.user) {
        state.userInfo = action.payload.user;
        state.token    = action.payload.token ?? state.token;
      } else {
        state.userInfo = action.payload;
      }
      state.isAuthenticated = true;
    },
    setToken: (state, action) => {
      state.token = action.payload;
    },
    clearUser: () => ({ ...initialState }),
    logout:    () => ({ ...initialState }),
    setAddresses: (state, action) => {
      state.addresses = action.payload;
    },
    setCurrentAddress: (state, action) => {
      state.currentAddress = action.payload;
    },
  },
});

export const {
  setUser,
  setToken,
  clearUser,
  logout,
  setAddresses,
  setCurrentAddress,
} = userSlice.actions;

export default userSlice.reducer;
