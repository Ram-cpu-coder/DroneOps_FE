import { LogOut, Plane } from "lucide-react";

const Sidebar = ({ activeRoute, routes, onNavigate, onLogout }) => {
  const primaryRoutes = routes.filter((route) => !route.secondary);
  const secondaryRoutes = routes.filter((route) => route.secondary);

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">
          <Plane size={24} strokeWidth={2.4} />
        </div>
        <div>
          <h1>DroneOps</h1>
          <p>Fleet Management</p>
        </div>
      </div>

      <nav className="nav-list" aria-label="Primary navigation">
        {primaryRoutes.map((route) => (
          <SidebarButton
            key={route.id}
            route={route}
            active={activeRoute === route.id}
            onNavigate={onNavigate}
          />
        ))}
      </nav>

      <div className="sidebar-footer">
        {secondaryRoutes.map((route) => (
          <SidebarButton
            key={route.id}
            route={route}
            active={activeRoute === route.id}
            onNavigate={onNavigate}
          />
        ))}
        <button className="nav-item logout" type="button" onClick={onLogout}>
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

const SidebarButton = ({ route, active, onNavigate }) => {
  const Icon = route.icon;

  return (
    <button
      type="button"
      className={`nav-item ${active ? "active" : ""}`}
      onClick={() => onNavigate(route.id)}
      aria-current={active ? "page" : undefined}
    >
      <Icon size={20} />
      <span>{route.label}</span>
    </button>
  );
};

export default Sidebar;
