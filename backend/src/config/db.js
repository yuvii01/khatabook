import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import dns from 'dns';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

try {
  dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
} catch (e) {}

let isMongoConnected = false;
let connectionError = null;

const sanitizeMongoUri = (rawUri) => {
  if (!rawUri) return 'mongodb://127.0.0.1:27017/km_stonex_khata';
  let uri = rawUri.trim();

  const match = uri.match(/^(mongodb(?:\+srv)?:\/\/)([^:]+):(.+)@([^@]+)$/);
  if (match) {
    const protocol = match[1];
    const user = match[2];
    let pass = match[3];
    const hostAndRest = match[4];

    if (pass.includes('@') && !pass.includes('%40')) {
      pass = encodeURIComponent(pass);
    }
    uri = `${protocol}${user}:${pass}@${hostAndRest}`;
  }

  if (uri.includes('.mongodb.net/') && !uri.match(/\.mongodb\.net\/[a-zA-Z0-9_-]+\?/)) {
    uri = uri.replace('.mongodb.net/?', '.mongodb.net/km_stonex_khata?');
    if (uri.endsWith('.mongodb.net/')) {
      uri = uri + 'km_stonex_khata?retryWrites=true&w=majority';
    }
  }

  return uri;
};

export const connectDB = async () => {
  const rawUri = process.env.MONGODB_URI;
  const uri = sanitizeMongoUri(rawUri);

  try {
    mongoose.set('strictQuery', false);
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 8000,
    });

    isMongoConnected = true;
    connectionError = null;
    console.log(`[MongoDB Connected]: ${conn.connection.host} / ${conn.connection.name}`);
    return true;
  } catch (error) {
    isMongoConnected = false;
    connectionError = error.message;
    console.warn(`[MongoDB Connection Warning]: ${error.message}. Running on local persistent fallback.`);
    return false;
  }
};

export const getDbStatus = () => ({
  connected: isMongoConnected,
  type: isMongoConnected ? 'MongoDB' : 'LocalJSONFallback',
  uri: process.env.MONGODB_URI ? 'MongoDB Atlas Configured' : 'Default / Localhost',
  error: connectionError,
});
