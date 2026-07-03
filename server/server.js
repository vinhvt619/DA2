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
import Notification from "./models/Notification.js";
import { createNotification } from "./utils/notificationService.js";

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
  process.env.VERCEL_BRANCH_URL
    ? `https://${process.env.VERCEL_BRANCH_URL}`
    : undefined,
  process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : undefined,
].filter(Boolean);

const missingEnv = [];
if (!mongoUri) {
  missingEnv.push("MONGODB_URI");
}
if (usingDefaultJwtSecret) {
  console.warn(
    "JWT_SECRET is not configured. Using the built-in fallback secret.",
  );
}
if (missingEnv.length) {
  console.error(
    `Missing required environment variables: ${missingEnv.join(", ")}`,
  );
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
      console.log(
        "Seeded admin account with username 'admin' and password '1111'",
      );
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
    const resumes = await Resume.find({ 
      userId: req.user.id,
      isVirtual: { $ne: true }
    })
    .select("-pdfData")
    .sort({
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

    const userRole =
      role === "company" || role === "employee" ? role : "employee";
    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      role: userRole,
    });

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
      role: user.role || "employee",
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

app.get("/api/user/profile/:userId", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select("-password").lean();
    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }
    
    const latestResume = await Resume.findOne({ userId: user._id })
      .sort({ updatedAt: -1 })
      .select("_id");
      
    user.latestResumeId = latestResume ? latestResume._id : null;
    
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
    let { senderId, senderName, content, room = "general", image } = req.body;

    const token = req.cookies.token;
    if (token) {
      try {
        const decoded = jwt.verify(token, jwtSecret);
        const user = await User.findById(decoded.id);
        if (user) {
          senderId = user._id.toString();
          senderName = user.fullName || user.username;
        }
      } catch {
        // Keep requested values on error
      }
    }

    if (!senderId || !senderName || (!content && !image)) {
      return res.status(400).json({ message: "Thieu thong tin tin nhan" });
    }

    const newMessage = new Message({ senderId, senderName, content, room, image });
    await newMessage.save();
    res.status(201).json(newMessage);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get list of all registered users (excluding current user) to start chat
app.get("/api/chat/users", authMiddleware, async (req, res) => {
  try {
    const users = await User.find({ _id: { $ne: req.user.id } }).select(
      "fullName username role",
    );
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get active chat threads for the current user
app.get("/api/chat/threads", authMiddleware, async (req, res) => {
  try {
    const currentUserId = req.user.id;

    const messages = await Message.find({
      $or: [
        { room: "general" },
        { room: { $regex: `^private_.*${currentUserId}` } },
      ],
    }).sort({ createdAt: -1 });

    const threadsMap = new Map();

    for (const msg of messages) {
      const room = msg.room;
      if (threadsMap.has(room)) continue;

      let partner = null;
      if (room.startsWith("private_")) {
        const parts = room.replace("private_", "").split("_");
        const partnerId = parts.find((id) => id !== currentUserId);
        if (partnerId) {
          try {
            partner = await User.findById(partnerId).select(
              "fullName username role",
            );
          } catch {
            // User might have been deleted or invalid ID
          }
        }
      }

      threadsMap.set(room, {
        room,
        lastMessage: msg.content,
        lastMessageAt: msg.createdAt,
        senderName: msg.senderName,
        senderId: msg.senderId,
        partner: partner
          ? {
              id: partner._id,
              name: partner.fullName || partner.username,
              role: partner.role,
            }
          : null,
      });
    }

    if (!threadsMap.has("general")) {
      const lastGeneralMsg = await Message.findOne({ room: "general" }).sort({
        createdAt: -1,
      });
      threadsMap.set("general", {
        room: "general",
        lastMessage: lastGeneralMsg
          ? lastGeneralMsg.content
          : "Chưa có tin nhắn",
        lastMessageAt: lastGeneralMsg ? lastGeneralMsg.createdAt : new Date(),
        senderName: lastGeneralMsg ? lastGeneralMsg.senderName : "",
        senderId: lastGeneralMsg ? lastGeneralMsg.senderId : "",
        partner: null,
      });
    }

    const threads = Array.from(threadsMap.values()).sort(
      (a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt),
    );
    res.status(200).json(threads);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// JOB & APPLICATION ENDPOINTS
// ==========================================

// Get all jobs (only return Active and not expired)
app.get("/api/jobs", async (req, res) => {
  try {
    const currentDate = new Date();
    const jobs = await Job.find({
      status: { $nin: ["Draft", "Expired"] },
      $or: [
        { expiryDate: { $exists: false } },
        { expiryDate: null },
        { expiryDate: { $gte: currentDate } }
      ]
    }).sort({ createdAt: -1 });
    res.status(200).json(jobs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get jobs posted by the currently logged-in company
app.get("/api/jobs/my", authMiddleware, async (req, res) => {
  try {
    const jobs = await Job.find({ companyId: req.user.id }).sort({
      createdAt: -1,
    });
    res.status(200).json(jobs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get applications received by the logged-in company
app.get("/api/jobs/applications", authMiddleware, async (req, res) => {
  try {
    const jobs = await Job.find({ companyId: req.user.id });
    const jobIds = jobs.map((j) => j._id);

    const applications = await Application.find({ jobId: { $in: jobIds } })
      .populate("jobId", "title")
      .sort({ createdAt: -1 });

    res.status(200).json(applications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Post a new job
app.post("/api/jobs", authMiddleware, async (req, res) => {
  try {
    const {
      title,
      company,
      location,
      type,
      salary,
      description,
      requirements,
      benefits,
      tags,
      status,
      expiryDate,
    } = req.body;

    const user = await User.findById(req.user.id);
    if (!user || user.role !== "company") {
      return res
        .status(403)
        .json({ message: "Chi doanh nghiep moi duoc dang tuyen dung" });
    }

    const newJob = new Job({
      title,
      company: company || user.fullName || user.username,
      companyId: user._id,
      location,
      type,
      salary,
      description,
      requirements: Array.isArray(requirements)
        ? requirements
        : requirements
          ? requirements.split("\n").filter(Boolean)
          : [],
      benefits: Array.isArray(benefits)
        ? benefits
        : benefits
          ? benefits.split("\n").filter(Boolean)
          : [],
      tags: Array.isArray(tags)
        ? tags
        : tags
          ? tags
              .split(",")
              .map((t) => t.trim())
              .filter(Boolean)
          : [],
      status: status || "Active",
      expiryDate: expiryDate || null,
    });

    await newJob.save();
    res
      .status(201)
      .json({ message: "Dang tuyen dung thanh cong", job: newJob });
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

    const alreadyApplied = await Application.findOne({
      jobId,
      candidateId: req.user.id,
    });
    if (alreadyApplied) {
      return res
        .status(400)
        .json({ message: "Ban da nop CV cho cong viec nay roi" });
    }

    const newApp = new Application({
      jobId,
      candidateId: req.user.id,
      resumeId,
      fullName: resume.personalInfo?.fullName || user.fullName || user.username,
      email: resume.personalInfo?.email || user.email,
      phone: resume.personalInfo?.phone || user.phoneNumber || "",
      status: "Pending",
    });

    await newApp.save();

    if (job) {
      await createNotification({
        recipient: job.companyId,
        recipientRole: 'company',
        type: 'NEW_APPLICATION',
        title: 'Có ứng viên mới ứng tuyển',
        message: `${newApp.fullName} vừa ứng tuyển vào vị trí của bạn`,
        link: '/CompanyDashboard'
      });
    }

    res
      .status(201)
      .json({ message: "Nop ho so ung tuyen thanh cong", application: newApp });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }

});

// Submit application with local file upload (PDF, DOC, DOCX)
app.post("/api/jobs/apply-file", authMiddleware, async (req, res) => {
  try {
    const { jobId, fileData, fileName } = req.body;
    if (!jobId || !fileData || !fileName) {
      return res.status(400).json({ message: "Thieu thong tin ung tuyen" });
    }

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: "Khong tim thay cong viec" });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "Nguoi dung khong ton tai" });
    }

    // Kiem tra xem da ung tuyen chua
    const alreadyApplied = await Application.findOne({
      jobId,
      candidateId: req.user.id,
    });
    if (alreadyApplied) {
      return res.status(400).json({ message: "Ban da nop CV cho cong viec nay roi" });
    }

    // Tao Resume ao tu file
    const virtualResume = new Resume({
      userId: req.user.id,
      title: `File CV - ${fileName}`,
      pdfData: fileData,
      fileName: fileName,
      isVirtual: true,
      personalInfo: {
        fullName: user.fullName || user.username,
        email: user.email,
        phone: user.phoneNumber || "",
      }
    });
    await virtualResume.save();

    // Tao Application
    const newApp = new Application({
      jobId,
      candidateId: req.user.id,
      resumeId: virtualResume._id,
      fullName: user.fullName || user.username,
      email: user.email,
      phone: user.phoneNumber || "",
      status: "Pending",
    });
    await newApp.save();

    if (job) {
      await createNotification({
        recipient: job.companyId,
        recipientRole: 'company',
        type: 'NEW_APPLICATION',
        title: 'Có ứng viên mới ứng tuyển',
        message: `${newApp.fullName} vừa ứng tuyển vào vị trí của bạn`,
        link: '/CompanyDashboard'
      });
    }

    res.status(201).json({ message: "Nop ho so ung tuyen thanh cong", application: newApp });
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

// Update a job
app.put("/api/jobs/:id", authMiddleware, async (req, res) => {
  try {
    const {
      title,
      company,
      location,
      type,
      salary,
      description,
      requirements,
      benefits,
      tags,
      status,
      expiryDate,
    } = req.body;

    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ message: "Khong tim thay tin tuyen dung" });
    }

    const requester = await User.findById(req.user.id);
    if (
      job.companyId.toString() !== req.user.id &&
      (!requester || requester.role !== "admin")
    ) {
      return res
        .status(403)
        .json({ message: "Ban khong co quyen chinh sua tin nay" });
    }

    job.title = title || job.title;
    job.company = company || job.company;
    job.location = location || job.location;
    job.type = type || job.type;
    job.salary = salary || job.salary;
    job.description = description || job.description;

    if (requirements !== undefined) {
      job.requirements = Array.isArray(requirements)
        ? requirements
        : requirements
          ? requirements.split("\n").filter(Boolean)
          : [];
    }
    if (benefits !== undefined) {
      job.benefits = Array.isArray(benefits)
        ? benefits
        : benefits
          ? benefits.split("\n").filter(Boolean)
          : [];
    }
    if (tags !== undefined) {
      job.tags = Array.isArray(tags)
        ? tags
        : tags
          ? tags
              .split(",")
              .map((t) => t.trim())
              .filter(Boolean)
          : [];
    }
    if (status !== undefined) {
      job.status = status;
    }
    if (expiryDate !== undefined) {
      job.expiryDate = expiryDate || null;
    }

    await job.save();
    res.status(200).json({ message: "Cap nhat tin tuyen dung thanh cong", job });
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
    if (
      job.companyId.toString() !== req.user.id &&
      (!requester || requester.role !== "admin")
    ) {
      return res
        .status(403)
        .json({ message: "Ban khong co quyen xoa tin nay" });
    }

    await Job.findByIdAndDelete(req.params.id);
    await Application.deleteMany({ jobId: req.params.id });

    res.status(200).json({ message: "Xoa tin tuyen dung thanh cong" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update application status
app.put("/api/jobs/applications/:id", authMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    if (!["Pending", "Reviewing", "Interview", "Offered", "Rejected", "Accepted"].includes(status)) {
      return res.status(400).json({ message: "Trang thai khong hop le" });
    }

    const application = await Application.findById(req.params.id);
    if (!application) {
      return res
        .status(404)
        .json({ message: "Khong tim thay ho so ung tuyen" });
    }

    const job = await Job.findById(application.jobId);
    if (!job || job.companyId.toString() !== req.user.id) {
      const requester = await User.findById(req.user.id);
      if (!requester || requester.role !== "admin") {
        return res
          .status(403)
          .json({
            message: "Ban khong co quyen thay doi trang thai ho so nay",
          });
      }
    }

    application.status = status;
    await application.save();

    const jobTitleMsg = job ? job.title : "một công việc";
    await createNotification({
      recipient: application.candidateId,
      recipientRole: 'employee',
      type: 'APPLICATION_STATUS_CHANGED',
      title: 'Trạng thái hồ sơ đã thay đổi',
      message: `Hồ sơ ứng tuyển vị trí ${jobTitleMsg} của bạn đã chuyển sang trạng thái: ${status}`,
      link: '/UserDashboard'
    });

    res
      .status(200)
      .json({ message: "Cap nhat trang thai ho so thanh cong", application });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// NOTIFICATION ENDPOINTS
// ==========================================

// Get unread count
app.get("/api/notifications/unread-count", authMiddleware, async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      recipient: req.user.id,
      isRead: false,
    });
    res.status(200).json({ count });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get notifications
app.get("/api/notifications", authMiddleware, async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user.id })
      .sort({ createdAt: -1 })
      .limit(30);
    res.status(200).json(notifications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mark single notification as read
app.put("/api/notifications/:id/read", authMiddleware, async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user.id },
      { isRead: true },
      { new: true }
    );
    if (!notification) {
      return res.status(404).json({ message: "Khong tim thay thong bao" });
    }
    res.status(200).json(notification);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mark all as read
app.put("/api/notifications/mark-all-read", authMiddleware, async (req, res) => {
  try {
    const result = await Notification.updateMany(
      { recipient: req.user.id, isRead: false },
      { isRead: true }
    );
    res.status(200).json({ modifiedCount: result.modifiedCount });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a notification
app.delete("/api/notifications/:id", authMiddleware, async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      recipient: req.user.id,
    });
    if (!notification) {
      return res.status(404).json({ message: "Khong tim thay thong bao" });
    }
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// SAVED JOBS ENDPOINTS
// ==========================================

// Get user's saved jobs
app.get("/api/saved-jobs", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "Nguoi dung khong ton tai" });
    }
    // Sort savedJobs by savedAt descending (newest first)
    const sortedSavedJobs = (user.savedJobs || []).sort((a, b) => new Date(b.savedAt) - new Date(a.savedAt));
    res.status(200).json(sortedSavedJobs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Save a job
app.post("/api/saved-jobs/:jobId", authMiddleware, async (req, res) => {
  try {
    const { jobId } = req.params;
    if (!jobId) {
      return res.status(400).json({ message: "Thieu thong tin jobId" });
    }

    await User.findOneAndUpdate(
      { _id: req.user.id, 'savedJobs.jobId': { $ne: jobId } },
      { $push: { savedJobs: { jobId: jobId, savedAt: new Date() } } }
    );
    
    res.status(200).json({ message: "Da luu cong viec" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Unsave a job
app.delete("/api/saved-jobs/:jobId", authMiddleware, async (req, res) => {
  try {
    const { jobId } = req.params;
    if (!jobId) {
      return res.status(400).json({ message: "Thieu thong tin jobId" });
    }

    await User.findByIdAndUpdate(
      req.user.id,
      { $pull: { savedJobs: { jobId: jobId } } }
    );

    res.status(200).json({ message: "Da bo luu cong viec" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get CV details (authorized viewing)
app.get("/api/resumes/view/:id", async (req, res) => {
  try {
    const resume = await Resume.findById(req.params.id);
    if (!resume) {
      return res.status(404).json({ message: "Khong tim thay CV" });
    }
    return res.status(200).json(resume);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin stats
app.get("/api/admin/stats", authMiddleware, async (req, res) => {
  try {
    const requester = await User.findById(req.user.id);
    if (!requester || requester.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Quyen truy cap chi danh cho Admin" });
    }

    const totalUsers = await User.countDocuments({});
    const totalCompanies = await User.countDocuments({ role: "company" });
    const totalEmployees = await User.countDocuments({ role: "employee" });
    const totalJobs = await Job.countDocuments({});
    const totalApplications = await Application.countDocuments({});

    const allUsers = await User.find({})
      .select("-password")
      .sort({ createdAt: -1 });

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
