import { BatteryCharging, CalendarClock, Cpu, MapPin, Pencil, Plane, RadioTower, Save, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import ActionButton from "../../../components/common/ActionButton";
import BatteryMeter from "../../../components/common/BatteryMeter";
import StatusBadge from "../../../components/common/StatusBadge";
import { droneOpsApi } from "../../../services/droneOpsApi";

const droneStatuses = ["AVAILABLE", "IN_MISSION", "MAINTENANCE", "GROUNDED", "DISCONNECTED", "AWAITING_APPROVAL"];
const certificationStatuses = ["CERTIFIED", "AWAITING_APPROVAL", "AWAITING_RENEWAL", "EXPIRED", "GROUNDED_PENDING_INSPECTION"];

const DroneProfileDialog = ({ drone, onUpdated, onDeleted, onClose }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState(() => toEditableForm(drone));
  const telemetry = drone.latestTelemetry;
  const droneUuid = drone.uuid ?? drone.idRaw ?? drone.id;

  useEffect(() => {
    setForm(toEditableForm(drone));
  }, [drone]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose?.();
    };

    document.body.classList.add("modal-open");
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.classList.remove("modal-open");
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  const previewDrone = useMemo(() => ({
    ...drone,
    ...form,
    id: form.droneCode || drone.id,
    flightHours: Number(form.flightHours || 0),
    purchaseDate: form.purchaseDate ? new Date(form.purchaseDate).toISOString() : drone.purchaseDate
  }), [drone, form]);

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSave = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    setError("");

    try {
      const updatedDrone = await droneOpsApi.drones.update(droneUuid, {
        droneCode: form.droneCode,
        model: form.model,
        manufacturer: form.manufacturer || undefined,
        serialNumber: form.serialNumber,
        batteryType: form.batteryType || undefined,
        firmwareVersion: form.firmwareVersion || undefined,
        status: form.status,
        flightHours: Number(form.flightHours || 0),
        purchaseDate: form.purchaseDate ? new Date(form.purchaseDate).toISOString() : undefined,
        certificationStatus: form.certificationStatus
      });

      onUpdated?.(updatedDrone);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = window.confirm(`Delete ${drone.id} from the fleet?`);
    if (!confirmed) return;

    setIsDeleting(true);
    setError("");

    try {
      await droneOpsApi.drones.remove(droneUuid);
      onDeleted?.(drone);
    } catch (requestError) {
      setError(`${requestError.message}. If this drone has mission or telemetry history, set its status to GROUNDED instead of deleting it.`);
    } finally {
      setIsDeleting(false);
    }
  };

  const dialog = (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose?.()}>
      <form className="modal-dialog profile-dialog" role="dialog" aria-modal="true" aria-labelledby="drone-profile-title" onSubmit={handleSave}>
        <div className="modal-header">
          <div>
            <p className="eyebrow">Drone Profile</p>
            <h2 id="drone-profile-title">{previewDrone.id}</h2>
            <p>{previewDrone.model} {previewDrone.manufacturer ? `by ${previewDrone.manufacturer}` : ""}</p>
          </div>
          <div className="profile-header-actions">
            <ActionButton icon={Pencil} onClick={() => setIsEditing((current) => !current)}>
              {isEditing ? "View" : "Edit"}
            </ActionButton>
            <button className="icon-button" type="button" onClick={onClose} aria-label="Close drone profile">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="modal-body">
          {error && <div className="auth-alert">{error}</div>}

          <div className="profile-hero">
            <div className="profile-aircraft-icon">
              <Plane size={42} />
            </div>
            <div>
              <h3>{previewDrone.id}</h3>
              <p>{previewDrone.serialNumber}</p>
            </div>
            <StatusBadge>{previewDrone.status}</StatusBadge>
          </div>

          <div className="profile-metrics">
            <ProfileMetric icon={BatteryCharging} label="Battery" value={`${drone.battery ?? 0}%`}>
              <BatteryMeter value={drone.battery ?? 0} />
            </ProfileMetric>
            <ProfileMetric icon={RadioTower} label="Signal" value={`${drone.signal ?? 0}%`} />
            <ProfileMetric icon={Plane} label="Flight Hours" value={previewDrone.flightHours} />
          </div>

          {isEditing ? (
            <div className="profile-edit-grid">
              <Field label="Drone ID" value={form.droneCode} onChange={(value) => updateField("droneCode", value)} required />
              <Field label="Model" value={form.model} onChange={(value) => updateField("model", value)} required />
              <Field label="Manufacturer" value={form.manufacturer} onChange={(value) => updateField("manufacturer", value)} />
              <Field label="Serial Number" value={form.serialNumber} onChange={(value) => updateField("serialNumber", value)} required />
              <Field label="Battery Type" value={form.batteryType} onChange={(value) => updateField("batteryType", value)} />
              <Field label="Firmware Version" value={form.firmwareVersion} onChange={(value) => updateField("firmwareVersion", value)} />
              <SelectField label="Status" value={form.status} onChange={(value) => updateField("status", value)} options={droneStatuses} />
              <Field label="Flight Hours" type="number" value={form.flightHours} onChange={(value) => updateField("flightHours", value)} min="0" />
              <Field label="Purchase Date" type="date" value={form.purchaseDate} onChange={(value) => updateField("purchaseDate", value)} />
              <SelectField label="Certification" value={form.certificationStatus} onChange={(value) => updateField("certificationStatus", value)} options={certificationStatuses} />
            </div>
          ) : (
            <div className="profile-grid">
              <ProfileSection icon={Cpu} title="Aircraft Details">
                <ProfileRow label="Model" value={drone.model} />
                <ProfileRow label="Manufacturer" value={drone.manufacturer} />
                <ProfileRow label="Battery Type" value={drone.batteryType} />
                <ProfileRow label="Firmware" value={drone.firmwareVersion} />
                <ProfileRow label="Certification" value={drone.certificationStatus} />
              </ProfileSection>

              <ProfileSection icon={CalendarClock} title="Lifecycle">
                <ProfileRow label="Purchased" value={formatDate(drone.purchaseDate)} />
                <ProfileRow label="Next Service" value={drone.nextMaintenance} />
                <ProfileRow label="Created" value={formatDate(drone.createdAt)} />
                <ProfileRow label="Updated" value={formatDate(drone.updatedAt)} />
              </ProfileSection>

              <ProfileSection icon={MapPin} title="Latest Telemetry">
                <ProfileRow label="Location" value={telemetry ? formatCoordinate(telemetry.location) : "No live telemetry"} />
                <ProfileRow label="Altitude" value={telemetry ? `${telemetry.location.altitude} m` : "No data"} />
                <ProfileRow label="Speed" value={telemetry ? `${telemetry.velocity.speed} m/s` : "No data"} />
                <ProfileRow label="Heading" value={telemetry ? `${telemetry.velocity.heading} deg` : "No data"} />
                <ProfileRow label="Last Seen" value={telemetry ? formatDateTime(telemetry.timestamp) : "No data"} />
              </ProfileSection>
            </div>
          )}
        </div>

        <div className="modal-footer profile-footer">
          <ActionButton icon={Trash2} onClick={handleDelete} disabled={isDeleting}>
            {isDeleting ? "Deleting" : "Delete Drone"}
          </ActionButton>
          <div className="form-actions">
            <ActionButton onClick={onClose}>Cancel</ActionButton>
            {isEditing && (
              <ActionButton icon={Save} variant="primary" type="submit" disabled={isSaving}>
                {isSaving ? "Saving" : "Save Changes"}
              </ActionButton>
            )}
          </div>
        </div>
      </form>
    </div>
  );

  return createPortal(dialog, document.body);
};

