import { useCallback, useMemo, useState } from "react";
import { CalendarClock, CheckCircle2, Plus, Route, X } from "lucide-react";
import ActionButton from "../../components/common/ActionButton";
import DataTable from "../../components/common/DataTable";
import MetricCard from "../../components/common/MetricCard";
import ProgressBar from "../../components/common/ProgressBar";
import SectionHeader from "../../components/common/SectionHeader";
import StatusBadge from "../../components/common/StatusBadge";
import { missions } from "../../data/droneOpsData";
import { useApiResource } from "../../hooks/useApiResource";
import { useFleetSearch } from "../../hooks/useFleetSearch";
import { droneOpsApi } from "../../services/droneOpsApi";
import MissionForm from "./components/MissionForm";

const Missions = ({ searchValue }) => {
  const [showMissionForm, setShowMissionForm] = useState(false);
  const [toast, setToast] = useState(null);
  const loadMissions = useCallback(() => droneOpsApi.missions.list(), []);
  const { data: apiMissions, error, isLoading, isFallback, refresh } = useApiResource(loadMissions, missions);
  const normalizedMissions = useMemo(() => apiMissions.map(normalizeMission), [apiMissions]);
  const filteredMissions = useFleetSearch(normalizedMissions, searchValue);
  const metricMissions = isFallback ? [] : normalizedMissions;
  const activeMissions = metricMissions.filter((mission) => ["ACTIVE", "In Progress"].includes(mission.status)).length;
  const scheduledMissions = metricMissions.filter((mission) => ["PLANNED", "APPROVED", "Scheduled"].includes(mission.status)).length;
  const averageProgress = metricMissions.length
    ? Math.round(metricMissions.reduce((total, mission) => total + Number(mission.progress ?? 0), 0) / metricMissions.length)
    : 0;

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

  const handleCreateMissionClick = () => {
    if (showMissionForm) {
      setShowMissionForm(false);
      return;
    }
    setShowMissionForm(true);
  };

  return (
    <section className="page-stack">
      {toast && (
        <div className="toast-region" role="status" aria-live="polite">
          <div className="toast-card success">
            <CheckCircle2 size={20} />
            <div>
              <strong>{toast.title}</strong>
              <p>{toast.message}</p>
            </div>
            <button className="toast-close" type="button" onClick={() => setToast(null)} aria-label="Dismiss notification">
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      <div className="stats-grid three">
        <MetricCard label="Active Missions" value={isLoading ? "..." : activeMissions} delta={isFallback ? "Backend unavailable" : "Live mission records"} icon={Route} tone="green" />
        <MetricCard label="Scheduled Missions" value={isLoading ? "..." : scheduledMissions} delta="Planned or approved" icon={CalendarClock} tone="purple" />
        <MetricCard label="Avg Completion" value={isLoading ? "..." : `${averageProgress}%`} delta="Calculated from mission records" icon={Route} tone="blue" />
      </div>
      {error && <div className="auth-alert">Backend unavailable: showing fallback missions. {error}</div>}
      <div className="panel">
        <SectionHeader
          title="Mission Control"
          description="Plan, track, and audit drone missions from assignment through completion."
          action={
            <ActionButton
              icon={Plus}
              variant="primary"
              onClick={handleCreateMissionClick}
            >
              {showMissionForm ? "Hide Form" : "Create Mission"}
            </ActionButton>
          }
        />
        <DataTable
          columns={columns}
          rows={filteredMissions}
          getRowKey={(mission) => mission.id}
          emptyMessage={isLoading ? "Loading mission records..." : "No missions created yet."}
        />
      </div>
      {showMissionForm && (
        <MissionForm
          onCreated={(mission) => {
            refresh();
            setShowMissionForm(false);
            setToast({
              title: "Mission created",
              message: `${mission.missionCode} is now saved in Mission Control.`
            });
            window.setTimeout(() => setToast(null), 4500);
          }}
          onCancel={() => setShowMissionForm(false)}
        />
      )}
    </section>
  );
};

const normalizeMission = (mission) => ({
  ...mission,
  id: mission.missionCode ?? mission.id,
  drone: mission.drone?.droneCode ?? mission.drone ?? "Unassigned",
  pilot: mission.pilot?.name ?? mission.pilot ?? "Unassigned",
  risk: mission.riskAssessment?.level ?? mission.risk ?? "Pending",
  eta: mission.eta ?? (mission.plannedStartAt ? new Date(mission.plannedStartAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Not scheduled")
});

export default Missions;
