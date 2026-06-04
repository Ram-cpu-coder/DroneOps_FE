import Sidebar from "./Sidebar";
import TopBar from "./TopBar";

const AppLayout = ({
  activeRoute,
  routes,
  user,
  searchValue,
  themeMode,
  onNavigate,
  onSearchChange,
  onThemeModeChange,
  onLogout,
  children
}) => {
<<<<<<< HEAD
  const currentRoute = routes.find((route) => route.id === activeRoute) ?? routes[0] ?? {
    label: "DroneOps",
    description: "Your workspace is loading."
  };
=======
  const currentRoute = routes.find((route) => route.id === activeRoute) ?? routes[0];
>>>>>>> a42502c6d700f2717489ee870fd450c6431788f9

  return (
    <div className="app-shell">
      <Sidebar activeRoute={activeRoute} routes={routes} onNavigate={onNavigate} onLogout={onLogout} />
      <main className="workspace">
        <TopBar
          title={currentRoute.label}
          description={currentRoute.description}
          user={user}
          searchValue={searchValue}
          themeMode={themeMode}
          onSearchChange={onSearchChange}
          onThemeModeChange={onThemeModeChange}
        />
        {children}
      </main>
    </div>
  );
};

export default AppLayout;
