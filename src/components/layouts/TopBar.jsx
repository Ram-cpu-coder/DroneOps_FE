import { AlertTriangle, Bell, CheckCircle2, LoaderCircle, Moon, Monitor, RefreshCw, Search, Sun, UserRound } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { hasClientPermission } from "../../features/auth/accessControl";
import { droneOpsApi } from "../../services/droneOpsApi";

const themeOptions = [
  { id: "default", label: "Default", icon: Monitor },
  { id: "dark", label: "Dark", icon: Moon },
  { id: "light", label: "Light", icon: Sun }
];

const TopBar = ({ title, description, user, searchValue, themeMode, onSearchChange, onThemeModeChange }) => {
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notificationError, setNotificationError] = useState("");
  const [isNotificationLoading, setIsNotificationLoading] = useState(false);
  const [lastLoadedAt, setLastLoadedAt] = useState(0);
  const storageKey = useMemo(() => `droneops-read-notifications:${user?.id ?? "anonymous"}`, [user?.id]);
  const [readNotificationIds, setReadNotificationIds] = useState([]);
  const unreadCount = useMemo(
    () => notifications.filter((item) => item.priority !== "info" && !readNotificationIds.includes(item.id)).length,
    [notifications, readNotificationIds]
  );

  const canRead = useCallback((permission) => hasClientPermission(user, permission), [user]);

  const loadNotifications = useCallback(async ({ force = false } = {}) => {
    if (!force && lastLoadedAt && Date.now() - lastLoadedAt < 60000) return;

    setIsNotificationLoading(true);
    setNotificationError("");

    try {
      const [dronesResult, missionsResult, incidentsResult, telemetryResult] = await Promise.all([
        canRead("fleet") ? droneOpsApi.drones.list().catch(() => []) : [],
        canRead("missions") ? droneOpsApi.missions.list().catch(() => []) : [],
        canRead("incidents") ? droneOpsApi.incidents.list().catch(() => []) : [],
        canRead("telemetry:read") ? droneOpsApi.telemetry.live().catch(() => []) : []
      ]);

      setNotifications(buildNotifications({
        drones: dronesResult,
        missions: missionsResult,
        incidents: incidentsResult,
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
      markNotificationsRead(notifications);
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
        <div className="notification-shell">
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
                    {isNotificationLoading ? <LoaderCircle className="button-spinner" size={15} /> : <RefreshCw size={15} />}
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
                    <article className={`notification-item ${item.priority}`} key={item.id}>
                      <Icon size={18} />
                      <div>
                        <strong>{item.title}</strong>
                        <p>{item.message}</p>
                        <span>{item.time}</span>
                      </div>
                    </article>
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

const buildNotifications = ({ drones = [], missions = [], incidents = [], telemetryRows = [] }) => {
  const items = [
    ...drones
      .filter((drone) => ["GROUNDED", "MAINTENANCE", "DISCONNECTED"].includes(drone.status))
      .map((drone) => ({
        id: `drone-${drone.id}`,
        title: `${drone.droneCode ?? "Drone"} needs attention`,
        message: `Status is ${formatStatus(drone.status)}.`,
        priority: drone.status === "GROUNDED" || drone.status === "DISCONNECTED" ? "critical" : "warning",
        timestamp: drone.updatedAt
      })),
    ...missions
      .filter((mission) => ["ACTIVE", "PLANNED", "APPROVED"].includes(mission.status))
      .slice(0, 4)
      .map((mission) => ({
        id: `mission-${mission.id}`,
        title: mission.status === "ACTIVE" ? "Mission active" : "Mission scheduled",
        message: `${mission.name ?? mission.missionCode ?? "Mission"} is ${formatStatus(mission.status)}.`,
        priority: mission.status === "ACTIVE" ? "info" : "warning",
        timestamp: mission.updatedAt ?? mission.plannedStartAt
      })),
    ...incidents
      .filter((incident) => !["CLOSED", "RESOLVED"].includes(incident.status))
      .map((incident) => ({
        id: `incident-${incident.id}`,
        title: "Open incident",
        message: `${incident.title ?? incident.incidentCode ?? "Incident"} is ${formatStatus(incident.status)}.`,
        priority: ["HIGH", "CRITICAL"].includes(incident.severity) ? "critical" : "warning",
        timestamp: incident.updatedAt ?? incident.createdAt
      })),
    ...telemetryRows.flatMap((row) => {
      const telemetry = row.telemetry ?? row;
      const droneLabel = row.drone?.droneCode ?? telemetry.droneId ?? "Drone";
      const alerts = [];
      if (Number(telemetry.battery?.level ?? telemetry.batteryLevel) < 20) {
        alerts.push({
          id: `battery-${row.drone?.id ?? telemetry.droneId ?? droneLabel}`,
          title: "Low battery",
          message: `${droneLabel} battery is at ${telemetry.battery?.level ?? telemetry.batteryLevel}%.`,
          priority: "critical",
          timestamp: telemetry.timestamp
        });
      }
      if (Number(telemetry.signal?.strength ?? telemetry.signalStrength) < 45) {
        alerts.push({
          id: `signal-${row.drone?.id ?? telemetry.droneId ?? droneLabel}`,
          title: "Weak signal",
          message: `${droneLabel} signal strength is ${telemetry.signal?.strength ?? telemetry.signalStrength}%.`,
          priority: "warning",
          timestamp: telemetry.timestamp
        });
      }
      return alerts;
    })
  ];

  return items
    .filter((item) => item.timestamp)
    .sort((left, right) => new Date(right.timestamp) - new Date(left.timestamp))
    .slice(0, 8)
    .map((item) => ({ ...item, time: formatRelativeTime(item.timestamp) }));
};

const formatStatus = (status = "") => status.toString().toLowerCase().replaceAll("_", " ");

const formatRelativeTime = (timestamp) => {
  const date = new Date(timestamp);
  const diffMinutes = Math.max(0, Math.floor((Date.now() - date.getTime()) / 60000));
  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes} min ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} hr${diffHours === 1 ? "" : "s"} ago`;
  return date.toLocaleDateString();
};

export default TopBar;
