import { Bell, Database, ShieldCheck } from "lucide-react";
import MetricCard from "../../components/common/MetricCard";
import SectionHeader from "../../components/common/SectionHeader";
import StatusBadge from "../../components/common/StatusBadge";
import { settings } from "../../data/droneOpsData";

const Settings = () => {
  return (
    <section className="page-stack">
      <div className="stats-grid three">
        <MetricCard label="Roles" value={settings.roles.length} delta="Access model prepared" icon={ShieldCheck} tone="green" />
        <MetricCard label="Integrations" value={settings.integrations.length} delta="Backend-ready placeholders" icon={Database} tone="blue" />
        <MetricCard label="Alert Rules" value={settings.thresholds.length} delta="Operational thresholds" icon={Bell} tone="purple" />
      </div>
      <div className="settings-grid">
        <div className="panel">
          <SectionHeader title="Alert Thresholds" description="Rules that will drive backend incident creation." />
          <div className="settings-list">
            {settings.thresholds.map((item) => (
              <div className="settings-row" key={item.label}>
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </div>
            ))}
          </div>
        </div>
        <div className="panel">
          <SectionHeader title="Integrations" description="Prepared surfaces for MERN API and PostgreSQL-backed services." />
          <div className="settings-list">
            {settings.integrations.map((item) => (
              <div className="settings-row block" key={item.name}>
                <div>
                  <strong>{item.name}</strong>
                  <p>{item.note}</p>
                </div>
                <StatusBadge>{item.status}</StatusBadge>
              </div>
            ))}
          </div>
        </div>
        <div className="panel wide">
          <SectionHeader title="Access Roles" description="Role definitions for future authentication and authorization." />
          <div className="role-grid">
            {settings.roles.map((item) => (
              <article className="role-card" key={item.role}>
                <h3>{item.role}</h3>
                <p>{item.access}</p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Settings;
