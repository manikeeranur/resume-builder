import mongoose from "mongoose";

const MONGO_URI = process.env.MONGO_URI;

let cached = global._mongoose;
if (!cached) {
  cached = global._mongoose = { conn: null, promise: null };
}

export default async function dbConnect() {
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    if (!MONGO_URI) throw new Error("MONGO_URI is not set");
    cached.promise = mongoose.connect(MONGO_URI).then((m) => m);
  }
  cached.conn = await cached.promise;
  return cached.conn;
}
