import express from "express";
import http from "http";
import { Server } from "socket.io";
import { parseCookie } from "cookie";
import mongoose from "mongoose";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import { createApiLimiter } from "./utils/apiRateLimiter.js";
import swaggerUi from "swagger-ui-express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import Resume from "./models/Resume.js";
import User from "./models/User.js";
import Message from "./models/Message.js";
import Job from "./models/Job.js";
import Application from "./models/Application.js";
import Notification from "./models/Notification.js";
import HiddenChat from "./models/HiddenChat.js";
import ChatReadState from "./models/ChatReadState.js";
import { createNotification, createNotificationsBulk, setNotificationPublisher } from "./utils/notificationService.js";
import { createNotificationPublisher, createNotificationRelayHandler } from "./services/notificationRealtime.js";

import { isJobDeleted, isJobUnavailable } from "./utils/jobAvailability.js";
import { createPublicJobsHandler } from "./services/publicJobsService.js";
import { jobSubmissionPolicy, normalizeJobExpiry } from "./utils/jobModeration.js";
import { companyAccountStatus, isApprovedCompany, companyRegistrationFields } from '../shared/companyPolicy.js';
import { companyDecision, createCompanyAccountHandler } from './services/companyAdminService.js';
import News from './models/News.js';
import { newsArticles as legacyNews } from '../src/data/newsArticles.js';
import { mergeNewsCatalogue, sanitizeNews } from './services/newsService.js';
import { randomUUID } from 'node:crypto';
import { createJobReviewHandler } from './services/jobReviewService.js';
import { createJobRestoreHandler } from './services/jobRestoreService.js';
import { adminJobStatus } from '../shared/adminJobStatus.js';
import { deactivateAccount } from './services/accountDeletionService.js';
import { createAccountAuthMiddleware } from './services/accountAuthService.js';
import { createPasswordChangeHandler, createDemoPasswordResetHandler, isDemoPasswordResetEnabled } from './services/passwordChangeService.js';
import { sanitizeRichText } from "./utils/richTextSanitizer.js";

import { sanitizeResumeLayout } from "./utils/resumeLayout.js";
import { sanitizeCustomSections } from "./utils/resumeCustomSections.js";
import { normalizeSkillNames } from "../shared/resumeCustomSections.js";
import { RESUME_TEMPLATE_KEYS } from "../shared/resumeTemplates.js";
import { normalizeResumePageCount } from "../shared/resumePages.js";
import {
  createCompanyApplicationsHandler,
  createMyApplicationsHandler,
  createUpdateApplicationStatusHandler,
} from "./services/applicationStatusService.js";
import { createApplyJobHandler, createApplyFileJobHandler } from "./services/applicationSubmissionService.js";
import { freezeLegacyResumeApplications, ensureApplicationResumeSnapshot, applicationResumeData, createApplicationResumeHandler } from "./services/applicationResumeService.js";
import aiRoutes from "./routes/aiRoutes.js";
import { runJobExpiryCheck } from "./cron/jobExpiryCron.js";
import openapiSpec from "./openapi.js";

dotenv.config();
mongoose.set("bufferCommands", false);

const app = express();
app.disable("x-powered-by");
if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

const PORT = process.env.PORT || 5000;
const DEFAULT_DB_NAME = process.env.MONGO_DB_NAME || "RabbitCV";
// Allow a manually managed URI to override the value provisioned by an
// integration. This keeps local development on MONGODB_URI while giving
// deployments a safe fallback when an integration credential becomes stale.
const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
const jwtSecret = process.env.JWT_SECRET || "rabbitcv_secret_key_12345";
const usingDefaultJwtSecret = !process.env.JWT_SECRET;
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:4000",
  "http://127.0.0.1:4000",
  "http://127.0.0.2:4000",
  "http://[::1]:4000",
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

const realtimeServerUrl = process.env.REALTIME_SERVER_URL?.replace(/\/+$/, "");
const realtimeSharedSecret = process.env.REALTIME_SHARED_SECRET;
const socketJwtSecret =
  process.env.REALTIME_JWT_SECRET || realtimeSharedSecret || jwtSecret;
const realtimeRelayTimeoutMs = Math.min(
  Math.max(Number.parseInt(process.env.REALTIME_RELAY_TIMEOUT_MS || "5000", 10), 1000),
  5000,
);

const contentSecurityPolicy = {
  useDefaults: false,
  directives: {
    defaultSrc: ["'self'"],
    baseUri: ["'self'"],
    connectSrc: [
      "'self'",
      "https://rabbitcv.vercel.app",
      "wss://rabbitcv.vercel.app",
      "http://localhost:5000",
      "ws://localhost:5000",
    ],
    fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
    formAction: ["'self'"],
    frameAncestors: ["'none'"],
    imgSrc: ["'self'", "data:", "blob:", "https:"],
    objectSrc: ["'none'"],
    scriptSrc: ["'self'", "https://cdn.jsdelivr.net"],
    scriptSrcAttr: ["'none'"],
    styleSrc: [
      "'self'",
      "'unsafe-inline'",
      "https://fonts.googleapis.com",
      "https://cdn.jsdelivr.net",
    ],
  },
};

const apiLimiter = createApiLimiter();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: {
    message: "Qua nhieu lan dang nhap that bai. Vui long thu lai sau 15 phut.",
  },
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    message: "Qua nhieu yeu cau dang ky. Vui long thu lai sau.",
  },
});

const escapeRegExp = (value) =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const privateRoomPattern = (userId) => {
  const escapedUserId = escapeRegExp(userId);
  // Private room ids are stored as private_<sortedUserId>_<sortedUserId>.
  // Matching either position avoids the old broad `.*userId` scan.
  return new RegExp(`^private_(?:${escapedUserId}_|[^_]+_${escapedUserId}$)`);
};

app.get("/api-docs.json", (req, res) => {
  res.json(openapiSpec);
});

