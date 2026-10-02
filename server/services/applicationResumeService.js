import Resume from '../models/Resume.js';

const resumeFields = Object.keys(Resume.schema.obj).filter((field) => field !== 'userId');

export function captureApplicationResume(resume, origin = 'submitted') {
  const source = resume.toObject ? resume.toObject() : resume;
  const content = Object.fromEntries(resumeFields.filter((field) => source[field] !== undefined)
    .map((field) => [field, source[field]]));
  return {
    resumeSnapshot: JSON.parse(JSON.stringify(content)),
    resumeSnapshotCapturedAt: new Date(),
    resumeSnapshotOrigin: origin,
  };
}

export async function freezeLegacyResumeApplications(Application, resume) {
  // Preserve the last available version before its owner changes or deletes it.
  return Application.updateMany(
    { resumeId: resume._id, resumeSnapshot: null },
    { $set: captureApplicationResume(resume, 'legacy') },
    { runValidators: true, timestamps: false },
  );
}

export async function ensureApplicationResumeSnapshot(Application, ResumeModel, application) {
  if (application.resumeSnapshot) return application;
  const resume = await ResumeModel.findById(application.resumeId);
  if (!resume) return null;
  const captured = await Application.findOneAndUpdate(
    { _id: application._id, resumeSnapshot: null },
    { $set: captureApplicationResume(resume, 'legacy') },
    { returnDocument: 'after', runValidators: true, timestamps: false },
  ).select('+resumeSnapshot');
  return captured || Application.findById(application._id).select('+resumeSnapshot');
}

export function applicationResumeData(application) {
  const snapshot = application.resumeSnapshot;
  return {
    ...(snapshot.toObject ? snapshot.toObject() : snapshot),
    _id: application.resumeId,
    userId: application.candidateId,
    applicationId: application._id,
    submittedAt: application.createdAt,
    resumeSnapshotCapturedAt: application.resumeSnapshotCapturedAt,
    resumeSnapshotOrigin: application.resumeSnapshotOrigin,
  };
}

export function createApplicationResumeHandler({ Application, Resume: ResumeModel, Job, sanitizeResumeData }) {
  return async (req, res) => {
    try {
      let application = await Application.findById(req.params.id).select('+resumeSnapshot');
      if (!application) return res.status(404).json({ message: 'Không tìm thấy hồ sơ ứng tuyển.' });
      const isCandidate = String(application.candidateId) === String(req.user.id);
      let isHiringCompany = false;
      if (req.user.role === 'company') {
        isHiringCompany = Boolean(await Job.exists({ _id: application.jobId, companyId: req.user.id }));
      }
      if (!isCandidate && req.user.role !== 'admin' && !isHiringCompany) {
        return res.status(403).json({ message: 'Bạn không có quyền xem CV đã nộp này.' });
      }
      application = await ensureApplicationResumeSnapshot(Application, ResumeModel, application);
      if (!application?.resumeSnapshot) {
        return res.status(410).json({ message: 'Hồ sơ cũ chưa lưu bản CV và CV gốc không còn tồn tại.' });
      }
      return res.status(200).json(sanitizeResumeData(applicationResumeData(application)));
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  };
}
