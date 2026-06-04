import { useState } from "react";
import { KeyRound, Mail } from "lucide-react";
import ActionButton from "../../components/common/ActionButton";
import { API_BASE_URL } from "../../services/apiClient";

const PasswordReset = ({ result, error, isLoading, onReset, onAuthViewChange }) => {
  const [email, setEmail] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();
    if (isLoading) return;
    onReset(email);
  };

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <div>
        <h2>Password reset</h2>
        <p>Enter your account email and we will send a secure reset link.</p>
      </div>
      {error && <div className="auth-alert">{error}</div>}
      {result && (
        <div className="verification-card">
          <strong>{result.emailSent ? "Reset link sent" : "Reset link prepared"}</strong>
          <span>Check your inbox for the password reset email.</span>
          {!result.emailSent && result.emailError && (
            <small>Email delivery needs SMTP review. You can still open the reset page locally while developing.</small>
          )}
          {result.devResetToken && (
            <a className="auth-inline-link" href={`${API_BASE_URL}/auth/reset-password/${result.devResetToken}`} target="_blank" rel="noreferrer">
              Open local reset page
            </a>
          )}
        </div>
      )}
      <label className="field">
        <span>Email</span>
        <Mail className="field-icon" size={18} />
        <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} disabled={isLoading} required />
      </label>
      {isLoading && (
        <div className="auth-progress" role="status">
          Preparing your secure password reset link...
        </div>
      )}
      <ActionButton icon={KeyRound} variant="primary" type="submit" disabled={isLoading} isLoading={isLoading}>
        {isLoading ? "Sending reset link..." : "Send reset link"}
      </ActionButton>
      <button type="button" className="text-button left" onClick={() => onAuthViewChange("login")}>
        Back to login
      </button>
    </form>
  );
};

export default PasswordReset;
