import { captureApplicationResume } from './applicationResumeService.js';
import { cleanAiText } from '../utils/aiDataSanitizer.js';
import { isJobUnavailable } from '../utils/jobAvailability.js';
import { validatePdfUpload } from '../utils/pdfValidation.js';

export const ALREADY_APPLIED_CODE = 'ALREADY_APPLIED';
export const ALREADY_APPLIED_MESSAGE = 'Bạn đã nộp CV cho công việc này rồi';
export const CANDIDATE_ROLE_REQUIRED_CODE = 'CANDIDATE_ROLE_REQUIRED';
export const CANDIDATE_ROLE_REQUIRED_MESSAGE = 'Chỉ tài khoản ứng viên mới được nộp hồ sơ ứng tuyển.';

function hasExactJobCandidateKeys(obj) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
    return false;
  }
  const keys = Object.keys(obj);
  return keys.length === 2 && Object.hasOwn(obj, 'jobId') && Object.hasOwn(obj, 'candidateId');
}

export function isDuplicateApplicationError(error) {
  if (Number(error?.code) !== 11000) {
    return false;
  }

  const keyPatternKeys =
    error?.keyPattern && typeof error.keyPattern === 'object' && !Array.isArray(error.keyPattern)
      ? Object.keys(error.keyPattern)
      : [];
  const keyValueKeys =
    error?.keyValue && typeof error.keyValue === 'object' && !Array.isArray(error.keyValue)
      ? Object.keys(error.keyValue)
      : [];

  if (keyPatternKeys.length > 0 || keyValueKeys.length > 0) {
    const patternMatches =
      keyPatternKeys.length > 0
        ? hasExactJobCandidateKeys(error.keyPattern) &&
          Boolean(error.keyPattern.jobId) &&
          Boolean(error.keyPattern.candidateId)
        : true;
    const valueMatches =
      keyValueKeys.length > 0
        ? hasExactJobCandidateKeys(error.keyValue) &&
          error.keyValue.jobId !== undefined &&
          error.keyValue.candidateId !== undefined
        : true;
    return patternMatches && valueMatches;
  }

  if (typeof error?.message === 'string') {
    return /\bindex:\s*(?:[\w.$]+\.)?jobId_1_candidateId_1\b/.test(error.message);
  }

  return false;
}

function hasExplicitDuplicateMetadata(error) {
  const keyPatternKeys =
    error?.keyPattern && typeof error.keyPattern === 'object' && !Array.isArray(error.keyPattern)
      ? Object.keys(error.keyPattern)
      : [];
  const keyValueKeys =
    error?.keyValue && typeof error.keyValue === 'object' && !Array.isArray(error.keyValue)
      ? Object.keys(error.keyValue)
      : [];
  if (keyPatternKeys.length > 0 || keyValueKeys.length > 0) {
    return true;
  }
  return typeof error?.message === 'string' && /\bindex:\s*[\w.$]+/.test(error.message);
}

async function isConfirmedDuplicateApplication(Application, error, query) {
  if (isDuplicateApplicationError(error)) {
    return true;
  }
  if (Number(error?.code) !== 11000 || hasExplicitDuplicateMetadata(error)) {
    return false;
  }
  if (typeof Application?.findOne === 'function') {
    const existing = await Application.findOne(query);
    return Boolean(existing);
  }
  return false;
}

function ensureCandidateRole(req, res) {
  if (!req.user?.id) {
    res.status(401).json({ message: 'Không có quyền truy cập, vui lòng đăng nhập' });
    return false;
  }
  if (req.user.role !== 'employee') {
    res.status(403).json({
      code: CANDIDATE_ROLE_REQUIRED_CODE,
      message: CANDIDATE_ROLE_REQUIRED_MESSAGE,
    });
    return false;
  }
  return true;
}

function buildJobSnapshot(job) {
  return {
    title: job.title,
    company: job.company,
    location: job.location,
    type: job.type,
    salary: job.salary,
  };
}

async function notifyNewApplication(createNotificationsBulk, job, candidateId, fullName) {
  if (!job || typeof createNotificationsBulk !== 'function') {
    return;
  }
  await createNotificationsBulk([
    {
      recipient: job.companyId,
      recipientRole: 'company',
      type: 'NEW_APPLICATION',
      title: 'Có ứng viên mới ứng tuyển',
      message: `${fullName} vừa ứng tuyển vào vị trí của bạn`,
      link: '/CompanyDashboard',
    },
    {
      recipient: candidateId,
      recipientRole: 'employee',
      type: 'APPLICATION_SUBMITTED',
      title: 'Nộp hồ sơ thành công',
      message: `Bạn đã ứng tuyển thành công vào vị trí ${job.title}`,
      link: '/UserDashboard',
    },
  ]);
}

