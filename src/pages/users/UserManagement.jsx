import { ShieldCheck, UserCheck, Users } from "lucide-react";
import DataTable from "../../components/common/DataTable";
import MetricCard from "../../components/common/MetricCard";
import SectionHeader from "../../components/common/SectionHeader";
import StatusBadge from "../../components/common/StatusBadge";
import { demoUsers, userRoles } from "../../data/authData";

const UserManagement = () => {
  const verifiedUsers = demoUsers.filter((user) => user.isVerified).length;

  const columns = [
    { key: "name", label: "User", render: (user) => <strong>{user.name}</strong> },
    { key: "email", label: "Email" },
    {
      key: "role",
      label: "Role",
      render: (user) => userRoles.find((role) => role.id === user.role)?.label ?? user.role
    },
    { key: "organization", label: "Organization" },
    {
      key: "isVerified",
      label: "Verification",
      render: (user) => <StatusBadge>{user.isVerified ? "Verified" : "Awaiting Approval"}</StatusBadge>
    }
  ];

  return (
    <section className="page-stack">
      <div className="stats-grid three">
        <MetricCard label="Users" value={demoUsers.length} delta="Mock account directory" icon={Users} tone="blue" />
        <MetricCard label="Verified" value={verifiedUsers} delta="Allowed portal access" icon={UserCheck} tone="green" />
        <MetricCard label="Roles" value={userRoles.length} delta="RBAC model from documentation" icon={ShieldCheck} tone="purple" />
      </div>
      <div className="panel">
        <SectionHeader
          title="User Management"
          description="Frontend-only role and verification view for System Administrator access."
        />
        <DataTable columns={columns} rows={demoUsers} getRowKey={(user) => user.id} />
      </div>
      <div className="role-grid no-padding">
        {userRoles.map((role) => (
          <article className="role-card" key={role.id}>
            <h3>{role.label}</h3>
            <p>{role.summary}</p>
          </article>
        ))}
      </div>
    </section>
  );
};

export default UserManagement;
