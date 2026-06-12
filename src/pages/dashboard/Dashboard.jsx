import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { Activity, AlertTriangle, MapPin, Plane } from "lucide-react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import LoadingLogo from "../../components/common/LoadingLogo";
import MetricCard from "../../components/common/MetricCard";
import { hasClientPermission } from "../../features/auth/accessControl";
import { routeActionRequested } from "../../features/ui/uiSlice";
import { useApiResource } from "../../hooks/useApiResource";
import { droneOpsApi } from "../../services/droneOpsApi";
import ActivityFeed from "./components/ActivityFeed";
import FleetOverviewTable from "./components/FleetOverviewTable";
import IncidentWatch from "./components/IncidentWatch";
import MissionQueue from "./components/MissionQueue";
import { useFleetSearch } from "../../hooks/useFleetSearch";
import { buildRecentActivityFromAudit, formatRelativeTime } from "../../utils/activityStream";

const metricIcons = [Plane, Activity, AlertTriangle, MapPin];
const GeospatialMap = lazy(() => import("../../components/maps/GeospatialMap"));
const emptyDashboardData = {
  metrics: {
    totalDrones: 0,
    activeMissions: 0,
    openIncidents: 0,
    pendingMaintenance: 0
  },
  activeDrones: [],
  missionQueue: [],
  incidentWatch: [],
  recentActivity: []
};

const Dashboard = ({ searchValue, user, onNavigate }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [showLivePanels, setShowLivePanels] = useState(false);
  const canRead = useCallback((permission) => hasClientPermission(user, permission), [user]);
  const loadTelemetry = useCallback(() => {
    if (!showLivePanels || !canRead("telemetry:read")) return Promise.resolve([]);
    return droneOpsApi.telemetry.live();
  }, [canRead, showLivePanels]);
  const loadDashboardData = useCallback(async () => {
    return droneOpsApi.dashboard.overview();
  }, []);

  const { data: dashboardData, isLoading: isDashboardLoading, error: dashboardError, refresh: refreshDashboard } = useApiResource(
    loadDashboardData,
    emptyDashboardData,
    { cacheKey: `dashboard:${user?.organisationId ?? "unknown"}:${user?.role ?? "role"}`, staleMs: 30000 }
  );
  const { data: telemetryRows } = useApiResource(
    loadTelemetry,
    [],
    { cacheKey: `telemetry-live:${user?.organisationId ?? "unknown"}`, staleMs: 5000, enabled: showLivePanels && canRead("telemetry:read") }
  );

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      refreshDashboard();
    }, 60000);

    return () => window.clearInterval(intervalId);
  }, [refreshDashboard]);
  const summary = dashboardData?.metrics ?? emptyDashboardData.metrics;
  const apiDrones = dashboardData?.activeDrones ?? [];
  const apiMissions = dashboardData?.missionQueue ?? [];
  const apiIncidents = dashboardData?.incidentWatch ?? [];
  const apiAuditLogs = dashboardData?.recentActivity ?? [];

  const dashboardMetrics = useMemo(() => {
    if (isDashboardLoading && !apiDrones.length && !apiMissions.length && !apiIncidents.length) {
      return [
        { label: "Total Drones", value: "...", delta: "Loading backend fleet records", tone: "blue" },
        { label: "Active Missions", value: "...", delta: "Loading mission records", tone: "green" },
        { label: "Open Alerts", value: "...", delta: "Loading incident count", tone: "red" },
        { label: "Maintenance", value: "...", delta: "Loading maintenance records", tone: "purple" }
      ];
    }

    return [
      { label: "Total Drones", value: String(summary.totalDrones ?? 0), delta: "From dashboard overview", tone: "blue" },
      { label: "Active Missions", value: String(summary.activeMissions ?? 0), delta: `${apiMissions.length} priority missions shown`, tone: "green" },
      { label: "Open Alerts", value: String(summary.openIncidents ?? 0), delta: "Open incident records", tone: "red" },
      { label: "Maintenance", value: String(summary.pendingMaintenance ?? 0), delta: "Pending maintenance items", tone: "purple" }
    ];
  }, [apiDrones, apiIncidents, apiMissions, isDashboardLoading, summary]);

  const normalizedDrones = useMemo(() => apiDrones.map((drone) => normalizeDrone(drone, telemetryRows)), [apiDrones, telemetryRows]);
  const filteredDrones = useFleetSearch(normalizedDrones, searchValue);
  const recentActivity = useMemo(() => buildRecentActivityFromAudit(apiAuditLogs), [apiAuditLogs]);
  const dashboardMissions = useMemo(
    () => apiMissions.map(normalizeMissionCard).slice(0, 3),
    [apiMissions]
  );

  const handleNewMission = () => {
    dispatch(routeActionRequested({ routeId: "missions", action: "create" }));
    onNavigate?.("missions");
  };

  return (
    <>
      <section className="stats-grid" aria-label="Fleet summary">
        {dashboardMetrics.map((metric, index) => (
          <MetricCard key={metric.label} {...metric} icon={metricIcons[index]} />
        ))}
      </section>

      <section className="content-grid dashboard-grid">
        {dashboardError && <div className="auth-alert dashboard-alert">Some dashboard data could not be loaded: {dashboardError}</div>}
        <FleetOverviewTable
          drones={filteredDrones.slice(0, 5)}
          isLoading={isDashboardLoading}
          onDroneSelect={(drone) => navigate(`/fleet/${encodeURIComponent(drone.uuid ?? drone.id)}`)}
        />
        {showLivePanels && canRead("telemetry:read") ? (
          <Suspense fallback={<div className="panel map-panel map-loading"><LoadingLogo label="Loading telemetry map" /></div>}>
            <GeospatialMap />
          </Suspense>
        ) : (
          <div className="panel map-panel map-loading map-deferred">
            <div>
              <span className="eyebrow">Telemetry Map</span>
              <h3>Live map loads on demand</h3>
              <p>Dashboard records are ready first. Open the map when you need live drone positions and geofence overlays.</p>
              {canRead("telemetry:read") ? (
                <button className="primary-btn compact" type="button" onClick={() => setShowLivePanels(true)}>
                  Open Live Map
                </button>
              ) : (
                <span>Telemetry access is not enabled for this role.</span>
              )}
            </div>
          </div>
        )}
        <MissionQueue
          missions={dashboardMissions}
          canCreate={canRead("missions:manage")}
          isLoading={isDashboardLoading}
          onCreateMission={handleNewMission}
        />
        <ActivityFeed activity={recentActivity} isLoading={isDashboardLoading} />
        <IncidentWatch incidents={apiIncidents.map(normalizeIncidentCard).slice(0, 2)} />
      </section>
    </>
  );
};

