// src/utils/createfs.js
import mongoose from "mongoose";

let gfs;
let readyPromise;

/**
 * Initialize GridFSBucket after MongoDB connection
 */
mongoose.connection.on("connected", () => {
  gfs = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
    bucketName: "mailUploads",
  });
  console.log("✅ GridFS initialized");
});

/**
 * Get GridFSBucket instance
 */
export const getGFS = async () => {
  if (gfs) return gfs;

  if (!readyPromise) {
    readyPromise = new Promise((resolve, reject) => {
      if (mongoose.connection.readyState === 1 && gfs) {
        resolve(gfs);
      } else {
        mongoose.connection.once("connected", () => resolve(gfs));
        mongoose.connection.once("error", (err) => reject(err));
      }
    });
  }

  return readyPromise;
};