app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(openapiSpec, {
    explorer: true,
    customSiteTitle: "RabbitCV API Docs",
    swaggerOptions: {
      displayRequestDuration: true,
      persistAuthorization: true,
      tryItOutEnabled: true,
    },
  }),
);

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

app.use(
  helmet({
    contentSecurityPolicy,
    crossOriginResourcePolicy: { policy: "cross-origin" },
    frameguard: { action: "deny" },
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  }),
);
app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));
app.use("/api", apiLimiter);

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
  let healthy = missingEnv.length === 0;

  if (healthy) {
    try {
      await connectDB();
    } catch (err) {
      healthy = false;
      console.error("Health check database error:", err.message);
    }
  }

  healthy = healthy && mongoose.connection.readyState === 1;
  return res.status(healthy ? 200 : 503).json({ ok: healthy });
});

app.use("/api", async (req, res, next) => {
  if (
    req.path === "/health" ||
    req.path === "/socket-ticket" ||
    req.path.startsWith("/realtime/")
  ) {
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

const authMiddleware = createAccountAuthMiddleware({ verifyToken: (token) => jwt.verify(token, jwtSecret), UserModel: User, ensureConnected: connectDB });

const publishRealtimeMessage = async (receiverId, message) => {
  if (realtimeServerUrl && realtimeSharedSecret) {
    try {
      const response = await fetch(`${realtimeServerUrl}/api/realtime/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Realtime-Secret": realtimeSharedSecret,
        },
        body: JSON.stringify({ receiverId, message }),
        signal: AbortSignal.timeout(realtimeRelayTimeoutMs),
      });

      if (response.ok) return;
      console.error(`Realtime relay returned ${response.status}`);
    } catch (error) {
      console.error("Khong the gui su kien den realtime server:", error.message);
    }
  }

  io.to(`user_${receiverId}`).emit("newMessage", message);
};

const adminMiddleware = (req, res, next) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Chỉ admin được thực hiện thao tác này.' });
  next();
};

const SELF_USER_FIELDS = [
  "_id",
  "username",
  "email",
  "fullName",
  "address",
  "country",
  "hometown",
  "age",
  "birthDate",
  "phoneNumber",
  "companyIndustry",
  "companySize",
  "companyWebsite",
  "companyDescription",
  "companyFoundedYear",
  "companyTaxCode",
  "educations",
  "experiences",
  "activities",
  "savedJobs",
  "role",
  "status",
  "companyVerificationStatus",
  "isBanned",
  "companyAccountApprovalStatus",
  "companyAccountRejectionReason",
  "createdAt",
  "updatedAt",
].join(" ");

const PUBLIC_USER_FIELDS = [
  "_id",
  "username",
  "email",
  "fullName",
  "address",
  "country",
  "hometown",
  "phoneNumber",
  "companyIndustry",
  "companySize",
  "companyWebsite",
  "companyDescription",
  "companyFoundedYear",
  "educations",
  "experiences",
  "activities",
  "role",
  "status",
  "companyVerificationStatus",
].join(" ");

const ADMIN_USER_FIELDS = [
  "_id",
  "username",
  "email",
  "fullName",
  "role",
  "status",
  "isBanned",
  "companyIndustry",
  "companySize",
  "companyVerificationStatus",
  "createdAt",
  "companyAccountApprovalStatus",
  "companyAccountRejectionReason",
  "companyTaxCode",
  "companyWebsite",
  "address",
  "phoneNumber",
  "updatedAt",
].join(" ");

const toSafeUser = (user) => {
  const value = typeof user?.toObject === "function" ? user.toObject() : user;
  if (!value) {
    return value;
  }

  const { password: _password, pin: _pin, ...safeUser } = value;
  return safeUser;
};

app.get("/api/admin/health/details", authMiddleware, async (req, res) => {
  try {
    const requester = await User.findById(req.user.id).select("role");
    if (!requester || requester.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Quyen truy cap chi danh cho Admin" });
    }

    return res.status(200).json({
      ok: mongoose.connection.readyState === 1,
      environment: process.env.NODE_ENV || "development",
      missingEnv,
      auth: {
        jwtConfigured: Boolean(process.env.JWT_SECRET),
        usingDefaultJwtSecret,
      },
      database: {
        readyState: mongoose.connection.readyState,
        connected: mongoose.connection.readyState === 1,
        name: mongoose.connection.name || null,
        host: mongoose.connection.host || null,
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: getPublicErrorMessage(error, "Khong the doc trang thai he thong"),
    });
  }
});

app.get("/api/cron/job-expiry", async (req, res) => {
  const expectedToken = process.env.CRON_SECRET;
  const isLocal = process.env.NODE_ENV !== "production";
  const isAuthorized =
    isLocal ||
    (expectedToken && req.headers.authorization === `Bearer ${expectedToken}`);

  if (!isAuthorized) {
    return res.status(401).json({ message: "Cron token khong hop le" });
  }

  try {
    const summary = await runJobExpiryCheck();
    return res.status(200).json({ ok: true, ...summary });
  } catch (error) {
    console.error("Job expiry cron failed:", error.message);
    return res.status(500).json({ ok: false });
  }
});

app.use("/api/ai", authMiddleware, aiRoutes);

const RESUME_TEMPLATES = new Set(RESUME_TEMPLATE_KEYS);

const cleanRichText = (value) =>
  sanitizeRichText(value);

const cleanExternalUrl = (value) => {
  if (typeof value !== "string" || !value.trim()) return "";

  const rawUrl = value.trim();
  if (/^[a-z][a-z\d+.-]*:/i.test(rawUrl) && !/^https?:\/\//i.test(rawUrl)) {
    return "";
  }
  const candidate = /^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`;

  try {
    const parsedUrl = new URL(candidate);
    return ["http:", "https:"].includes(parsedUrl.protocol) ? candidate : "";
  } catch {
    return "";
  }
};

const cleanDescriptions = (items) =>
  Array.isArray(items)
    ? items.map((item) => ({
        ...item,
        description: cleanRichText(item?.description),
      }))
    : [];

const sanitizeResumeData = (source) => {
  const data = source?.toObject ? source.toObject() : source || {};
  const customSections = sanitizeCustomSections(data.customSections);

  return {
    ...data,
    personalInfo: {
      ...(data.personalInfo || {}),
      website: cleanExternalUrl(data.personalInfo?.website),
    },
    bio: cleanRichText(data.bio),
    profile: Array.isArray(data.profile)
      ? data.profile.map((item) => ({
          ...item,
          link: cleanExternalUrl(item?.link),
        }))
      : [],
    experience: cleanDescriptions(data.experience),
    education: cleanDescriptions(data.education),
    skill: normalizeSkillNames(data.skill),
    language: cleanDescriptions(data.language),
    certificate: cleanDescriptions(data.certificate),
    project: cleanDescriptions(data.project).map((item) => ({
      ...item,
      link: cleanExternalUrl(item?.link),
    })),
    award: cleanDescriptions(data.award),
    customSections,
    layout: sanitizeResumeLayout(data.layout, customSections),
    pageCount: normalizeResumePageCount(data.pageCount),
  };
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
    res.status(200).json(resumes.map(sanitizeResumeData));
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

    res.status(200).json(sanitizeResumeData(resume));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/resume", authMiddleware, async (req, res) => {
  try {
    const data = sanitizeResumeData(req.body);
    const requestedId = data._id;

    delete data._id;
    delete data.userId;
    delete data.createdAt;
    delete data.updatedAt;
    delete data.__v;
    delete data.isVirtual;
    delete data.pdfData;
    delete data.fileName;

    data.title = typeof data.title === "string" ? data.title.trim() : "";

    if (!data.title) {
      return res.status(400).json({ message: "Vui long nhap ten CV." });
    }

    if (!RESUME_TEMPLATES.has(data.selectedTemplate)) {
      return res.status(400).json({ message: "Mau CV khong hop le." });
    }
    if (requestedId && !mongoose.isValidObjectId(requestedId)) {
      return res.status(400).json({ message: "ID CV khong hop le." });
    }

    const titleCheck = await Resume.findOne({
      title: data.title,
      userId: req.user.id,
    });

    if (
      titleCheck &&
      (!requestedId || titleCheck._id.toString() !== requestedId.toString())
    ) {
      return res.status(400).json({
        code: "DUPLICATE_RESUME_TITLE",
        message: "Ten CV nay da ton tai. Vui long chon ten khac.",
      });
    }

    if (requestedId) {
      const resume = await Resume.findOne({
        _id: requestedId,
        userId: req.user.id,
      });

      if (!resume) {
        return res.status(404).json({ message: "Khong tim thay CV de cap nhat." });
      }

      await freezeLegacyResumeApplications(Application, resume);
      Object.assign(resume, data);
      await resume.save();
      return res.status(200).json({
        message: "Cap nhat CV thanh cong",
        resume: sanitizeResumeData(resume),
      });
    }

    const newResume = new Resume({ ...data, userId: req.user.id });
    await newResume.save();
    res.status(200).json({
      message: "T?o CV moi thanh cong",
      resume: sanitizeResumeData(newResume),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete("/api/resume/:id", authMiddleware, async (req, res) => {
  try {
    const resume = await Resume.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!resume) {
      return res.status(404).json({ message: "Khong tim thay CV de xoa" });
    }

    await freezeLegacyResumeApplications(Application, resume);
    await Resume.deleteOne({ _id: resume._id, userId: req.user.id });

    res.status(200).json({ message: "Da xoa CV thanh cong" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/register", registerLimiter, async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: "Vui long nhap du thong tin" });
    }
    if (role === 'company' && !String(req.body.fullName || '').trim()) return res.status(400).json({ message: 'Vui lòng nhập tên doanh nghiệp.' });

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
      ...companyRegistrationFields(userRole, req.body),
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

app.post("/api/login", loginLimiter, async (req, res) => {
  try {
    const { username, password, rememberMe } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        message: "Ten dang nhap va mat khau la bat buoc",
      });
    }

    const user = await User.findOne({ username }).select("+password");
    if (!user) {
      return res.status(400).json({ message: "Tai khoan khong ton tai" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Mat khau khong chinh xac" });
    }

    if (user.isBanned || user.deletedAt) {
      return res.status(403).json({ message: "Tai khoan da bi khoa" });
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

    res.status(200).json({
      message: "Dang nhap thanh cong",
      user: toSafeUser(user),
    });
  } catch (err) {
    res.status(500).json({
      message: getPublicErrorMessage(err, "Co loi xay ra khi dang nhap"),
      error: process.env.NODE_ENV === "production" ? undefined : err.message,
    });
  }
});

app.get("/api/me", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select(SELF_USER_FIELDS);
    res.status(200).json({ user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/users/search", authMiddleware, async (req, res) => {
  try {
    const query = String(req.query.q || "").trim();
    if (!query) {
      return res.status(200).json({ users: [] });
    }

    const pattern = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    const users = await User.find({
      _id: { $ne: req.user.id },
      isBanned: { $ne: true },
      $or: [
        { fullName: pattern },
        { username: pattern },
        { email: pattern },
        { companyIndustry: pattern },
      ],
    })
      .select(
        "_id fullName username email role status companyIndustry companyWebsite",
      )
      .limit(12)
      .lean();

    res.status(200).json({ users });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/user/profile/:userId", authMiddleware, async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.params.userId, deletedAt: null })
      .select(PUBLIC_USER_FIELDS)
      .lean();
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
      companyIndustry,
      companySize,
      companyWebsite,
      companyDescription,
      companyFoundedYear,
      companyTaxCode,
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
        companyIndustry,
        companySize,
        companyWebsite,
        companyDescription,
        companyFoundedYear,
        companyTaxCode,
        educations,
        experiences,
        activities,
      },
      { returnDocument: 'after', runValidators: true },
    ).select(SELF_USER_FIELDS);

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

    const updateData = { email, phoneNumber };
    
    if (pin !== undefined) {
      if (!pin || pin.trim() === "") {
        updateData.pin = null; // Xóa PIN → lưu null
      } else {
        const salt = await bcrypt.genSalt(10);
        updateData.pin = await bcrypt.hash(pin, salt);
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      updateData,
      { returnDocument: 'after', runValidators: true },
    ).select(SELF_USER_FIELDS);

    res.status(200).json({
      message: "Cap nhat bao mat thanh cong",
      user: updatedUser,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put("/api/user/password", authMiddleware, rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Bạn đã thử đổi mật khẩu quá nhiều lần. Vui lòng thử lại sau 15 phút." },
}), createPasswordChangeHandler({ UserModel: User, comparePassword: bcrypt.compare, hashPassword: bcrypt.hash }));

app.post('/api/forgot-password', rateLimit({
  windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: true, legacyHeaders: false,
  message: { message: 'Bạn đã thử đặt lại mật khẩu quá nhiều lần. Vui lòng thử lại sau 15 phút.' },
}), createDemoPasswordResetHandler({ enabled: isDemoPasswordResetEnabled(), UserModel: User, comparePassword: bcrypt.compare, hashPassword: bcrypt.hash }));

app.post("/api/logout", (req, res) => {
  res.clearCookie("token", cookieOptions);
  res.status(200).json({ message: "Da dang xuat" });
});

app.get("/api/socket-ticket", authMiddleware, (req, res) => {
  const token = jwt.sign(
    { id: req.user.id, role: req.user.role, purpose: "socket" },
    socketJwtSecret,
    { expiresIn: "5m" },
  );

  res.status(200).json({ token });
});

app.get("/api/messages", authMiddleware, async (req, res) => {
  try {
    const room = String(req.query.room || "general");
    const userId = req.user.id;

    if (room !== "general") {
      if (room.startsWith("private_")) {
        const parts = room.substring("private_".length).split("_");
        if (parts.length !== 2 || !parts.includes(userId)) {
          return res.status(403).json({ message: "Ban khong co quyen truy cap phong nay" });
        }
      } else {
        return res.status(403).json({ message: "Loai phong khong hop le" });
      }
    }

    const requestedLimit = Number.parseInt(req.query.limit, 10);
    const messageLimit = Number.isFinite(requestedLimit)
      ? Math.min(Math.max(requestedLimit, 1), 100)
      : 50;
    let query = { room };
    
    if (room !== "general") {
      const hiddenRecord = await HiddenChat.findOne({ userId, room }).lean();
      if (hiddenRecord) {
        query.createdAt = { $gt: hiddenRecord.hiddenAt };
      }
    }

    const messages = await Message.find(query)
      .select("_id senderId senderName content image room createdAt updatedAt")
      .sort({ createdAt: -1 })
      .limit(messageLimit)
      .lean();
    messages.reverse();
    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/messages", authMiddleware, async (req, res) => {
  try {
    let { content, room = "general", image } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "Khong tim thay nguoi dung" });
    }
    
    const senderId = user._id.toString();
    const senderName = user.fullName || user.username;

    if (!content && !image) {
      return res.status(400).json({ message: "Thieu thong tin tin nhan" });
    }

    const newMessage = new Message({ senderId, senderName, content, room, image });
    await newMessage.save();

    if (room.startsWith("private_")) {
      const ids = room.replace("private_", "").split("_");
      const receiverId = ids.find((id) => id !== senderId);
      if (receiverId) {
        await publishRealtimeMessage(receiverId, newMessage.toObject());
      }
    }

    res.status(201).json(newMessage);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get list of all registered users (excluding current user) to start chat
app.get("/api/chat/users", authMiddleware, async (req, res) => {
  try {
    const users = await User.find({ _id: { $ne: req.user.id }, deletedAt: null, isBanned: { $ne: true } }).select(
      "fullName username role",
    ).lean();
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get active chat threads for the current user
app.get("/api/chat/threads", authMiddleware, async (req, res) => {
  try {
    const currentUserId = String(req.user.id);
    const roomPattern = privateRoomPattern(currentUserId);

    // Read only private rooms. Sorting by room + createdAt matches the
    // Message compound index and lets $group take the newest message per room.
    const aggregatedMessages = await Message.aggregate([
      {
        $match: {
          room: roomPattern,
        },
      },
      { $sort: { room: 1, createdAt: -1 } },
      {
        $group: {
          _id: "$room",
          lastMessage: { $first: "$content" },
          lastMessageAt: { $first: "$createdAt" },
          senderName: { $first: "$senderName" },
          senderId: { $first: "$senderId" },
        },
      },
      { $sort: { lastMessageAt: -1 } },
    ]);

    // Gom danh sach partnerId, loai bo trung lap truoc khi query User.
    const partnerIds = new Set();
    for (const msg of aggregatedMessages) {
      const parts = msg._id.replace("private_", "").split("_");
      const partnerId = parts.find((id) => id !== currentUserId);
      if (partnerId) partnerIds.add(partnerId);
    }

    // Partner data and hidden-room data are independent queries.
    let partnersMap = {};
    const [partners, hiddenRecords] = await Promise.all([
      partnerIds.size > 0
        ? User.find({ _id: { $in: [...partnerIds] } })
            .select("fullName username role")
            .lean()
        : [],
      HiddenChat.find({ userId: currentUserId }).lean(),
    ]);

    if (partners.length > 0) {
      partners.forEach(p => {
        partnersMap[p._id.toString()] = p;
      });
    }

    // Map du lieu thanh mang threads cuoi cung.
    const threadsMap = new Map();
    for (const msg of aggregatedMessages) {
      const room = msg._id;
      let partnerInfo = null;

      if (room.startsWith("private_")) {
        const parts = room.replace("private_", "").split("_");
        const partnerId = parts.find((id) => id !== currentUserId);
        if (partnerId && partnersMap[partnerId]) {
          const p = partnersMap[partnerId];
          partnerInfo = {
            id: p._id,
            name: p.fullName || p.username,
            role: p.role,
          };
        }
      }

      threadsMap.set(room, {
        room,
        lastMessage: msg.lastMessage,
        lastMessageAt: msg.lastMessageAt,
        senderName: msg.senderName,
        senderId: msg.senderId,
        partner: partnerInfo,
      });
    }

    const threads = Array.from(threadsMap.values()).sort(
      (a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt),
    );

    // Lọc bỏ những phòng bị ẩn và chưa có tin nhắn mới
    const hiddenMap = {};
    hiddenRecords.forEach(h => hiddenMap[h.room] = new Date(h.hiddenAt));

    const visibleThreads = threads.filter(t => {
      if (!hiddenMap[t.room]) return true; // Chưa bị ẩn
      
      const lastMsgTime = new Date(t.lastMessageAt);
      const hiddenTime = hiddenMap[t.room];
      
      // Nếu có tin nhắn mới sau thời điểm ẩn, thì hiện lại
      return lastMsgTime > hiddenTime;
    });

    res.status(200).json(
      visibleThreads,
    );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get the number of private conversations containing messages the current user
// has not opened yet. This persists the message badge across refreshes/logins.
app.get("/api/chat/unread-count", authMiddleware, async (req, res) => {
  try {
    const currentUserId = String(req.user.id);
    const roomPattern = privateRoomPattern(currentUserId);
    const readStates = await ChatReadState.find({ userId: currentUserId }).lean();
    const readAtByRoom = new Map(
      readStates.map((state) => [state.room, new Date(state.lastReadAt)]),
    );

    // Return one latest received message per room instead of transferring and
    // iterating through the complete message history in the Node function.
    const latestReceivedMessages = await Message.aggregate([
      {
        $match: {
          room: roomPattern,
          senderId: { $ne: currentUserId },
        },
      },
      {
        $group: {
          _id: "$room",
          lastMessageAt: { $max: "$createdAt" },
        },
      },
    ]);

    const unreadRooms = new Set();
    for (const message of latestReceivedMessages) {
      const lastReadAt = readAtByRoom.get(message._id);
      if (!lastReadAt || new Date(message.lastMessageAt) > lastReadAt) {
        unreadRooms.add(message._id);
      }
    }

    res.status(200).json({ unreadCount: unreadRooms.size });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Opening the message menu acknowledges every conversation that currently
// contains received messages. Persisting this timestamp prevents the badge
// from returning after a page refresh.
app.patch("/api/chat/mark-all-read", authMiddleware, async (req, res) => {
  try {
    const currentUserId = String(req.user.id);
    const readAt = new Date();
    const rooms = await Message.distinct("room", {
      room: { $regex: `^private_.*${currentUserId}` },
      senderId: { $ne: currentUserId },
    });

    if (rooms.length > 0) {
      await ChatReadState.bulkWrite(
        rooms.map((room) => ({
          updateOne: {
            filter: { userId: currentUserId, room },
            update: { $set: { lastReadAt: readAt } },
            upsert: true,
          },
        })),
      );
    }

    res.status(200).json({ markedRooms: rooms.length, readAt });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// A thread becomes read only when the user opens that specific conversation.
app.patch("/api/chat/threads/:room/read", authMiddleware, async (req, res) => {
  try {
    const { room } = req.params;
    const currentUserId = req.user.id;
    const participantIds = room.startsWith("private_")
      ? room.replace("private_", "").split("_")
      : [];

    if (!participantIds.includes(currentUserId)) {
      return res.status(403).json({ message: "Khong co quyen truy cap doan chat nay" });
    }

    await ChatReadState.findOneAndUpdate(
      { userId: currentUserId, room },
      { lastReadAt: new Date() },
      { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true },
    );

    res.status(200).json({ message: "Da danh dau da doc" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Hide a chat room
app.patch("/api/chat/threads/:room/hide", authMiddleware, async (req, res) => {
  try {
    const { room } = req.params;
    if (room === "general") {
      return res.status(400).json({ message: "Không thể ẩn nhóm chung" });
    }
    
    await HiddenChat.findOneAndUpdate(
      { userId: req.user.id, room },
      { hiddenAt: new Date() },
      { upsert: true, returnDocument: 'after' }
    );
    res.status(200).json({ message: "Đã ẩn đoạn chat" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// JOB & APPLICATION ENDPOINTS
// ==========================================

// Get all jobs (only return Active and not expired)
app.get("/api/jobs", createPublicJobsHandler({ JobModel: Job }));

// Get jobs posted by the currently logged-in company
app.get("/api/jobs/my", authMiddleware, async (req, res) => {
  try {
    const jobs = await Job.find({
      companyId: req.user.id,
      status: { $ne: "Deleted" },
      deletedAt: null,
    }).sort({
      createdAt: -1,
    });
    res.status(200).json(jobs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get applications received by the logged-in company
app.get("/api/jobs/applications", authMiddleware, createCompanyApplicationsHandler({ Application, Job }));

// Get applications for the logged-in candidate
app.get("/api/jobs/applications/mine", authMiddleware, createMyApplicationsHandler({ Application }));

app.get("/api/jobs/applications/:id/resume", authMiddleware, createApplicationResumeHandler({
  Application, Resume, Job, sanitizeResumeData,
}));

// Post a new job
app.post("/api/jobs", authMiddleware, async (req, res) => {
  try {
    const {
      title,
      company,
      location,
      type,
      salary,
      experience,
      education,
      workModel,
      description,
      requirements,
      benefits,
      tags,
      status,
      expiryDate,
    } = req.body;

    const user = await User.findById(req.user.id);
    if (!isApprovedCompany(user)) {
      return res
        .status(403)
        .json({ message: "Tài khoản doanh nghiệp cần được admin duyệt trước khi gửi tin tuyển dụng." });
    }

    if (expiryDate) {
      const now = new Date();
      const maxDate = new Date();
      maxDate.setFullYear(now.getFullYear() + 2);
      
      const d = new Date(expiryDate);
      if (isNaN(d) || d > maxDate || d < new Date(new Date().setHours(0,0,0,0))) {
        return res.status(400).json({ message: "Ngày hết hạn không hợp lệ (tối thiểu là hôm nay và tối đa 2 năm kể từ hôm nay)." });
      }
    }

    let submissionPolicy;
    try { submissionPolicy = jobSubmissionPolicy(null, { ...req.body, status }, user); }
    catch (error) { return res.status(400).json({ message: error.message }); }
    const newJob = new Job({
      title,
      company: company || user.fullName || user.username,
      companyId: user._id,
      location,
      type,
      salary,
      experience: experience || "Không yêu cầu",
      education: education || "Không yêu cầu",
      workModel: workModel || (type === "Remote" ? "Làm từ xa" : type === "Hybrid" ? "Kết hợp" : "Tại văn phòng"),
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
      ...submissionPolicy,
      expiryDate: normalizeJobExpiry(expiryDate),
    });

    await newJob.save();
    res
      .status(201)
      .json({ message: newJob.status === 'Draft' ? 'Đã lưu bản nháp.' : newJob.status === 'Active' ? 'Tin tuyển dụng đã được công khai.' : 'Đã gửi tin tuyển dụng chờ admin duyệt.', job: newJob });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Submit a CV application
app.post("/api/jobs/apply", authMiddleware, createApplyJobHandler({
  Application,
  Resume,
  Job,
  User,
  createNotificationsBulk,
}));

// Submit application with local PDF upload
app.post("/api/jobs/apply-file", authMiddleware, createApplyFileJobHandler({
  Application,
  Resume,
  Job,
  User,
  createNotificationsBulk,
}));

// Get job by ID
app.get("/api/jobs/:id", async (req, res) => {
  try {
    res.set("Cache-Control", "no-store");
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ message: "Khong tim thay tin tuyen dung" });
    }
    if (isJobDeleted(job) || job.isAdminHidden || job.approvalStatus !== 'Approved') {
      return res.status(410).json({ message: "Tin tuyen dung da bi an" });
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
      experience,
      education,
      workModel,
      description,
      requirements,
      benefits,
      tags,
      expiryDate,
    } = req.body;

    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ message: "Khong tim thay tin tuyen dung" });
    }
    if (isJobDeleted(job)) {
      return res.status(410).json({ message: "Tin tuyen dung da bi xoa" });
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

    if (requester.role === 'company' && !isApprovedCompany(requester)) return res.status(403).json({ message: 'Tài khoản doanh nghiệp chưa được admin duyệt.' });
    let submissionPolicy;
    try { submissionPolicy = jobSubmissionPolicy(job, req.body, requester); }
    catch (error) { return res.status(400).json({ message: error.message }); }

    job.title = title || job.title;
    job.company = company || job.company;
    job.location = location || job.location;
    job.type = type || job.type;
    job.salary = salary || job.salary;
    if (experience !== undefined) job.experience = experience || "Không yêu cầu";
    if (education !== undefined) job.education = education || "Không yêu cầu";
    if (workModel !== undefined) job.workModel = workModel || "Tại văn phòng";
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
    Object.assign(job, submissionPolicy);
    
    if (expiryDate) {
      const now = new Date();
      const maxDate = new Date();
      maxDate.setFullYear(now.getFullYear() + 2);
      
      const d = new Date(expiryDate);
      if (isNaN(d) || d > maxDate) {
        return res.status(400).json({ message: "Ngày hết hạn không hợp lệ (tối đa 2 năm kể từ hôm nay)." });
      }
    }

    if (expiryDate !== undefined) {
      const newExpiry = expiryDate ? new Date(expiryDate).getTime() : null;
      const oldExpiry = job.expiryDate ? new Date(job.expiryDate).getTime() : null;
      const isDateChanged = newExpiry !== oldExpiry;
      
      if (isDateChanged) {
        job.expiryNotifiedAt = null;
        job.expiredNotifiedAt = null;
      }
      job.expiryDate = normalizeJobExpiry(expiryDate);
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

    job.status = "Deleted";
    job.deletedAt = new Date();
    await job.save();

    res.status(200).json({
      message: "Da xoa tin tuyen dung. Lich su ung tuyen va viec da luu duoc giu lai.",
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update application status
app.put("/api/jobs/applications/:id", authMiddleware, createUpdateApplicationStatusHandler({
  Application,
  Job,
  User,
  createNotification,
}));
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
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const notifications = await Notification.find({ recipient: req.user.id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Notification.countDocuments({ recipient: req.user.id });
    const totalPages = Math.ceil(total / limit);

    res.json({ notifications, totalPages, currentPage: page });
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
      { returnDocument: 'after' }
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

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: "Khong tim thay cong viec" });
    }
    if (isJobUnavailable(job)) {
      return res.status(410).json({ message: "Khong the luu tin da dong hoac da bi xoa" });
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
app.get("/api/resumes/view/:id", authMiddleware, async (req, res) => {
  try {
    // Older recruiter links must also use the submitted copy, never the live CV.
    if (req.user.role === "company") {
      const companyJobIds = await Job.find({ companyId: req.user.id }).distinct("_id");
      let application = await Application.findOne({ resumeId: req.params.id, jobId: { $in: companyJobIds } })
        .select('+resumeSnapshot').sort({ createdAt: -1 });
      if (!application) return res.status(403).json({ message: "Bạn không có quyền xem CV này" });
      application = await ensureApplicationResumeSnapshot(Application, Resume, application);
      if (!application?.resumeSnapshot) {
        return res.status(410).json({ message: "Hồ sơ cũ chưa lưu bản CV và CV gốc không còn tồn tại." });
      }
      return res.status(200).json(sanitizeResumeData(applicationResumeData(application)));
    }
    const resume = await Resume.findById(req.params.id);
    if (!resume) {
      return res.status(404).json({ message: "Khong tim thay CV" });
    }
    const isOwner = resume.userId.toString() === req.user.id.toString();
    const isAdmin = req.user.role === "admin";
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ 
        message: "Bạn không có quyền xem CV này" 
      });
    }
    return res.status(200).json(sanitizeResumeData(resume));
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

    const totalUsers = await User.countDocuments({ deletedAt: null });
    const totalCompanies = await User.countDocuments({ role: "company", deletedAt: null });
    const totalEmployees = await User.countDocuments({ role: "employee", deletedAt: null });
    const totalJobs = await Job.countDocuments({ status: { $ne: "Deleted" }, deletedAt: null });
    const totalApplications = await Application.countDocuments({});

    const allUsers = await User.find({ deletedAt: null })
      .select(ADMIN_USER_FIELDS)
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

app.get("/api/admin/jobs", authMiddleware, async (req, res) => {
  try {
    const requester = await User.findById(req.user.id);
    if (!requester || requester.role !== "admin") {
      return res.status(403).json({ message: "Quyen truy cap chi danh cho Admin" });
    }

    const jobs = await Job.find({ status: { $ne: "Deleted" }, deletedAt: null }).sort({ createdAt: -1 }).lean();
    const applicationCounts = await Application.aggregate([
      { $group: { _id: "$jobId", count: { $sum: 1 } } },
    ]);
    const countByJob = new Map(
      applicationCounts.map((item) => [item._id.toString(), item.count]),
    );

    const normalizedJobs = jobs.map((job) => ({
      ...job,
      company: { name: job.company },
      rawStatus: job.status,
      status: adminJobStatus(job),
      applicantCount: countByJob.get(job._id.toString()) || 0,
    }));

    res.status(200).json({ jobs: normalizedJobs });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/admin/jobs/:id/review', authMiddleware, adminMiddleware, createJobReviewHandler({ JobModel: Job, UserModel: User, notify: createNotification }));

app.put("/api/admin/jobs/:id/hide", authMiddleware, async (req, res) => {
  try {
    const requester = await User.findById(req.user.id);
    if (!requester || requester.role !== "admin") {
      return res.status(403).json({ message: "Quyen truy cap chi danh cho Admin" });
    }

    const job = await Job.findOneAndUpdate(
      { _id: req.params.id, deletedAt: null, status: { $ne: 'Deleted' }, approvalStatus: 'Approved' },
      { status: "Expired", isAdminHidden: true },
      { returnDocument: 'after' },
    );
    if (!job) return res.status(404).json({ message: "Khong tim thay cong viec" });
    res.status(200).json({ message: "Da an tin tuyen dung", job });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/admin/jobs/:id/unhide', authMiddleware, adminMiddleware, createJobRestoreHandler({ JobModel: Job, UserModel: User }));

app.delete("/api/admin/jobs/:id", authMiddleware, async (req, res) => {
  try {
    const requester = await User.findById(req.user.id);
    if (!requester || requester.role !== "admin") {
      return res.status(403).json({ message: "Quyen truy cap chi danh cho Admin" });
    }

    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ message: "Khong tim thay cong viec" });
    job.status = "Deleted";
    job.deletedAt = new Date();
    await job.save();
    res.status(200).json({
      message: "Da xoa tin tuyen dung. Lich su ung tuyen va viec da luu duoc giu lai.",
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/admin/companies", authMiddleware, async (req, res) => {
  try {
    const requester = await User.findById(req.user.id);
    if (!requester || requester.role !== "admin") {
      return res.status(403).json({ message: "Quyen truy cap chi danh cho Admin" });
    }

    const companies = await User.find({ role: "company", deletedAt: null })
      .select(ADMIN_USER_FIELDS)
      .sort({ createdAt: -1 })
      .lean();
    const jobCounts = await Job.aggregate([
      { $match: { status: { $ne: "Deleted" }, deletedAt: null } },
      { $group: { _id: "$companyId", count: { $sum: 1 } } },
    ]);
    const jobCountByCompany = new Map(jobCounts.map((item) => [item._id.toString(), item.count]));

    res.status(200).json({
      companies: companies.map((company) => ({
        ...company,
        jobCount: jobCountByCompany.get(company._id.toString()) || 0,
        accountApprovalStatus: companyAccountStatus(company),
        verificationStatus: company.companyVerificationStatus === 'verified' ? 'verified' : 'unverified',
      })),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/admin/companies', authMiddleware, adminMiddleware, createCompanyAccountHandler({ UserModel: User, hashPassword: bcrypt.hash }));

app.put("/api/admin/companies/:id/verification", authMiddleware, async (req, res) => {
  try {
    const requester = await User.findById(req.user.id);
    if (!requester || requester.role !== "admin") {
      return res.status(403).json({ message: "Quyen truy cap chi danh cho Admin" });
    }

    const existing = await User.findOne({ _id: req.params.id, role: 'company', deletedAt: null });
    if (!existing) return res.status(404).json({ message: 'Không tìm thấy doanh nghiệp.' });
    let updates;
    try { updates = companyDecision(existing, req.body); }
    catch (error) { return res.status(400).json({ message: error.message }); }
    const company = await User.findOneAndUpdate(
      { _id: existing._id, updatedAt: existing.updatedAt, deletedAt: null },
      { $set: updates }, { returnDocument: 'after', runValidators: true },
    ).select(ADMIN_USER_FIELDS);
    if (!company) return res.status(409).json({ message: 'Tài khoản đã thay đổi. Vui lòng tải lại.' });

    res.status(200).json({ message: "Da cap nhat doanh nghiep", company });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put("/api/admin/users/:id/ban", authMiddleware, async (req, res) => {
  try {
    const requester = await User.findById(req.user.id);
    if (!requester || requester.role !== "admin") {
      return res.status(403).json({ message: "Quyen truy cap chi danh cho Admin" });
    }
    if (req.params.id === req.user.id) {
      return res.status(400).json({ message: "Khong the khoa tai khoan dang dung" });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isBanned: true },
      { returnDocument: 'after' },
    ).select(ADMIN_USER_FIELDS);
    if (!user) return res.status(404).json({ message: "Khong tim thay nguoi dung" });
    res.status(200).json({ message: "Da khoa tai khoan", user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete("/api/admin/users/:id", authMiddleware, async (req, res) => {
  try {
    const requester = await User.findById(req.user.id);
    if (!requester || requester.role !== "admin") {
      return res.status(403).json({ message: "Quyen truy cap chi danh cho Admin" });
    }
    if (req.params.id === req.user.id) {
      return res.status(400).json({ message: "Khong the xoa tai khoan dang dung" });
    }

    const user = await deactivateAccount({ connection: mongoose.connection, UserModel: User, JobModel: Job }, req.params.id);
    if (!user) return res.status(404).json({ message: "Khong tim thay nguoi dung" });
    io.in(`user_${user._id}`).disconnectSockets(true);
    res.status(200).json({ message: "Đã vô hiệu hóa tài khoản, gỡ tin tuyển dụng và giữ lịch sử ứng tuyển." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/news', async (req, res) => {
  try { res.set('Cache-Control', 'no-store').json(mergeNewsCatalogue(legacyNews, await News.find({}).lean())); }
  catch { res.status(503).json({ message: 'Không thể tải tin tức.' }); }
});
app.get('/api/admin/news', authMiddleware, adminMiddleware, async (req, res) => {
  try { res.set('Cache-Control', 'no-store').json({ articles: mergeNewsCatalogue(legacyNews, await News.find({}).lean(), true) }); }
  catch { res.status(503).json({ message: 'Không thể tải tin tức.' }); }
});
app.post('/api/admin/news', authMiddleware, adminMiddleware, async (req, res) => {
  let fields;
  try { fields = sanitizeNews(req.body); } catch (error) { return res.status(400).json({ message: error.message }); }
  try {
    const article = await News.create({ ...fields, slug: `bai-viet-${randomUUID()}`, authorId: req.user.id, publishedAt: fields.status === 'Published' ? new Date() : null });
    res.status(201).json({ article });
  } catch { res.status(500).json({ message: 'Không thể lưu bài viết.' }); }
});
app.put('/api/admin/news/:slug', authMiddleware, adminMiddleware, async (req, res) => {
  let fields;
  try { fields = sanitizeNews(req.body); } catch (error) { return res.status(400).json({ message: error.message }); }
  try {
    const existing = await News.findOne({ slug: req.params.slug });
    if (existing?.status === 'Deleted' || (!existing && !legacyNews.some((a) => a.slug === req.params.slug))) return res.status(404).json({ message: 'Không tìm thấy bài viết.' });
    const article = await News.findOneAndUpdate({ slug: req.params.slug, status: { $ne: 'Deleted' } }, { $set: { ...fields, authorId: req.user.id, publishedAt: existing?.publishedAt || (fields.status === 'Published' ? new Date() : null) } }, { upsert: true, returnDocument: 'after', runValidators: true });
    res.json({ article });
  } catch { res.status(500).json({ message: 'Không thể cập nhật bài viết.' }); }
});
app.delete('/api/admin/news/:slug', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const existing = await News.findOne({ slug: req.params.slug });
    if (!existing && !legacyNews.some((a) => a.slug === req.params.slug)) return res.status(404).json({ message: 'Không tìm thấy bài viết.' });
    await News.findOneAndUpdate({ slug: req.params.slug }, { $set: { status: 'Deleted', authorId: req.user.id } }, { upsert: true, returnDocument: 'after' });
    res.json({ message: 'Đã xóa bài viết.' });
  } catch { res.status(500).json({ message: 'Không thể xóa bài viết.' }); }
});

const server = http.createServer(app);

const io = new Server(server, {
  cors: corsOptions
});

setNotificationPublisher(createNotificationPublisher({
  io,
  serverUrl: realtimeServerUrl,
  sharedSecret: realtimeSharedSecret,
  timeoutMs: realtimeRelayTimeoutMs,
}));

app.post("/api/realtime/notifications", createNotificationRelayHandler({
  io,
  sharedSecret: realtimeSharedSecret,
}));

app.get("/api/realtime/health", (req, res) => {
  res.status(200).json({ ok: true, service: "rabbitcv-realtime" });
});

app.post("/api/realtime/messages", (req, res) => {
  if (
    !realtimeSharedSecret ||
    req.get("X-Realtime-Secret") !== realtimeSharedSecret
  ) {
    return res.status(401).json({ message: "Realtime secret khong hop le" });
  }

  const { receiverId, message } = req.body || {};
  if (!receiverId || !message?.room) {
    return res.status(400).json({ message: "Du lieu realtime khong hop le" });
  }

  io.to(`user_${receiverId}`).emit("newMessage", message);
  return res.status(202).json({ delivered: true });
});

io.use((socket, next) => {
  try {
    const cookies = parseCookie(socket.handshake.headers.cookie || "");
    const token = socket.handshake.auth?.token || cookies.token;
    
    if (!token) {
      return next(new Error("Authentication error: No token provided"));
    }
    
    const decoded = jwt.verify(token, socketJwtSecret);
    socket.user = decoded;
    next();
  } catch {
    next(new Error("Authentication error: Invalid token"));
  }
});

io.on("connection", (socket) => {
  const userId = socket.user.id;
  console.log(`[Socket] User connected: ${userId} (Socket ID: ${socket.id})`);
  
  socket.join(`user_${userId}`);
  
  socket.on("disconnect", () => {
    console.log(`[Socket] User disconnected: ${userId} (Socket ID: ${socket.id})`);
  });
});

if (!process.env.VERCEL) {
  server.listen(PORT, () => {
    console.log(`Server dang chay tai http://localhost:${PORT}`);
  });
}

export { app, io, server };
export default app;