const normalizeDrone = (drone, telemetryRows = []) => {
  const latestTelemetry = findTelemetry(drone, telemetryRows);

  return {
    ...drone,
    uuid: drone.id,
    id: drone.droneCode ?? drone.id,
    battery: latestTelemetry?.battery.level ?? drone.latestTelemetry?.batteryLevel ?? drone.battery ?? 0,
    signal: latestTelemetry?.signal.strength ?? drone.signal ?? 0,
    latestTelemetry,
    flightHours: drone.flightHours ?? 0,
    nextMaintenance: drone.nextMaintenanceDate ? new Date(drone.nextMaintenanceDate).toLocaleDateString() : (drone.nextMaintenance ?? "Not scheduled"),
    location: latestTelemetry
      ? `${Number(latestTelemetry.location.latitude).toFixed(4)}, ${Number(latestTelemetry.location.longitude).toFixed(4)}`
      : (drone.location ?? "No live position")
  };
};

const findTelemetry = (drone, telemetryRows = []) => {
  return telemetryRows.find((row) => row.drone?.id === drone.id || row.drone?.droneCode === drone.droneCode)?.telemetry;
};

const normalizeMissionCard = (mission) => ({
  id: mission.id,
  name: mission.name ?? mission.missionCode ?? "Untitled mission",
  drone: mission.drone?.droneCode ?? mission.drone ?? "Unassigned drone",
  eta: mission.eta ?? (mission.plannedStartAt ? new Date(mission.plannedStartAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Not scheduled"),
  progress: Number(mission.progress ?? (mission.status === "COMPLETED" ? 100 : mission.status === "ACTIVE" ? 55 : 0)),
  risk: mission.riskAssessment?.level ?? mission.risk ?? "Pending"
});

const normalizeIncidentCard = (incident) => ({
  id: incident.id,
  title: incident.title ?? incident.incidentCode ?? "Untitled incident",
  place: incident.location ?? incident.drone?.droneCode ?? "Location not recorded",
  time: incident.updatedAt ? formatRelativeTime(incident.updatedAt) : "Recently updated",
  status: incident.status,
  severity: incident.severity
});

export default Dashboard;
