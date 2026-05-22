import { AlertTriangle, ShieldCheck, UserRoundCheck } from "lucide-react";
import DataTable from "../../components/common/DataTable";
import MetricCard from "../../components/common/MetricCard";
import SectionHeader from "../../components/common/SectionHeader";
import StatusBadge from "../../components/common/StatusBadge";
import { incidents } from "../../data/droneOpsData";
import { useFleetSearch } from "../../hooks/useFleetSearch";

const Incidents = ({ searchValue }) => {
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
        />
        <DataTable columns={columns} rows={filteredIncidents} getRowKey={(incident) => incident.id} />
      </div>
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
