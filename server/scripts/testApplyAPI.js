
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import Job from '../models/Job.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../../.env') });

async function runTest() {
  await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);
  
  // Find a test user (candidate)
  const candidate = await User.findOne({ role: 'employee' });
  // Find a job
  const job = await Job.findOne({});
  
  if (!candidate || !job) {
    console.log("Missing test data");
    process.exit(1);
  }

  // Login as candidate to get cookie
  console.log("Logging in as:", candidate.email);
  let cookie = '';
  try {
    const loginRes = await fetch('http://localhost:5000/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: candidate.email,
        password: 'password123'
      })
    });
    const setCookie = loginRes.headers.get('set-cookie');
    if (setCookie) {
        cookie = setCookie.split(';')[0];
    } else {
        throw new Error('No cookie');
    }
  } catch (e) {
    // If password fails, let's just generate a token
    const jwt = await import('jsonwebtoken');
    const token = jwt.default.sign(
      { id: candidate._id, email: candidate.email, role: candidate.role },
      process.env.JWT_SECRET || "fallback_secret_key_for_development_only",
      { expiresIn: "1d" }
    );
    cookie = `token=${token}; Path=/; HttpOnly`;
    console.log("Generated fake cookie for test");
  }

  try {
    console.log("Calling POST /api/jobs/apply-file");
    const res = await fetch('http://localhost:5000/api/jobs/apply-file', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookie
      },
      body: JSON.stringify({
        jobId: job._id.toString(),
        fileData: "dummy_base64_data",
        fileName: "test_cv.pdf"
      })
    });
    
    console.log("API Response Status:", res.status);
    const resData = await res.json();
    console.log("API Response Data:", JSON.stringify(resData, null, 2));

    // Wait a bit for async notifications
    await new Promise(r => setTimeout(r, 1000));

    // Verify notifications
    const notifs = await Notification.find({ 
      recipient: { $in: [candidate._id, job.companyId] } 
    }).sort({ createdAt: -1 }).limit(5);

    console.log("\nRecently created notifications for candidate and company:");
    notifs.forEach(n => {
      console.log(`- Type: ${n.type}, Recipient: ${n.recipient}, Title: ${n.title}`);
    });

    // Call GET /api/notifications
    console.log("\nCalling GET /api/notifications");
    const getRes = await fetch('http://localhost:5000/api/notifications', {
      headers: { Cookie: cookie }
    });
    const getResData = await getRes.json();
    console.log("GET Notifications Response Data Shape:");
    console.log("Keys:", Object.keys(getResData));
    console.log("totalPages:", getResData.totalPages);
    console.log("currentPage:", getResData.currentPage);
    console.log("notifications length:", getResData.notifications?.length);

    // Clean up
    console.log("\nCleaning up test data...");
    
    // Cleanup notifications created in the last 1 minute for these two users with NEW_APPLICATION and APPLICATION_SUBMITTED
    const oneMinAgo = new Date(Date.now() - 60000);
    const delNotif = await Notification.deleteMany({
      createdAt: { $gte: oneMinAgo },
      type: { $in: ['NEW_APPLICATION', 'APPLICATION_SUBMITTED'] }
    });
    console.log("Deleted notifications:", delNotif.deletedCount);

  } catch (err) {
    console.error("API Error:", err.message);
  }

  mongoose.disconnect();
}

runTest();
