const appointmentSchema = new mongoose.Schema({
  patient: { type: mongoose.Schema.Types.ObjectId, ref: "Patient" },
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor" },
  date: Date,
  status: {
    type: String,
    enum: ["pending", "approved", "completed"],
    default: "pending"
  }
});