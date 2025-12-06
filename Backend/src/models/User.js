import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  full_name: String,
  password: { type: String, required: true },
  designation: String,
  department_id: { type: mongoose.Schema.Types.ObjectId, ref: "Department" },
  contact: String,
  working_hours: { type: String, default: "9:00 AM - 5:00 PM" },
  employee_id: String,
  avatar_url: String,
  responsibilities: String,
  last_login: Date
}, { timestamps: true });

export default mongoose.model("User", UserSchema);
