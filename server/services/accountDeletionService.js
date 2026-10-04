// Keep ownership references and application snapshots; remove all public jobs atomically.
export function deactivateAccount({ connection, UserModel, JobModel }, id) {
  return connection.transaction(async (session) => {
    const deletedAt = new Date();
    const user = await UserModel.findOneAndUpdate({ _id: id, deletedAt: null }, { $set: { isBanned: true, deletedAt } }, { session, returnDocument: 'after' });
    if (user?.role === 'company') await JobModel.updateMany({ companyId: user._id }, { $set: { status: 'Deleted', deletedAt, isAdminHidden: true } }, { session });
    return user;
  });
}
