import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  token: null, 
  user: null,  
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setToken: (state, action) => {
      state.token = action.payload;
    },
    clearToken: (state) => {
      state.token = null;
    },
    setUser: (state, action) => {
      state.user = action.payload;
    },
    clearUser: (state) => {
      state.user = null;
    },
  },
});

export const { setToken, clearToken, setUser, clearUser } = authSlice.actions;

export default authSlice.reducer;
