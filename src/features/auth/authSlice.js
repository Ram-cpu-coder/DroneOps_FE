import { createSlice } from "@reduxjs/toolkit";
import { authService } from "./authService";

const initialState = {
  session: authService.getSession(),
  authView: "login",
  pendingVerification: null,
  error: ""
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    loginRequested(state, action) {
      const result = authService.login(action.payload);
      state.error = "";

      if (result.ok) {
        state.session = result.session;
        state.authView = "login";
        state.pendingVerification = null;
        return;
      }

      if (result.requiresVerification) {
        state.authView = "verify";
        state.pendingVerification = {
          user: result.user,
          token: "mock.verify.existing-user"
        };
        return;
      }

      state.error = result.message;
    },
    signupRequested(state, action) {
      const result = authService.signup(action.payload);
      if (result.ok) {
        state.authView = "verify";
        state.error = "";
        state.pendingVerification = {
          user: result.user,
          token: result.verificationToken
        };
      }
    },
    verificationCompleted(state) {
      if (!state.pendingVerification?.user) return;
      state.session = authService.verifyEmail(state.pendingVerification.user);
      state.pendingVerification = null;
      state.authView = "login";
      state.error = "";
    },
    passwordResetRequested(state, action) {
      state.passwordReset = authService.requestPasswordReset(action.payload);
    },
    authViewChanged(state, action) {
      state.authView = action.payload;
      state.error = "";
    },
    loggedOut(state) {
      authService.logout();
      state.session = null;
      state.authView = "login";
      state.pendingVerification = null;
      state.error = "";
    }
  }
});

export const {
  authViewChanged,
  loggedOut,
  loginRequested,
  passwordResetRequested,
  signupRequested,
  verificationCompleted
} = authSlice.actions;

export default authSlice.reducer;
