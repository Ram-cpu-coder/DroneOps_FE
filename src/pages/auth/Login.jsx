import { useState } from "react";
import { LogIn } from "lucide-react";
import ActionButton from "../../components/common/ActionButton";

const Login = ({ error, onLogin, onAuthViewChange }) => {
  const [form, setForm] = useState({ email: "ops@droneops.test", password: "Password123!" });
  const [showDemo, setShowDemo] = useState(false);

  const handleSubmit = (event) => {
    event.preventDefault();
    onLogin(form);
  };

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <div>
        <h2>Log in</h2>
        <p>Use your DroneOps account to access fleet, mission, safety, and compliance modules.</p>
      </div>
      {error && <div className="auth-alert">{error}</div>}
      <label className="field">
        <span>Email</span>
        <input
          type="email"
          value={form.email}
          onChange={(event) => setForm({ ...form, email: event.target.value })}
          placeholder="ops@droneops.test"
          required
        />
      </label>
      <label className="field">
        <span>Password</span>
        <input
          type="password"
          value={form.password}
          onChange={(event) => setForm({ ...form, password: event.target.value })}
          placeholder="Password123!"
          required
        />
      </label>
      <div className="auth-row">
        <label className="checkbox-row">
          <input type="checkbox" defaultChecked />
          <span>Keep session active</span>
        </label>
        <button type="button" className="text-button" onClick={() => onAuthViewChange("reset")}>
          Forgot password?
        </button>
      </div>
      <ActionButton icon={LogIn} variant="primary" type="submit">Login</ActionButton>
      <div className="auth-switch">
        <span>No account yet?</span>
        <button type="button" className="text-button" onClick={() => onAuthViewChange("signup")}>
          Create account
        </button>
      </div>
      <button type="button" className="demo-toggle" onClick={() => setShowDemo((current) => !current)}>
        {showDemo ? "Hide demo credentials" : "Use demo credentials"}
      </button>
      {showDemo && (
        <div className="demo-credentials">
          <strong>Demo accounts</strong>
          <button type="button" onClick={() => setForm({ email: "ops@droneops.test", password: "Password123!" })}>
            Operations Manager
          </button>
          <button type="button" onClick={() => setForm({ email: "pilot@droneops.test", password: "Password123!" })}>
            Remote Pilot
          </button>
          <button type="button" onClick={() => setForm({ email: "unverified@droneops.test", password: "Password123!" })}>
            Unverified User
          </button>
        </div>
      )}
    </form>
  );
};

export default Login;
