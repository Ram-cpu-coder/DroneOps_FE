<<<<<<< HEAD
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
            <input type="checkbox" />
            <span>Mission details are ready to save.</span>
          </label>
          <div className="form-actions">
            <ActionButton onClick={onCancel}>Cancel</ActionButton>
            <ActionButton icon={Save} variant="primary" type="submit" disabled={isSaving}>
              {isSaving ? "Creating" : "Create Mission"}
            </ActionButton>
          </div>
        </div>
      </form>
    </div>
  );

  return createPortal(dialog, document.body);
=======
import { CalendarClock, ClipboardCheck, MapPinned, Route, Save, ShieldCheck, UserRound } from "lucide-react";
import ActionButton from "../../../components/common/ActionButton";
import SectionHeader from "../../../components/common/SectionHeader";
import { drones } from "../../../data/droneOpsData";

const missionTypes = ["Mapping", "Inspection", "Security", "Delivery", "Training", "Emergency Response"];
const missionStatuses = ["Draft", "Scheduled", "In Progress", "Paused", "Completed", "Cancelled"];
const riskLevels = ["Low", "Medium", "High", "Critical"];
const pilots = ["Maya Chen", "Noah Patel", "Ava Brown", "Jordan Lee", "Remote Pilot Pool"];

const MissionForm = ({ onCancel }) => {
  return (
    <form className="panel registration-panel">
      <SectionHeader
        title="Create Mission"
        description="Plan mission scope, route controls, crew assignment, and safety approvals before dispatch."
        action={<ActionButton icon={Save} variant="primary">Save Draft</ActionButton>}
      />

      <div className="doc-callout">
        <strong>Documentation alignment</strong>
        <span>Captures mission assignment, operational area, risk assessment, JSA confirmation, geofence rules, and pilot/drone readiness for the PostgreSQL `missions` workflow.</span>
      </div>

      <div className="form-layout">
        <FormSection icon={Route} title="Mission Identity">
          <Field label="Mission ID" placeholder="MIS-1046" />
          <Field label="Mission Name" placeholder="North Ridge Thermal Sweep" />
          <SelectField label="Mission Type" options={missionTypes} />
          <SelectField label="Status" options={missionStatuses} />
        </FormSection>

        <FormSection icon={UserRound} title="Assignment">
          <SelectField label="Assigned Drone" options={drones.map((drone) => `${drone.id} - ${drone.model}`)} />
          <SelectField label="Remote Pilot" options={pilots} />
          <Field label="Operations Manager" placeholder="Operations Manager" />
          <Field label="Support Crew" placeholder="Visual observer / payload specialist" />
        </FormSection>

        <FormSection icon={MapPinned} title="Route & Location">
          <Field label="Launch Site" placeholder="Site A - Dock 01" />
          <Field label="Operating Area" placeholder="Site A - Zone 1" />
          <Field label="Waypoint Count" type="number" placeholder="18" />
          <Field label="Geofence Profile" placeholder="North Ridge perimeter" />
        </FormSection>

        <FormSection icon={CalendarClock} title="Schedule">
          <Field label="Planned Date" type="date" />
          <Field label="Start Time" type="time" />
          <Field label="Estimated Duration" placeholder="45 min" />
          <Field label="Return-to-Home Buffer" placeholder="25% battery reserve" />
        </FormSection>

        <FormSection icon={ShieldCheck} title="Risk & Safety">
          <SelectField label="Risk Level" options={riskLevels} />
          <Field label="Weather Minimums" placeholder="Wind < 34 km/h, visibility > 5 km" />
          <TextareaField label="JSA / Hazard Notes" placeholder="Known hazards, public proximity, restricted areas, and mitigation plan." />
          <TextareaField label="Emergency Procedure" placeholder="Lost link, geofence breach, low battery, and forced landing procedure." />
        </FormSection>

        <FormSection icon={ClipboardCheck} title="Readiness Checks">
          <RuleItem title="Airworthiness" text="Drone must be certified, charged, and not under maintenance or grounded status." />
          <RuleItem title="Pilot readiness" text="Pilot must be assigned and allowed to submit flight logs and risk assessment." />
          <RuleItem title="Compliance pack" text="Mission should retain JSA, geofence, telemetry, and post-flight log evidence." />
          <RuleItem title="Dispatch lock" text="High/Critical risk missions require Safety Officer review before launch." />
        </FormSection>
      </div>

      <div className="registration-footer">
        <label className="checkbox-row">
          <input type="checkbox" />
          <span>Risk assessment, JSA, and pre-flight requirements are ready for review.</span>
        </label>
        <div className="form-actions">
          <ActionButton onClick={onCancel}>Cancel</ActionButton>
          <ActionButton icon={Save} variant="primary">Create Mission</ActionButton>
        </div>
      </div>
    </form>
  );
>>>>>>> a42502c6d700f2717489ee870fd450c6431788f9
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

<<<<<<< HEAD
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
=======
const Field = ({ label, type = "text", placeholder = "" }) => (
  <label className="field">
    <span>{label}</span>
    <input type={type} placeholder={placeholder} />
  </label>
);

const SelectField = ({ label, options }) => (
  <label className="field">
    <span>{label}</span>
    <select defaultValue="">
      <option value="" disabled>Select {label.toLowerCase()}</option>
      {options.map((option) => (
        <option key={option} value={option}>{option}</option>
      ))}
>>>>>>> a42502c6d700f2717489ee870fd450c6431788f9
    </select>
  </label>
);

<<<<<<< HEAD
const TextareaField = ({ label, placeholder = "", value, onChange }) => (
  <label className="field wide-field">
    <span>{label}</span>
    <textarea value={value ?? ""} onChange={(event) => onChange?.(event.target.value)} placeholder={placeholder} rows={4} />
  </label>
);

=======
const TextareaField = ({ label, placeholder = "" }) => (
  <label className="field wide-field">
    <span>{label}</span>
    <textarea placeholder={placeholder} rows={4} />
  </label>
);

const RuleItem = ({ title, text }) => (
  <div className="rule-item">
    <strong>{title}</strong>
    <span>{text}</span>
  </div>
);

>>>>>>> a42502c6d700f2717489ee870fd450c6431788f9
export default MissionForm;
