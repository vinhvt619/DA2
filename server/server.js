import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import cookieParser from "cookie-parser";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import Resume from "./models/Resume.js";
import User from "./models/User.js";
import Message from "./models/Message.js";
import Job from "./models/Job.js";
import Application from "./models/Application.js";

dotenv.config();
mongoose.set("bufferCommands", false);

const app = express();
const PORT = process.env.PORT || 5000;
const DEFAULT_DB_NAME = process.env.MONGO_DB_NAME || "RabbitCV";
const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
const jwtSecret = process.env.JWT_SECRET || "rabbitcv_secret_key_12345";
const usingDefaultJwtSecret = !process.env.JWT_SECRET;
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:4000",
  "http://localhost:3000",
  "https://rabbitcv.vercel.app",
  process.env.CLIENT_URL,
  process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
  process.env.VERCEL_BRANCH_URL ? `https://${process.env.VERCEL_BRANCH_URL}` : undefined,
  process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : undefined,
].filter(Boolean);

const missingEnv = [];
if (!mongoUri) {
  missingEnv.push("MONGODB_URI");
}
if (usingDefaultJwtSecret) {
  console.warn("JWT_SECRET is not configured. Using the built-in fallback secret.");
}
if (missingEnv.length) {
  console.error(`Missing required environment variables: ${missingEnv.join(", ")}`);
}

const corsOptions = {
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`Origin ${origin} is not allowed by CORS`));
  },
  credentials: true,
};

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
};

const mongoCache = globalThis.mongoCache || {
  conn: null,
  promise: null,
  adminSeeded: false,
};
globalThis.mongoCache = mongoCache;

const resolveMongoUri = (uri) => {
  if (!uri) {
    return null;
  }

  try {
    const parsed = new URL(uri);
    parsed.pathname = `/${DEFAULT_DB_NAME}`;
    return parsed.toString();
  } catch {
    return uri;
  }
};

app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

const seedAdmin = async () => {
  try {
    const adminExists = await User.findOne({ username: "admin" });
    if (!adminExists) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash("1111", salt);
      const adminUser = new User({
        username: "admin",
        email: "admin@rabbitcv.com",
        password: hashedPassword,
        role: "admin",
        fullName: "System Administrator",
      });
      await adminUser.save();
      console.log("Seeded admin account with username 'admin' and password '1111'");
    }
  } catch (err) {
    console.error("Loi seed admin:", err.message);
  }
};

const connectDB = async () => {
  if (!mongoUri) {
    throw new Error("Missing MONGODB_URI");
  }

  if (mongoCache.conn) {
    return mongoCache.conn;
  }

  if (!mongoCache.promise) {
    mongoCache.promise = mongoose.connect(resolveMongoUri(mongoUri), {
      serverSelectionTimeoutMS: 5000,
      maxPoolSize: 10,
      family: 4,
    });
  }

  try {
    mongoCache.conn = await mongoCache.promise;

    if (!mongoCache.adminSeeded) {
      await seedAdmin();
      mongoCache.adminSeeded = true;
    }

    return mongoCache.conn;
  } catch (err) {
    mongoCache.promise = null;
    mongoCache.conn = null;
    throw err;
  }
};

const getPublicErrorMessage = (err, fallbackMessage) => {
  if (err?.code === 11000) {
    return "Ten dang nhap hoac email da ton tai";
  }

  if (err?.name === "ValidationError") {
    return "Thong tin dang ky khong hop le";
  }

  if (err?.name === "MongooseServerSelectionError") {
    return "Khong ket noi duoc database. Vui long kiem tra MongoDB Atlas.";
  }

  if (err?.message?.includes("JWT_SECRET")) {
    return "Server chua cau hinh JWT_SECRET";
  }

  return fallbackMessage;
};

app.get("/api/health", async (req, res) => {
  let dbError = null;

  if (!missingEnv.includes("MONGODB_URI")) {
    try {
      await connectDB();
    } catch (err) {
      dbError = err.message;
    }
  }

  const dbConnected = mongoose.connection.readyState === 1;

  res.status(missingEnv.length || dbError || !dbConnected ? 500 : 200).json({
    ok: missingEnv.length === 0 && dbConnected,
    env: process.env.NODE_ENV || "development",
    missingEnv,
    auth: {
      jwtConfigured: Boolean(jwtSecret),
      usingDefaultJwtSecret,
    },
    database: {
      readyState: mongoose.connection.readyState,
      connected: dbConnected,
      name: mongoose.connection.name || null,
      host: mongoose.connection.host || null,
      error: dbError,
    },
  });
});

