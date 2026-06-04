import { MailCheck } from "lucide-react";
import ActionButton from "../../components/common/ActionButton";

const VerifyEmail = ({ pendingUser, emailSent, emailError, canUseLocalVerification, onVerify, onAuthViewChange }) => {
  return (
    <div className="auth-form">
      <div>
        <h2>Email verification</h2>
        <p>We sent a secure verification link to your email. Open it once, then come back and log in.</p>
      </div>
      <div className="verification-card">
        <strong>{emailSent ? "Check your inbox" : "Verification is ready"}</strong>
        <span>{pendingUser?.email}</span>
        {!emailSent && emailError && (
          <small>Email delivery needs SMTP review. You can still use local verification while developing.</small>
        )}
      </div>
      {canUseLocalVerification && !emailSent && (
        <ActionButton icon={MailCheck} variant="primary" onClick={onVerify}>
          Verify locally
        </ActionButton>
      )}
      <button type="button" className="text-button left" onClick={() => onAuthViewChange("login")}>
        Back to login
      </button>
    </div>
  );
};

export default VerifyEmail;
