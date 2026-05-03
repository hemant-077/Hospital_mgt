import Patient from "../models/Patient.js";

const sendError = (res, error) => {
  const statusCode = error.name === "ValidationError" || error.name === "CastError" ? 400 : 500;
  res.status(statusCode).json({ message: error.message });
};

// CREATE
export const addPatient = async (req, res) => {
  try {
    const patient = await Patient.create(req.body);
    res.status(201).json(patient);
  } catch (error) {
    sendError(res, error);
  }
};

// READ ALL
export const getPatients = async (req, res) => {
  try {
    const patients = await Patient.find().sort({ createdAt: -1 });
    res.json(patients);
  } catch (error) {
    sendError(res, error);
  }
};

// READ SINGLE
export const getPatientById = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);

    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    res.json(patient);
  } catch (error) {
    sendError(res, error);
  }
};

// UPDATE
export const updatePatient = async (req, res) => {
  try {
    const patient = await Patient.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    res.json(patient);
  } catch (error) {
    sendError(res, error);
  }
};

// DELETE
export const deletePatient = async (req, res) => {
  try {
    const patient = await Patient.findByIdAndDelete(req.params.id);

    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    res.json({ message: "Patient deleted" });
  } catch (error) {
    sendError(res, error);
  }
};
