import { useCallback, useEffect, useMemo, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import AppLayout from "./components/layouts/AppLayout";
import LoadingLogo from "./components/common/LoadingLogo";
import { canAccessRoute, firstAccessibleRoute } from "./features/auth/accessControl";
import {
  authViewChanged,
  googleLoginRequested,
  googleProfileCompleted,
  loggedOut,
  loginRequested,
  passwordResetRequested,
  sessionRestoreRequested,
  signupRequested,
  verificationCompleted
} from "./features/auth/authSlice";
import { routeActionCleared, routeChanged, searchChanged, themeModeChanged, uiReset } from "./features/ui/uiSlice";
import AuthShell from "./pages/auth/AuthShell";
import GoogleProfileSetup from "./pages/auth/GoogleProfileSetup";
import Login from "./pages/auth/Login";
import PasswordReset from "./pages/auth/PasswordReset";
import Signup from "./pages/auth/Signup";
import VerifyEmail from "./pages/auth/VerifyEmail";
import { appRoutes } from "./routes/appRoutes";

const authPathToView = {
  "/login": "login",
  "/signup": "signup",
  "/verify": "verify",
  "/reset": "reset",
  "/google-setup": "google_onboarding"
};

const authViewToPath = {
  login: "/login",
  signup: "/signup",
  verify: "/verify",
  reset: "/reset",
  google_onboarding: "/google-setup"
};

const App = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const restoredRouteHandledRef = useRef(false);
  const { session, authView, pendingVerification, pendingGoogleProfile, error, passwordReset, isLoading, isBootstrapping, restoredSession } = useSelector((state) => state.auth);
  const { activeRoute, globalSearch, pendingRouteAction, themeMode } = useSelector((state) => state.ui);

  const accessibleRoutes = useMemo(() => {
    if (!session?.user) return [];
    return appRoutes.filter((route) => canAccessRoute(session.user, route));
  }, [session]);

  const currentAppRoute = useMemo(
    () => accessibleRoutes.find((route) => location.pathname === route.path || location.pathname.startsWith(`${route.path}/`)) ?? null,
    [accessibleRoutes, location.pathname]
  );

  useEffect(() => {
    document.documentElement.dataset.theme = themeMode;
    window.localStorage.setItem("droneops-theme-mode", themeMode);
  }, [themeMode]);

  useEffect(() => {
    dispatch(sessionRestoreRequested());
  }, [dispatch]);

  useEffect(() => {
    const handleSessionExpired = () => {
      dispatch(loggedOut());
      dispatch(uiReset());
      navigate("/login", { replace: true });
    };

    window.addEventListener("droneops:session-expired", handleSessionExpired);
    return () => window.removeEventListener("droneops:session-expired", handleSessionExpired);
  }, [dispatch, navigate]);

  useEffect(() => {
    if (isBootstrapping) return;

    if (!session?.user) {
      const nextAuthView = authPathToView[location.pathname] ?? authView;
      const nextAuthPath = authViewToPath[nextAuthView] ?? "/login";

      if (nextAuthView !== authView) {
        dispatch(authViewChanged(nextAuthView));
      }

      if (location.pathname !== nextAuthPath) {
        navigate(nextAuthPath, { replace: true });
      }
      return;
    }

    const nextRoute = currentAppRoute ?? firstAccessibleRoute(session.user, appRoutes);
    if (!nextRoute) return;

    if (activeRoute !== nextRoute.id) {
      dispatch(routeChanged(nextRoute.id));
    }

    if (!currentAppRoute && location.pathname !== nextRoute.path) {
      navigate(nextRoute.path, { replace: true });
    }
  }, [activeRoute, authView, currentAppRoute, dispatch, isBootstrapping, location.pathname, navigate, session]);

  useEffect(() => {
    if (!restoredSession || restoredRouteHandledRef.current || !session?.user) return;

    restoredRouteHandledRef.current = true;
    if (location.pathname !== "/dashboard") {
      dispatch(routeChanged("dashboard"));
      navigate("/dashboard", { replace: true });
    }
  }, [dispatch, location.pathname, navigate, restoredSession, session]);

  const handleNavigate = useCallback((routeId) => {
    const nextRoute = accessibleRoutes.find((route) => route.id === routeId);
    if (!nextRoute) return;
    dispatch(routeChanged(nextRoute.id));
    navigate(nextRoute.path);
  }, [accessibleRoutes, dispatch, navigate]);

  const handleAuthViewChange = useCallback((view) => {
    dispatch(authViewChanged(view));
    navigate(authViewToPath[view] ?? "/login");
  }, [dispatch, navigate]);

  const handleLogin = useCallback((credentials) => {
    dispatch(loginRequested(credentials));
  }, [dispatch]);

  const handleGoogleLogin = useCallback((credential) => {
    dispatch(googleLoginRequested(credential));
  }, [dispatch]);

  const handleSignup = useCallback((payload) => {
    dispatch(signupRequested(payload));
  }, [dispatch]);

  const handleVerify = useCallback(() => {
    dispatch(verificationCompleted(pendingVerification?.devVerificationToken));
  }, [dispatch, pendingVerification]);

  const handleLogout = useCallback(() => {
    dispatch(loggedOut());
    dispatch(uiReset());
    navigate("/login", { replace: true });
  }, [dispatch, navigate]);

  const shouldResetRestoredRoute = restoredSession && !restoredRouteHandledRef.current && session?.user && location.pathname !== "/dashboard";
  const ActivePage = currentAppRoute?.component ?? accessibleRoutes[0]?.component;
  const resolvedActiveRoute = currentAppRoute?.id ?? accessibleRoutes[0]?.id ?? activeRoute;

  if (isBootstrapping || shouldResetRestoredRoute) {
    return (
      <div className="app-boot-screen">
        <LoadingLogo label="Restoring DroneOps session" size="lg" />
        <p>Checking your session before loading operations data.</p>
      </div>
    );
  }

  if (!session?.user) {
    return (
      <AuthShell
        themeMode={themeMode}
        onThemeModeChange={(mode) => dispatch(themeModeChanged(mode))}
      >
        {authView === "login" && (
          <Login
            error={error}
            isLoading={isLoading}
            onLogin={handleLogin}
            onGoogleLogin={handleGoogleLogin}
            onAuthViewChange={handleAuthViewChange}
          />
        )}
        {authView === "signup" && (
          <Signup
            onSignup={handleSignup}
            error={error}
            isLoading={isLoading}
            onAuthViewChange={handleAuthViewChange}
          />
        )}
        {authView === "google_onboarding" && (
          <GoogleProfileSetup
            pendingGoogleProfile={pendingGoogleProfile}
            error={error}
            isLoading={isLoading}
            onComplete={(payload) => dispatch(googleProfileCompleted(payload))}
            onAuthViewChange={handleAuthViewChange}
          />
        )}
        {authView === "verify" && (
          <VerifyEmail
            pendingUser={pendingVerification?.user}
            emailSent={pendingVerification?.emailSent}
            emailError={pendingVerification?.emailError}
            canUseLocalVerification={Boolean(pendingVerification?.devVerificationToken)}
            onVerify={handleVerify}
            onAuthViewChange={handleAuthViewChange}
          />
        )}
        {authView === "reset" && (
          <PasswordReset
            result={passwordReset}
            error={error}
            isLoading={isLoading}
            onReset={(email) => dispatch(passwordResetRequested(email))}
            onAuthViewChange={handleAuthViewChange}
          />
        )}
      </AuthShell>
    );
  }

  return (
    <AppLayout
      activeRoute={resolvedActiveRoute}
      routes={accessibleRoutes}
      user={session.user}
      searchValue={globalSearch}
      themeMode={themeMode}
      onNavigate={handleNavigate}
      onSearchChange={(value) => dispatch(searchChanged(value))}
      onThemeModeChange={(mode) => dispatch(themeModeChanged(mode))}
      onLogout={handleLogout}
    >
      {ActivePage && (
        <ActivePage
          searchValue={globalSearch}
          onNavigate={handleNavigate}
          pendingRouteAction={pendingRouteAction}
          onRouteActionHandled={() => dispatch(routeActionCleared())}
          user={session.user}
        />
      )}
    </AppLayout>
  );
};

export default App;
