const API_BASE_URL = import.meta.env.VITE_API_URL || "";

const request = async (path, options = {}) => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  });

  const isJson = response.headers.get("content-type")?.includes("application/json");
  const data = isJson ? await response.json() : null;

  if (!response.ok) {
    throw new Error(data?.message || "Request failed");
  }

  return data;
};

export const api = {
  listPatients: () => request("/api/patients"),
  createPatient: (patient) => request("/api/patients", {
    method: "POST",
    body: JSON.stringify(patient),
  }),
  updatePatient: (id, patient) => request(`/api/patients/${id}`, {
    method: "PUT",
    body: JSON.stringify(patient),
  }),
  deletePatient: (id) => request(`/api/patients/${id}`, {
    method: "DELETE",
  }),

  listDoctors: () => request("/api/doctors"),
  createDoctor: (doctor) => request("/api/doctors", {
    method: "POST",
    body: JSON.stringify(doctor),
  }),
  updateDoctor: (id, doctor) => request(`/api/doctors/${id}`, {
    method: "PUT",
    body: JSON.stringify(doctor),
  }),
  deleteDoctor: (id) => request(`/api/doctors/${id}`, {
    method: "DELETE",
  }),

  listAppointments: () => request("/api/appointments"),
  createAppointment: (appointment) => request("/api/appointments", {
    method: "POST",
    body: JSON.stringify(appointment),
  }),
  updateAppointment: (id, appointment) => request(`/api/appointments/${id}`, {
    method: "PUT",
    body: JSON.stringify(appointment),
  }),
  deleteAppointment: (id) => request(`/api/appointments/${id}`, {
    method: "DELETE",
  }),
};
