import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { Activity, AlertTriangle, MapPin, Plane } from "lucide-react";
import { useDispatch } from "react-redux";
import MetricCard from "../../components/common/MetricCard";
import { hasClientPermission } from "../../features/auth/accessControl";
import { routeActionRequested, routeChanged } from "../../features/ui/uiSlice";
import { useApiResource } from "../../hooks/useApiResource";
import { droneOpsApi } from "../../services/droneOpsApi";
import ActivityFeed from "./components/ActivityFeed";
import FleetOverviewTable from "./components/FleetOverviewTable";
import IncidentWatch from "./components/IncidentWatch";
import MissionQueue from "./components/MissionQueue";
import { useFleetSearch } from "../../hooks/useFleetSearch";
import DroneProfileDialog from "../fleet/components/DroneProfileDialog";

const metricIcons = [Plane, Activity, AlertTriangle, MapPin];
const GeospatialMap = lazy(() => import("../../components/maps/GeospatialMap"));
const emptyDashboardData = {
  summary: null,
  drones: [],
  missions: [],
  incidents: [],
  reports: [],
  maintenance: []
};

const Dashboard = ({ searchValue, user }) => {
  const dispatch = useDispatch();
  const [selectedDrone, setSelectedDrone] = useState(null);
  const [showLivePanels, setShowLivePanels] = useState(false);
  const canRead = useCallback((permission) => hasClientPermission(user, permission), [user]);
  const loadTelemetry = useCallback(() => {
    if (!showLivePanels || !canRead("telemetry:read")) return Promise.resolve([]);
    return droneOpsApi.telemetry.live();
  }, [canRead, showLivePanels]);
  const loadDashboardData = useCallback(async () => {
    const [summaryResult, dronesResult, missionsResult, incidentsResult, reportsResult, maintenanceResult] = await Promise.all([
      canRead("reports:read") ? droneOpsApi.reports.summary().catch(() => null) : null,
      canRead("fleet") || canRead("drones:read") ? droneOpsApi.drones.list().catch(() => []) : [],
      canRead("missions") || canRead("missions:read") ? droneOpsApi.missions.list().catch(() => []) : [],
      canRead("incidents") || canRead("incidents:read") ? droneOpsApi.incidents.list().catch(() => []) : [],
      canRead("reports") || canRead("reports:read") ? droneOpsApi.reports.list().catch(() => []) : [],
      canRead("maintenance:manage") ? droneOpsApi.maintenance.list().catch(() => []) : []
    ]);

    return {
      summary: summaryResult,
      drones: dronesResult,
      missions: missionsResult,
      incidents: incidentsResult,
      reports: reportsResult,
      maintenance: maintenanceResult
    };
  }, [canRead]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setShowLivePanels(true), 1200);
    return () => window.clearTimeout(timeoutId);
  }, []);

  const { data: dashboardData, isLoading: isDashboardLoading, error: dashboardError, refresh: refreshDashboard } = useApiResource(loadDashboardData, emptyDashboardData);
  const { data: telemetryRows } = useApiResource(loadTelemetry, []);
  const summary = dashboardData?.summary;
  const apiDrones = dashboardData?.drones ?? [];
  const apiMissions = dashboardData?.missions ?? [];
  const apiIncidents = dashboardData?.incidents ?? [];
  const apiReports = dashboardData?.reports ?? [];
  const apiMaintenance = dashboardData?.maintenance ?? [];

  const dashboardMetrics = useMemo(() => {
    if (isDashboardLoading && !apiDrones.length && !apiMissions.length && !apiIncidents.length) {
      return [
        { label: "Total Drones", value: "...", delta: "Loading backend fleet records", tone: "blue" },
        { label: "Active Missions", value: "...", delta: "Loading mission records", tone: "green" },
        { label: "Open Alerts", value: "...", delta: "Loading incident count", tone: "red" },
        { label: "Maintenance", value: "...", delta: "Loading maintenance records", tone: "purple" }
      ];
    }

    const activeMissions = apiMissions.filter((mission) => ["ACTIVE", "IN_MISSION"].includes(mission.status)).length;
    const openIncidents = apiIncidents.filter((incident) => !["CLOSED", "RESOLVED"].includes(incident.status)).length;
    const pendingMaintenance = apiMaintenance.length
      ? apiMaintenance.filter((item) => ["SCHEDULED", "OVERDUE", "IN_PROGRESS"].includes(item.status)).length
      : summary?.pendingMaintenance ?? 0;

    return [
      { label: "Total Drones", value: String(apiDrones.length || summary?.drones || 0), delta: "From backend fleet records", tone: "blue" },
      { label: "Active Missions", value: String(activeMissions), delta: `${apiMissions.length} mission records loaded`, tone: "green" },
      { label: "Open Alerts", value: String(openIncidents), delta: "Open incident records", tone: "red" },
      { label: "Maintenance", value: String(pendingMaintenance), delta: apiMaintenance.length ? "Maintenance records loaded" : "From backend summary", tone: "purple" }
    ];
  }, [apiDrones, apiIncidents, apiMaintenance, apiMissions, isDashboardLoading, summary]);

  const normalizedDrones = useMemo(() => apiDrones.map((drone) => normalizeDrone(drone, telemetryRows)), [apiDrones, telemetryRows]);
  const filteredDrones = useFleetSearch(normalizedDrones, searchValue);
  const recentActivity = useMemo(() => buildRecentActivity({
    drones: apiDrones,
    missions: apiMissions,
    incidents: apiIncidents,
    reports: apiReports
  }), [apiDrones, apiIncidents, apiMissions, apiReports]);
  const dashboardMissions = useMemo(
    () => apiMissions.map(normalizeMissionCard).slice(0, 3),
    [apiMissions]
  );

  const handleNewMission = () => {
    dispatch(routeActionRequested({ routeId: "missions", action: "create" }));
    dispatch(routeChanged("missions"));
  };

  return (
    <>
      {selectedDrone && (
        <DroneProfileDialog
          drone={selectedDrone}
          canManage={canRead("drones:manage")}
          onUpdated={() => {
            refreshDashboard();
            setSelectedDrone(null);
          }}
          onDeleted={() => {
            refreshDashboard();
            setSelectedDrone(null);
          }}
          onClose={() => setSelectedDrone(null)}
        />
      )}

      <section className="stats-grid" aria-label="Fleet summary">
        {dashboardMetrics.map((metric, index) => (
          <MetricCard key={metric.label} {...metric} icon={metricIcons[index]} />
        ))}
      </section>

      <section className="content-grid dashboard-grid">
        {dashboardError && <div className="auth-alert dashboard-alert">Some dashboard data could not be loaded: {dashboardError}</div>}
        <FleetOverviewTable drones={filteredDrones.slice(0, 5)} isLoading={isDashboardLoading} onDroneSelect={setSelectedDrone} />
        {showLivePanels && canRead("telemetry:read") ? (
          <Suspense fallback={<div className="panel map-panel map-loading">Loading telemetry map...</div>}>
            <GeospatialMap />
          </Suspense>
        ) : (
          <div className="panel map-panel map-loading">
            {canRead("telemetry:read") ? "Preparing telemetry map..." : "Telemetry access is not enabled for this role."}
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

const buildRecentActivity = ({ drones = [], missions = [], incidents = [], reports = [] }) => {
  const items = [
    ...drones.flatMap((drone) => buildDroneActivity(drone)),
    ...missions.flatMap((mission) => buildMissionActivity(mission)),
    ...incidents.flatMap((incident) => buildIncidentActivity(incident)),
    ...reports.flatMap((report) => buildReportActivity(report))
  ];

  return items
    .filter((item) => item.timestamp)
    .sort((left, right) => new Date(right.timestamp) - new Date(left.timestamp))
    .slice(0, 6)
    .map((item) => ({
      ...item,
      time: formatRelativeTime(item.timestamp)
    }));
};

const buildDroneActivity = (drone) => {
  const label = drone.droneCode ?? drone.id;
  return [
    {
      id: `drone-created-${drone.id}`,
      label: `${label} added to fleet`,
      timestamp: drone.createdAt,
      type: "drone"
    },
    {
      id: `drone-updated-${drone.id}`,
      label: `${label} status is ${formatStatus(drone.status)}`,
      timestamp: drone.updatedAt,
      type: "success"
    }
  ];
};

const buildMissionActivity = (mission) => {
  const label = mission.missionCode ?? mission.name ?? mission.id;
  return [
    {
      id: `mission-created-${mission.id}`,
      label: `${label} mission created`,
      timestamp: mission.createdAt,
      type: "mission"
    },
    {
      id: `mission-updated-${mission.id}`,
      label: `${label} is ${formatStatus(mission.status)}`,
      timestamp: mission.updatedAt,
      type: "mission"
    }
  ];
};

const buildIncidentActivity = (incident) => {
  const label = incident.incidentCode ?? incident.title ?? incident.id;
  return [
    {
      id: `incident-created-${incident.id}`,
      label: `${label} incident logged`,
      timestamp: incident.createdAt,
      type: "incident"
    },
    {
      id: `incident-updated-${incident.id}`,
      label: `${label} is ${formatStatus(incident.status)}`,
      timestamp: incident.updatedAt,
      type: "incident"
    }
  ];
};

const buildReportActivity = (report) => [
  {
    id: `report-created-${report.id}`,
    label: `${report.title ?? report.name ?? "Report"} generated`,
    timestamp: report.createdAt,
    type: "report"
  }
];

const formatStatus = (status = "") => {
  return status.toString().toLowerCase().replaceAll("_", " ");
};

const formatRelativeTime = (timestamp) => {
  const date = new Date(timestamp);
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.max(0, Math.floor(diffMs / 60000));

  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes} min ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} hr${diffHours === 1 ? "" : "s"} ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;

  return date.toLocaleDateString();
};

export default Dashboard;
