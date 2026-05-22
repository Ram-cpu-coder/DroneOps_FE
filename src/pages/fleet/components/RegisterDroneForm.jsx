import { CalendarClock, ClipboardCheck, Cpu, FileCheck2, Plane, Save } from "lucide-react";
import ActionButton from "../../../components/common/ActionButton";
import SectionHeader from "../../../components/common/SectionHeader";

const droneStatuses = [
  "AVAILABLE",
  "IN_MISSION",
  "MAINTENANCE",
  "GROUNDED",
  "DISCONNECTED",
  "AWAITING_APPROVAL"
];
const certificationStatuses = [
  "CERTIFIED",
  "AWAITING_APPROVAL",
  "AWAITING_RENEWAL",
  "EXPIRED",
  "GROUNDED_PENDING_INSPECTION"
];
const batteryTypes = ["Li-ion 6S", "LiPo 4S", "LiPo 6S", "Smart battery pack", "Emergency battery pack"];

const RegisterDroneForm = () => {
  return (
    <form className="panel registration-panel">
      <SectionHeader
        title="Register New Drone"
        description="Capture aircraft identity, compliance, payload, assignment, and maintenance details before it joins the operational fleet."
        action={<ActionButton icon={Save} variant="primary">Save Draft</ActionButton>}
      />

      <div className="doc-callout">
        <strong>Documentation alignment</strong>
        <span>Registers a record for the PostgreSQL `drones` entity. Serial number should be unique, and default status should be AVAILABLE when approved.</span>
      </div>

      <div className="form-layout">
        <FormSection icon={Plane} title="Aircraft Identity">
          <Field label="Drone ID" placeholder="DRN-007" />
          <Field label="Model" placeholder="Matrice 350 RTK" />
          <Field label="Manufacturer" placeholder="DJI / Autel / Custom" />
          <Field label="Serial Number" placeholder="SN-2026-0007" />
        </FormSection>

        <FormSection icon={Cpu} title="Operational Metadata">
          <SelectField label="Battery Type" options={batteryTypes} />
          <Field label="Firmware Version" placeholder="v12.4.1" />
          <SelectField label="Status" options={droneStatuses} />
          <Field label="Flight Hours" type="number" placeholder="0" />
        </FormSection>

        <FormSection icon={CalendarClock} title="Lifecycle Dates">
          <Field label="Purchase Date" type="date" />
          <Field label="Next Inspection Due" type="date" />
          <Field label="Last Maintenance Date" type="date" />
          <Field label="Flight-Hour Inspection Threshold" placeholder="50 hours" />
        </FormSection>

        <FormSection icon={FileCheck2} title="Certification">
          <SelectField label="Certification Status" options={certificationStatuses} />
          <Field label="Certification Reference" placeholder="CASA-RPA-0007" />
          <Field label="Certification Expiry" type="date" />
          <Field label="Remote ID" placeholder="RID-DRN-007" />
        </FormSection>

        <FormSection icon={ClipboardCheck} title="Business Rules">
          <RuleItem title="Grounding restriction" text="GROUNDED drones cannot be assigned to missions." />
          <RuleItem title="Maintenance lock" text="MAINTENANCE drones are unavailable until service is closed." />
          <RuleItem title="Critical defects" text="Critical defects should automatically move the drone to GROUNDED." />
          <RuleItem title="Telemetry failure" text="Telemetry timeout should update status to DISCONNECTED." />
        </FormSection>
      </div>

      <div className="registration-footer">
        <label className="checkbox-row">
          <input type="checkbox" />
          <span>Pre-flight inspection completed and aircraft is safe to assign.</span>
        </label>
        <div className="form-actions">
          <ActionButton>Cancel</ActionButton>
          <ActionButton icon={Save} variant="primary">Register Drone</ActionButton>
        </div>
      </div>
    </form>
  );
};

const FormSection = ({ icon: Icon, title, children }) => {
  return (
    <section className="form-section">
      <div className="form-section-title">
        <Icon size={18} />
        <h3>{title}</h3>
      </div>
      <div className="form-grid">{children}</div>
    </section>
  );
};

const Field = ({ label, type = "text", placeholder = "" }) => {
  return (
    <label className="field">
      <span>{label}</span>
      <input type={type} placeholder={placeholder} />
    </label>
  );
};

const SelectField = ({ label, options }) => {
  return (
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
};

const RuleItem = ({ title, text }) => {
  return (
    <div className="rule-item">
      <strong>{title}</strong>
      <span>{text}</span>
    </div>
  );
};

export default RegisterDroneForm;
