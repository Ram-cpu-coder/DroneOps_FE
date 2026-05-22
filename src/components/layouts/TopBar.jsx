import { Bell, Search, UserRound } from "lucide-react";

const TopBar = ({ title, description, user, searchValue, onSearchChange }) => {
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
        <div className="operator">
          <UserRound size={18} />
          <span>{user?.roleLabel ?? "Ops Lead"}</span>
        </div>
      </div>
    </header>
  );
};

export default TopBar;
