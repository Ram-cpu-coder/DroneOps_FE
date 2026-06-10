import { AlertTriangle, Bell, CheckCircle2, Moon, Monitor, RefreshCw, Search, Sun, UserRound } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import LoadingLogo from "../common/LoadingLogo";
import { hasClientPermission } from "../../features/auth/accessControl";
import { droneOpsApi } from "../../services/droneOpsApi";
import { buildNotificationsFromEvents } from "../../utils/activityStream";

const themeOptions = [
  { id: "default", label: "Default", icon: Monitor },
  { id: "dark", label: "Dark", icon: Moon },
  { id: "light", label: "Light", icon: Sun }
];

const TopBar = ({ title, description, user, searchValue, themeMode, onSearchChange, onThemeModeChange }) => {
  const navigate = useNavigate();
  const notificationRef = useRef(null);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notificationError, setNotificationError] = useState("");
  const [isNotificationLoading, setIsNotificationLoading] = useState(false);
  const [lastLoadedAt, setLastLoadedAt] = useState(0);
  const storageKey = useMemo(() => `droneops-read-notifications:${user?.id ?? "anonymous"}`, [user?.id]);
  const [readNotificationIds, setReadNotificationIds] = useState([]);
  const unreadCount = useMemo(
    () => notifications.filter((item) => !readNotificationIds.includes(item.id)).length,
    [notifications, readNotificationIds]
  );

  const canRead = useCallback((permission) => hasClientPermission(user, permission), [user]);

  const loadNotifications = useCallback(async ({ force = false } = {}) => {
    if (!force && lastLoadedAt && Date.now() - lastLoadedAt < 60000) return;

    setIsNotificationLoading(true);
    setNotificationError("");

    try {
      const [auditResult, telemetryResult] = await Promise.all([
        canRead("audit:read") ? droneOpsApi.audit.list({ limit: 20 }).catch(() => []) : [],
        canRead("telemetry:read") ? droneOpsApi.telemetry.live().catch(() => []) : []
      ]);

      setNotifications(buildNotificationsFromEvents({
        auditLogs: auditResult,
        telemetryRows: telemetryResult
      }));
      setLastLoadedAt(Date.now());
    } catch (error) {
      setNotificationError(error.message ?? "Notifications could not be loaded.");
    } finally {
      setIsNotificationLoading(false);
    }
  }, [canRead, lastLoadedAt]);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(storageKey);
      setReadNotificationIds(stored ? JSON.parse(stored) : []);
    } catch {
      setReadNotificationIds([]);
    }
  }, [storageKey]);

  useEffect(() => {
    loadNotifications();
    const intervalId = window.setInterval(() => loadNotifications({ force: true }), 60000);
    return () => window.clearInterval(intervalId);
  }, [loadNotifications]);

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (!notificationRef.current?.contains(event.target)) {
        setIsNotificationsOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  const markNotificationsRead = useCallback((items) => {
    if (!items.length) return;

    setReadNotificationIds((current) => {
      const next = Array.from(new Set([...current, ...items.map((item) => item.id)]));
      window.localStorage.setItem(storageKey, JSON.stringify(next));
      return next;
    });
  }, [storageKey]);

  const handleNotificationClick = () => {
    const nextOpenState = !isNotificationsOpen;
    setIsNotificationsOpen(nextOpenState);
    if (nextOpenState) {
      loadNotifications();
    }
  };

  const handleNotificationItemClick = (item) => {
    markNotificationsRead([item]);
    setIsNotificationsOpen(false);

    if (item.targetPath) {
      navigate(item.targetPath);
    }
  };

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
        <div className="notification-shell" ref={notificationRef}>
          <button
            className="icon-button notification-button"
            type="button"
            aria-label="Notifications"
            aria-expanded={isNotificationsOpen}
            onClick={handleNotificationClick}
          >
            <Bell size={19} />
            {unreadCount > 0 && <span className="notification-badge">{unreadCount > 9 ? "9+" : unreadCount}</span>}
          </button>
          {isNotificationsOpen && (
            <div className="notification-popover" role="dialog" aria-label="User notifications">
              <div className="notification-popover-header">
                <div>
                  <strong>Notifications</strong>
                  <span>{user?.roleLabel ?? "Current user"}</span>
                </div>
                <div className="notification-actions">
                  {unreadCount > 0 && (
                    <button
                      className="notification-read-button"
                      type="button"
                      onClick={() => markNotificationsRead(notifications)}
                    >
                      Mark all read
                    </button>
                  )}
                  <button
                    className="icon-button compact"
                    type="button"
                    aria-label="Refresh notifications"
                    onClick={() => loadNotifications({ force: true })}
                    disabled={isNotificationLoading}
                  >
                    {isNotificationLoading ? <LoadingLogo label="Refreshing notifications" size="xs" compact /> : <RefreshCw size={15} />}
                  </button>
                </div>
              </div>
              <div className="notification-list">
                {isNotificationLoading && notifications.length === 0 && <p className="empty-state">Loading notifications...</p>}
                {notificationError && <p className="empty-state error">{notificationError}</p>}
                {!isNotificationLoading && !notificationError && notifications.length === 0 && (
                  <article className="notification-item">
                    <CheckCircle2 size={18} />
                    <div>
                      <strong>All clear</strong>
                      <p>No notifications for your current role.</p>
                    </div>
                  </article>
                )}
                {notifications.map((item) => {
                  const Icon = item.priority === "info" ? CheckCircle2 : AlertTriangle;
                  return (
                    <button
                      className={`notification-item ${item.priority}`}
                      key={item.id}
                      type="button"
                      onClick={() => handleNotificationItemClick(item)}
                    >
                      <Icon size={18} />
                      <div>
                        <strong>{item.title}</strong>
                        <p>{item.message}</p>
                        <span>{item.time}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
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
