import { CalendarClock, Plus, Route } from "lucide-react";
import ActionButton from "../../components/common/ActionButton";
import DataTable from "../../components/common/DataTable";
import MetricCard from "../../components/common/MetricCard";
import ProgressBar from "../../components/common/ProgressBar";
import SectionHeader from "../../components/common/SectionHeader";
import StatusBadge from "../../components/common/StatusBadge";
import { missions } from "../../data/droneOpsData";
import { useFleetSearch } from "../../hooks/useFleetSearch";

const Missions = ({ searchValue }) => {
  const filteredMissions = useFleetSearch(missions, searchValue);
  const activeMissions = missions.filter((mission) => mission.status === "In Progress").length;

  const columns = [
    { key: "id", label: "Mission ID", render: (mission) => <strong>{mission.id}</strong> },
    { key: "name", label: "Mission" },
    { key: "type", label: "Type" },
    { key: "drone", label: "Drone" },
    { key: "pilot", label: "Pilot" },
    { key: "status", label: "Status", render: (mission) => <StatusBadge>{mission.status}</StatusBadge> },
    { key: "risk", label: "Risk", render: (mission) => <StatusBadge type="risk">{mission.risk}</StatusBadge> },
    { key: "progress", label: "Progress", render: (mission) => <ProgressBar value={mission.progress} /> },
    { key: "eta", label: "ETA" }
  ];

  return (
    <section className="page-stack">
      <div className="stats-grid three">
        <MetricCard label="Active Missions" value={activeMissions} delta="Live routes underway" icon={Route} tone="green" />
        <MetricCard label="Scheduled Today" value="1" delta="Emergency drill at 14:00" icon={CalendarClock} tone="purple" />
        <MetricCard label="Avg Completion" value="64%" delta="Across active missions" icon={Route} tone="blue" />
      </div>
      <div className="panel">
        <SectionHeader
          title="Mission Control"
          description="Plan, track, and audit drone missions from assignment through completion."
          action={<ActionButton icon={Plus} variant="primary">Create Mission</ActionButton>}
        />
        <DataTable columns={columns} rows={filteredMissions} getRowKey={(mission) => mission.id} />
      </div>
    </section>
  );
};

export default Missions;
