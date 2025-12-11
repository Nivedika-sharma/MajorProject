// src/utils/gridfs.js
import mongoose from "mongoose";

let gfs = null;

export const getGFS = () => {
  if (!mongoose.connection.db) throw new Error("MongoDB not connected");
  if (!gfs) {
    gfs = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
      bucketName: "mailUploads",
    });
    console.log("✅ GridFS initialized");
  }
  return gfs;
};
