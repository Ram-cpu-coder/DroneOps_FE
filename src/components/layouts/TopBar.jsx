import { Bell, Moon, Monitor, Search, Sun, UserRound } from "lucide-react";

const themeOptions = [
  { id: "default", label: "Default", icon: Monitor },
  { id: "dark", label: "Dark", icon: Moon },
  { id: "light", label: "Light", icon: Sun }
];

const TopBar = ({ title, description, user, searchValue, themeMode, onSearchChange, onThemeModeChange }) => {
  return (
    <header className="topbar">
      <div>
        <p className="eyebrow">Operations Center</p>
        <h2>{title}</h2>
        <p className="subtitle">{description}</p>
      </div>
      <div className="topbar-actions">
        <label className="search-box">
          <Search size={18} />
          <input
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search drones, missions, incidents"
          />
        </label>
        <button className="icon-button" type="button" aria-label="Notifications">
          <Bell size={19} />
        </button>
        <div className="theme-switcher" aria-label="Theme mode">
          {themeOptions.map((option) => {
            const Icon = option.icon;
            const isActive = themeMode === option.id;
            return (
              <button
                key={option.id}
                className={isActive ? "active" : ""}
                type="button"
                onClick={() => onThemeModeChange(option.id)}
                aria-pressed={isActive}
                title={`${option.label} mode`}
              >
                <Icon size={16} />
                <span>{option.label}</span>
              </button>
            );
          })}
        </div>
        <div className="operator">
          <UserRound size={18} />
          <span>{user?.roleLabel ?? "Ops Lead"}</span>
        </div>
      </div>
    </header>
  );
};

export default TopBar;
