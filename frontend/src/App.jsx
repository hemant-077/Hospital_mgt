import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  CalendarClock,
  ClipboardList,
  Download,
  Edit3,
  LockKeyhole,
  LogIn,
  LogOut,
  Plus,
  RefreshCcw,
  Stethoscope,
  Trash2,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";
import { api } from "./api";

const emptyPatient = {
  name: "",
  age: "",
  gender: "Male",
  disease: "",
};

const emptyDoctor = {
  name: "",
  specialization: "",
  experience: "",
};

const emptyAppointment = {
  patientId: "",
  doctorId: "",
  date: "",
  status: "scheduled",
};

const tabs = [
  { id: "patients", label: "Patients", icon: UserRound },
  { id: "doctors", label: "Doctors", icon: Stethoscope },
  { id: "appointments", label: "Appointments", icon: CalendarClock },
];

const demoUsers = [
  {
    role: "doctor",
    label: "Doctor Dashboard",
    username: "doctor",
    password: "CareOps!2026#Doctor",
    startTab: "patients",
    tabs: ["patients", "doctors", "appointments"],
  },
  {
    role: "patient",
    label: "Patient Dashboard",
    username: "patient",
    password: "CareOps!2026#Patient",
    startTab: "patients",
    tabs: ["patients"],
  },
];

