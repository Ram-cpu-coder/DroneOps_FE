import { useCallback, useMemo, useState } from "react";
import { CheckCircle2, Eye, Plane, Plus, Wrench, X } from "lucide-react";
import ActionButton from "../../components/common/ActionButton";
import BatteryMeter from "../../components/common/BatteryMeter";
import DataTable from "../../components/common/DataTable";
import MetricCard from "../../components/common/MetricCard";
import ProgressBar from "../../components/common/ProgressBar";
import SectionHeader from "../../components/common/SectionHeader";
import StatusBadge from "../../components/common/StatusBadge";
import { drones } from "../../data/droneOpsData";
import { useApiResource } from "../../hooks/useApiResource";
import { useFleetSearch } from "../../hooks/useFleetSearch";
import { droneOpsApi } from "../../services/droneOpsApi";
import DroneProfileDialog from "./components/DroneProfileDialog";
import RegisterDroneForm from "./components/RegisterDroneForm";

const Fleet = ({ searchValue }) => {
  const [showRegisterDrone, setShowRegisterDrone] = useState(false);
  const [selectedDrone, setSelectedDrone] = useState(null);
  const [toast, setToast] = useState(null);
  const loadDrones = useCallback(() => droneOpsApi.drones.list(), []);
  const loadTelemetry = useCallback(() => droneOpsApi.telemetry.live(), []);
  const { data: apiDrones, error, isLoading, isFallback, refresh } = useApiResource(loadDrones, drones);
  const { data: telemetryRows } = useApiResource(loadTelemetry, []);
  const normalizedDrones = useMemo(() => apiDrones.map((drone) => normalizeDrone(drone, telemetryRows)), [apiDrones, telemetryRows]);
  const filteredDrones = useFleetSearch(normalizedDrones, searchValue);
  const metricDrones = isFallback ? [] : normalizedDrones;
  const activeCount = metricDrones.filter((drone) => drone.status === "AVAILABLE").length;
  const maintenanceCount = metricDrones.filter((drone) => drone.status === "MAINTENANCE").length;

  const columns = [
    {
      key: "id",
      label: "Drone",
      render: (drone) => (
        <button className="link-button strong-link" type="button" onClick={() => setSelectedDrone(drone)}>
          <Eye size={15} />
          <span>{drone.id}</span>
        </button>
      )
    },
    { key: "serialNumber", label: "Serial Number" },
    { key: "model", label: "Model" },
    { key: "manufacturer", label: "Manufacturer" },
    { key: "status", label: "Status", render: (drone) => <StatusBadge>{drone.status}</StatusBadge> },
    { key: "battery", label: "Battery", render: (drone) => <BatteryMeter value={drone.battery} /> },
    { key: "flightHours", label: "Flight Hours" },
    { key: "certificationStatus", label: "Certification", render: (drone) => <StatusBadge>{drone.certificationStatus}</StatusBadge> },
    { key: "nextMaintenance", label: "Next Service" }
  ];

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
        <MetricCard label="Aircraft Registered" value={isLoading ? "..." : metricDrones.length} delta={isFallback ? "Backend unavailable" : "Live fleet records"} icon={Plane} tone="blue" />
        <MetricCard label="Available Drones" value={isLoading ? "..." : activeCount} delta="Eligible for mission assignment" icon={Plane} tone="green" />
        <MetricCard label="Maintenance" value={isLoading ? "..." : maintenanceCount} delta="Requires engineer review" icon={Wrench} tone="red" />
      </div>

      {error && <div className="auth-alert">Backend unavailable: showing fallback fleet data. {error}</div>}
      {showRegisterDrone && (
        <RegisterDroneForm
          onRegistered={(registeredDrone) => {
            refresh();
            setShowRegisterDrone(false);
            setToast({
              title: "Drone registered",
              message: `${registeredDrone.droneCode} is now available in the fleet inventory.`
            });
            window.setTimeout(() => setToast(null), 4500);
          }}
          onCancel={() => setShowRegisterDrone(false)}
        />
      )}
      {selectedDrone && (
        <DroneProfileDialog
          drone={selectedDrone}
          onUpdated={(updatedDrone) => {
            refresh();
            setSelectedDrone(null);
            setToast({
              title: "Drone updated",
              message: `${updatedDrone.droneCode ?? updatedDrone.id} profile was saved.`
            });
            window.setTimeout(() => setToast(null), 4500);
          }}
          onDeleted={(deletedDrone) => {
            refresh();
            setSelectedDrone(null);
            setToast({
              title: "Drone deleted",
              message: `${deletedDrone.id} was removed from the fleet.`
            });
            window.setTimeout(() => setToast(null), 4500);
          }}
          onClose={() => setSelectedDrone(null)}
        />
      )}

      <div className="panel">
        <SectionHeader
          title="Fleet Inventory"
          description="Operational status, payload, maintenance window, and aircraft readiness."
          action={
            <ActionButton
              icon={Plus}
              variant="primary"
              onClick={() => setShowRegisterDrone((current) => !current)}
            >
              {showRegisterDrone ? "Hide Form" : "Register Drone"}
            </ActionButton>
          }
        />
        <DataTable
          columns={columns}
          rows={filteredDrones}
          getRowKey={(drone) => drone.id}
          emptyMessage={isLoading ? "Loading fleet records..." : "No drones registered yet."}
        />
      </div>
    </section>
  );
};

const normalizeDrone = (drone, telemetryRows = []) => {
  const latestTelemetry = telemetryRows.find((row) => row.drone?.id === drone.id || row.drone?.droneCode === drone.droneCode)?.telemetry;

  return {
    ...drone,
    uuid: drone.id,
    id: drone.droneCode ?? drone.id,
    battery: latestTelemetry?.battery.level ?? drone.latestTelemetry?.batteryLevel ?? drone.battery ?? 0,
    signal: latestTelemetry?.signal.strength ?? drone.signal ?? 0,
    latestTelemetry,
    health: drone.health ?? 100,
    mission: drone.mission ?? "Standby",
    pilot: drone.pilot ?? "Unassigned",
    nextMaintenance: drone.nextMaintenanceDate ? new Date(drone.nextMaintenanceDate).toLocaleDateString() : (drone.nextMaintenance ?? "Not scheduled")
  };
};

export default Fleet;
