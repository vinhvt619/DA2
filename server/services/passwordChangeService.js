import { forgotPasswordSchema, passwordUpdateSchema } from '../../shared/passwordUpdateSchema.js';

// Contact must belong to the authenticated account; it is not ownership proof.
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

async function savePassword(user, newPassword, res, { UserModel, comparePassword, hashPassword }) {
  if (await comparePassword(newPassword, user.password)) return res.status(400).json({ message: 'Mật khẩu mới phải khác mật khẩu hiện tại.' });
  const password = await hashPassword(newPassword, 10);
  // Reject concurrent changes to the password, contact or account availability.
  const updated = await UserModel.findOneAndUpdate(
    { _id: user._id, ...(user.username ? { username: user.username } : {}), password: user.password, email: user.email, phoneNumber: user.phoneNumber, isBanned: { $ne: true }, deletedAt: null },
    { $set: { password } }, { returnDocument: 'after', runValidators: true },
  ).select('_id');
  if (!updated) return res.status(409).json({ message: 'Tài khoản vừa thay đổi. Vui lòng kiểm tra lại thông tin và thử lại.' });
  return res.status(200).json({ message: 'Đổi mật khẩu thành công.' });
}

export function createPasswordChangeHandler(dependencies) {
  const { UserModel } = dependencies;
  return async (req, res) => {
    if (!req.user?.id) return res.status(401).json({ message: 'Vui lòng đăng nhập để đổi mật khẩu.' });
    if (!req.user?.id) return res.status(401).json({ message: 'Vui lòng đăng nhập để đổi mật khẩu.' });
    const parsed = passwordUpdateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.issues[0].message });
    const { newPassword, contact } = parsed.data;
    try {
      const user = await UserModel.findById(req.user.id).select("+password email phoneNumber isBanned deletedAt");
      if (!user || user.isBanned || user.deletedAt) {
        return res.status(401).json({ message: "Tài khoản không còn khả dụng. Vui lòng đăng nhập lại." });
      }
      if (!matchesAccountContact(contact, user)) {
        return res.status(400).json({ message: "Email hoặc số điện thoại không khớp với tài khoản của bạn." });
      }
      return await savePassword(user, newPassword, res, dependencies);
    } catch {
      return res.status(503).json({ message: "Không thể cập nhật mật khẩu lúc này. Vui lòng thử lại sau." });
    }
  };
}

export function isDemoPasswordResetEnabled(env = process.env) {
  if (env.ALLOW_DEMO_PASSWORD_RESET !== undefined) return env.ALLOW_DEMO_PASSWORD_RESET === 'true';
  return env.NODE_ENV !== 'production';
}

function contactQuery(contact) {
  const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  if (contact.includes('@')) return { email: new RegExp(`^${escapeRegex(normalizeEmail(contact))}$`, 'i') };
  const phone = normalizePhone(contact);
  if (!phone) return null;
  const forms = [phone];
  if (/^0\d{9,10}$/.test(phone)) forms.push(`+84${phone.slice(1)}`);
  const patterns = forms.map((value) => [...value].map(escapeRegex).join('[\\s().-]*'));
  return { phoneNumber: new RegExp(`^\\s*(?:${patterns.join('|')})\\s*$`) };
}

export function createDemoPasswordResetHandler({ enabled = false, ...dependencies }) {
  return async (req, res) => {
    if (!enabled) return res.status(403).json({ message: 'Đổi mật khẩu trực tiếp chỉ được bật cho môi trường demo.' });
    const parsed = forgotPasswordSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.issues[0].message });
    const { username, contact, newPassword } = parsed.data;
    const query = { ...contactQuery(contact), username };
    try {
      const users = await dependencies.UserModel.find(query).select('+password username email phoneNumber isBanned deletedAt').limit(2);
      if (users.length > 1) return res.status(400).json({ message: 'Tên đăng nhập hoặc email không khớp với tài khoản khả dụng.' });
      const user = users[0];
      if (!user || user.isBanned || user.deletedAt || user.username !== username || !matchesAccountContact(contact, user)) return res.status(400).json({ message: 'Tên đăng nhập hoặc email không khớp với tài khoản khả dụng.' });
      return await savePassword(user, newPassword, res, dependencies);
    } catch {
      return res.status(503).json({ message: 'Không thể cập nhật mật khẩu lúc này. Vui lòng thử lại sau.' });
    }
  };
}
