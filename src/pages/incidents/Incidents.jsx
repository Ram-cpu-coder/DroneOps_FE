import { useEffect, useRef, useState } from "react";
import { AlertTriangle, Plus, ShieldCheck, UserRoundCheck } from "lucide-react";
import ActionButton from "../../components/common/ActionButton";
import DataTable from "../../components/common/DataTable";
import MetricCard from "../../components/common/MetricCard";
import SectionHeader from "../../components/common/SectionHeader";
import StatusBadge from "../../components/common/StatusBadge";
import { incidents } from "../../data/droneOpsData";
import { useFleetSearch } from "../../hooks/useFleetSearch";
import IncidentForm from "./components/IncidentForm";

const Incidents = ({ searchValue }) => {
  const [showIncidentForm, setShowIncidentForm] = useState(false);
  const incidentFormRef = useRef(null);
  const filteredIncidents = useFleetSearch(incidents, searchValue);
  const highCount = incidents.filter((incident) => incident.severity === "High").length;

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
      <div className="stats-grid three">
        <MetricCard label="Open Incidents" value={incidents.length} delta="Across telemetry and weather" icon={AlertTriangle} tone="red" />
        <MetricCard label="High Severity" value={highCount} delta="Needs immediate review" icon={ShieldCheck} tone="red" />
        <MetricCard label="Assigned Owners" value="3" delta="No unowned incidents" icon={UserRoundCheck} tone="green" />
      </div>
      <div className="panel">
        <SectionHeader
          title="Incident Register"
          description="Actionable operational incidents with ownership, severity, source, and latest status."
          action={
            <ActionButton
              icon={Plus}
              variant="primary"
              onClick={handleLogIncidentClick}
            >
              {showIncidentForm ? "Hide Form" : "Log Incident"}
            </ActionButton>
          }
        />
        <DataTable columns={columns} rows={filteredIncidents} getRowKey={(incident) => incident.id} />
      </div>
      {showIncidentForm && (
        <div ref={incidentFormRef} className="form-scroll-anchor" tabIndex={-1}>
          <IncidentForm onCancel={() => setShowIncidentForm(false)} />
        </div>
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

export default Incidents;
