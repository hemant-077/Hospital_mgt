import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/hms";

    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log("MongoDB Connected");
  } catch (error) {
    console.error(`MongoDB connection failed: ${error.message}`);
    console.error(
      "Make sure MongoDB is running locally on 127.0.0.1:27017 or update MONGO_URI to a valid MongoDB connection string."
    );
    process.exit(1);
  }
};

export default connectDB;
