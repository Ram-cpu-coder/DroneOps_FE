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
    </select>
  </label>
);

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

export default IncidentForm;
