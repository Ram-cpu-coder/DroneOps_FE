import { MailCheck } from "lucide-react";
import ActionButton from "../../components/common/ActionButton";

const VerifyEmail = ({ pendingUser, verificationToken, onVerify, onAuthViewChange }) => {
  return (
    <div className="auth-form">
      <div>
        <h2>Email verification</h2>
        <p>DroneOps blocks unverified users from the operations portal until verification is completed.</p>
      </div>
      <div className="verification-card">
        <strong>Verification email prepared</strong>
        <span>{pendingUser?.email}</span>
        <code>{verificationToken}</code>
      </div>
      <ActionButton icon={MailCheck} variant="primary" onClick={onVerify}>
        Simulate Verify Email
      </ActionButton>
      <button type="button" className="text-button left" onClick={() => onAuthViewChange("login")}>
        Back to login
      </button>
    </div>
  );
};

export default VerifyEmail;
