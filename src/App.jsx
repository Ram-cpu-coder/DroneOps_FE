import { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import AppLayout from "./components/layouts/AppLayout";
import { canAccessRoute, firstAccessibleRoute } from "./features/auth/accessControl";
import {
  authViewChanged,
  loggedOut,
  loginRequested,
  passwordResetRequested,
  signupRequested,
  verificationCompleted
} from "./features/auth/authSlice";
import { routeChanged, searchChanged, themeModeChanged, uiReset } from "./features/ui/uiSlice";
import AuthShell from "./pages/auth/AuthShell";
import Login from "./pages/auth/Login";
import PasswordReset from "./pages/auth/PasswordReset";
import Signup from "./pages/auth/Signup";
import VerifyEmail from "./pages/auth/VerifyEmail";
import { appRoutes } from "./routes/appRoutes";

const App = () => {
  const dispatch = useDispatch();
  const { session, authView, pendingVerification, error, passwordReset } = useSelector((state) => state.auth);
  const { activeRoute, globalSearch, themeMode } = useSelector((state) => state.ui);

  const accessibleRoutes = useMemo(() => {
    if (!session?.user) return [];
    return appRoutes.filter((route) => canAccessRoute(session.user, route));
  }, [session]);

  useEffect(() => {
    if (!session?.user) return;
    if (!accessibleRoutes.some((route) => route.id === activeRoute)) {
      dispatch(routeChanged(firstAccessibleRoute(session.user, appRoutes).id));
    }
  }, [accessibleRoutes, activeRoute, dispatch, session]);

  useEffect(() => {
    document.documentElement.dataset.theme = themeMode;
    window.localStorage.setItem("droneops-theme-mode", themeMode);
  }, [themeMode]);

  const ActivePage = useMemo(() => {
    return accessibleRoutes.find((route) => route.id === activeRoute)?.component ?? accessibleRoutes[0]?.component;
  }, [accessibleRoutes, activeRoute]);

  const handleLogin = (credentials) => {
    dispatch(loginRequested(credentials));
  };

  const handleSignup = (payload) => {
    dispatch(signupRequested(payload));
  };

  const handleVerify = () => {
    dispatch(verificationCompleted());
  };

  const handleLogout = () => {
    dispatch(loggedOut());
    dispatch(uiReset());
  };

  if (!session?.user) {
    return (
      <AuthShell>
        {authView === "login" && (
          <Login
            error={error}
            onLogin={handleLogin}
            onAuthViewChange={(view) => dispatch(authViewChanged(view))}
          />
        )}
        {authView === "signup" && (
          <Signup
            onSignup={handleSignup}
            onAuthViewChange={(view) => dispatch(authViewChanged(view))}
          />
        )}
        {authView === "verify" && (
          <VerifyEmail
            pendingUser={pendingVerification?.user}
            verificationToken={pendingVerification?.token}
            onVerify={handleVerify}
            onAuthViewChange={(view) => dispatch(authViewChanged(view))}
          />
        )}
        {authView === "reset" && (
          <PasswordReset
            result={passwordReset}
            onReset={(email) => dispatch(passwordResetRequested(email))}
            onAuthViewChange={(view) => dispatch(authViewChanged(view))}
          />
        )}
      </AuthShell>
    );
  }

  return (
    <AppLayout
      activeRoute={activeRoute}
      routes={accessibleRoutes}
      user={session.user}
      searchValue={globalSearch}
      themeMode={themeMode}
      onNavigate={(routeId) => dispatch(routeChanged(routeId))}
      onSearchChange={(value) => dispatch(searchChanged(value))}
      onThemeModeChange={(mode) => dispatch(themeModeChanged(mode))}
      onLogout={handleLogout}
    >
      {ActivePage && (
        <ActivePage
          searchValue={globalSearch}
          onNavigate={(routeId) => dispatch(routeChanged(routeId))}
          user={session.user}
        />
      )}
    </AppLayout>
  );
};

export default App;
