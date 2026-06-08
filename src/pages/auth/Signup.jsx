import { useState } from "react";
import { Eye, EyeOff, ImagePlus, UserPlus } from "lucide-react";
import ActionButton from "../../components/common/ActionButton";
import { userRoles } from "../../data/authData";
import { authService } from "../../features/auth/authService";

const passwordRules = [
  { id: "length", label: "At least 8 characters", test: (value) => value.length >= 8 },
  { id: "uppercase", label: "One uppercase letter", test: (value) => /[A-Z]/.test(value) },
  { id: "lowercase", label: "One lowercase letter", test: (value) => /[a-z]/.test(value) },
  { id: "number", label: "One number", test: (value) => /\d/.test(value) },
  { id: "special", label: "One special character", test: (value) => /[^A-Za-z0-9]/.test(value) }
];

const Signup = ({ error, isLoading, onSignup, onAuthViewChange }) => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    organization: "",
    role: "operations_manager",
    profileImageUrl: ""
  });
  const [showPassword, setShowPassword] = useState(false);
  const [imageUpload, setImageUpload] = useState({ isUploading: false, fileName: "", error: "" });
  const passwordStatus = passwordRules.map((rule) => ({ ...rule, isValid: rule.test(form.password) }));
  const isPasswordValid = passwordStatus.every((rule) => rule.isValid);

  const handleSubmit = (event) => {
    event.preventDefault();
    if (isLoading) return;
    if (!isPasswordValid) return;
    onSignup(form);
  };

  const handleProfileImageChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImageUpload({ isUploading: true, fileName: file.name, error: "" });
    try {
      const result = await authService.uploadProfileImage(file);
      setForm((current) => ({ ...current, profileImageUrl: result.profileImageUrl }));
      setImageUpload({ isUploading: false, fileName: file.name, error: "" });
    } catch (uploadError) {
      setForm((current) => ({ ...current, profileImageUrl: "" }));
      setImageUpload({ isUploading: false, fileName: "", error: uploadError.message });
    }
  };

  return (
    <form className="auth-form signup-form" onSubmit={handleSubmit}>
      <div>
        <h2>Create account</h2>
        <p>Register with identity, organization details, role, and optional profile image reference.</p>
      </div>
      {error && <div className="auth-alert">{error}</div>}
      <fieldset className="auth-form-grid" disabled={isLoading}>
        <label className="field wide-field">
          <span>Name</span>
          <input
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            placeholder="Full name"
            required
          />
        </label>
        <label className="field wide-field">
          <span>Email</span>
          <input
            type="email"
            value={form.email}
            onChange={(event) => setForm({ ...form, email: event.target.value })}
            placeholder="work.email@example.com"
            required
          />
        </label>
        <label className="field password-field wide-field">
          <span>Password</span>
          <input
            type={showPassword ? "text" : "password"}
            value={form.password}
            onChange={(event) => setForm({ ...form, password: event.target.value })}
            placeholder="Strong password"
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
        <div className="password-rules" aria-live="polite">
          {passwordStatus.map((rule) => (
            <span key={rule.id} className={rule.isValid ? "is-valid" : ""}>
              {rule.isValid ? "OK" : "--"} {rule.label}
            </span>
          ))}
        </div>
        <label className="field wide-field">
          <span>Organization</span>
          <input
            value={form.organization}
            onChange={(event) => setForm({ ...form, organization: event.target.value })}
            placeholder="Organization name"
            required
          />
        </label>
        <label className="field">
          <span>Role</span>
          <select
            value={form.role}
            onChange={(event) => setForm({ ...form, role: event.target.value })}
            aria-label="Select role"
          >
            {userRoles.map((role) => (
              <option key={role.id} value={role.id}>{role.label}</option>
            ))}
          </select>
        </label>
        <label className="upload-field wide-field">
          <input type="file" accept="image/*" onChange={handleProfileImageChange} disabled={isLoading || imageUpload.isUploading} />
          <span><ImagePlus size={18} /> Upload profile image</span>
          <small>
            {imageUpload.isUploading
              ? "Uploading to Cloudinary..."
              : imageUpload.fileName || "Optional PNG, JPG, or WebP"}
          </small>
        </label>
        {imageUpload.error && <div className="auth-alert wide-field">{imageUpload.error}</div>}
      </fieldset>
      {isLoading && (
        <div className="auth-progress" role="status">
          Creating your DroneOps account and preparing verification...
        </div>
      )}
      <ActionButton icon={UserPlus} variant="primary" type="submit" disabled={isLoading || imageUpload.isUploading || !isPasswordValid} isLoading={isLoading}>
        {isLoading ? "Creating account..." : "Create account"}
      </ActionButton>
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
