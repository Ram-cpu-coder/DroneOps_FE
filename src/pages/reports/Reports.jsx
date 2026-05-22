import { BarChart3, Download, FileText } from "lucide-react";
import ActionButton from "../../components/common/ActionButton";
import DataTable from "../../components/common/DataTable";
import MetricCard from "../../components/common/MetricCard";
import SectionHeader from "../../components/common/SectionHeader";
import StatusBadge from "../../components/common/StatusBadge";
import { reports } from "../../data/droneOpsData";

const Reports = () => {
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
        <MetricCard label="Utilization" value="78%" delta="Last 7 days" icon={BarChart3} tone="blue" />
        <MetricCard label="Completion Rate" value="91%" delta="Across closed missions" icon={FileText} tone="green" />
        <MetricCard label="Exports Ready" value="4" delta="CSV/PDF later via backend" icon={Download} tone="purple" />
      </div>
      <div className="panel">
        <SectionHeader
          title="Operational Reports"
          description="Summary views ready to connect to PostgreSQL-backed analytics endpoints."
          action={<ActionButton icon={Download} variant="primary">Export</ActionButton>}
        />
        <DataTable columns={columns} rows={reports} getRowKey={(report) => report.name} />
      </div>
      <div className="report-grid">
        {reports.map((report) => (
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

export default Reports;