export function createApplyJobHandler({
  Application,
  Resume,
  Job,
  User,
  createNotificationsBulk,
}) {
  return async (req, res) => {
    try {
      if (!ensureCandidateRole(req, res)) {
        return;
      }

      const { jobId, resumeId, coverLetter } = req.body || {};
      if (!jobId || !resumeId) {
        return res.status(400).json({ message: 'Thieu thong tin ung tuyen' });
      }

      const job = await Job.findById(jobId);
      if (!job) {
        return res.status(404).json({ message: 'Khong tim thay cong viec' });
      }
      if (isJobUnavailable(job)) {
        return res.status(410).json({ message: 'Tin tuyen dung da het han, da dong hoac da bi xoa' });
      }

      const resume = await Resume.findOne({
        _id: resumeId,
        userId: req.user.id,
        isVirtual: { $ne: true },
      });
      if (!resume) {
        return res.status(404).json({ message: 'Khong tim thay CV' });
      }

      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ message: 'Nguoi dung khong ton tai' });
      }

      const duplicateQuery = {
        jobId,
        candidateId: req.user.id,
      };
      const alreadyApplied = await Application.findOne(duplicateQuery);
      if (alreadyApplied) {
        return res.status(409).json({
          code: ALREADY_APPLIED_CODE,
          message: ALREADY_APPLIED_MESSAGE,
        });
      }

      const submittedAt = new Date();
      const newApp = new Application({
        jobId,
        candidateId: req.user.id,
        resumeId,
        ...captureApplicationResume(resume),
        fullName: resume.personalInfo?.fullName || user.fullName || user.username,
        email: resume.personalInfo?.email || user.email,
        phone: resume.personalInfo?.phone || user.phoneNumber || '',
        coverLetter: cleanAiText(coverLetter, 5000),
        status: 'Pending',
        statusHistory: [{ status: 'Pending', timestamp: submittedAt }],
        createdAt: submittedAt,
        jobSnapshot: buildJobSnapshot(job),
      });

      try {
        await newApp.save();
      } catch (error) {
        if (await isConfirmedDuplicateApplication(Application, error, duplicateQuery)) {
          return res.status(409).json({
            code: ALREADY_APPLIED_CODE,
            message: ALREADY_APPLIED_MESSAGE,
          });
        }
        throw error;
      }

      await notifyNewApplication(createNotificationsBulk, job, req.user.id, newApp.fullName);

      return res.status(201).json({
        message: 'Nop ho so ung tuyen thanh cong',
        application: newApp,
      });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  };
}

export function createApplyFileJobHandler({
  Application,
  Resume,
  Job,
  User,
  createNotificationsBulk,
}) {
  return async (req, res) => {
    try {
      if (!ensureCandidateRole(req, res)) {
        return;
      }

      const { jobId, fileData, fileName, coverLetter } = req.body || {};
      if (!jobId || !fileData || !fileName) {
        return res.status(400).json({ message: 'Thieu thong tin ung tuyen' });
      }

      const pdfValidation = validatePdfUpload({ fileData, fileName });
      if (!pdfValidation.valid) {
        return res.status(400).json({ message: pdfValidation.message });
      }
      const normalizedFileName = pdfValidation.fileName;

      const job = await Job.findById(jobId);
      if (!job) {
        return res.status(404).json({ message: 'Khong tim thay cong viec' });
      }
      if (isJobUnavailable(job)) {
        return res.status(410).json({ message: 'Tin tuyen dung da het han, da dong hoac da bi xoa' });
      }

      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ message: 'Nguoi dung khong ton tai' });
      }

      const duplicateQuery = {
        jobId,
        candidateId: req.user.id,
      };
      const alreadyApplied = await Application.findOne(duplicateQuery);
      if (alreadyApplied) {
        return res.status(409).json({
          code: ALREADY_APPLIED_CODE,
          message: ALREADY_APPLIED_MESSAGE,
        });
      }

      const virtualResume = new Resume({
        userId: req.user.id,
        title: `File CV - ${normalizedFileName}`,
        pdfData: fileData,
        fileName: normalizedFileName,
        isVirtual: true,
        personalInfo: {
          fullName: user.fullName || user.username,
          email: user.email,
          phone: user.phoneNumber || '',
        },
      });
      await virtualResume.save();

      const submittedAt = new Date();
      const newApp = new Application({
        jobId,
        candidateId: req.user.id,
        resumeId: virtualResume._id,
        ...captureApplicationResume(virtualResume),
        fullName: user.fullName || user.username,
        email: user.email,
        phone: user.phoneNumber || '',
        coverLetter: cleanAiText(coverLetter, 5000),
        status: 'Pending',
        statusHistory: [{ status: 'Pending', timestamp: submittedAt }],
        createdAt: submittedAt,
        jobSnapshot: buildJobSnapshot(job),
      });

      try {
        await newApp.save();
      } catch (error) {
        await Resume.deleteOne({ _id: virtualResume._id });
        if (await isConfirmedDuplicateApplication(Application, error, duplicateQuery)) {
          return res.status(409).json({
            code: ALREADY_APPLIED_CODE,
            message: ALREADY_APPLIED_MESSAGE,
          });
        }
        throw error;
      }

      await notifyNewApplication(createNotificationsBulk, job, req.user.id, newApp.fullName);

      return res.status(201).json({
        message: 'Nop ho so ung tuyen thanh cong',
        application: newApp,
      });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  };
}
