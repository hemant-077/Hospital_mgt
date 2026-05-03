import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import http from "http";
import connectDB from "./config/db.js";
import patientRoutes from "./routes/patientRoutes.js";
import doctorRoutes from "./routes/doctorRoutes.js";
import appointmentRoutes from "./routes/appointmentRoutes.js";


dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("HMS API Running...");
});

app.use("/api/patients", patientRoutes);
app.use("/api/doctors", doctorRoutes);
app.use("/api/appointments", appointmentRoutes);

app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

const PORT = Number(process.env.PORT) || 5000;
const MAX_PORT_RETRIES = 10;

await connectDB();

const startServer = (port, retriesLeft = MAX_PORT_RETRIES) => {
  const server = http.createServer(app);

  server.once("error", (error) => {
    if (error.code === "EADDRINUSE" && retriesLeft > 0) {
      const nextPort = port + 1;
      console.warn(`Port ${port} is already in use. Trying port ${nextPort}...`);
      startServer(nextPort, retriesLeft - 1);
      return;
    }

    console.error(`Server failed to start: ${error.message}`);
    process.exit(1);
  });

  server.once("listening", () => {
    console.log(`Server running on port ${port}`);
  });

  server.listen(port);
};

startServer(PORT);
