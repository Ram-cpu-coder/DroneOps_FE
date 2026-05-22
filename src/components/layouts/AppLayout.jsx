import Sidebar from "./Sidebar";
import TopBar from "./TopBar";

const AppLayout = ({ activeRoute, routes, user, searchValue, onNavigate, onSearchChange, onLogout, children }) => {
  const currentRoute = routes.find((route) => route.id === activeRoute) ?? routes[0];

  return (
    <div className="app-shell">
      <Sidebar activeRoute={activeRoute} routes={routes} onNavigate={onNavigate} onLogout={onLogout} />
      <main className="workspace">
        <TopBar
          title={currentRoute.label}
          description={currentRoute.description}
          user={user}
          searchValue={searchValue}
          onSearchChange={onSearchChange}
        />
        {children}
      </main>
    </div>
  );
};

export default AppLayout;
