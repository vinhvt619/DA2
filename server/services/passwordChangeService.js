// This is an additional account-data check, not proof of email/phone ownership.
// A signed-in session and the correct current password remain mandatory.
const normalizeEmail = (value) => typeof value === "string" ? value.trim().toLowerCase() : "";

function normalizePhone(value) {
  if (typeof value !== "string" || !/^[+\d\s().-]+$/.test(value)) return "";
  let phone = value.replace(/[\s().-]/g, "");
  if (/^\+84\d{9,10}$/.test(phone)) phone = `0${phone.slice(3)}`;
  return /^\+?\d{7,15}$/.test(phone) ? phone : "";
}

export function matchesAccountContact(contact, user) {
  if (typeof contact !== "string" || !contact.trim() || contact.length > 254) return false;
  if (contact.includes("@")) {
    const email = normalizeEmail(contact);
    return Boolean(email && email === normalizeEmail(user.email));
  }
  const phone = normalizePhone(contact);
  return Boolean(phone && phone === normalizePhone(user.phoneNumber));
}

export function createPasswordChangeHandler({ UserModel, comparePassword, hashPassword }) {
  return async (req, res) => {
    const { oldPassword, newPassword, contact } = req.body || {};
    if (typeof oldPassword !== "string" || !oldPassword ||
        typeof newPassword !== "string" || newPassword.length < 8 ||
        Buffer.byteLength(newPassword, "utf8") > 72 ||
        typeof contact !== "string" || !contact.trim() || contact.length > 254) {
      return res.status(400).json({ message: "Nhập email/số điện thoại, mật khẩu hiện tại và mật khẩu mới từ 8 ký tự (tối đa 72 byte)." });
    }
    try {
      const user = await UserModel.findById(req.user.id).select("+password email phoneNumber isBanned deletedAt");
      if (!user || user.isBanned || user.deletedAt) {
        return res.status(401).json({ message: "Tài khoản không còn khả dụng. Vui lòng đăng nhập lại." });
      }
      if (!matchesAccountContact(contact, user)) {
        return res.status(400).json({ message: "Email hoặc số điện thoại không khớp với tài khoản của bạn." });
      }
      if (!await comparePassword(oldPassword, user.password)) {
        return res.status(400).json({ message: "Mật khẩu hiện tại không chính xác." });
      }
      if (await comparePassword(newPassword, user.password)) {
        return res.status(400).json({ message: "Mật khẩu mới phải khác mật khẩu hiện tại." });
      }
      const password = await hashPassword(newPassword, 10);
      // Do not overwrite a password changed by another concurrent request.
      const updated = await UserModel.findOneAndUpdate(
        { _id: user._id, password: user.password, email: user.email, phoneNumber: user.phoneNumber,
          isBanned: { $ne: true }, deletedAt: null },
        { $set: { password } },
        { returnDocument: "after", runValidators: true },
      ).select("_id");
      if (!updated) {
        return res.status(409).json({ message: "Tài khoản vừa thay đổi. Vui lòng kiểm tra lại thông tin và thử lại." });
      }
      return res.status(200).json({ message: "Đổi mật khẩu thành công." });
    } catch {
      return res.status(503).json({ message: "Không thể cập nhật mật khẩu lúc này. Vui lòng thử lại sau." });
    }
  };
}
