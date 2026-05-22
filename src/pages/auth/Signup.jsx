import { useState } from "react";
import { UserPlus } from "lucide-react";
import ActionButton from "../../components/common/ActionButton";
import { userRoles } from "../../data/authData";

const Signup = ({ onSignup, onAuthViewChange }) => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    organization: "",
    role: "operations_manager",
    profileImage: ""
  });

  const handleSubmit = (event) => {
    event.preventDefault();
    onSignup(form);
  };

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <div>
        <h2>Create account</h2>
        <p>Register with identity, organization details, role, and optional profile image reference.</p>
      </div>
      <div className="auth-form-grid">
        <label className="field">
          <span>Name</span>
          <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
        </label>
        <label className="field">
          <span>Email</span>
          <input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required />
        </label>
        <label className="field">
          <span>Password</span>
          <input type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} required />
        </label>
        <label className="field">
          <span>Organization</span>
          <input value={form.organization} onChange={(event) => setForm({ ...form, organization: event.target.value })} required />
        </label>
        <label className="field">
          <span>Role</span>
          <select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })}>
            {userRoles.map((role) => (
              <option key={role.id} value={role.id}>{role.label}</option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Profile Image URL</span>
          <input value={form.profileImage} onChange={(event) => setForm({ ...form, profileImage: event.target.value })} placeholder="Optional" />
        </label>
      </div>
      <ActionButton icon={UserPlus} variant="primary" type="submit">Create account</ActionButton>
      <div className="auth-switch">
        <span>Already registered?</span>
        <button type="button" className="text-button" onClick={() => onAuthViewChange("login")}>
          Back to login
        </button>
      </div>
    </form>
  );
};

export default Signup;
