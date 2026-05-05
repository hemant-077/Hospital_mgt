import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import mongoose from "mongoose";
import connectDB from "../config/db.js";
import Patient from "../models/Patient.js";
import Doctor from "../models/Doctor.js";
import Appointment from "../models/Appointment.js";

dotenv.config({ quiet: true });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.resolve(__dirname, "../data");
const shouldClear = process.argv.includes("--clear");
const toObjectId = (prefix, id) => `${prefix}${String(id).padStart(20, "0")}`;

const readCsv = (fileName) => {
  const filePath = path.join(dataDir, fileName);
  const [headerLine, ...rows] = fs.readFileSync(filePath, "utf8").trim().split(/\r?\n/);
  const headers = headerLine.split(",");

  return rows.map((row) => {
    const values = row.split(",");
    return headers.reduce((record, header, index) => {
      record[header] = values[index];
      return record;
    }, {});
  });
};

const patients = readCsv("patients.csv").map(({ id, ...patient }) => ({
  _id: toObjectId("f000", id),
  ...patient,
  age: Number(patient.age),
}));

const doctors = readCsv("doctors.csv").map(({ id, ...doctor }) => ({
  _id: toObjectId("d000", id),
  ...doctor,
  experience: Number(doctor.experience),
}));

const appointments = readCsv("appointments.csv").map((appointment) => ({
  _id: toObjectId("a000", appointment.id),
  patientId: toObjectId("f000", appointment.patientId),
  doctorId: toObjectId("d000", appointment.doctorId),
  date: appointment.date,
  status: appointment.status,
}));

try {
  await connectDB();

  if (shouldClear) {
    await Promise.all([
      Patient.deleteMany({}),
      Doctor.deleteMany({}),
      Appointment.deleteMany({}),
    ]);
  }

  await Patient.insertMany(patients, { ordered: true });
  await Doctor.insertMany(doctors, { ordered: true });
  await Appointment.insertMany(appointments, { ordered: true });

  console.log(`Imported ${patients.length} patients`);
  console.log(`Imported ${doctors.length} doctors`);
  console.log(`Imported ${appointments.length} appointments`);
} catch (error) {
  console.error(`CSV import failed: ${error.message}`);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
