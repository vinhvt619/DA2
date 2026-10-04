import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import { pathToFileURL } from 'node:url';
import { MIGRATION_ID as COMPANY_MIGRATION_ID } from './verify-existing-companies.mjs';

export const JOB_CUTOFF = new Date('2026-10-02T15:33:22.541Z');
export const MIGRATION_ID = 'publish-existing-company-jobs-2026-10-02';
export function eligibleJobsFilter(companyIds, now = new Date()) {
  return {
    companyId: { $in: companyIds }, status: { $in: ['Active', 'Pending'] },
    deletedAt: null, isAdminHidden: { $ne: true },
    $and: [
      { $or: [{ createdAt: { $lte: JOB_CUTOFF } }, { createdAt: { $exists: false } }] },
      { $or: [{ expiryDate: null }, { expiryDate: { $gte: now } }] },
      { $or: [{ approvalStatus: 'Pending' }, { approvalStatus: null }] },
    ],
  };
}
export async function publishExistingJobs(db, apply = false) {
  const migrations = db.collection('appMigrations');
  const companyRecord = await migrations.findOne({ _id: COMPANY_MIGRATION_ID });
  if (!companyRecord?.completedAt) throw new Error('Existing company verification must be completed first.');
  let record = await migrations.findOne({ _id: MIGRATION_ID });
  if (record?.completedAt) return { alreadyCompleted: true, matchedCount: record.matchedCount, modifiedCount: record.modifiedCount };
  const companies = await db.collection('users').find({
    _id: { $in: companyRecord.before.map((user) => user._id) }, role: 'company',
    companyAccountApprovalStatus: 'approved', companyVerificationStatus: 'verified',
    isBanned: { $ne: true }, deletedAt: null,
  }, { projection: { _id: 1 } }).toArray();
  const companyIds = companies.map((company) => company._id);
  const jobs = db.collection('jobs');
  const before = record?.before || await jobs.find(eligibleJobsFilter(companyIds), { projection: {
    _id: 1, status: 1, approvalStatus: 1, approvalSource: 1, reviewedAt: 1, reviewedBy: 1, rejectionReason: 1, updatedAt: 1,
  } }).toArray();
  if (!apply) return { dryRun: true, eligibleCompanyCount: companyIds.length, eligibleJobCount: before.length, cutoff: JOB_CUTOFF };
  if (!record) {
    try { await migrations.insertOne({ _id: MIGRATION_ID, cutoff: JOB_CUTOFF, before, startedAt: new Date() }); }
    catch (error) { if (error.code !== 11000) throw error; }
    record = await migrations.findOne({ _id: MIGRATION_ID });
    if (record?.completedAt) return { alreadyCompleted: true };
  }
  const filter = { ...eligibleJobsFilter(companyIds), _id: { $in: record.before.map((job) => job._id) } };
  const result = await jobs.updateMany(filter, { $set: {
    status: 'Active', approvalStatus: 'Approved', approvalSource: 'company_verification',
    reviewedAt: null, reviewedBy: null, rejectionReason: '', updatedAt: new Date(),
  } });
  const remaining = await jobs.countDocuments(filter);
  if (remaining) throw new Error('Some eligible jobs remain pending.');
  await migrations.updateOne({ _id: MIGRATION_ID }, { $set: { completedAt: new Date(), matchedCount: result.matchedCount, modifiedCount: result.modifiedCount } });
  return { matchedCount: result.matchedCount, modifiedCount: result.modifiedCount, remaining };
}
async function main() {
  dotenv.config({ quiet: true });
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!uri) throw new Error('Missing database configuration.');
  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 10000 });
  try {
    await client.connect();
    console.log(JSON.stringify(await publishExistingJobs(client.db(process.env.MONGO_DB_NAME || 'RabbitCV'), process.argv.includes('--apply'))));
  } finally { await client.close(); }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main().catch(() => {
  console.error('Job migration failed. No credentials or private data are logged.'); process.exitCode = 1;
});
