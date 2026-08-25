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

const loginSchema = z.object({
  username: z.string().trim().min(1, "Vui lòng nhập tên đăng nhập."),
  password: z.string().min(1, "Vui lòng nhập mật khẩu."),
  rememberMe: z.boolean(),
});

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      username: "",
      password: "",
      rememberMe: false,
    },
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (values) => {
    try {
      const data = await fetchJson("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (data.user) login(data.user);
      showToast("Đăng nhập thành công!", "success");

      const destination =
        data.user?.role === "admin"
          ? "/admin"
          : data.user?.role === "company"
            ? "/CompanyDashboard"
            : "/MainMenu";
      navigate(destination, { replace: true });
    } catch (error) {
      setError("root.server", {
        message: error.message || "Tài khoản hoặc mật khẩu không chính xác.",
      });
    }
  };

  const serverError = errors.root?.server?.message;

  return (
    <div className="flex min-h-screen w-full flex-col bg-[var(--page-background)] page-transition">
      <Header />

      <div className="flex flex-1 flex-col items-center justify-center px-4 py-8">
        <div className="mb-6 flex flex-col items-center">
          <img alt="RabbitCV Logo" src="/RabbitCV.png" className="mb-3 h-16 w-16" />
          <h1 className="text-2xl font-bold text-[#9346F5]">Đăng nhập</h1>
        </div>

        <form className="w-full max-w-sm" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="space-y-4 rounded-3xl bg-white p-6 shadow-xl">
            {serverError && (
              <div role="alert" className="rounded-xl border border-red-100 bg-red-50 p-3 text-center text-sm font-medium text-red-600">
                {serverError}
              </div>
            )}

            <div>
              <label htmlFor="login-username" className="mb-2 block text-sm font-semibold text-gray-700">
                Tên đăng nhập
              </label>
              <input
                id="login-username"
                type="text"
                autoComplete="username"
                aria-invalid={Boolean(errors.username)}
                {...register("username")}
                className="w-full rounded-xl border-2 border-gray-300 px-3 py-2.5 focus:border-[#9346F5] focus:outline-none"
                placeholder="Nhập tên đăng nhập"
              />
              {errors.username && <p className="mt-1 text-xs text-red-600">{errors.username.message}</p>}
            </div>

            <div className="relative">
              <label htmlFor="login-password" className="mb-2 block text-sm font-semibold text-gray-700">
                Mật khẩu
              </label>
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                aria-invalid={Boolean(errors.password)}
                {...register("password")}
                className="w-full rounded-xl border-2 border-gray-300 py-2.5 pl-3 pr-11 focus:border-[#9346F5] focus:outline-none"
                placeholder="Nhập mật khẩu"
              />
              <button
                type="button"
                onClick={() => setShowPassword((visible) => !visible)}
                className="absolute bottom-2.5 right-3 grid h-6 w-6 place-items-center text-slate-400 hover:text-violet-600"
                aria-label={showPassword ? "Ẩn mật khẩu" : "Hiển thị mật khẩu"}
              >
                {showPassword ? <EyeSlashIcon className="size-5" /> : <EyeIcon className="size-5" />}
              </button>
              {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>}
            </div>

            <label className="flex cursor-pointer items-center text-sm text-gray-700">
              <input
                type="checkbox"
                {...register("rememberMe")}
                className="h-4 w-4 cursor-pointer rounded border-gray-300 text-[#9346F5] focus:ring-[#9346F5]"
              />
              <span className="ml-2">Ghi nhớ đăng nhập</span>
            </label>

            <button
              type="submit"
              disabled={isSubmitting}
              className={`mt-4 w-full rounded-xl py-3 font-bold text-white shadow-md ${
                isSubmitting
                  ? "cursor-not-allowed bg-gray-400"
                  : "cursor-pointer bg-linear-to-r from-[#9346F5] to-[#7c38c9] hover:shadow-xl"
              }`}
            >
              {isSubmitting ? "Đang xử lý..." : "Đăng nhập"}
            </button>

            <p className="mt-4 text-center text-sm text-gray-600">
              Chưa có tài khoản?{" "}
              <Link to="/register" className="font-semibold text-[#9346F5] hover:text-[#7c38c9]">
                Đăng ký ngay
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Login;
