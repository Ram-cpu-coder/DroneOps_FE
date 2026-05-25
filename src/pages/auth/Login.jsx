import { useState } from "react";
import { ArrowRight, BarChart3, Eye, EyeOff, Lock, MapPin, RadioTower, ShieldCheck, User } from "lucide-react";
import ActionButton from "../../components/common/ActionButton";

const Login = ({ error, onLogin, onAuthViewChange }) => {
  const [form, setForm] = useState({ email: "ops@droneops.test", password: "Password123!" });
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (event) => {
    event.preventDefault();
    onLogin(form);
  };

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <div>
        <h2>Welcome Back</h2>
        <p>Sign in to continue your operations</p>
      </div>
      {error && <div className="auth-alert">{error}</div>}
      <label className="field">
        <span>Email</span>
        <User className="field-icon" size={18} />
        <input
          type="email"
          value={form.email}
          onChange={(event) => setForm({ ...form, email: event.target.value })}
          placeholder="Email Address"
          required
        />
      </label>
      <label className="field">
        <span>Password</span>
        <Lock className="field-icon" size={18} />
        <input
          type={showPassword ? "text" : "password"}
          value={form.password}
          onChange={(event) => setForm({ ...form, password: event.target.value })}
          placeholder="Password"
          required
        />
        <button
          className="field-trailing-button"
          type="button"
          onClick={() => setShowPassword((current) => !current)}
          aria-label={showPassword ? "Hide password" : "Show password"}
        >
          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </label>
      <div className="auth-row">
        <button type="button" className="text-button" onClick={() => onAuthViewChange("reset")}>
          Forgot password?
        </button>
      </div>
      <ActionButton icon={ArrowRight} iconPosition="end" variant="primary" type="submit">Log In</ActionButton>
      <div className="auth-divider"><span>or</span></div>
      <button className="google-button" type="button">
        <span className="google-mark">G</span>
        Sign in with Google
      </button>
      <div className="auth-switch">
        <span>No account yet?</span>
        <button type="button" className="text-button" onClick={() => onAuthViewChange("signup")}>
          Create account
        </button>
      </div>
      <div className="login-feature-grid">
        <FeatureTile icon={RadioTower} label="Real-time Monitoring" />
        <FeatureTile icon={MapPin} label="Mission Management" />
        <FeatureTile icon={BarChart3} label="Data Analytics" />
        <FeatureTile icon={ShieldCheck} label="Secure Operations" />
      </div>
    </form>
  );
};

const FeatureTile = ({ icon: Icon, label }) => (
  <div className="login-feature-tile">
    <span><Icon size={22} /></span>
    <p>{label}</p>
  </div>
);

export default Login;
