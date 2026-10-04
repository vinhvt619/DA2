import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import { pathToFileURL } from 'node:url';

// Fixed to the user's request, never advanced to the execution date.
export const CUTOFF = new Date('2026-10-02T15:27:31.168Z');
export const MIGRATION_ID = 'verify-existing-companies-2026-10-02';
export const existingCompaniesFilter = () => ({
  role: 'company', deletedAt: null, isBanned: { $ne: true },
  $or: [{ createdAt: { $lte: CUTOFF } }, { createdAt: { $exists: false } }],
});
const fields = {
  status: 'active', companyAccountApprovalStatus: 'approved',
  companyVerificationStatus: 'verified', companyAccountRejectionReason: '',
};

export async function verifyExistingCompanies(db, apply = false) {
  const users = db.collection('users');
  const migrations = db.collection('appMigrations');
  let record = await migrations.findOne({ _id: MIGRATION_ID });
  if (record?.completedAt) return { alreadyCompleted: true, cutoff: CUTOFF, matchedCount: record.matchedCount, modifiedCount: record.modifiedCount };
  const before = record?.before || await users.find(existingCompaniesFilter(), { projection: {
    _id: 1, status: 1, companyAccountApprovalStatus: 1, companyVerificationStatus: 1,
    companyAccountRejectionReason: 1, updatedAt: 1,
  } }).toArray();
  if (!apply) return { dryRun: true, cutoff: CUTOFF, eligibleCount: before.length };
  // Preserve the exact account set and previous moderation fields before writing.
  if (!record) {
    try { await migrations.insertOne({ _id: MIGRATION_ID, cutoff: CUTOFF, before, startedAt: new Date() }); }
    catch (error) { if (error.code !== 11000) throw error; }
    record = await migrations.findOne({ _id: MIGRATION_ID });
    if (record?.completedAt) return { alreadyCompleted: true, cutoff: CUTOFF };
  }
  const filter = { ...existingCompaniesFilter(), _id: { $in: record.before.map((user) => user._id) } };
  const result = await users.updateMany(filter, { $set: { ...fields, updatedAt: new Date() } });
  const remaining = await users.countDocuments({ $and: [filter, { $or: Object.entries(fields).map(([key, value]) => ({ [key]: { $ne: value } })) }] });
  if (remaining) throw new Error(`Still ${remaining} eligible accounts without the requested status; migration remains incomplete.`);
  await migrations.updateOne({ _id: MIGRATION_ID }, { $set: { completedAt: new Date(), matchedCount: result.matchedCount, modifiedCount: result.modifiedCount } });
  return { cutoff: CUTOFF, matchedCount: result.matchedCount, modifiedCount: result.modifiedCount, remaining };
}

async function main() {
  dotenv.config({ quiet: true });
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!uri) throw new Error('Missing MongoDB connection configuration.');
  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 10000 });
  try {
    await client.connect();
    console.log(JSON.stringify(await verifyExistingCompanies(client.db(process.env.MONGO_DB_NAME || 'RabbitCV'), process.argv.includes('--apply'))));
  } finally { await client.close(); }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(() => { console.error('Company migration failed. No credentials or private account data are logged.'); process.exitCode = 1; });
}
