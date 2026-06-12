import { apiClient, SESSION_KEY } from "../../services/apiClient";
import { userRoles } from "../../data/authData";

const roleIdByApiRole = {
  OPERATIONS_MANAGER: "operations_manager",
  REMOTE_PILOT: "remote_pilot",
  MAINTENANCE_COORDINATOR: "maintenance_coordinator",
  SAFETY_OFFICER: "safety_officer",
  COMPLIANCE_OFFICER: "compliance_officer",
  SYSTEM_ADMINISTRATOR: "system_administrator"
};

const apiRoleByRoleId = Object.fromEntries(
  Object.entries(roleIdByApiRole).map(([apiRole, roleId]) => [roleId, apiRole])
);

const decorateUser = (user) => {
  const role = userRoles.find((item) => item.id === (roleIdByApiRole[user.role] ?? user.role));
  const roleId = roleIdByApiRole[user.role] ?? user.role;

  return {
    ...user,
    role: roleId,
    roleLabel: role?.label ?? user.role,
    permissions: role?.permissions ?? [],
    organization: user.organisation?.name ?? user.organization ?? "DroneOps"
  };
};

const persistSession = (session) => {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
};

const toPersistableUser = (user = {}) => {
  // Flow metadata belongs to the current response, not the long-lived browser session.
  const { emailChangePending, ...persistableUser } = user;
  return persistableUser;
};

const clearSession = () => {
  localStorage.removeItem(SESSION_KEY);
};

const wait = (delay) => new Promise((resolve) => window.setTimeout(resolve, delay));

const isTransientNetworkError = (error) => {
  const message = error?.message?.toLowerCase() ?? "";
  return message.includes("failed to fetch") || message.includes("networkerror") || message.includes("load failed");
};

export const authService = {
  hasStoredSession() {
    return Boolean(localStorage.getItem(SESSION_KEY));
  },

  getSession() {
    const rawSession = localStorage.getItem(SESSION_KEY);
    if (!rawSession) return null;

    try {
      const session = JSON.parse(rawSession);
      if (!session?.user) return null;

      return {
        ...session,
        user: decorateUser(session.user)
      };
    } catch {
      clearSession();
      return null;
    }
  },

  async restoreSession() {
    const rawSession = localStorage.getItem(SESSION_KEY);
    if (!rawSession) return null;

    try {
      const session = JSON.parse(rawSession);
      if (!session?.refreshToken) {
        clearSession();
        return null;
      }

      let result;
      try {
        result = await apiClient.post("/auth/refresh-token", { refreshToken: session.refreshToken });
      } catch (error) {
        if (!isTransientNetworkError(error)) throw error;
        await wait(1400);
        result = await apiClient.post("/auth/refresh-token", { refreshToken: session.refreshToken });
      }

      return persistSession({
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        user: decorateUser(result.user ?? session.user)
      });
    } catch {
      clearSession();
      return null;
    }
  },

  updateStoredUser(user) {
    const session = this.getSession();
    if (!session) return null;

    return persistSession({
      ...session,
      user: decorateUser({
        ...session.user,
        ...toPersistableUser(user)
      })
    });
  },

  async login({ email, password }) {
    const result = await apiClient.post("/auth/login", { email, password });
    return persistSession({
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      user: decorateUser(result.user)
    });
  },

  async loginWithGoogle(credential) {
    const result = await apiClient.post("/auth/google", { credential });
    if (result.needsOnboarding) {
      return {
        needsOnboarding: true,
        credential,
        googleProfile: result.googleProfile
      };
    }

    return persistSession({
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      user: decorateUser(result.user)
    });
  },

  async completeGoogleProfile(payload) {
    const result = await apiClient.post("/auth/google/complete-profile", {
      credential: payload.credential,
      organisationName: payload.organization,
      role: apiRoleByRoleId[payload.role] ?? "OPERATIONS_MANAGER"
    });

    return persistSession({
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      user: decorateUser(result.user)
    });
  },

  async signup(payload) {
    const result = await apiClient.post("/auth/signup", {
      name: payload.name,
      email: payload.email,
      password: payload.password,
      organisationName: payload.organization,
      industry: payload.industry,
      profileImageUrl: payload.profileImageUrl || undefined,
      role: apiRoleByRoleId[payload.role] ?? "OPERATIONS_MANAGER"
    });

    return {
      emailSent: result.emailSent,
      emailError: result.emailError,
      devVerificationToken: result.devVerificationToken,
      user: decorateUser(result.user)
    };
  },

  async verifyEmail(token) {
    return apiClient.get(`/auth/verify/${token}?format=json`);
  },

  async requestPasswordReset(email) {
    return apiClient.post("/auth/forgot-password", { email });
  },

  async uploadProfileImage(file) {
    const formData = new FormData();
    formData.append("file", file);
    return apiClient.upload("/auth/profile-image", formData);
  },

  async logout() {
    try {
      await apiClient.post("/auth/logout", {});
    } finally {
      clearSession();
    }
  }
};
