import { MongoClient } from 'mongodb';

function getRequiredEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error(`${name} chưa được cấu hình`);
  return v;
}

export async function getMongoClient() {
  if (!globalThis.__mongoClientPromise) {
    const uri = getRequiredEnv('MONGODB_URI');
    const client = new MongoClient(uri);
    globalThis.__mongoClientPromise = client.connect();
  }
  return globalThis.__mongoClientPromise;
}

export async function getMongoDb() {
  const client = await getMongoClient();
  const dbName = process.env.MONGODB_DB || 'chatbot';
  return client.db(dbName);
}

export async function getKnowledgeCollection() {
  const db = await getMongoDb();
  const collectionName = process.env.MONGODB_KNOWLEDGE_COLLECTION || 'knowledge';
  return db.collection(collectionName);
}

export async function getSettingsCollection() {
  const db = await getMongoDb();
  const collectionName = process.env.MONGODB_SETTINGS_COLLECTION || 'settings';
  return db.collection(collectionName);
}

export async function getAdminsCollection() {
  const db = await getMongoDb();
  const collectionName = process.env.MONGODB_ADMINS_COLLECTION || 'admins';
  return db.collection(collectionName);
}

