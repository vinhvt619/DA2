export class ApplicationStatusLockedError extends Error {
  constructor() {
    super("Hồ sơ đã bị từ chối và không thể chuyển sang trạng thái khác.");
    this.name = "ApplicationStatusLockedError";
    this.code = "APPLICATION_STATUS_LOCKED";
  }
}

export async function updateApplicationStatus(model, id, status) {
  // Include the terminal-state check in the write so concurrent requests cannot reopen a rejection.
  const application = await model.findOneAndUpdate(
    { _id: id, status: { $ne: "Rejected" } },
    { $set: { status } },
    { returnDocument: 'after', runValidators: true },
  );
  if (!application) throw new ApplicationStatusLockedError();
  return application;
}
