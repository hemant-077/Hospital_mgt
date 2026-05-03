import express from "express";
import {
  addPatient,
  getPatients,
  getPatientById,
  updatePatient,
  deletePatient,
} from "../controllers/patientController.js";

const router = express.Router();

router.post("/", addPatient);
router.get("/", getPatients);
router.get("/:id", getPatientById);
router.put("/:id", updatePatient);
router.delete("/:id", deletePatient);

export default router;
