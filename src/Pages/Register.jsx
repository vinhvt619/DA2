import "../App.css";
import Header from "../Components/Header";
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useToastContext } from "../Components/Toast";
import { useAuth } from "../context/AuthContext.jsx";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";

function Register() {
  const navigate = useNavigate();
  const showToast = useToastContext();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "employee",
    terms: false,
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const readApiMessage = async (response) => {
    try {
      const data = await response.json();
      return data?.message || data?.error || "";
    } catch {
      return "";
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (
      !formData.username ||
      !formData.email ||
      !formData.password ||
      !formData.confirmPassword
    ) {
      setError("Vui lòng nhập đầy đủ thông tin.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }

    if (!formData.terms) {
      setError("Bạn phải đồng ý với Điều khoản sử dụng.");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password,
          role: formData.role,
        }),
      });
      if (res.ok) {
        const loginRes = await fetch("/api/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            username: formData.username,
            password: formData.password,
          }),
        });
        const loginData = await loginRes.json().catch(() => ({}));

        if (!loginRes.ok) {
          setError(
            loginData.message ||
              loginData.error ||
              "Đăng ký xong nhưng không đăng nhập tự động được.",
          );
          return;
        }

        showToast(
          "Đăng ký thành công! Chào mừng bạn đến với RabbitCV 🎉",
          "success",
        );
        if (loginData.user) login(loginData.user);
        
        if (loginData.user?.role === "company") {
          setTimeout(() => navigate("/CompanyDashboard"), 1000);
        } else {
          setTimeout(() => navigate("/MainMenu"), 1000);
        }
      } else {
        const message =
          (await readApiMessage(res)) || "Có lỗi xảy ra khi đăng ký.";
        setError(message);
      }
    } catch (err) {
      setError(err?.message || "Lỗi kết nối đến máy chủ.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-[var(--page-background)] page-transition">
      <Header />

      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center mb-4">
          <img
            alt="RabbitCV Logo"
            src="/RabbitCV.png"
            className="h-16 w-16 mb-2"
          />
          <h1 className="text-xl font-bold text-[#9346F5]">Đăng ký</h1>
        </div>

        <form className="w-full max-w-sm" onSubmit={handleSubmit}>
          <div className="bg-white p-6 rounded-3xl shadow-xl space-y-4">
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm font-medium border border-red-100 text-center">
                {error}
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1 ml-1">
                  Tên đăng nhập
                </label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  autoComplete="off"
                  className="w-full border-2 border-gray-300 px-4 py-2 rounded-xl focus:border-[#9346F5] focus:outline-none focus:ring-2 focus:ring-[#9346F5]/20"
                  placeholder="Nhập tên đăng nhập"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1 ml-1">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  autoComplete="off"
                  className="w-full border-2 border-gray-300 px-4 py-2 rounded-xl focus:border-[#9346F5] focus:outline-none focus:ring-2 focus:ring-[#9346F5]/20"
                  placeholder="example@mail.com"
                />
              </div>

              <div className="relative">
                <label className="block text-sm font-semibold text-gray-700 mb-1 ml-1">
                  Mật khẩu
                </label>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  autoComplete="new-password"
                  className="w-full rounded-xl border-2 border-gray-300 py-2 pl-4 pr-11 focus:border-[#9346F5] focus:outline-none focus:ring-2 focus:ring-[#9346F5]/20"
                  placeholder="Nhập mật khẩu"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  className="absolute bottom-2 right-3 grid h-6 w-6 place-items-center text-slate-400 hover:text-violet-600"
                  aria-label={showPassword ? "Ẩn mật khẩu" : "Hiển thị mật khẩu"}
                >
                  {showPassword ? <EyeSlashIcon className="size-5" /> : <EyeIcon className="size-5" />}
                </button>
              </div>

              <div className="relative">
                <label className="block text-sm font-semibold text-gray-700 mb-1 ml-1">
                  Xác nhận mật khẩu
                </label>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  autoComplete="new-password"
                  className="w-full rounded-xl border-2 border-gray-300 py-2 pl-4 pr-11 focus:border-[#9346F5] focus:outline-none focus:ring-2 focus:ring-[#9346F5]/20"
                  placeholder="Nhập lại mật khẩu"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((visible) => !visible)}
                  className="absolute bottom-2 right-3 grid h-6 w-6 place-items-center text-slate-400 hover:text-violet-600"
                  aria-label={showConfirmPassword ? "Ẩn mật khẩu xác nhận" : "Hiển thị mật khẩu xác nhận"}
                >
                  {showConfirmPassword ? <EyeSlashIcon className="size-5" /> : <EyeIcon className="size-5" />}
                </button>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 ml-1">
                  Bạn là
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData(p => ({ ...p, role: 'employee' }))}
                    className={`py-2.5 px-4 rounded-xl border-2 text-sm font-bold transition-all cursor-pointer ${
                      formData.role === 'employee'
                        ? 'border-[#9346F5] bg-purple-50 text-[#9346F5] shadow-xs'
                        : 'border-gray-200 text-gray-500 hover:border-gray-300'
                    }`}
                  >
                    Ứng viên
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData(p => ({ ...p, role: 'company' }))}
                    className={`py-2.5 px-4 rounded-xl border-2 text-sm font-bold transition-all cursor-pointer ${
                      formData.role === 'company'
                        ? 'border-[#9346F5] bg-purple-50 text-[#9346F5] shadow-xs'
                        : 'border-gray-200 text-gray-500 hover:border-gray-300'
                    }`}
                  >
                    Doanh nghiệp
                  </button>
                </div>
              </div>

              <div className="flex items-start mt-2">
                <div className="flex items-center h-5 mt-1">
                  <input
                    id="terms"
                    name="terms"
                    type="checkbox"
                    checked={formData.terms}
                    onChange={handleChange}
                    className="w-4 h-4 text-[#9346F5] border-gray-300 rounded focus:ring-[#9346F5] cursor-pointer"
                  />
                </div>
                <label
                  htmlFor="terms"
                  className="ml-3 text-xs text-gray-600 leading-tight"
                >
                  Tôi đồng ý với các{" "}
                  <span className="text-[#9346F5] font-semibold hover:underline cursor-pointer">
                    Điều khoản sử dụng
                  </span>{" "}
                  và Chính sách bảo mật của RabbitCV.
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full text-white font-bold py-2.5 px-4 rounded-xl shadow-md 
                ${loading ? "bg-gray-400 cursor-not-allowed" : "bg-linear-to-r from-[#9346F5] to-[#7c38c9] hover:shadow-xl cursor-pointer"}`}
            >
              {loading ? "Đang xử lý..." : "Đăng ký tài khoản"}
            </button>

            <div className="text-center">
              <p className="text-xs text-gray-600">
                Đã có tài khoản?{" "}
                <Link
                  to="/login"
                  className="text-[#9346F5] hover:text-[#7c38c9] font-semibold"
                >
                  Đăng nhập ngay
                </Link>
              </p>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Register;
