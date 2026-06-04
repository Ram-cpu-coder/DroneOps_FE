<<<<<<< HEAD
import { AlertTriangle, MapPinned, RadioTower, Save, UserRoundCheck, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import ActionButton from "../../../components/common/ActionButton";
import { useApiResource } from "../../../hooks/useApiResource";
import { droneOpsApi } from "../../../services/droneOpsApi";

const severityLevels = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
const incidentSources = ["Telemetry", "Weather", "Pilot Report", "Maintenance", "Geofence", "Manual Report"];
const incidentTypes = [
  { value: "LOSS_OF_SIGNAL", label: "Loss of signal" },
  { value: "GEOFENCE_BREACH", label: "Geofence alert" },
  { value: "LOW_BATTERY", label: "Low battery" },
  { value: "COLLISION", label: "Collision" },
  { value: "EMERGENCY_LANDING", label: "Emergency landing" },
  { value: "EQUIPMENT_FAILURE", label: "Equipment issue" },
  { value: "WEATHER_EVENT", label: "Weather event" }
];

const initialForm = {
  incidentCode: "",
  title: "",
  type: "",
  severity: "LOW",
  droneId: "",
  missionId: "",
  assignedToId: "",
  source: "Manual Report",
  location: "",
  details: ""
};

const IncidentForm = ({ onCreated, onCancel }) => {
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const loadDrones = useCallback(() => droneOpsApi.drones.list(), []);
  const loadMissions = useCallback(() => droneOpsApi.missions.list(), []);
  const loadUsers = useCallback(() => droneOpsApi.users.list(), []);
  const { data: drones } = useApiResource(loadDrones, []);
  const { data: missions } = useApiResource(loadMissions, []);
  const { data: users } = useApiResource(loadUsers, []);

  const ownerOptions = useMemo(
    () => users.filter((user) => ["SAFETY_OFFICER", "MAINTENANCE_COORDINATOR", "OPERATIONS_MANAGER", "SYSTEM_ADMINISTRATOR"].includes(user.role)),
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

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    setError("");

    try {
      const incident = await droneOpsApi.incidents.create({
        incidentCode: form.incidentCode,
        title: form.title,
        type: form.type,
        severity: form.severity,
        droneId: form.droneId,
        missionId: form.missionId || undefined,
        assignedToId: form.assignedToId || undefined,
        source: form.source || undefined,
        location: form.location || undefined,
        details: form.details || undefined
      });

      setForm(initialForm);
      onCreated?.({
        ...incident,
        incidentCode: incident.incidentCode ?? form.incidentCode
      });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsSaving(false);
    }
  };

  const dialog = (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onCancel?.()}>
      <form className="modal-dialog registration-dialog" role="dialog" aria-modal="true" aria-labelledby="log-incident-title" onSubmit={handleSubmit}>
        <div className="modal-header">
          <div>
            <p className="eyebrow">Incident Register</p>
            <h2 id="log-incident-title">Log Incident</h2>
            <p>Record what happened, link the drone, and assign someone to follow up.</p>
          </div>
          <button className="icon-button" type="button" onClick={onCancel} aria-label="Close incident form">
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          {error && <div className="auth-alert">{error}</div>}

          <div className="form-layout modal-form-layout">
            <FormSection icon={AlertTriangle} title="Incident Details">
              <Field label="Incident ID" value={form.incidentCode} onChange={(value) => updateField("incidentCode", value)} placeholder="INC-2204" required />
              <Field label="Title" value={form.title} onChange={(value) => updateField("title", value)} placeholder="Low battery during inspection" required />
              <SelectField label="Incident Type" value={form.type} onChange={(value) => updateField("type", value)} options={incidentTypes} required />
              <SelectField label="Severity" value={form.severity} onChange={(value) => updateField("severity", value)} options={severityLevels} required />
            </FormSection>

            <FormSection icon={RadioTower} title="Linked Records">
              <SelectField
                label="Drone"
                value={form.droneId}
                onChange={(value) => updateField("droneId", value)}
                options={drones.map((drone) => ({ value: drone.id, label: `${drone.droneCode ?? drone.id} - ${drone.model}` }))}
                required
              />
              <SelectField
                label="Mission"
                value={form.missionId}
                onChange={(value) => updateField("missionId", value)}
                options={missions.map((mission) => ({ value: mission.id, label: `${mission.missionCode ?? mission.id} - ${mission.name}` }))}
              />
              <SelectField label="Source" value={form.source} onChange={(value) => updateField("source", value)} options={incidentSources} />
            </FormSection>

            <FormSection icon={UserRoundCheck} title="Follow Up">
              <SelectField
                label="Assigned Owner"
                value={form.assignedToId}
                onChange={(value) => updateField("assignedToId", value)}
                options={ownerOptions.map((owner) => ({ value: owner.id, label: owner.name }))}
              />
              <Field label="Location" value={form.location} onChange={(value) => updateField("location", value)} placeholder="Site B - Zone 2" />
            </FormSection>

            <FormSection icon={MapPinned} title="Notes">
              <TextareaField
                label="What happened?"
                value={form.details}
                onChange={(value) => updateField("details", value)}
                placeholder="Add a short description, immediate action taken, and any useful evidence."
              />
            </FormSection>
          </div>
        </div>

        <div className="modal-footer">
          <label className="checkbox-row">
            <input type="checkbox" />
            <span>Incident details are ready to save.</span>
          </label>
          <div className="form-actions">
            <ActionButton onClick={onCancel}>Cancel</ActionButton>
            <ActionButton icon={Save} variant="primary" type="submit" disabled={isSaving}>
              {isSaving ? "Logging" : "Log Incident"}
            </ActionButton>
          </div>
        </div>
      </form>
    </div>
  );

  return createPortal(dialog, document.body);
=======
import { AlertTriangle, ClipboardCheck, MapPinned, RadioTower, Save, ShieldAlert, UserRoundCheck } from "lucide-react";
import ActionButton from "../../../components/common/ActionButton";
import SectionHeader from "../../../components/common/SectionHeader";
import { drones, missions } from "../../../data/droneOpsData";

const severityLevels = ["Low", "Medium", "High", "Critical"];
const incidentStatuses = ["Open", "Investigating", "Monitoring", "Resolved", "Closed"];
const incidentSources = ["Telemetry", "Weather API", "Pilot Report", "Maintenance Diagnostics", "Geofence Monitor", "Manual Report"];
const incidentTypes = ["Battery", "Weather", "Geofence", "Telemetry", "Maintenance", "Safety", "Compliance"];
const owners = ["Safety Officer", "Maintenance Coordinator", "Operations Manager", "Compliance Officer", "Remote Pilot"];

const IncidentForm = ({ onCancel }) => {
  return (
    <form className="panel registration-panel">
      <SectionHeader
        title="Log Incident"
        description="Record operational incidents with severity, source evidence, ownership, and corrective action workflow."
        action={<ActionButton icon={Save} variant="primary">Save Draft</ActionButton>}
      />

      <div className="doc-callout">
        <strong>Documentation alignment</strong>
        <span>Supports safety review, geofence breach monitoring, incident register ownership, hazard tracking, and audit evidence for compliance reporting.</span>
      </div>

      <div className="form-layout">
        <FormSection icon={AlertTriangle} title="Incident Summary">
          <Field label="Incident ID" placeholder="INC-2204" />
          <Field label="Title" placeholder="Geofence warning near waypoint 7" />
          <SelectField label="Incident Type" options={incidentTypes} />
          <SelectField label="Severity" options={severityLevels} />
        </FormSection>

        <FormSection icon={RadioTower} title="Operational Context">
          <SelectField label="Linked Mission" options={missions.map((mission) => `${mission.id} - ${mission.name}`)} />
          <SelectField label="Linked Drone" options={drones.map((drone) => `${drone.id} - ${drone.model}`)} />
          <SelectField label="Source" options={incidentSources} />
          <Field label="Reported Time" type="datetime-local" />
        </FormSection>

        <FormSection icon={MapPinned} title="Location & Evidence">
          <Field label="Location" placeholder="Site B - Zone 2" />
          <Field label="Waypoint / Coordinate" placeholder="WP-07 / -33.86, 151.20" />
          <Field label="Telemetry Reference" placeholder="TEL-2026-0525-1042" />
          <Field label="Attachment Reference" placeholder="Photo, log, or flight recording ID" />
        </FormSection>

        <FormSection icon={UserRoundCheck} title="Ownership">
          <SelectField label="Owner Role" options={owners} />
          <Field label="Assigned Owner" placeholder="Safety Officer" />
          <SelectField label="Status" options={incidentStatuses} />
          <Field label="Due Date" type="date" />
        </FormSection>

        <FormSection icon={ShieldAlert} title="Safety Review">
          <TextareaField label="Incident Details" placeholder="Describe what happened, triggering condition, affected drone/mission, and immediate operational impact." />
          <TextareaField label="Immediate Action Taken" placeholder="Hold mission, return-to-home, pilot notification, maintenance lock, or safety review." />
          <TextareaField label="Corrective / Preventive Action" placeholder="Follow-up actions, responsible team, target completion, and verification evidence." />
          <TextareaField label="Hazard Register Notes" placeholder="Link new or existing hazard register items and mitigation controls." />
        </FormSection>

        <FormSection icon={ClipboardCheck} title="Workflow Rules">
          <RuleItem title="Critical escalation" text="Critical incidents should alert Safety Officer and Operations Manager immediately." />
          <RuleItem title="Grounding trigger" text="Airworthiness or maintenance defects should ground the affected drone until cleared." />
          <RuleItem title="Audit trail" text="Incident changes should retain source, owner, timestamps, notes, and closure evidence." />
          <RuleItem title="Closure requirement" text="Resolved incidents require corrective action notes and review confirmation." />
        </FormSection>
      </div>

      <div className="registration-footer">
        <label className="checkbox-row">
          <input type="checkbox" />
          <span>Incident has enough evidence for triage and ownership assignment.</span>
        </label>
        <div className="form-actions">
          <ActionButton onClick={onCancel}>Cancel</ActionButton>
          <ActionButton icon={Save} variant="primary">Log Incident</ActionButton>
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
export default IncidentForm;
