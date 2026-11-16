import {
  isAllowedApplicationStatusTransition,
  isValidApplicationStatus,
} from '../../shared/applicationStatusPolicy.js';

export class ApplicationStatusLockedError extends Error {
  constructor() {
    super('Hồ sơ đã bị từ chối và không thể chuyển sang trạng thái khác.');
    this.name = 'ApplicationStatusLockedError';
    this.code = 'APPLICATION_STATUS_LOCKED';
  }
}

export class ApplicationStatusTransitionError extends Error {
  constructor(fromStatus, toStatus) {
    const fromLabel = fromStatus || 'không xác định';
    super(`Không thể chuyển trạng thái hồ sơ từ "${fromLabel}" sang "${toStatus}".`);
    this.name = 'ApplicationStatusTransitionError';
    this.code = 'INVALID_APPLICATION_STATUS_TRANSITION';
    this.fromStatus = fromStatus;
    this.toStatus = toStatus;
  }
}

function attachStatusChanged(record, changed) {
  if (record && typeof record === 'object') {
    Object.defineProperty(record, 'statusChanged', {
      value: changed,
      configurable: true,
      enumerable: false,
      writable: true,
    });
  }
  return record;
}

async function resolveCurrentApplication(model, id) {
  if (typeof model?.findById === 'function') {
    return model.findById(id);
  }
  return null;
}

export async function updateApplicationStatus(model, id, status, currentRecord = null) {
  if (!isValidApplicationStatus(status)) {
    throw new ApplicationStatusTransitionError(currentRecord?.status, status);
  }

  const observed = currentRecord || (await resolveCurrentApplication(model, id));
  if (!observed) {
    throw new ApplicationStatusLockedError();
  }

  const observedStatus = observed.status;
  if (observedStatus === 'Rejected') {
    throw new ApplicationStatusLockedError();
  }

  if (observedStatus === status) {
    if (currentRecord) {
      const latest = await resolveCurrentApplication(model, id);
      if (!latest || latest.status === 'Rejected') {
        throw new ApplicationStatusLockedError();
      }
      if (latest.status !== status) {
        throw new ApplicationStatusTransitionError(latest.status, status);
      }
      return attachStatusChanged(latest, false);
    }
    return attachStatusChanged(observed, false);
  }

  if (!isAllowedApplicationStatusTransition(observedStatus, status)) {
    throw new ApplicationStatusTransitionError(observedStatus, status);
  }

  const transitionAt = new Date();

  // Compare-and-set against the exact observed source status so concurrent mutations cannot bypass transition checks.
  const application = await model.findOneAndUpdate(
    { _id: id, status: observedStatus },
    {
      $set: { status },
      $push: { statusHistory: { status, timestamp: transitionAt } },
    },
    { returnDocument: 'after', runValidators: true },
  );

  if (application) {
    return attachStatusChanged(application, true);
  }

  const existing = await resolveCurrentApplication(model, id);
  if (!existing || existing.status === 'Rejected') {
    throw new ApplicationStatusLockedError();
  }

  if (existing.status === status && status !== 'Rejected') {
    return attachStatusChanged(existing, false);
  }

  throw new ApplicationStatusTransitionError(existing.status, status);
}

export function createCompanyApplicationsHandler({ Application, Job }) {
  return async (req, res) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ message: 'Vui long dang nhap' });
      }
      const jobs = await Job.find({ companyId: req.user.id });
      const jobIds = jobs.map((j) => j._id);

      const applications = await Application.find({ jobId: { $in: jobIds } })
        .populate('jobId', 'title company status deletedAt')
        .sort({ createdAt: -1 });

      return res.status(200).json(applications);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  };
}

export function createMyApplicationsHandler({ Application }) {
  return async (req, res) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ message: 'Vui long dang nhap' });
      }
      const applications = await Application.find({ candidateId: req.user.id })
        .populate('jobId', 'title company location type salary status expiryDate deletedAt')
        .sort({ createdAt: -1 });

      return res.status(200).json(applications);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  };
}

export function createUpdateApplicationStatusHandler({
  Application,
  Job,
  User,
  createNotification,
}) {
  return async (req, res) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ message: 'Vui long dang nhap' });
      }
      const { status } = req.body || {};
      if (!isValidApplicationStatus(status)) {
        return res.status(400).json({ message: 'Trang thai khong hop le' });
      }

      const application = await Application.findById(req.params.id);
      if (!application) {
        return res.status(404).json({ message: 'Khong tim thay ho so ung tuyen' });
      }

      const job = await Job.findById(application.jobId);
      if (!job || job.companyId.toString() !== req.user.id) {
        const requester = await User.findById(req.user.id);
        if (!requester || requester.role !== 'admin') {
          return res.status(403).json({
            message: 'Ban khong co quyen thay doi trang thai ho so nay',
          });
        }
      }

      const updatedApplication = await updateApplicationStatus(
        Application,
        application._id,
        status,
        application,
      );

      if (updatedApplication.statusChanged !== false && typeof createNotification === 'function') {
        const jobTitleMsg = job ? job.title : 'một công việc';
        await createNotification({
          recipient: application.candidateId,
          recipientRole: 'employee',
          type: 'APPLICATION_STATUS_CHANGED',
          title: 'Trạng thái hồ sơ đã thay đổi',
          message: `Hồ sơ ứng tuyển vị trí ${jobTitleMsg} của bạn đã chuyển sang trạng thái: ${status}`,
          link: '/UserDashboard',
        });
      }

      return res.status(200).json({
        message: 'Cap nhat trang thai ho so thanh cong',
        application: updatedApplication,
      });
    } catch (error) {
      if (
        error instanceof ApplicationStatusLockedError ||
        error instanceof ApplicationStatusTransitionError
      ) {
        return res.status(409).json({ code: error.code, message: error.message });
      }
      return res.status(500).json({ error: error.message });
    }
  };
}
