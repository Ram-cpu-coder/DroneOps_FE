import { lazy, Suspense } from "react";
import { Activity, AlertTriangle, MapPin, Plane } from "lucide-react";
import MetricCard from "../../components/common/MetricCard";
import { activity, drones, fleetSummary, incidents, missions } from "../../data/droneOpsData";
import ActivityFeed from "./components/ActivityFeed";
import FleetOverviewTable from "./components/FleetOverviewTable";
import IncidentWatch from "./components/IncidentWatch";
import MissionQueue from "./components/MissionQueue";
import { useFleetSearch } from "../../hooks/useFleetSearch";

const metricIcons = [Plane, Activity, AlertTriangle, MapPin];
const GeospatialMap = lazy(() => import("../../components/maps/GeospatialMap"));

const Dashboard = ({ searchValue }) => {
  const filteredDrones = useFleetSearch(drones, searchValue);

  return (
    <>
      <section className="stats-grid" aria-label="Fleet summary">
        {fleetSummary.map((metric, index) => (
          <MetricCard key={metric.label} {...metric} icon={metricIcons[index]} />
        ))}
      </section>

      <section className="content-grid dashboard-grid">
        <FleetOverviewTable drones={filteredDrones.slice(0, 5)} />
        <Suspense fallback={<div className="panel map-panel map-loading">Loading telemetry map...</div>}>
          <GeospatialMap />
        </Suspense>
        <MissionQueue missions={missions.slice(0, 3)} />
        <ActivityFeed activity={activity} />
        <IncidentWatch incidents={incidents.slice(0, 2)} />
      </section>
    </>
  );
};

export default Dashboard;