const ProfileMetric = ({ icon: Icon, label, value, children }) => (
  <div className="profile-metric">
    <Icon size={18} />
    <span>{label}</span>
    <strong>{value}</strong>
    {children}
  </div>
);

const ProfileSection = ({ icon: Icon, title, children }) => (
  <section className="profile-section">
    <div className="profile-section-title">
      <Icon size={18} />
      <h3>{title}</h3>
    </div>
    <dl>{children}</dl>
  </section>
);

const ProfileRow = ({ label, value }) => (
  <div>
    <dt>{label}</dt>
    <dd>{value || "Not provided"}</dd>
  </div>
);

const Field = ({ label, type = "text", value, onChange, required = false, min }) => (
  <label className="field">
    <span>{label}</span>
    <input type={type} value={value ?? ""} onChange={(event) => onChange(event.target.value)} required={required} min={min} />
  </label>
);

const SelectField = ({ label, options, value, onChange }) => (
  <label className="field">
    <span>{label}</span>
    <select value={value ?? ""} onChange={(event) => onChange(event.target.value)}>
      {options.map((option) => (
        <option key={option} value={option}>{option}</option>
      ))}
    </select>
  </label>
);

const toEditableForm = (drone) => ({
  droneCode: drone.droneCode ?? drone.id ?? "",
  model: drone.model ?? "",
  manufacturer: drone.manufacturer ?? "",
  serialNumber: drone.serialNumber ?? "",
  batteryType: drone.batteryType ?? "",
  firmwareVersion: drone.firmwareVersion ?? "",
  status: drone.status ?? "AVAILABLE",
  flightHours: drone.flightHours ?? 0,
  purchaseDate: drone.purchaseDate ? new Date(drone.purchaseDate).toISOString().slice(0, 10) : "",
  certificationStatus: drone.certificationStatus ?? "AWAITING_APPROVAL"
});

const formatDate = (value) => {
  if (!value) return "Not provided";
  return new Date(value).toLocaleDateString();
};

const formatDateTime = (value) => {
  if (!value) return "Not provided";
  return new Date(value).toLocaleString();
};

const formatCoordinate = ({ latitude, longitude }) => {
  return `${Number(latitude).toFixed(4)}, ${Number(longitude).toFixed(4)}`;
};

export default DroneProfileDialog;
