import "../App.css";
import { zodResolver } from "@hookform/resolvers/zod";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import Header from "../Components/Header";
import { useAuth } from "../context/AuthContext.jsx";
import { fetchJson } from "../utils/http.js";
import { showToast } from "../utils/toast.js";

const registerSchema = z
  .object({
    username: z.string().trim().min(1, "Vui lòng nhập tên đăng nhập."),
    email: z.string().trim().email("Email không hợp lệ."),
    password: z.string().min(1, "Vui lòng nhập mật khẩu."),
    confirmPassword: z.string().min(1, "Vui lòng nhập lại mật khẩu."),
    role: z.enum(["employee", "company"]),
    fullName: z.string().trim().max(200).optional(),
    companyTaxCode: z.string().trim().max(50).optional(),
    terms: z.boolean().refine(Boolean, "Bạn phải đồng ý với Điều khoản sử dụng."),
  })
  .refine((data) => data.role !== 'company' || Boolean(data.fullName?.trim()), { message: 'Vui lòng nhập tên doanh nghiệp.', path: ['fullName'] })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp.",
    path: ["confirmPassword"],
  });

function FieldError({ error }) {
  return error ? <p className="mt-1 text-xs text-red-600">{error.message}</p> : null;
}

function Register() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const {
    register,
    handleSubmit,
    setError,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
      role: "employee",
      fullName: '',
      companyTaxCode: '',
      terms: false,
    },
    resolver: zodResolver(registerSchema),
  });
  const selectedRole = watch("role");

  const onSubmit = async ({ confirmPassword, terms, ...values }) => {
    void confirmPassword;
    void terms;
    try {
      await fetchJson("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const loginData = await fetchJson("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: values.username,
          password: values.password,
        }),
      });

      if (loginData.user) login(loginData.user);
      showToast(values.role === 'company' ? 'Đăng ký thành công. Tài khoản doanh nghiệp đang chờ admin duyệt.' : 'Đăng ký thành công! Chào mừng bạn đến với RabbitCV.', 'success');
      navigate(
        loginData.user?.role === "company" ? "/CompanyDashboard" : "/MainMenu",
        { replace: true },
      );
    } catch (error) {
      setError("root.server", {
        message: error.message || "Có lỗi xảy ra khi đăng ký.",
      });
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-[var(--page-background)] page-transition">
      <Header />

      <div className="flex flex-1 flex-col items-center justify-center p-4">
        <div className="mb-4 flex flex-col items-center">
          <img alt="RabbitCV Logo" src="/RabbitCV.png" className="mb-2 h-16 w-16" />
          <h1 className="text-xl font-bold text-[#9346F5]">Đăng ký</h1>
        </div>

        <form className="w-full max-w-sm" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="space-y-4 rounded-3xl bg-white p-6 shadow-xl">
            {errors.root?.server && (
              <div role="alert" className="rounded-xl border border-red-100 bg-red-50 p-3 text-center text-sm font-medium text-red-600">
                {errors.root.server.message}
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label htmlFor="register-username" className="mb-1 ml-1 block text-sm font-semibold text-gray-700">
                  Tên đăng nhập
                </label>
                <input
                  id="register-username"
                  type="text"
                  autoComplete="username"
                  aria-invalid={Boolean(errors.username)}
                  {...register("username")}
                  className="w-full rounded-xl border-2 border-gray-300 px-4 py-2 focus:border-[#9346F5] focus:outline-none focus:ring-2 focus:ring-[#9346F5]/20"
                  placeholder="Nhập tên đăng nhập"
                />
                <FieldError error={errors.username} />
              </div>

              <div>
                <label htmlFor="register-email" className="mb-1 ml-1 block text-sm font-semibold text-gray-700">
                  Email
                </label>
                <input
                  id="register-email"
                  type="email"
                  autoComplete="email"
                  aria-invalid={Boolean(errors.email)}
                  {...register("email")}
                  className="w-full rounded-xl border-2 border-gray-300 px-4 py-2 focus:border-[#9346F5] focus:outline-none focus:ring-2 focus:ring-[#9346F5]/20"
                  placeholder="example@mail.com"
                />
                <FieldError error={errors.email} />
              </div>

              <div className="relative">
                <label htmlFor="register-password" className="mb-1 ml-1 block text-sm font-semibold text-gray-700">
                  Mật khẩu
                </label>
                <input
                  id="register-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  aria-invalid={Boolean(errors.password)}
                  {...register("password")}
                  className="w-full rounded-xl border-2 border-gray-300 py-2 pl-4 pr-11 focus:border-[#9346F5] focus:outline-none focus:ring-2 focus:ring-[#9346F5]/20"
                  placeholder="Nhập mật khẩu"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  className="absolute right-3 top-7 grid h-6 w-6 place-items-center text-slate-400 hover:text-violet-600"
                  aria-label={showPassword ? "Ẩn mật khẩu" : "Hiển thị mật khẩu"}
                >
                  {showPassword ? <EyeSlashIcon className="size-5" /> : <EyeIcon className="size-5" />}
                </button>
                <FieldError error={errors.password} />
              </div>

              <div className="relative">
                <label htmlFor="register-confirm-password" className="mb-1 ml-1 block text-sm font-semibold text-gray-700">
                  Xác nhận mật khẩu
                </label>
                <input
                  id="register-confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  aria-invalid={Boolean(errors.confirmPassword)}
                  {...register("confirmPassword")}
                  className="w-full rounded-xl border-2 border-gray-300 py-2 pl-4 pr-11 focus:border-[#9346F5] focus:outline-none focus:ring-2 focus:ring-[#9346F5]/20"
                  placeholder="Nhập lại mật khẩu"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((visible) => !visible)}
                  className="absolute right-3 top-7 grid h-6 w-6 place-items-center text-slate-400 hover:text-violet-600"
                  aria-label={showConfirmPassword ? "Ẩn mật khẩu xác nhận" : "Hiển thị mật khẩu xác nhận"}
                >
                  {showConfirmPassword ? <EyeSlashIcon className="size-5" /> : <EyeIcon className="size-5" />}
                </button>
                <FieldError error={errors.confirmPassword} />
              </div>

              <fieldset>
                <legend className="mb-2 ml-1 block text-sm font-semibold text-gray-700">Bạn là</legend>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    ["employee", "Ứng viên"],
                    ["company", "Doanh nghiệp"],
                  ].map(([role, label]) => (
                    <button
                      key={role}
                      type="button"
                      aria-pressed={selectedRole === role}
                      onClick={() => setValue("role", role, { shouldDirty: true, shouldValidate: true })}
                      className={`cursor-pointer rounded-xl border-2 px-4 py-2.5 text-sm font-bold transition-all ${
                        selectedRole === role
                          ? "border-[#9346F5] bg-purple-50 text-[#9346F5] shadow-xs"
                          : "border-gray-200 text-gray-500 hover:border-gray-300"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </fieldset>

              {selectedRole === 'company' && <div className="space-y-3">
                <p className="rounded-lg bg-amber-50 p-3 text-xs text-amber-800">Tài khoản cần được admin duyệt trước khi gửi tin. Doanh nghiệp được xác minh có thể đăng tin ngay.</p>
                <label className="block space-y-1 text-sm"><span>Tên doanh nghiệp *</span><input {...register('fullName')} aria-invalid={Boolean(errors.fullName)} className="w-full rounded-xl border-2 border-gray-300 px-4 py-2 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-100" /></label>
                <FieldError error={errors.fullName} />
                <label className="block space-y-1 text-sm"><span>Mã số thuế (nếu có)</span><input {...register('companyTaxCode')} className="w-full rounded-xl border-2 border-gray-300 px-4 py-2 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-100" /></label>
              </div>}

              <div>
                <label className="mt-2 flex items-start text-xs leading-tight text-gray-600">
                  <input
                    type="checkbox"
                    {...register("terms")}
                    className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded border-gray-300 text-[#9346F5] focus:ring-[#9346F5]"
                  />
                  <span className="ml-3">
                    Tôi đồng ý với Điều khoản sử dụng và Chính sách bảo mật của RabbitCV.
                  </span>
                </label>
                <FieldError error={errors.terms} />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full rounded-xl px-4 py-2.5 font-bold text-white shadow-md ${
                isSubmitting
                  ? "cursor-not-allowed bg-gray-400"
                  : "cursor-pointer bg-linear-to-r from-[#9346F5] to-[#7c38c9] hover:shadow-xl"
              }`}
            >
              {isSubmitting ? "Đang xử lý..." : "Đăng ký tài khoản"}
            </button>

            <p className="text-center text-xs font-semibold text-violet-700"><Link to="/forgot-password" className="hover:underline">Quên mật khẩu?</Link></p>
            <p className="text-center text-xs text-gray-600">
              Đã có tài khoản?{" "}
              <Link to="/login" className="font-semibold text-[#9346F5] hover:text-[#7c38c9]">
                Đăng nhập ngay
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Register;
