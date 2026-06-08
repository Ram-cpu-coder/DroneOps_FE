import { useCallback, useMemo } from "react";
import { ShieldCheck, UserCheck, Users } from "lucide-react";
import DataTable from "../../components/common/DataTable";
import MetricCard from "../../components/common/MetricCard";
import SectionHeader from "../../components/common/SectionHeader";
import StatusBadge from "../../components/common/StatusBadge";
import { userRoles } from "../../data/authData";
import { useApiResource } from "../../hooks/useApiResource";
import { droneOpsApi } from "../../services/droneOpsApi";

const UserManagement = () => {
  const loadUsers = useCallback(() => droneOpsApi.users.list(), []);
  const { data: apiUsers, error, isLoading, isFallback } = useApiResource(loadUsers, []);
  const users = useMemo(() => apiUsers.map(normalizeUser), [apiUsers]);
  const metricUsers = isFallback ? [] : users;
  const verifiedUsers = metricUsers.filter((user) => user.isVerified).length;

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
        <MetricCard label="Users" value={isLoading ? "..." : metricUsers.length} delta={isFallback ? "Backend unavailable" : "Current organisation directory"} icon={Users} tone="blue" />
        <MetricCard label="Verified" value={isLoading ? "..." : verifiedUsers} delta="Allowed portal access" icon={UserCheck} tone="green" />
        <MetricCard label="Roles" value={userRoles.length} delta="Configured access roles" icon={ShieldCheck} tone="purple" />
      </div>
      {error && <div className="auth-alert">Backend unavailable: user directory could not be loaded. {error}</div>}
      <div className="panel">
        <SectionHeader
          title="User Management"
          description="Organisation-scoped user directory with role and verification status."
        />
        <DataTable
          columns={columns}
          rows={users}
          getRowKey={(user) => user.id}
          emptyMessage={isLoading ? "Loading users..." : "No users found."}
        />
      </div>
    </section>
  );
};

const roleIdByApiRole = {
  OPERATIONS_MANAGER: "operations_manager",
  REMOTE_PILOT: "remote_pilot",
  MAINTENANCE_COORDINATOR: "maintenance_coordinator",
  SAFETY_OFFICER: "safety_officer",
  COMPLIANCE_OFFICER: "compliance_officer",
  SYSTEM_ADMINISTRATOR: "system_administrator"
};

const normalizeUser = (user) => ({
  ...user,
  role: roleIdByApiRole[user.role] ?? user.role,
  organization: user.organisation?.name ?? user.organization ?? "DroneOps"
});

export default UserManagement;
