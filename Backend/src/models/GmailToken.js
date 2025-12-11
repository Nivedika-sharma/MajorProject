// src/models/GmailToken.js
import mongoose from "mongoose";

const GmailTokenSchema = new mongoose.Schema({
  access_token: { type: String },
  refresh_token: { type: String },
  scope: { type: String },
  token_type: { type: String },
  expiry_date: { type: Number },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // <--- add this
});

export default mongoose.model("GmailToken", GmailTokenSchema);
