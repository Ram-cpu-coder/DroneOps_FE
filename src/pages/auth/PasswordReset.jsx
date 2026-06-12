import { useEffect, useMemo, useState } from "react";
import { KeyRound, Mail, MailCheck } from "lucide-react";
import ActionButton from "../../components/common/ActionButton";
import { API_BASE_URL } from "../../services/apiClient";

const PasswordReset = ({ result, error, isLoading, onReset, onAuthViewChange }) => {
  const [email, setEmail] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const cooldownLabel = useMemo(() => {
    const minutes = Math.floor(cooldown / 60).toString().padStart(2, "0");
    const seconds = (cooldown % 60).toString().padStart(2, "0");
    return `${minutes}:${seconds}`;
  }, [cooldown]);

  useEffect(() => {
    if (!result) return;
    setCooldown(result.cooldownSeconds ?? 120);
  }, [result]);

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const timerId = window.setInterval(() => {
      setCooldown((current) => Math.max(current - 1, 0));
    }, 1000);

    return () => window.clearInterval(timerId);
  }, [cooldown]);

  const handleSubmit = (event) => {
    event.preventDefault();
    if (isLoading || cooldown > 0) return;
    onReset(email.trim());
  };

  return (
    <form className="auth-form password-reset-form" onSubmit={handleSubmit}>
      <div>
        <h2>Password reset</h2>
        <p>Enter your account email and we will send a secure reset link.</p>
      </div>
      {error && <div className="auth-alert">{error}</div>}
      {result && (
        <div className="verification-card reset-result-card">
          <div className="verification-icon">
            <MailCheck size={26} />
          </div>
          <div className="verification-content">
            <strong>Reset link sent</strong>
            <p>Open the secure link from your inbox to create a new password.</p>
          </div>
          {cooldown > 0 && (
            <div className="reset-cooldown" role="timer" aria-live="polite">
              <span>Resend available</span>
              <strong>{cooldownLabel}</strong>
            </div>
          )}
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
      <ActionButton icon={KeyRound} variant="primary" type="submit" disabled={isLoading || cooldown > 0} isLoading={isLoading}>
        {isLoading ? "Sending reset link..." : cooldown > 0 ? `Resend in ${cooldownLabel}` : "Send reset link"}
      </ActionButton>
      <button type="button" className="text-button left" onClick={() => onAuthViewChange("login")}>
        Back to login
      </button>
    </form>
  );
};

export default PasswordReset;