app.use("/api", async (req, res, next) => {
  if (req.path === "/health") {
    return next();
  }

  try {
    await connectDB();
    return next();
  } catch (err) {
    console.error("Loi ket noi MongoDB:", err.message);
    return res.status(503).json({
      message:
        "Khong ket noi duoc database. Vui long kiem tra MONGODB_URI, them /RabbitCV vao URI, va mo Network Access tren MongoDB Atlas.",
      error: process.env.NODE_ENV === "production" ? undefined : err.message,
    });
  }
});

const authMiddleware = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ message: "Vui long dang nhap" });

  try {
    req.user = jwt.verify(token, jwtSecret);
    next();
  } catch {
    res.status(401).json({ message: "Phien dang nhap het han" });
  }
};

app.get("/api/resumes", authMiddleware, async (req, res) => {
  try {
    const resumes = await Resume.find({ userId: req.user.id }).sort({
      updatedAt: -1,
    });
    res.status(200).json(resumes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/resume/:id", authMiddleware, async (req, res) => {
  try {
    const resume = await Resume.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!resume) {
      return res.status(404).json({ message: "Khong tim thay CV" });
    }

    res.status(200).json(resume);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/resume", authMiddleware, async (req, res) => {
  try {
    const data = req.body;
    const titleCheck = await Resume.findOne({
      title: data.title,
      userId: req.user.id,
    });

    if (titleCheck && (!data._id || titleCheck._id.toString() !== data._id)) {
      return res.status(400).json({
        message: "Ten CV nay da ton tai. Vui long chon ten khac.",
      });
    }

    if (data._id) {
      const resume = await Resume.findOne({
        _id: data._id,
        userId: req.user.id,
      });

      if (resume) {
        Object.assign(resume, data);
        await resume.save();
        return res.status(200).json({
          message: "Cap nhat CV thanh cong",
          resume,
        });
      }
    }

    const newResume = new Resume({ ...data, userId: req.user.id });
    await newResume.save();
    res.status(200).json({
      message: "T?o CV moi thanh cong",
      resume: newResume,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete("/api/resume/:id", authMiddleware, async (req, res) => {
  try {
    const deleted = await Resume.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!deleted) {
      return res.status(404).json({ message: "Khong tim thay CV de xoa" });
    }

    res.status(200).json({ message: "Da xoa CV thanh cong" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/register", async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: "Vui long nhap du thong tin" });
    }

    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res.status(400).json({
        message: "Ten dang nhap hoac email da ton tai",
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    const userRole = (role === 'company' || role === 'employee') ? role : 'employee';
    const newUser = new User({ username, email, password: hashedPassword, role: userRole });

    await newUser.save();
    res.status(201).json({ message: "Dang ky thanh cong" });
  } catch (err) {
    res.status(500).json({
      message: getPublicErrorMessage(err, "Co loi xay ra khi dang ky"),
      error: process.env.NODE_ENV === "production" ? undefined : err.message,
    });
  }
});

app.post("/api/login", async (req, res) => {
  try {
    const { username, password, rememberMe } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        message: "Ten dang nhap va mat khau la bat buoc",
      });
    }

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ message: "Tai khoan khong ton tai" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Mat khau khong chinh xac" });
    }

    const payload = {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role || 'employee',
    };

    const token = jwt.sign(payload, jwtSecret, {
      expiresIn: rememberMe ? "30d" : "1d",
    });

    res.cookie("token", token, {
      ...cookieOptions,
      maxAge: rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000,
    });

    res.status(200).json({ message: "Dang nhap thanh cong", user: payload });
  } catch (err) {
    res.status(500).json({
      message: getPublicErrorMessage(err, "Co loi xay ra khi dang nhap"),
      error: process.env.NODE_ENV === "production" ? undefined : err.message,
    });
  }
});

app.get("/api/me", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    res.status(200).json({ user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put("/api/user/profile", authMiddleware, async (req, res) => {
  try {
    const {
      fullName,
      address,
      country,
      hometown,
      age,
      birthDate,
      email,
      educations,
      experiences,
      activities,
    } = req.body;

    if (email) {
      const emailExists = await User.findOne({
        email,
        _id: { $ne: req.user.id },
      });
      if (emailExists) {
        return res.status(400).json({ message: "Email da duoc su dung" });
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      {
        fullName,
        address,
        country,
        hometown,
        age,
        birthDate,
        email,
        educations,
        experiences,
        activities,
      },
      { new: true, runValidators: true },
    ).select("-password");

    res.status(200).json({
      message: "Cap nhat ho so thanh cong",
      user: updatedUser,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put("/api/user/security", authMiddleware, async (req, res) => {
  try {
    const { email, phoneNumber, pin } = req.body;

    if (email) {
      const emailExists = await User.findOne({
        email,
        _id: { $ne: req.user.id },
      });
      if (emailExists) {
        return res.status(400).json({ message: "Email da duoc su dung" });
      }
    }

    if (phoneNumber) {
      const phoneExists = await User.findOne({
        phoneNumber,
        _id: { $ne: req.user.id },
      });
      if (phoneExists) {
        return res
          .status(400)
          .json({ message: "So dien thoai da duoc su dung" });
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { email, phoneNumber, pin },
      { new: true, runValidators: true },
    ).select("-password");

    res.status(200).json({
      message: "Cap nhat bao mat thanh cong",
      user: updatedUser,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put("/api/user/password", authMiddleware, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "Nguoi dung khong ton tai" });
    }
    const isMatch = await bcrypt.compare(oldPassword, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Mat khau cu khong chinh xac" });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.status(200).json({ message: "Doi mat khau thanh cong" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/logout", (req, res) => {
  res.clearCookie("token", cookieOptions);
  res.status(200).json({ message: "Da dang xuat" });
});

app.get("/api/messages", async (req, res) => {
  try {
    const room = req.query.room || "general";
    const messages = await Message.find({ room })
      .sort({ createdAt: 1 })
      .limit(100);
    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/messages", async (req, res) => {
  try {
    const { senderId, senderName, content, room = "general" } = req.body;

    if (!senderId || !senderName || !content) {
      return res.status(400).json({ message: "Thieu thong tin tin nhan" });
    }

    const newMessage = new Message({ senderId, senderName, content, room });
    await newMessage.save();
    res.status(201).json(newMessage);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// JOB & APPLICATION ENDPOINTS
// ==========================================

// Get all jobs
app.get("/api/jobs", async (req, res) => {
  try {
    const jobs = await Job.find({}).sort({ createdAt: -1 });
    res.status(200).json(jobs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get job by ID
app.get("/api/jobs/:id", async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ message: "Khong tim thay tin tuyen dung" });
    }
    res.status(200).json(job);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get jobs posted by the currently logged-in company
app.get("/api/jobs/my", authMiddleware, async (req, res) => {
  try {
    const jobs = await Job.find({ companyId: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json(jobs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Post a new job
app.post("/api/jobs", authMiddleware, async (req, res) => {
  try {
    const { title, company, location, type, salary, description, requirements, benefits, tags } = req.body;
    
    const user = await User.findById(req.user.id);
    if (!user || user.role !== 'company') {
      return res.status(403).json({ message: "Chi doanh nghiep moi duoc dang tuyen dung" });
    }

    const newJob = new Job({
      title,
      company: company || user.fullName || user.username,
      companyId: user._id,
      location,
      type,
      salary,
      description,
      requirements: Array.isArray(requirements) ? requirements : (requirements ? requirements.split('\n').filter(Boolean) : []),
      benefits: Array.isArray(benefits) ? benefits : (benefits ? benefits.split('\n').filter(Boolean) : []),
      tags: Array.isArray(tags) ? tags : (tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : []),
    });

    await newJob.save();
    res.status(201).json({ message: "Dang tuyen dung thanh cong", job: newJob });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a job
app.delete("/api/jobs/:id", authMiddleware, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ message: "Khong tim thay tin tuyen dung" });
    }

    const requester = await User.findById(req.user.id);
    if (job.companyId.toString() !== req.user.id && (!requester || requester.role !== 'admin')) {
      return res.status(403).json({ message: "Ban khong co quyen xoa tin nay" });
    }

    await Job.findByIdAndDelete(req.params.id);
    await Application.deleteMany({ jobId: req.params.id });

    res.status(200).json({ message: "Xoa tin tuyen dung thanh cong" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Submit a CV application
app.post("/api/jobs/apply", authMiddleware, async (req, res) => {
  try {
    const { jobId, resumeId } = req.body;
    if (!jobId || !resumeId) {
      return res.status(400).json({ message: "Thieu thong tin ung tuyen" });
    }

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: "Khong tim thay cong viec" });
    }

    const resume = await Resume.findById(resumeId);
    if (!resume) {
      return res.status(404).json({ message: "Khong tim thay CV" });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "Nguoi dung khong ton tai" });
    }

    const alreadyApplied = await Application.findOne({ jobId, candidateId: req.user.id });
    if (alreadyApplied) {
      return res.status(400).json({ message: "Ban da nop CV cho cong viec nay roi" });
    }

    const newApp = new Application({
      jobId,
      candidateId: req.user.id,
      resumeId,
      fullName: resume.personalInfo?.fullName || user.fullName || user.username,
      email: resume.personalInfo?.email || user.email,
      phone: resume.personalInfo?.phone || user.phoneNumber || "",
      status: 'Pending',
    });

    await newApp.save();
    res.status(201).json({ message: "Nop ho so ung tuyen thanh cong", application: newApp });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get applications received by the logged-in company
app.get("/api/jobs/applications", authMiddleware, async (req, res) => {
  try {
    const jobs = await Job.find({ companyId: req.user.id });
    const jobIds = jobs.map(j => j._id);

    const applications = await Application.find({ jobId: { $in: jobIds } })
      .populate('jobId', 'title')
      .sort({ createdAt: -1 });

    res.status(200).json(applications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update application status
app.put("/api/jobs/applications/:id", authMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['Pending', 'Interview', 'Rejected', 'Accepted'].includes(status)) {
      return res.status(400).json({ message: "Trang thai khong hop le" });
    }

    const application = await Application.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ message: "Khong tim thay ho so ung tuyen" });
    }

    const job = await Job.findById(application.jobId);
    if (!job || job.companyId.toString() !== req.user.id) {
      const requester = await User.findById(req.user.id);
      if (!requester || requester.role !== 'admin') {
        return res.status(403).json({ message: "Ban khong co quyen thay doi trang thai ho so nay" });
      }
    }

    application.status = status;
    await application.save();

    res.status(200).json({ message: "Cap nhat trang thai ho so thanh cong", application });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get CV details (authorized viewing)
app.get("/api/resumes/view/:id", authMiddleware, async (req, res) => {
  try {
    const resume = await Resume.findById(req.params.id);
    if (!resume) {
      return res.status(404).json({ message: "Khong tim thay CV" });
    }

    if (resume.userId.toString() === req.user.id) {
      return res.status(200).json(resume);
    }

    const requester = await User.findById(req.user.id);
    if (!requester) {
      return res.status(403).json({ message: "Quyen truy cap bi tu choi" });
    }

    if (requester.role === 'admin') {
      return res.status(200).json(resume);
    }

    if (requester.role === 'company') {
      const jobs = await Job.find({ companyId: req.user.id });
      const jobIds = jobs.map(j => j._id);
      const appExists = await Application.findOne({ jobId: { $in: jobIds }, resumeId: req.params.id });
      if (appExists) {
        return res.status(200).json(resume);
      }
    }

    return res.status(403).json({ message: "Ban khong co quyen xem CV nay" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin stats
app.get("/api/admin/stats", authMiddleware, async (req, res) => {
  try {
    const requester = await User.findById(req.user.id);
    if (!requester || requester.role !== 'admin') {
      return res.status(403).json({ message: "Quyen truy cap chi danh cho Admin" });
    }

    const totalUsers = await User.countDocuments({});
    const totalCompanies = await User.countDocuments({ role: 'company' });
    const totalEmployees = await User.countDocuments({ role: 'employee' });
    const totalJobs = await Job.countDocuments({});
    const totalApplications = await Application.countDocuments({});

    const allUsers = await User.find({}).select("-password").sort({ createdAt: -1 });

    res.status(200).json({
      stats: {
        totalUsers,
        totalCompanies,
        totalEmployees,
        totalJobs,
        totalApplications,
      },
      users: allUsers,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () => {
    console.log(`Server dang chay tai http://localhost:${PORT}`);
  });
}

export default app;
