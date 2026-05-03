import Appointment from "../models/Appointment.js";

const sendError = (res, error) => {
  const statusCode = error.name === "ValidationError" || error.name === "CastError" ? 400 : 500;
  res.status(statusCode).json({ message: error.message });
};

const appointmentQuery = () => Appointment.find()
  .populate("patientId", "name age gender disease")
  .populate("doctorId", "name specialization experience");

const appointmentByIdQuery = (id) => Appointment.findById(id)
  .populate("patientId", "name age gender disease")
  .populate("doctorId", "name specialization experience");

export const addAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.create(req.body);
    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate("patientId", "name age gender disease")
      .populate("doctorId", "name specialization experience");

    res.status(201).json(populatedAppointment);
  } catch (error) {
    sendError(res, error);
  }
};

export const getAppointments = async (req, res) => {
  try {
    const appointments = await appointmentQuery().sort({ date: 1 });
    res.json(appointments);
  } catch (error) {
    sendError(res, error);
  }
};

export const getAppointmentById = async (req, res) => {
  try {
    const appointment = await appointmentByIdQuery(req.params.id);

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    res.json(appointment);
  } catch (error) {
    sendError(res, error);
  }
};

export const updateAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
      .populate("patientId", "name age gender disease")
      .populate("doctorId", "name specialization experience");

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    res.json(appointment);
  } catch (error) {
    sendError(res, error);
  }
};

export const deleteAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findByIdAndDelete(req.params.id);

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    res.json({ message: "Appointment deleted" });
  } catch (error) {
    sendError(res, error);
  }
};
