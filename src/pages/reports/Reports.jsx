import { useCallback, useMemo } from "react";
import { BarChart3, Download, FileText } from "lucide-react";
import ActionButton from "../../components/common/ActionButton";
import DataTable from "../../components/common/DataTable";
import MetricCard from "../../components/common/MetricCard";
import SectionHeader from "../../components/common/SectionHeader";
import StatusBadge from "../../components/common/StatusBadge";
import { reports } from "../../data/droneOpsData";
import { useApiResource } from "../../hooks/useApiResource";
import { droneOpsApi } from "../../services/droneOpsApi";

const Reports = () => {
  const loadReports = useCallback(() => droneOpsApi.reports.list(), []);
  const { data: apiReports, error, isLoading, isFallback } = useApiResource(loadReports, reports);
  const normalizedReports = useMemo(() => apiReports.map(normalizeReport), [apiReports]);
  const metricReports = isFallback ? [] : normalizedReports;
  const readyReports = metricReports.filter((report) => ["Ready", "READY", "GENERATED", "Generated"].includes(report.status)).length;
  const reportTypeCount = new Set(metricReports.map((report) => report.type).filter(Boolean)).size;

  const columns = [
    { key: "name", label: "Report", render: (report) => <strong>{report.name}</strong> },
    { key: "value", label: "Current Value" },
    { key: "change", label: "Change" },
    { key: "status", label: "Status", render: (report) => <StatusBadge>{report.status}</StatusBadge> },
    { key: "owner", label: "Owner" }
  ];

  return (
    <section className="page-stack">
      <div className="stats-grid three">
        <MetricCard label="Reports" value={isLoading ? "..." : metricReports.length} delta={isFallback ? "Backend unavailable" : "Saved report records"} icon={BarChart3} tone="blue" />
        <MetricCard label="Ready Reports" value={isLoading ? "..." : readyReports} delta="Ready to view or export" icon={FileText} tone="green" />
        <MetricCard label="Report Types" value={isLoading ? "..." : reportTypeCount} delta="Unique report categories" icon={Download} tone="purple" />
      </div>
      {error && <div className="auth-alert">Backend unavailable: showing fallback reports. {error}</div>}
      <div className="panel">
        <SectionHeader
          title="Operational Reports"
          description="Summary views ready to connect to PostgreSQL-backed analytics endpoints."
          action={<ActionButton icon={Download} variant="primary">Export</ActionButton>}
        />
        <DataTable
          columns={columns}
          rows={normalizedReports}
          getRowKey={(report) => report.name}
          emptyMessage={isLoading ? "Loading reports..." : "No reports generated yet."}
        />
      </div>
      <div className="report-grid">
        {normalizedReports.map((report) => (
          <article className="report-card" key={report.name}>
            <span>{report.owner}</span>
            <h3>{report.name}</h3>
            <strong>{report.value}</strong>
            <p>{report.change} versus previous reporting window</p>
          </article>
        ))}
      </div>
    </section>
  );
};

const normalizeReport = (report) => ({
  name: report.title ?? report.name,
  type: report.type,
  value: report.value ?? report.type ?? "Snapshot",
  change: report.change ?? "Stored audit snapshot",
  status: report.status ?? "Ready",
  owner: report.owner ?? "DroneOps"
});

export default Reports;
