import "../App.css";
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import HeaderNoUser from "../Components/HeaderNoUser";
import { useToastContext } from "../Components/Toast";
import { EyeSlashIcon } from "@heroicons/react/24/outline";

function Login() {
  const navigate = useNavigate();
  const showToast = useToastContext();
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    rememberMe: false,
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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

    if (!formData.username || !formData.password) {
      setError("Vui lòng nhập tên đăng nhập và mật khẩu.");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          username: formData.username,
          password: formData.password,
          rememberMe: formData.rememberMe,
        }),
      });
      const data = await res.json();

      if (res.ok) {
        showToast("Đăng nhập thành công!", "success");
        if (data.user?.role === "admin") {
          setTimeout(() => navigate("/AdminDashboard"), 800);
        } else if (data.user?.role === "company") {
          setTimeout(() => navigate("/CompanyDashboard"), 800);
        } else {
          setTimeout(() => navigate("/WelcomePageCustomer"), 800);
        }
      } else {
        setError(data.message || "Tài khoản hoặc mật khẩu không chính xác.");
      }
    } catch {
      setError("Lỗi kết nối đến máy chủ.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-linear-to-br from-[#F8F4FC] to-[#E8DCFA] flex flex-col">
      <HeaderNoUser />

      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="flex flex-col items-center mb-6">
          <img
            alt="RabbitCV Logo"
            src="/RabbitCV.png"
            className="h-16 w-16 mb-3"
          />
          <h1 className="text-2xl font-bold text-[#9346F5]">Đăng nhập</h1>
        </div>

        <form className="w-full max-w-sm" onSubmit={handleSubmit}>
          <div className="bg-white p-6 rounded-3xl shadow-xl space-y-4">
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm font-medium border border-red-100 text-center">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Tên đăng nhập
                </label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className="w-full border-2 border-gray-300 px-3 py-2.5 rounded-xl focus:border-[#9346F5]"
                  placeholder="Nhập tên đăng nhập"
                />
              </div>

              <div className="relative">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Mật khẩu
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full border-2 border-gray-300 px-3 py-2.5 rounded-xl focus:border-[#9346F5]"
                  placeholder="Nhập mật khẩu"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="remember"
                    name="rememberMe"
                    checked={formData.rememberMe}
                    onChange={handleChange}
                    className="w-4 h-4 text-[#9346F5] border-gray-300 rounded focus:ring-[#9346F5] cursor-pointer"
                  />
                  <label
                    htmlFor="remember"
                    className="ml-2 text-sm text-gray-700 cursor-pointer"
                  >
                    Ghi nhớ đăng nhập
                  </label>
                </div>
                <a
                  href="#"
                  className="text-sm text-[#9346F5] hover:text-[#7c38c9] font-semibold"
                >
                  Quên mật khẩu?
                </a>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full text-white font-bold py-3 rounded-xl shadow-md mt-4 
                ${loading ? "bg-gray-400 cursor-not-allowed" : "bg-linear-to-r from-[#9346F5] to-[#7c38c9] hover:shadow-xl cursor-pointer]"}`}
            >
              {loading ? "Đang xử lý..." : "Đăng nhập"}
            </button>

            <div className="text-center mt-4">
              <p className="text-sm text-gray-600">
                Chưa có tài khoản?{" "}
                <Link
                  to="/register"
                  className="text-[#9346F5] hover:text-[#7c38c9] font-semibold"
                >
                  Đăng ký ngay
                </Link>
              </p>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Login;
