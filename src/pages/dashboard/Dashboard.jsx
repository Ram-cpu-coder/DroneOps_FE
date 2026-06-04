import { lazy, Suspense, useCallback, useMemo, useState } from "react";
import { Activity, AlertTriangle, MapPin, Plane } from "lucide-react";
import MetricCard from "../../components/common/MetricCard";
import { incidents, missions } from "../../data/droneOpsData";
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

const Dashboard = ({ searchValue }) => {
  const [selectedDrone, setSelectedDrone] = useState(null);
  const loadSummary = useCallback(() => droneOpsApi.reports.summary(), []);
  const loadDrones = useCallback(() => droneOpsApi.drones.list(), []);
  const loadTelemetry = useCallback(() => droneOpsApi.telemetry.live(), []);
  const loadActivitySources = useCallback(async () => {
    const requests = await Promise.allSettled([
      droneOpsApi.missions.list(),
      droneOpsApi.incidents.list(),
      droneOpsApi.reports.list()
    ]);

    const [missionsResult, incidentsResult, reportsResult] = requests.map((request) => (
      request.status === "fulfilled" ? request.value : []
    ));

    return { missions: missionsResult, incidents: incidentsResult, reports: reportsResult };
  }, []);

  const { data: summary, isLoading: isSummaryLoading, error: summaryError } = useApiResource(loadSummary, null);
  const { data: apiDrones, isLoading: isDronesLoading, refresh: refreshDrones } = useApiResource(loadDrones, []);
  const { data: telemetryRows } = useApiResource(loadTelemetry, []);
  const { data: activitySources, isLoading: isActivityLoading } = useApiResource(loadActivitySources, { missions: [], incidents: [], reports: [] });

  const dashboardMetrics = useMemo(() => {
    if (isSummaryLoading && !summary) {
      return [
        { label: "Total Drones", value: "...", delta: "Loading backend fleet records", tone: "blue" },
        { label: "Active Missions", value: "...", delta: "Loading mission records", tone: "green" },
        { label: "Open Alerts", value: "...", delta: "Loading incident count", tone: "red" },
        { label: "Maintenance", value: "...", delta: "Loading maintenance records", tone: "purple" }
      ];
    }

    if (!summary) {
      return [
        { label: "Total Drones", value: "0", delta: summaryError ? "Backend summary unavailable" : "No fleet records yet", tone: "blue" },
        { label: "Active Missions", value: "0", delta: "No active mission records", tone: "green" },
        { label: "Open Alerts", value: "0", delta: "No open incidents", tone: "red" },
        { label: "Maintenance", value: "0", delta: "No pending maintenance", tone: "purple" }
      ];
    }

    return [
      { label: "Total Drones", value: String(summary.drones), delta: "From backend fleet records", tone: "blue" },
      { label: "Active Missions", value: String(summary.missions), delta: "Mission records in PostgreSQL", tone: "green" },
      { label: "Open Alerts", value: String(summary.openIncidents), delta: "Open incident count", tone: "red" },
      { label: "Maintenance", value: String(summary.pendingMaintenance), delta: "Pending maintenance records", tone: "purple" }
    ];
  }, [isSummaryLoading, summary, summaryError]);

  const normalizedDrones = useMemo(() => apiDrones.map((drone) => normalizeDrone(drone, telemetryRows)), [apiDrones, telemetryRows]);
  const filteredDrones = useFleetSearch(normalizedDrones, searchValue);
  const recentActivity = useMemo(() => buildRecentActivity({
    drones: apiDrones,
    missions: activitySources?.missions ?? [],
    incidents: activitySources?.incidents ?? [],
    reports: activitySources?.reports ?? []
  }), [activitySources, apiDrones]);

  return (
    <>
      {selectedDrone && (
        <DroneProfileDialog
          drone={selectedDrone}
          onUpdated={() => {
            refreshDrones();
            setSelectedDrone(null);
          }}
          onDeleted={() => {
            refreshDrones();
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
        <FleetOverviewTable drones={filteredDrones.slice(0, 5)} isLoading={isDronesLoading} onDroneSelect={setSelectedDrone} />
        <Suspense fallback={<div className="panel map-panel map-loading">Loading telemetry map...</div>}>
          <GeospatialMap />
        </Suspense>
        <MissionQueue missions={missions.slice(0, 3)} />
        <ActivityFeed activity={recentActivity} isLoading={isActivityLoading} />
        <IncidentWatch incidents={incidents.slice(0, 2)} />
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
