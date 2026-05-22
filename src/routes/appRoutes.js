import {
  AlertTriangle,
  BarChart3,
  ClipboardList,
  Grid2X2,
  MapPin,
  Plane,
  Settings,
  Users
} from "lucide-react";
import Dashboard from "../pages/dashboard/Dashboard";
import Fleet from "../pages/fleet/Fleet";
import Missions from "../pages/missions/Missions";
import Incidents from "../pages/incidents/Incidents";
import Reports from "../pages/reports/Reports";
import SettingsPage from "../pages/settings/Settings";
import UserManagement from "../pages/users/UserManagement";

export const appRoutes = [
  {
    id: "dashboard",
    label: "Dashboard",
    description: "Fleet health, mission status, alerts, and operational activity.",
    icon: Grid2X2,
    requiredPermission: "dashboard",
    component: Dashboard
  },
  {
    id: "fleet",
    label: "Fleet",
    description: "Aircraft inventory, dock status, maintenance, payloads, and telemetry readiness.",
    icon: Plane,
    requiredPermission: "fleet",
    component: Fleet
  },
  {
    id: "missions",
    label: "Missions",
    description: "Mission planning, route progress, assigned drones, and scheduled work.",
    icon: MapPin,
    requiredPermission: "missions",
    component: Missions
  },
  {
    id: "incidents",
    label: "Incidents",
    description: "Open alerts, severity handling, incident ownership, and audit trail.",
    icon: AlertTriangle,
    requiredPermission: "incidents",
    component: Incidents
  },
  {
    id: "reports",
    label: "Reports",
    description: "Utilization, safety, compliance, energy, and export-ready summaries.",
    icon: ClipboardList,
    requiredPermission: "reports",
    component: Reports
  },
  {
    id: "users",
    label: "Users",
    description: "Manage users, verification status, role assignments, and access control.",
    icon: Users,
    requiredPermission: "users",
    component: UserManagement,
    secondary: true
  },
  {
    id: "settings",
    label: "Settings",
    description: "Operational thresholds, team access, notification rules, and integrations.",
    icon: Settings,
    requiredPermission: "settings",
    component: SettingsPage,
    secondary: true
  }
];

export const quickActions = [
  { label: "Create Mission", icon: MapPin, target: "missions" },
  { label: "Fleet Report", icon: BarChart3, target: "reports" },
  { label: "Register Drone", icon: Plane, target: "fleet" }
];
