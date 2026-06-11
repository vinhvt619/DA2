import { MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

const args = new Set(process.argv.slice(2));
const shouldApply = args.has("--apply");

const sourceUri = process.env.LOCAL_MONGO_URI || "mongodb://127.0.0.1:27017/RabbitCV";
const targetUri = process.env.ATLAS_MONGO_URI || process.env.MONGODB_URI || process.env.MONGO_URI;
const dbName = process.env.MONGO_DB_NAME || "RabbitCV";
const collections = ["users", "resumes", "jobs", "applications", "messages"];

if (!targetUri) {
  console.error("Missing ATLAS_MONGO_URI, MONGODB_URI, or MONGO_URI.");
  process.exit(1);
}

const clientOptions = {
  serverSelectionTimeoutMS: 10000,
};

const copyCollection = async (sourceDb, targetDb, collectionName) => {
  const sourceCollection = sourceDb.collection(collectionName);
  const targetCollection = targetDb.collection(collectionName);
  const docs = await sourceCollection.find({}).toArray();
  const targetCountBefore = await targetCollection.countDocuments();

  if (!docs.length) {
    return { collectionName, sourceCount: 0, targetCountBefore, copiedCount: 0 };
  }

  if (!shouldApply) {
    return { collectionName, sourceCount: docs.length, targetCountBefore, copiedCount: 0 };
  }

  const operations = docs.map((doc) => ({
    replaceOne: {
      filter: { _id: doc._id },
      replacement: doc,
      upsert: true,
    },
  }));

  const result = await targetCollection.bulkWrite(operations, { ordered: false });
  return {
    collectionName,
    sourceCount: docs.length,
    targetCountBefore,
    copiedCount: result.upsertedCount + result.modifiedCount + result.matchedCount,
  };
};

const main = async () => {
  const sourceClient = new MongoClient(sourceUri, clientOptions);
  const targetClient = new MongoClient(targetUri, clientOptions);

  try {
    await sourceClient.connect();
    await targetClient.connect();

    const sourceDb = sourceClient.db(dbName);
    const targetDb = targetClient.db(dbName);

    console.log(`Mode: ${shouldApply ? "apply" : "dry-run"}`);
    console.log(`Source DB: ${sourceDb.databaseName}`);
    console.log(`Target DB: ${targetDb.databaseName}`);

    for (const collectionName of collections) {
      const result = await copyCollection(sourceDb, targetDb, collectionName);
      console.log(
        `${result.collectionName}: source ${result.sourceCount}, target before ${result.targetCountBefore}${
          shouldApply ? `, copied/upserted ${result.copiedCount}` : ""
        }`,
      );
    }

    if (!shouldApply) {
      console.log("Dry-run only. Re-run with --apply to migrate data.");
    }
  } finally {
    await Promise.allSettled([sourceClient.close(), targetClient.close()]);
  }
};

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
