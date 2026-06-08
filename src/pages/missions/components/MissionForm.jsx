import { CalendarClock, MapPinned, Route, Save, UserRound, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import ActionButton from "../../../components/common/ActionButton";
import { useApiResource } from "../../../hooks/useApiResource";
import { droneOpsApi } from "../../../services/droneOpsApi";

const missionTypes = ["Mapping", "Inspection", "Security", "Delivery", "Training", "Emergency Response"];

const initialForm = {
  missionCode: "",
  name: "",
  type: "",
  droneId: "",
  pilotId: "",
  launchSite: "",
  operatingArea: "",
  plannedDate: "",
  startTime: "",
  endTime: "",
  waypointNotes: ""
};

const MissionForm = ({ onCreated, onCancel }) => {
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const loadDrones = useCallback(() => droneOpsApi.drones.list(), []);
  const loadUsers = useCallback(() => droneOpsApi.users.list(), []);
  const { data: drones } = useApiResource(loadDrones, []);
  const { data: users } = useApiResource(loadUsers, []);

  const pilotOptions = useMemo(
    () => users.filter((user) => ["REMOTE_PILOT", "OPERATIONS_MANAGER", "SYSTEM_ADMINISTRATOR"].includes(user.role)),
    [users]
  );

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onCancel?.();
    };

    document.body.classList.add("modal-open");
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.classList.remove("modal-open");
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onCancel]);

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const buildDateTime = (date, time) => {
    if (!date || !time) return undefined;
    return new Date(`${date}T${time}`).toISOString();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    setError("");

    try {
      const mission = await droneOpsApi.missions.create({
        missionCode: form.missionCode,
        name: form.name,
        type: form.type,
        droneId: form.droneId || undefined,
        pilotId: form.pilotId || undefined,
        launchSite: form.launchSite || undefined,
        operatingArea: form.operatingArea || undefined,
        plannedStartAt: buildDateTime(form.plannedDate, form.startTime),
        plannedEndAt: buildDateTime(form.plannedDate, form.endTime),
        plannedRoute: form.waypointNotes ? { notes: form.waypointNotes } : undefined
      });

      setForm(initialForm);
      setIsConfirmed(false);
      onCreated?.({
        ...mission,
        missionCode: mission.missionCode ?? form.missionCode
      });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsSaving(false);
    }
  };

  const dialog = (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onCancel?.()}>
      <form className="modal-dialog registration-dialog" role="dialog" aria-modal="true" aria-labelledby="create-mission-title" onSubmit={handleSubmit}>
        <div className="modal-header">
          <div>
            <p className="eyebrow">Mission Planning</p>
            <h2 id="create-mission-title">Create Mission</h2>
            <p>Set the mission details, assign a drone and pilot, and schedule the operation.</p>
          </div>
          <button className="icon-button" type="button" onClick={onCancel} aria-label="Close mission form">
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          {error && <div className="auth-alert">{error}</div>}

          <div className="form-layout modal-form-layout">
            <FormSection icon={Route} title="Mission Details">
              <Field label="Mission ID" value={form.missionCode} onChange={(value) => updateField("missionCode", value)} placeholder="MIS-1046" required />
              <Field label="Mission Name" value={form.name} onChange={(value) => updateField("name", value)} placeholder="North Ridge Inspection" required />
              <SelectField label="Mission Type" value={form.type} onChange={(value) => updateField("type", value)} options={missionTypes} required />
              <Field label="Operating Area" value={form.operatingArea} onChange={(value) => updateField("operatingArea", value)} placeholder="Site A - Zone 1" />
            </FormSection>

            <FormSection icon={UserRound} title="Assignment">
              <SelectField
                label="Assigned Drone"
                value={form.droneId}
                onChange={(value) => updateField("droneId", value)}
                options={drones.map((drone) => ({ value: drone.id, label: `${drone.droneCode ?? drone.id} - ${drone.model}` }))}
              />
              <SelectField
                label="Remote Pilot"
                value={form.pilotId}
                onChange={(value) => updateField("pilotId", value)}
                options={pilotOptions.map((pilot) => ({ value: pilot.id, label: pilot.name }))}
              />
              <Field label="Launch Site" value={form.launchSite} onChange={(value) => updateField("launchSite", value)} placeholder="Main dock / roof pad" />
            </FormSection>

            <FormSection icon={CalendarClock} title="Schedule">
              <Field label="Planned Date" type="date" value={form.plannedDate} onChange={(value) => updateField("plannedDate", value)} />
              <Field label="Start Time" type="time" value={form.startTime} onChange={(value) => updateField("startTime", value)} />
              <Field label="End Time" type="time" value={form.endTime} onChange={(value) => updateField("endTime", value)} />
            </FormSection>

            <FormSection icon={MapPinned} title="Route Notes">
              <TextareaField
                label="Route / Waypoint Notes"
                value={form.waypointNotes}
                onChange={(value) => updateField("waypointNotes", value)}
                placeholder="Add route notes, key waypoints, or site instructions."
              />
            </FormSection>
          </div>
        </div>

        <div className="modal-footer">
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={isConfirmed}
              onChange={(event) => setIsConfirmed(event.target.checked)}
              required
            />
            <span>I confirm the mission details, assigned drone, and pilot information are correct.</span>
          </label>
          <div className="form-actions">
            <ActionButton onClick={onCancel}>Cancel</ActionButton>
            <ActionButton icon={Save} variant="primary" type="submit" disabled={isSaving || !isConfirmed}>
              {isSaving ? "Creating" : "Create Mission"}
            </ActionButton>
          </div>
        </div>
      </form>
    </div>
  );

  return createPortal(dialog, document.body);
};

const FormSection = ({ icon: Icon, title, children }) => (
  <section className="form-section">
    <div className="form-section-title">
      <Icon size={18} />
      <h3>{title}</h3>
    </div>
    <div className="form-grid">{children}</div>
  </section>
);

const Field = ({ label, type = "text", placeholder = "", value, onChange, required = false }) => (
  <label className="field">
    <span>{label}</span>
    <input type={type} value={value ?? ""} onChange={(event) => onChange?.(event.target.value)} placeholder={placeholder} required={required} />
  </label>
);

const SelectField = ({ label, options, value, onChange, required = false }) => (
  <label className="field">
    <span>{label}</span>
    <select value={value ?? ""} onChange={(event) => onChange?.(event.target.value)} required={required}>
      <option value="" disabled>Select {label.toLowerCase()}</option>
      {options.map((option) => {
        const value = typeof option === "string" ? option : option.value;
        const label = typeof option === "string" ? option : option.label;
        return <option key={value} value={value}>{label}</option>;
      })}
    </select>
  </label>
);

const TextareaField = ({ label, placeholder = "", value, onChange }) => (
  <label className="field wide-field">
    <span>{label}</span>
    <textarea value={value ?? ""} onChange={(event) => onChange?.(event.target.value)} placeholder={placeholder} rows={4} />
  </label>
);

export default MissionForm;
