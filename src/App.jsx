import { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import AppLayout from "./components/layouts/AppLayout";
import { canAccessRoute, firstAccessibleRoute } from "./features/auth/accessControl";
import {
  authViewChanged,
  googleLoginRequested,
  googleProfileCompleted,
  loggedOut,
  loginRequested,
  passwordResetRequested,
  signupRequested,
  verificationCompleted
} from "./features/auth/authSlice";
import { routeChanged, searchChanged, themeModeChanged, uiReset } from "./features/ui/uiSlice";
import AuthShell from "./pages/auth/AuthShell";
import GoogleProfileSetup from "./pages/auth/GoogleProfileSetup";
import Login from "./pages/auth/Login";
import PasswordReset from "./pages/auth/PasswordReset";
import Signup from "./pages/auth/Signup";
import VerifyEmail from "./pages/auth/VerifyEmail";
import { appRoutes } from "./routes/appRoutes";

const App = () => {
  const dispatch = useDispatch();
<<<<<<< HEAD
  const { session, authView, pendingVerification, pendingGoogleProfile, error, passwordReset, isLoading } = useSelector((state) => state.auth);
=======
  const { session, authView, pendingVerification, error, passwordReset } = useSelector((state) => state.auth);
>>>>>>> a42502c6d700f2717489ee870fd450c6431788f9
  const { activeRoute, globalSearch, themeMode } = useSelector((state) => state.ui);

  const accessibleRoutes = useMemo(() => {
    if (!session?.user) return [];
    return appRoutes.filter((route) => canAccessRoute(session.user, route));
  }, [session]);

  useEffect(() => {
    if (!session?.user) return;
    if (!accessibleRoutes.some((route) => route.id === activeRoute)) {
      const nextRoute = firstAccessibleRoute(session.user, appRoutes);
      if (nextRoute?.id) dispatch(routeChanged(nextRoute.id));
    }
  }, [accessibleRoutes, activeRoute, dispatch, session]);

  useEffect(() => {
    document.documentElement.dataset.theme = themeMode;
    window.localStorage.setItem("droneops-theme-mode", themeMode);
  }, [themeMode]);

<<<<<<< HEAD
  useEffect(() => {
    const handleSessionExpired = () => {
      dispatch(loggedOut());
      dispatch(uiReset());
    };

    window.addEventListener("droneops:session-expired", handleSessionExpired);
    return () => window.removeEventListener("droneops:session-expired", handleSessionExpired);
  }, [dispatch]);

=======
>>>>>>> a42502c6d700f2717489ee870fd450c6431788f9
  const ActivePage = useMemo(() => {
    return accessibleRoutes.find((route) => route.id === activeRoute)?.component ?? accessibleRoutes[0]?.component;
  }, [accessibleRoutes, activeRoute]);

  const handleLogin = (credentials) => {
    dispatch(loginRequested(credentials));
  };

  const handleGoogleLogin = (credential) => {
    dispatch(googleLoginRequested(credential));
  };

  const handleSignup = (payload) => {
    dispatch(signupRequested(payload));
  };

  const handleVerify = () => {
    dispatch(verificationCompleted(pendingVerification?.devVerificationToken));
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
            isLoading={isLoading}
            onLogin={handleLogin}
            onGoogleLogin={handleGoogleLogin}
            onAuthViewChange={(view) => dispatch(authViewChanged(view))}
          />
        )}
        {authView === "signup" && (
          <Signup
            onSignup={handleSignup}
            error={error}
            isLoading={isLoading}
            onAuthViewChange={(view) => dispatch(authViewChanged(view))}
          />
        )}
        {authView === "google_onboarding" && (
          <GoogleProfileSetup
            pendingGoogleProfile={pendingGoogleProfile}
            error={error}
            isLoading={isLoading}
            onComplete={(payload) => dispatch(googleProfileCompleted(payload))}
            onAuthViewChange={(view) => dispatch(authViewChanged(view))}
          />
        )}
        {authView === "verify" && (
          <VerifyEmail
            pendingUser={pendingVerification?.user}
            emailSent={pendingVerification?.emailSent}
            emailError={pendingVerification?.emailError}
            canUseLocalVerification={Boolean(pendingVerification?.devVerificationToken)}
            onVerify={handleVerify}
            onAuthViewChange={(view) => dispatch(authViewChanged(view))}
          />
        )}
        {authView === "reset" && (
          <PasswordReset
            result={passwordReset}
            error={error}
            isLoading={isLoading}
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
