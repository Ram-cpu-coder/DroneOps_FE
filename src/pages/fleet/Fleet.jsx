import { useState } from "react";
import { Plane, Plus, Wrench } from "lucide-react";
import ActionButton from "../../components/common/ActionButton";
import BatteryMeter from "../../components/common/BatteryMeter";
import DataTable from "../../components/common/DataTable";
import MetricCard from "../../components/common/MetricCard";
import ProgressBar from "../../components/common/ProgressBar";
import SectionHeader from "../../components/common/SectionHeader";
import StatusBadge from "../../components/common/StatusBadge";
import { drones } from "../../data/droneOpsData";
import { useFleetSearch } from "../../hooks/useFleetSearch";
import RegisterDroneForm from "./components/RegisterDroneForm";

const Fleet = ({ searchValue }) => {
  const [showRegisterDrone, setShowRegisterDrone] = useState(false);
  const filteredDrones = useFleetSearch(drones, searchValue);
  const activeCount = drones.filter((drone) => drone.status === "AVAILABLE").length;
  const maintenanceCount = drones.filter((drone) => drone.status === "MAINTENANCE").length;

  const columns = [
    { key: "id", label: "Drone", render: (drone) => <strong>{drone.id}</strong> },
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
      <div className="stats-grid three">
        <MetricCard label="Aircraft Registered" value={drones.length} delta="Tracked in the drones entity" icon={Plane} tone="blue" />
        <MetricCard label="Available Drones" value={activeCount} delta="Eligible for mission assignment" icon={Plane} tone="green" />
        <MetricCard label="Maintenance" value={maintenanceCount} delta="Requires engineer review" icon={Wrench} tone="red" />
      </div>

      {showRegisterDrone && <RegisterDroneForm />}

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
        <DataTable columns={columns} rows={filteredDrones} getRowKey={(drone) => drone.id} />
      </div>
    </section>
  );
};

export default Fleet;
