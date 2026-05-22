import { useState } from "react";
import { KeyRound } from "lucide-react";
import ActionButton from "../../components/common/ActionButton";

const PasswordReset = ({ result, onReset, onAuthViewChange }) => {
  const [email, setEmail] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();
    onReset(email);
  };

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <div>
        <h2>Password reset</h2>
        <p>Prepare a secure reset flow with a one-time token and rate-limit messaging for backend integration.</p>
      </div>
      {result && (
        <div className="verification-card">
          <strong>{result.message}</strong>
          <code>{result.token}</code>
        </div>
      )}
      <label className="field">
        <span>Email</span>
        <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
      </label>
      <ActionButton icon={KeyRound} variant="primary" type="submit">Send reset link</ActionButton>
      <button type="button" className="text-button left" onClick={() => onAuthViewChange("login")}>
        Back to login
      </button>
    </form>
  );
};

export default PasswordReset;
