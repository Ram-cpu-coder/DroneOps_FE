import { RadioTower, SlidersHorizontal } from "lucide-react";
import ActionButton from "../../../components/common/ActionButton";
import BatteryMeter from "../../../components/common/BatteryMeter";
import DataTable from "../../../components/common/DataTable";
import SectionHeader from "../../../components/common/SectionHeader";
import StatusBadge from "../../../components/common/StatusBadge";

const FleetOverviewTable = ({ drones }) => {
  const columns = [
    { key: "id", label: "Drone ID", render: (drone) => <strong>{drone.id}</strong> },
    { key: "status", label: "Status", render: (drone) => <StatusBadge>{drone.status}</StatusBadge> },
    { key: "battery", label: "Battery", render: (drone) => <BatteryMeter value={drone.battery} /> },
    {
      key: "signal",
      label: "Signal",
      render: (drone) => (
        <div className="signal"><RadioTower size={15} /><span>{drone.signal}%</span></div>
      )
    },
    { key: "flightHours", label: "Flight Hours" },
    { key: "location", label: "Location" }
  ];

  return (
    <div className="panel fleet-panel">
      <SectionHeader
        title="Active Drones"
        description="Live telemetry from operational and docked aircraft."
        action={<ActionButton icon={SlidersHorizontal}>Filter</ActionButton>}
      />
      <DataTable columns={columns} rows={drones} getRowKey={(drone) => drone.id} />
    </div>
  );
};

export default FleetOverviewTable;
