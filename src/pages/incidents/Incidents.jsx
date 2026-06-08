import { useCallback, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Plus, ShieldCheck, UserRoundCheck, X } from "lucide-react";
import ActionButton from "../../components/common/ActionButton";
import DataTable from "../../components/common/DataTable";
import MetricCard from "../../components/common/MetricCard";
import SectionHeader from "../../components/common/SectionHeader";
import StatusBadge from "../../components/common/StatusBadge";
import { incidents } from "../../data/droneOpsData";
import { hasClientPermission } from "../../features/auth/accessControl";
import { useApiResource } from "../../hooks/useApiResource";
import { useFleetSearch } from "../../hooks/useFleetSearch";
import { droneOpsApi } from "../../services/droneOpsApi";
import IncidentForm from "./components/IncidentForm";

const Incidents = ({ searchValue, user }) => {
  const [showIncidentForm, setShowIncidentForm] = useState(false);
  const [toast, setToast] = useState(null);
  const canCreateIncident = hasClientPermission(user, "incidents:manage") || hasClientPermission(user, "incidents:create");
  const loadIncidents = useCallback(() => droneOpsApi.incidents.list(), []);
  const { data: apiIncidents, error, isLoading, isFallback, refresh } = useApiResource(loadIncidents, incidents);
  const normalizedIncidents = useMemo(() => apiIncidents.map(normalizeIncident), [apiIncidents]);
  const filteredIncidents = useFleetSearch(normalizedIncidents, searchValue);
  const metricIncidents = isFallback ? [] : normalizedIncidents;
  const openIncidentCount = metricIncidents.filter((incident) => !["CLOSED", "Closed", "RESOLVED", "Resolved"].includes(incident.status)).length;
  const highCount = metricIncidents.filter((incident) => ["HIGH", "CRITICAL", "High", "Critical"].includes(incident.severity)).length;
  const assignedOwnerCount = new Set(
    metricIncidents
      .map((incident) => incident.owner)
      .filter((owner) => owner && owner !== "Unassigned")
  ).size;

  const columns = [
    { key: "id", label: "Incident", render: (incident) => <strong>{incident.id}</strong> },
    { key: "title", label: "Issue" },
    { key: "severity", label: "Severity", render: (incident) => <StatusBadge type="risk">{incident.severity}</StatusBadge> },
    { key: "status", label: "Status", render: (incident) => <StatusBadge>{incident.status}</StatusBadge> },
    { key: "owner", label: "Owner" },
    { key: "source", label: "Source" },
    { key: "time", label: "Reported" }
  ];

  const handleLogIncidentClick = () => {
    if (showIncidentForm) {
      setShowIncidentForm(false);
      return;
    }
    setShowIncidentForm(true);
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
        <MetricCard label="Open Incidents" value={isLoading ? "..." : openIncidentCount} delta={isFallback ? "Backend unavailable" : "Open backend records"} icon={AlertTriangle} tone="red" />
        <MetricCard label="High Severity" value={isLoading ? "..." : highCount} delta="High or critical records" icon={ShieldCheck} tone="red" />
        <MetricCard label="Assigned Owners" value={isLoading ? "..." : assignedOwnerCount} delta="Unique assigned owners" icon={UserRoundCheck} tone="green" />
      </div>
      {error && <div className="auth-alert">Backend unavailable: showing fallback incidents. {error}</div>}
      <div className="panel">
        <SectionHeader
          title="Incident Register"
          description="Actionable operational incidents with ownership, severity, source, and latest status."
          action={canCreateIncident ? (
            <ActionButton
              icon={Plus}
              variant="primary"
              onClick={handleLogIncidentClick}
            >
              {showIncidentForm ? "Hide Form" : "Log Incident"}
            </ActionButton>
          ) : null}
        />
        <DataTable
          columns={columns}
          rows={filteredIncidents}
          getRowKey={(incident) => incident.id}
          emptyMessage={isLoading ? "Loading incident records..." : "No incidents logged yet."}
        />
      </div>
      {canCreateIncident && showIncidentForm && (
        <IncidentForm
          onCreated={(incident) => {
            refresh();
            setShowIncidentForm(false);
            setToast({
              title: "Incident logged",
              message: `${incident.incidentCode} is now in the incident register.`
            });
            window.setTimeout(() => setToast(null), 4500);
          }}
          onCancel={() => setShowIncidentForm(false)}
        />
      )}
      <div className="detail-grid">
        {filteredIncidents.map((incident) => (
          <article className="detail-card" key={incident.id}>
            <div className="detail-card-header">
              <h3>{incident.title}</h3>
              <StatusBadge type="risk">{incident.severity}</StatusBadge>
            </div>
            <p>{incident.details}</p>
            <dl>
              <div><dt>Location</dt><dd>{incident.place}</dd></div>
              <div><dt>Owner</dt><dd>{incident.owner}</dd></div>
              <div><dt>Status</dt><dd>{incident.status}</dd></div>
            </dl>
          </article>
        ))}
      </div>
    </section>
  );
};

const normalizeIncident = (incident) => ({
  ...incident,
  id: incident.incidentCode ?? incident.id,
  owner: incident.assignedTo?.name ?? incident.reportedBy?.name ?? incident.owner ?? "Unassigned",
  place: incident.location ?? incident.place ?? "No location",
  time: incident.createdAt ? new Date(incident.createdAt).toLocaleString() : incident.time,
  details: incident.details ?? "No details captured yet."
});

export default Incidents;
