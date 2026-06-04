import { apiClient } from "./apiClient";

export const droneOpsApi = {
  drones: {
    list: () => apiClient.get("/drones"),
    create: (payload) => apiClient.post("/drones", payload),
    update: (id, payload) => apiClient.put(`/drones/${id}`, payload),
    remove: (id) => apiClient.delete(`/drones/${id}`)
  },
  missions: {
    list: () => apiClient.get("/missions"),
    create: (payload) => apiClient.post("/missions", payload),
    update: (id, payload) => apiClient.put(`/missions/${id}`, payload),
    start: (id) => apiClient.post(`/missions/${id}/start`, {}),
    complete: (id) => apiClient.post(`/missions/${id}/complete`, {}),
    replay: (id) => apiClient.get(`/missions/${id}/replay`)
  },
  telemetry: {
    live: () => apiClient.get("/telemetry/live"),
    byDrone: (droneId) => apiClient.get(`/telemetry/${droneId}`),
    ingest: (payload) => apiClient.post("/telemetry", payload)
  },
  incidents: {
    list: () => apiClient.get("/incidents"),
    create: (payload) => apiClient.post("/incidents", payload),
    update: (id, payload) => apiClient.put(`/incidents/${id}`, payload)
  },
  maintenance: {
    list: () => apiClient.get("/maintenance"),
    create: (payload) => apiClient.post("/maintenance", payload),
    update: (id, payload) => apiClient.put(`/maintenance/${id}`, payload)
  },
  documents: {
    list: (params = "") => apiClient.get(`/documents${params}`),
    create: (payload) => apiClient.post("/documents", payload),
    upload: (formData) => apiClient.upload("/documents/upload", formData)
  },
  reports: {
    list: () => apiClient.get("/reports"),
    summary: () => apiClient.get("/reports/summary"),
    create: (payload) => apiClient.post("/reports", payload)
  },
  geofences: {
    list: () => apiClient.get("/geofences"),
    create: (payload) => apiClient.post("/geofences", payload)
  },
  users: {
    list: () => apiClient.get("/users")
  },
  audit: {
    list: () => apiClient.get("/audit")
  }
};

