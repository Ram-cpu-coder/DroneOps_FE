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

export default MissionForm;