function App() {
  const [authUser, setAuthUser] = useState(() => {
    const savedRole = window.localStorage.getItem("hmsUserRole");
    return demoUsers.find((user) => user.role === savedRole) || null;
  });
  const [activeTab, setActiveTab] = useState("patients");
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [loginError, setLoginError] = useState("");
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [patientForm, setPatientForm] = useState(emptyPatient);
  const [doctorForm, setDoctorForm] = useState(emptyDoctor);
  const [appointmentForm, setAppointmentForm] = useState(emptyAppointment);
  const [editing, setEditing] = useState({ type: null, id: null });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const loadData = async () => {
    setLoading(true);
    setError("");

    try {
      const [patientData, doctorData, appointmentData] = await Promise.all([
        api.listPatients(),
        api.listDoctors(),
        api.listAppointments(),
      ]);

      setPatients(patientData);
      setDoctors(doctorData);
      setAppointments(appointmentData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authUser) {
      setActiveTab(authUser.startTab);
      loadData();
    }
  }, [authUser]);

  const availableTabs = useMemo(() => {
    if (!authUser) {
      return [];
    }

    return tabs.filter((tab) => authUser.tabs.includes(tab.id));
  }, [authUser]);

  const dashboard = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const todaysAppointments = appointments.filter((appointment) =>
      appointment.date?.slice(0, 10) === today
    ).length;
    const scheduledAppointments = appointments.filter((appointment) =>
      appointment.status === "scheduled"
    ).length;

    return [
      { label: "Patients", value: patients.length, icon: UsersRound },
      { label: "Doctors", value: doctors.length, icon: Stethoscope },
      { label: "Today", value: todaysAppointments, icon: Activity },
      {
        label: "Scheduled",
        value: scheduledAppointments,
        icon: ClipboardList,
      },
    ];
  }, [appointments, doctors.length, patients.length]);

  const exportRowCount = useMemo(() => {
    if (activeTab === "patients") {
      return patients.length;
    }

    if (activeTab === "doctors") {
      return doctors.length;
    }

    return appointments.length;
  }, [activeTab, appointments.length, doctors.length, patients.length]);

  const resetForms = () => {
    setPatientForm(emptyPatient);
    setDoctorForm(emptyDoctor);
    setAppointmentForm(emptyAppointment);
    setEditing({ type: null, id: null });
  };

  const showNotice = (message) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2500);
  };

  const exportActiveCsv = () => {
    const exportConfig = {
      patients: {
        fileName: "patients.csv",
        columns: ["id", "name", "age", "gender", "disease"],
        rows: patients.map((patient, index) => ({
          id: index + 1,
          name: patient.name,
          age: patient.age,
          gender: patient.gender,
          disease: patient.disease,
        })),
      },
      doctors: {
        fileName: "doctors.csv",
        columns: ["id", "name", "specialization", "experience"],
        rows: doctors.map((doctor, index) => ({
          id: index + 1,
          name: doctor.name,
          specialization: doctor.specialization,
          experience: doctor.experience,
        })),
      },
      appointments: {
        fileName: "appointments.csv",
        columns: [
          "id",
          "patientId",
          "patientName",
          "doctorId",
          "doctorName",
          "date",
          "status",
        ],
        rows: appointments.map((appointment, index) => ({
          id: index + 1,
          patientId: findRecordNumber(patients, normalizeRefId(appointment.patientId)),
          patientName: readRefName(appointment.patientId),
          doctorId: findRecordNumber(doctors, normalizeRefId(appointment.doctorId)),
          doctorName: readRefName(appointment.doctorId),
          date: appointment.date,
          status: appointment.status,
        })),
      },
    };

    const config = exportConfig[activeTab];

    if (!config || config.rows.length === 0) {
      showNotice("No records to export");
      return;
    }

    downloadCsv(config.fileName, config.columns, config.rows);
    showNotice("CSV exported");
  };

  const handleLogin = (event) => {
    event.preventDefault();
    setLoginError("");

    const user = demoUsers.find((account) =>
      account.username === loginForm.username.trim() &&
      account.password === loginForm.password
    );

    if (!user) {
      setLoginError("Invalid username or password");
      return;
    }

    window.localStorage.setItem("hmsUserRole", user.role);
    setAuthUser(user);
    setLoginForm({ username: "", password: "" });
    setError("");
    setNotice("");
    resetForms();
  };

  const handleLogout = () => {
    window.localStorage.removeItem("hmsUserRole");
    setAuthUser(null);
    setLoginError("");
    setActiveTab("patients");
    resetForms();
  };

  const handlePatientSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");

    const payload = {
      ...patientForm,
      age: Number(patientForm.age),
    };

    try {
      if (editing.type === "patient") {
        await api.updatePatient(editing.id, payload);
        showNotice("Patient updated");
      } else {
        await api.createPatient(payload);
        showNotice("Patient added");
      }

      resetForms();
      await loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDoctorSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");

    const payload = {
      ...doctorForm,
      experience: Number(doctorForm.experience),
    };

    try {
      if (editing.type === "doctor") {
        await api.updateDoctor(editing.id, payload);
        showNotice("Doctor updated");
      } else {
        await api.createDoctor(payload);
        showNotice("Doctor added");
      }

      resetForms();
      await loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAppointmentSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");

    const payload = {
      ...appointmentForm,
      status: authUser.role === "patient" ? "scheduled" : appointmentForm.status,
    };

    try {
      if (editing.type === "appointment") {
        await api.updateAppointment(editing.id, payload);
        showNotice("Appointment updated");
      } else {
        await api.createAppointment(payload);
        showNotice("Appointment booked");
      }

      resetForms();
      await loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const cancelAppointment = async (appointment) => {
    setSaving(true);
    setError("");

    try {
      await api.updateAppointment(appointment._id, {
        patientId: normalizeRefId(appointment.patientId),
        doctorId: normalizeRefId(appointment.doctorId),
        date: appointment.date,
        status: "cancelled",
      });
      showNotice("Appointment cancelled");
      resetForms();
      await loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const editPatient = (patient) => {
    setActiveTab("patients");
    setEditing({ type: "patient", id: patient._id });
    setPatientForm({
      name: patient.name,
      age: patient.age,
      gender: patient.gender,
      disease: patient.disease,
    });
  };

  const editDoctor = (doctor) => {
    setActiveTab("doctors");
    setEditing({ type: "doctor", id: doctor._id });
    setDoctorForm({
      name: doctor.name,
      specialization: doctor.specialization,
      experience: doctor.experience,
    });
  };

  const editAppointment = (appointment) => {
    setActiveTab("appointments");
    setEditing({ type: "appointment", id: appointment._id });
    setAppointmentForm({
      patientId: normalizeRefId(appointment.patientId),
      doctorId: normalizeRefId(appointment.doctorId),
      date: toDatetimeLocal(appointment.date),
      status: appointment.status,
    });
  };

  const removeRecord = async (type, id) => {
    setSaving(true);
    setError("");

    try {
      if (type === "patient") {
        await api.deletePatient(id);
      }

      if (type === "doctor") {
        await api.deleteDoctor(id);
      }

      if (type === "appointment") {
        await api.deleteAppointment(id);
      }

      showNotice("Record deleted");
      resetForms();
      await loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!authUser) {
    return (
      <LoginPage
        form={loginForm}
        setForm={setLoginForm}
        error={loginError}
        onSubmit={handleLogin}
      />
    );
  }

  return (
    <main className={`app-shell ${authUser.role === "patient" ? "patient-shell" : ""}`}>
      {authUser.role !== "patient" && (
        <aside className="sidebar">
          <div className="brand">
            <span className="brand-mark"><Activity size={22} /></span>
            <div>
              <h1>Hospital HMS</h1>
              <p>Care operations</p>
            </div>
          </div>

          <nav className="nav-tabs" aria-label="Management sections">
            {availableTabs.map((tab) => {
              const Icon = tab.icon;

              return (
                <button
                  key={tab.id}
                  className={activeTab === tab.id ? "active" : ""}
                  type="button"
                  onClick={() => {
                    setActiveTab(tab.id);
                    resetForms();
                  }}
                >
                  <Icon size={18} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          <button className="logout-button" type="button" onClick={handleLogout}>
            <LogOut size={17} />
            <span>Logout</span>
          </button>
        </aside>
      )}

      <section className="workspace">
        <header className="topbar">
          <div>
            <h2>{tabs.find((tab) => tab.id === activeTab)?.label}</h2>
            <p>{new Date().toLocaleDateString(undefined, {
              weekday: "long",
              day: "numeric",
              month: "short",
              year: "numeric",
            })}</p>
          </div>
          <div className="topbar-actions">
            <span className="role-pill">{authUser.label}</span>
            <button className="icon-button" type="button" onClick={loadData} title="Refresh">
              <RefreshCcw size={18} />
            </button>
            <button
              className="export-button"
              type="button"
              onClick={exportActiveCsv}
              disabled={loading || exportRowCount === 0}
              title="Export CSV"
            >
              <Download size={17} />
              <span>Export CSV</span>
            </button>
            {authUser.role === "patient" && (
              <button className="icon-button" type="button" onClick={handleLogout} title="Logout">
                <LogOut size={18} />
              </button>
            )}
          </div>
        </header>

        <section className="stats-grid" aria-label="Hospital summary">
          {dashboard.map((item) => {
            const Icon = item.icon;

            return (
              <article className="stat" key={item.label}>
                <Icon size={20} />
                <div>
                  <strong>{item.value}</strong>
                  <span>{item.label}</span>
                </div>
              </article>
            );
          })}
        </section>

        {notice && <p className="notice success">{notice}</p>}
        {error && <p className="notice error">{error}</p>}

        {activeTab === "patients" && (
          <>
            <Panel
              title={editing.type === "patient" ? "Edit patient" : "Register patient"}
              form={(
                <PatientForm
                  form={patientForm}
                  setForm={setPatientForm}
                  onSubmit={handlePatientSubmit}
                  onCancel={resetForms}
                  isEditing={editing.type === "patient"}
                  saving={saving}
                />
              )}
            >
              <PatientTable patients={patients} loading={loading} onEdit={editPatient} onDelete={removeRecord} />
            </Panel>

            {authUser.role === "patient" && (
              <section className="schedule-panel">
                <div className="panel-heading">
                  <CalendarClock size={18} />
                  <h3>Doctor schedule</h3>
                </div>
                <AppointmentScheduleTable appointments={appointments} loading={loading} />
              </section>
            )}
          </>
        )}

        {activeTab === "doctors" && (
          <Panel
            title={editing.type === "doctor" ? "Edit doctor" : "Add doctor"}
            form={(
              <DoctorForm
                form={doctorForm}
                setForm={setDoctorForm}
                onSubmit={handleDoctorSubmit}
                onCancel={resetForms}
                isEditing={editing.type === "doctor"}
                saving={saving}
              />
            )}
          >
            <DoctorTable doctors={doctors} loading={loading} onEdit={editDoctor} onDelete={removeRecord} />
          </Panel>
        )}

        {activeTab === "appointments" && (
          <Panel
            title={editing.type === "appointment" ? "Edit appointment" : "Book appointment"}
            form={(
              <AppointmentForm
                form={appointmentForm}
                setForm={setAppointmentForm}
                patients={patients}
                doctors={doctors}
                onSubmit={handleAppointmentSubmit}
                onCancel={resetForms}
                isEditing={editing.type === "appointment"}
                role={authUser.role}
                saving={saving}
              />
            )}
          >
            <AppointmentTable
              appointments={appointments}
              loading={loading}
              role={authUser.role}
              onEdit={editAppointment}
              onDelete={removeRecord}
              onCancel={cancelAppointment}
            />
          </Panel>
        )}
      </section>
    </main>
  );
}

function LoginPage({ form, setForm, error, onSubmit }) {
  return (
    <main className="login-shell">
      <section className="login-panel">
        <div className="login-brand">
          <span className="brand-mark"><Activity size={22} /></span>
          <div>
            <h1>Hospital HMS</h1>
            <p>Secure role login</p>
          </div>
        </div>

        <form className="login-form" onSubmit={onSubmit}>
          <div>
            <h2>Login</h2>
            <p>Securely manage hospital records and appointments.</p>
          </div>

          {error && <p className="notice error">{error}</p>}

          <label>
            <span>Username</span>
            <input
              value={form.username}
              onChange={(event) => setForm({ ...form, username: event.target.value })}
              required
            />
          </label>
          <label>
            <span>Password</span>
            <input
              type="password"
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
              required
            />
          </label>

          <button className="primary-button login-submit" type="submit">
            <LogIn size={17} />
            <span>Login</span>
          </button>
        </form>

        <div className="credentials-box" aria-label="Demo credentials">
          <div className="panel-heading">
            <LockKeyhole size={17} />
            <h3>Demo username / password</h3>
          </div>
          {demoUsers.map((user) => (
            <div className="credential-row" key={user.role}>
              <strong>{user.label}</strong>
              <span>Username: {user.username}</span>
              <span>Password: {user.password}</span>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

function Panel({ title, form, children }) {
  return (
    <section className="content-grid">
      <div className="form-panel">
        <div className="panel-heading">
          <Plus size={18} />
          <h3>{title}</h3>
        </div>
        {form}
      </div>
      <div className="table-panel">
        {children}
      </div>
    </section>
  );
}

function PatientForm({ form, setForm, onSubmit, onCancel, isEditing, saving }) {
  return (
    <form className="record-form" onSubmit={onSubmit}>
      <label>
        <span>Name</span>
        <input
          value={form.name}
          onChange={(event) => setForm({ ...form, name: event.target.value })}
          required
        />
      </label>
      <div className="form-row">
        <label>
          <span>Age</span>
          <input
            min="0"
            type="number"
            value={form.age}
            onChange={(event) => setForm({ ...form, age: event.target.value })}
            required
          />
        </label>
        <label>
          <span>Gender</span>
          <select
            value={form.gender}
            onChange={(event) => setForm({ ...form, gender: event.target.value })}
          >
            <option>Male</option>
            <option>Female</option>
            <option>Other</option>
          </select>
        </label>
      </div>
      <label>
        <span>Disease</span>
        <input
          value={form.disease}
          onChange={(event) => setForm({ ...form, disease: event.target.value })}
          required
        />
      </label>
      <FormActions saving={saving} isEditing={isEditing} onCancel={onCancel} />
    </form>
  );
}

function DoctorForm({ form, setForm, onSubmit, onCancel, isEditing, saving }) {
  return (
    <form className="record-form" onSubmit={onSubmit}>
      <label>
        <span>Name</span>
        <input
          value={form.name}
          onChange={(event) => setForm({ ...form, name: event.target.value })}
          required
        />
      </label>
      <label>
        <span>Specialization</span>
        <input
          value={form.specialization}
          onChange={(event) => setForm({ ...form, specialization: event.target.value })}
          required
        />
      </label>
      <label>
        <span>Experience</span>
        <input
          min="0"
          type="number"
          value={form.experience}
          onChange={(event) => setForm({ ...form, experience: event.target.value })}
          required
        />
      </label>
      <FormActions saving={saving} isEditing={isEditing} onCancel={onCancel} />
    </form>
  );
}

function AppointmentForm({ form, setForm, patients, doctors, onSubmit, onCancel, isEditing, role, saving }) {
  return (
    <form className="record-form" onSubmit={onSubmit}>
      <label>
        <span>Patient</span>
        <select
          value={form.patientId}
          onChange={(event) => setForm({ ...form, patientId: event.target.value })}
          required
        >
          <option value="">Select patient</option>
          {patients.map((patient) => (
            <option key={patient._id} value={patient._id}>{patient.name}</option>
          ))}
        </select>
      </label>
      <label>
        <span>Doctor</span>
        <select
          value={form.doctorId}
          onChange={(event) => setForm({ ...form, doctorId: event.target.value })}
          required
        >
          <option value="">Select doctor</option>
          {doctors.map((doctor) => (
            <option key={doctor._id} value={doctor._id}>{doctor.name} - {doctor.specialization}</option>
          ))}
        </select>
      </label>
      <div className={role === "patient" ? "" : "form-row"}>
        <label>
          <span>Date</span>
          <input
            type="datetime-local"
            value={form.date}
            onChange={(event) => setForm({ ...form, date: event.target.value })}
            required
          />
        </label>
        {role === "doctor" && (
          <label>
            <span>Status</span>
            <select
              value={form.status}
              onChange={(event) => setForm({ ...form, status: event.target.value })}
            >
              <option value="scheduled">Scheduled</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </label>
        )}
      </div>
      <FormActions saving={saving} isEditing={isEditing} onCancel={onCancel} />
    </form>
  );
}

function FormActions({ saving, isEditing, onCancel }) {
  return (
    <div className="form-actions">
      <button className="primary-button" type="submit" disabled={saving}>
        <Plus size={16} />
        <span>{isEditing ? "Update" : "Save"}</span>
      </button>
      {isEditing && (
        <button className="ghost-button" type="button" onClick={onCancel}>
          <X size={16} />
          <span>Cancel</span>
        </button>
      )}
    </div>
  );
}

function PatientTable({ patients, loading, onEdit, onDelete }) {
  return (
    <DataTable
      columns={["Name", "Age", "Gender", "Disease", "Actions"]}
      loading={loading}
      emptyText="No patients registered"
    >
      {patients.map((patient) => (
        <tr key={patient._id}>
          <td>{patient.name}</td>
          <td>{patient.age}</td>
          <td>{patient.gender}</td>
          <td>{patient.disease}</td>
          <td><RowActions onEdit={() => onEdit(patient)} onDelete={() => onDelete("patient", patient._id)} /></td>
        </tr>
      ))}
    </DataTable>
  );
}

function DoctorTable({ doctors, loading, onEdit, onDelete }) {
  return (
    <DataTable
      columns={["Name", "Specialization", "Experience", "Actions"]}
      loading={loading}
      emptyText="No doctors added"
    >
      {doctors.map((doctor) => (
        <tr key={doctor._id}>
          <td>{doctor.name}</td>
          <td>{doctor.specialization}</td>
          <td>{doctor.experience} years</td>
          <td><RowActions onEdit={() => onEdit(doctor)} onDelete={() => onDelete("doctor", doctor._id)} /></td>
        </tr>
      ))}
    </DataTable>
  );
}

function AppointmentTable({ appointments, loading, role, onEdit, onDelete, onCancel }) {
  return (
    <DataTable
      columns={["Patient", "Doctor", "Date", "Status", "Actions"]}
      loading={loading}
      emptyText="No appointments booked"
    >
      {appointments.map((appointment) => (
        <tr key={appointment._id}>
          <td>{readRefName(appointment.patientId)}</td>
          <td>{readRefName(appointment.doctorId)}</td>
          <td>{formatDate(appointment.date)}</td>
          <td><span className={`status-pill ${appointment.status}`}>{appointment.status}</span></td>
          <td>
            {role === "patient" ? (
              <CancelAction
                disabled={appointment.status === "cancelled"}
                onCancel={() => onCancel(appointment)}
              />
            ) : (
              <RowActions
                onEdit={() => onEdit(appointment)}
                onDelete={() => onDelete("appointment", appointment._id)}
              />
            )}
          </td>
        </tr>
      ))}
    </DataTable>
  );
}

function AppointmentScheduleTable({ appointments, loading }) {
  return (
    <DataTable
      columns={["Patient", "Doctor", "Specialization", "Date", "Time", "Status"]}
      loading={loading}
      emptyText="No doctor schedule available"
    >
      {appointments.map((appointment) => (
        <tr key={appointment._id}>
          <td>{readRefName(appointment.patientId)}</td>
          <td>{readRefName(appointment.doctorId)}</td>
          <td>{readDoctorSpecialization(appointment.doctorId)}</td>
          <td>{formatDateOnly(appointment.date)}</td>
          <td>{formatTimeOnly(appointment.date)}</td>
          <td><span className={`status-pill ${appointment.status}`}>{appointment.status}</span></td>
        </tr>
      ))}
    </DataTable>
  );
}

function CancelAction({ disabled, onCancel }) {
  return (
    <button
      className="ghost-button danger-text"
      type="button"
      onClick={onCancel}
      disabled={disabled}
    >
      <X size={16} />
      <span>{disabled ? "Cancelled" : "Cancel"}</span>
    </button>
  );
}

function DataTable({ columns, loading, emptyText, children }) {
  const rows = Array.isArray(children) ? children : [children].filter(Boolean);

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {columns.map((column) => <th key={column}>{column}</th>)}
          </tr>
        </thead>
        <tbody>
          {loading && (
            <tr>
              <td colSpan={columns.length} className="table-state">Loading records...</td>
            </tr>
          )}
          {!loading && rows.length === 0 && (
            <tr>
              <td colSpan={columns.length} className="table-state">{emptyText}</td>
            </tr>
          )}
          {!loading && children}
        </tbody>
      </table>
    </div>
  );
}

function RowActions({ onEdit, onDelete }) {
  return (
    <div className="row-actions">
      <button className="icon-button" type="button" onClick={onEdit} title="Edit">
        <Edit3 size={16} />
      </button>
      <button className="icon-button danger" type="button" onClick={onDelete} title="Delete">
        <Trash2 size={16} />
      </button>
    </div>
  );
}

function readRefName(ref) {
  if (!ref) {
    return "Unavailable";
  }

  return typeof ref === "string" ? ref : ref.name;
}

function readDoctorSpecialization(ref) {
  if (!ref || typeof ref === "string") {
    return "Unavailable";
  }

  return ref.specialization || "Unavailable";
}

function normalizeRefId(ref) {
  if (!ref) {
    return "";
  }

  return typeof ref === "string" ? ref : ref._id;
}

function findRecordNumber(records, recordId) {
  const index = records.findIndex((record) => record._id === recordId);
  return index === -1 ? "" : index + 1;
}

function toDatetimeLocal(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
}

function formatDate(value) {
  if (!value) {
    return "Not set";
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatDateOnly(value) {
  if (!value) {
    return "Not set";
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
  }).format(new Date(value));
}

function formatTimeOnly(value) {
  if (!value) {
    return "Not set";
  }

  return new Intl.DateTimeFormat(undefined, {
    timeStyle: "short",
  }).format(new Date(value));
}

function downloadCsv(fileName, columns, rows) {
  const csv = [
    columns.join(","),
    ...rows.map((row) => columns.map((column) => escapeCsvValue(row[column])).join(",")),
  ].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

function escapeCsvValue(value) {
  const text = value === null || value === undefined ? "" : String(value);

  if (/[",\n\r]/.test(text)) {
    return `"${text.replaceAll("\"", "\"\"")}"`;
  }

  return text;
}

export default App;
