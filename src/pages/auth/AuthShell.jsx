import { Plane } from "lucide-react";
import DroneOpsVantaScene from "../../components/visuals/DroneOpsVantaScene";

const AuthShell = ({ children }) => {
  return (
    <main className="auth-shell">
      <section className="auth-panel">
        <div className="auth-brand">
          <div className="brand-mark">
            <Plane size={24} strokeWidth={2.4} />
          </div>
          <div>
            <h1>DroneOps</h1>
            <p>Enterprise drone operations governance</p>
          </div>
        </div>
        {children}
      </section>
      <aside className="auth-aside">
        <DroneOpsVantaScene />
        <div className="auth-identity-card">
          <div className="auth-orbit-logo">
            <Plane size={42} strokeWidth={2.2} />
          </div>
          <p className="eyebrow">DroneOps Platform</p>
          <h2>Fleet. Missions. Safety.</h2>
          <p>Enterprise drone operations in one secure command space.</p>
          <div className="auth-status-strip">
            <span>Live fleet</span>
            <span>Mission ready</span>
            <span>Compliance aware</span>
          </div>
        </div>
      </aside>
    </main>
  );
};

export default AuthShell;
