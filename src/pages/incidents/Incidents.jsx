<<<<<<< HEAD
import { useCallback, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Plus, ShieldCheck, UserRoundCheck, X } from "lucide-react";
=======
import { useEffect, useRef, useState } from "react";
import { AlertTriangle, Plus, ShieldCheck, UserRoundCheck } from "lucide-react";
>>>>>>> a42502c6d700f2717489ee870fd450c6431788f9
import ActionButton from "../../components/common/ActionButton";
import DataTable from "../../components/common/DataTable";
import MetricCard from "../../components/common/MetricCard";
import SectionHeader from "../../components/common/SectionHeader";
import StatusBadge from "../../components/common/StatusBadge";
import { incidents } from "../../data/droneOpsData";
import { useApiResource } from "../../hooks/useApiResource";
import { useFleetSearch } from "../../hooks/useFleetSearch";
<<<<<<< HEAD
import { droneOpsApi } from "../../services/droneOpsApi";
=======
>>>>>>> a42502c6d700f2717489ee870fd450c6431788f9
import IncidentForm from "./components/IncidentForm";

const Incidents = ({ searchValue }) => {
  const [showIncidentForm, setShowIncidentForm] = useState(false);
<<<<<<< HEAD
  const [toast, setToast] = useState(null);
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
=======
  const incidentFormRef = useRef(null);
  const filteredIncidents = useFleetSearch(incidents, searchValue);
  const highCount = incidents.filter((incident) => incident.severity === "High").length;
>>>>>>> a42502c6d700f2717489ee870fd450c6431788f9

  const columns = [
    { key: "id", label: "Incident", render: (incident) => <strong>{incident.id}</strong> },
    { key: "title", label: "Issue" },
    { key: "severity", label: "Severity", render: (incident) => <StatusBadge type="risk">{incident.severity}</StatusBadge> },
    { key: "status", label: "Status", render: (incident) => <StatusBadge>{incident.status}</StatusBadge> },
    { key: "owner", label: "Owner" },
    { key: "source", label: "Source" },
    { key: "time", label: "Reported" }
  ];

  useEffect(() => {
    if (!showIncidentForm || !incidentFormRef.current) return;
    incidentFormRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    incidentFormRef.current.focus({ preventScroll: true });
  }, [showIncidentForm]);

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
          action={
            <ActionButton
              icon={Plus}
              variant="primary"
<<<<<<< HEAD
              onClick={() => setShowIncidentForm((current) => !current)}
            >
              Log Incident
            </ActionButton>
          }
        />
        <DataTable
          columns={columns}
          rows={filteredIncidents}
          getRowKey={(incident) => incident.id}
          emptyMessage={isLoading ? "Loading incident records..." : "No incidents logged yet."}
=======
              onClick={handleLogIncidentClick}
            >
              {showIncidentForm ? "Hide Form" : "Log Incident"}
            </ActionButton>
          }
>>>>>>> a42502c6d700f2717489ee870fd450c6431788f9
        />
      </div>
      {showIncidentForm && (
<<<<<<< HEAD
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
=======
        <div ref={incidentFormRef} className="form-scroll-anchor" tabIndex={-1}>
          <IncidentForm onCancel={() => setShowIncidentForm(false)} />
        </div>
>>>>>>> a42502c6d700f2717489ee870fd450c6431788f9
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
