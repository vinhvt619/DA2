export function createAccountAuthMiddleware({ verifyToken, UserModel, ensureConnected }) {
  return async (req, res, next) => {
    const token = req.cookies?.token;
    if (!token) return res.status(401).json({ message: 'Vui lòng đăng nhập.' });
    try { req.user = verifyToken(token); }
    catch { return res.status(401).json({ message: 'Phiên đăng nhập hết hạn.' }); }
    try {
      await ensureConnected();
      const account = await UserModel.findById(req.user.id).select('role isBanned deletedAt');
      if (!account || account.isBanned || account.deletedAt) return res.status(401).json({ message: 'Tài khoản đã bị khóa hoặc xóa.' });
      req.user.role = account.role;
      return next();
    } catch { return res.status(503).json({ message: 'Không thể kiểm tra phiên đăng nhập lúc này.' }); }
  };
}
