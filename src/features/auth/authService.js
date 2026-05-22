import { demoUsers, userRoles } from "../../data/authData";

const SESSION_KEY = "droneops_mock_session";
const SESSION_DURATION_MS = 30 * 60 * 1000;

const createToken = (prefix) => `${prefix}.${Date.now()}.${Math.random().toString(36).slice(2)}`;

const sanitizeUser = (user) => {
  const { password, ...safeUser } = user;
  const role = userRoles.find((item) => item.id === safeUser.role);
  return {
    ...safeUser,
    roleLabel: role?.label ?? "Unknown Role",
    permissions: role?.permissions ?? []
  };
};

export const authService = {
  getSession() {
    const rawSession = localStorage.getItem(SESSION_KEY);
    if (!rawSession) return null;

    try {
      const session = JSON.parse(rawSession);
      if (Date.now() > session.expiresAt) {
        localStorage.removeItem(SESSION_KEY);
        return null;
      }
      return session;
    } catch {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
  },

  login({ email, password }) {
    const user = demoUsers.find((item) => item.email.toLowerCase() === email.toLowerCase());

    if (!user || user.password !== password) {
      return { ok: false, message: "Invalid email or password." };
    }

    if (!user.isVerified) {
      return {
        ok: false,
        requiresVerification: true,
        user: sanitizeUser(user),
        message: "Email verification is required before accessing DroneOps."
      };
    }

    const session = {
      accessToken: createToken("mock.jwt.access"),
      refreshToken: createToken("mock.jwt.refresh"),
      createdAt: Date.now(),
      expiresAt: Date.now() + SESSION_DURATION_MS,
      user: sanitizeUser(user)
    };

    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return { ok: true, session };
  },

  signup(payload) {
    const user = {
      id: `usr-${Date.now()}`,
      name: payload.name,
      email: payload.email,
      role: payload.role,
      organization: payload.organization,
      isVerified: false,
      avatar: payload.name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase()
    };

    return {
      ok: true,
      verificationToken: createToken("mock.verify"),
      user: sanitizeUser({ ...user, password: payload.password })
    };
  },

  verifyEmail(user) {
    const session = {
      accessToken: createToken("mock.jwt.access"),
      refreshToken: createToken("mock.jwt.refresh"),
      createdAt: Date.now(),
      expiresAt: Date.now() + SESSION_DURATION_MS,
      user: { ...user, isVerified: true }
    };

    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return session;
  },

  requestPasswordReset(email) {
    return {
      ok: true,
      token: createToken("mock.reset"),
      message: `Password reset link prepared for ${email}.`
    };
  },

  logout() {
    localStorage.removeItem(SESSION_KEY);
  }
};
