import { z } from 'zod';

const passwordFields = {
  newPassword: z.string().min(8, 'Mật khẩu mới phải có ít nhất 8 ký tự.').refine((value) => new TextEncoder().encode(value).length <= 72, 'Mật khẩu mới không được vượt quá 72 byte.'),
  confirmPassword: z.string().min(1, 'Vui lòng xác nhận mật khẩu mới.'),
};
const requireMatchingPasswords = (schema) => schema.refine((value) => value.newPassword === value.confirmPassword, { message: 'Mật khẩu mới không khớp.', path: ['confirmPassword'] });

export const passwordUpdateSchema = requireMatchingPasswords(z.object({
  contact: z.string().trim().min(1, 'Vui lòng nhập email hoặc số điện thoại của tài khoản.').max(254, 'Email hoặc số điện thoại quá dài.'),
  ...passwordFields,
}));

export const forgotPasswordSchema = requireMatchingPasswords(z.object({
  username: z.string().trim().min(1, 'Vui lòng nhập tên đăng nhập.').max(254, 'Tên đăng nhập quá dài.'),
  contact: z.string().trim().min(1, 'Vui lòng nhập email của tài khoản.').email('Email không hợp lệ.').max(254, 'Email quá dài.'),
  ...passwordFields,
}));
