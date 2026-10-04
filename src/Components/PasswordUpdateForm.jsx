import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { forgotPasswordSchema, passwordUpdateSchema } from '../../shared/passwordUpdateSchema.js';
import InputPassword from './InputPassword.jsx';
import { fetchJson } from '../utils/http.js';
import { showToast } from '../utils/toast.js';

export default function PasswordUpdateForm({ endpoint = '/api/user/password', label = 'Thay đổi mật khẩu', submitLabel = 'Cập nhật mật khẩu', onSuccess }) {
  const isPasswordReset = endpoint === '/api/forgot-password';
  const [visible, setVisible] = useState({ newPassword: false, confirmPassword: false });
  const { register, control, handleSubmit, reset, setError, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(isPasswordReset ? forgotPasswordSchema : passwordUpdateSchema), defaultValues: { ...(isPasswordReset ? { username: '' } : {}), contact: '', newPassword: '', confirmPassword: '' },
  });
  const submit = async (values) => {
    try {
      const data = await fetchJson(endpoint, { method: endpoint === '/api/user/password' ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(values) });
      reset(); setVisible({ newPassword: false, confirmPassword: false });
      showToast(data.message || 'Đổi mật khẩu thành công.', 'success');
      onSuccess?.();
    } catch (error) { setError('root.server', { message: error.message || 'Không thể cập nhật mật khẩu.' }); }
  };
  return <form aria-label={label} onSubmit={handleSubmit(submit)} noValidate>
    {errors.root?.server && <p role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{errors.root.server.message}</p>}
    <fieldset disabled={isSubmitting} className="grid min-w-0 gap-4 sm:grid-cols-2">
      {isPasswordReset && <div className="sm:col-span-2">
        <label htmlFor="password-username" className="mb-1.5 block text-xs font-semibold text-slate-700">Tên đăng nhập</label>
        <input id="password-username" type="text" maxLength={254} autoComplete="username" {...register('username')} aria-invalid={Boolean(errors.username)} aria-describedby={errors.username ? 'password-username-error' : undefined} placeholder="Nhập tên đăng nhập của tài khoản" className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:ring-2 focus:ring-violet-100" />
        {errors.username && <p id="password-username-error" className="mt-1.5 text-xs text-red-600">{errors.username.message}</p>}
      </div>}
      <div className="sm:col-span-2">
        <label htmlFor="password-contact" className="mb-1.5 block text-xs font-semibold text-slate-700">{isPasswordReset ? 'Email của tài khoản' : 'Email hoặc số điện thoại xác nhận'}</label>
        <input id="password-contact" type={isPasswordReset ? 'email' : 'text'} maxLength={254} autoComplete={isPasswordReset ? 'email' : 'username'} {...register('contact')} aria-invalid={Boolean(errors.contact)} aria-describedby={errors.contact ? 'password-contact-error' : undefined} placeholder={isPasswordReset ? 'Nhập email đã đăng ký với tài khoản trên' : 'Nhập email hoặc số điện thoại của tài khoản'} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:ring-2 focus:ring-violet-100" />
        {errors.contact && <p id="password-contact-error" className="mt-1.5 text-xs text-red-600">{errors.contact.message}</p>}
      </div>
      {[['newPassword', 'Mật khẩu mới'], ['confirmPassword', 'Xác nhận mật khẩu mới']].map(([name, title]) => <div key={name} className="min-w-0">
        <label htmlFor={name} className="mb-1.5 block text-xs font-semibold text-slate-700">{title}</label>
        <Controller name={name} control={control} render={({ field }) => <InputPassword id={name} name={name} inputRef={field.ref} value={field.value} onChange={field.onChange} onBlur={field.onBlur} show={visible[name]} onToggle={() => setVisible((old) => ({ ...old, [name]: !old[name] }))} placeholder={title} invalid={Boolean(errors[name])} describedBy={errors[name] ? `${name}-error` : undefined} />} />
        {errors[name] && <p id={`${name}-error`} className="mt-1.5 text-xs text-red-600">{errors[name].message}</p>}
      </div>)}
    </fieldset>
    <button type="submit" disabled={isSubmitting} className="mt-5 inline-flex min-h-10 items-center justify-center rounded-lg bg-violet-600 px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-violet-700 focus-visible:ring-2 focus-visible:ring-violet-500 disabled:cursor-not-allowed disabled:bg-slate-300">{isSubmitting ? 'Đang cập nhật...' : submitLabel}</button>
  </form>;
}
