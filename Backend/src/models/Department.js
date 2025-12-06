import mongoose from "mongoose";
const DepartmentSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  description: String,
  icon: String,
  color: String
}, { timestamps: true });

export default mongoose.model("Department", DepartmentSchema);
