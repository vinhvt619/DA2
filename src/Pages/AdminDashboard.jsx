import React, { useState, useEffect } from "react";
import {
  UsersIcon,
  BriefcaseIcon,
  ChartBarIcon,
  FlagIcon,
  ArrowRightStartOnRectangleIcon,
  DocumentMagnifyingGlassIcon,
  BellIcon,
} from "@heroicons/react/24/outline";
import { Link, useNavigate } from "react-router-dom";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCompanies: 0,
    totalEmployees: 0,
    totalJobs: 0,
    totalApplications: 0,
  });
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdminStats = async () => {
      try {
        const res = await fetch("/api/admin/stats", { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          setStats(data.stats);
          setUsers(data.users);
        }
      } catch (error) {
        console.error("Loi lay thong ke admin:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAdminStats();
  }, []);

  return (
    <div className="bg-linear-to-br from-[#F8F4FC] to-[#E8DCFA] min-h-screen font-sans text-gray-900 flex overflow-hidden">
      <aside className="w-[280px] bg-white border-r border-gray-100 flex flex-col justify-between py-8 shrink-0 relative z-20">
        <div>
          <div className="px-10 mb-12 flex items-center gap-3">
            <div className="w-9 h-9 bg-black rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg leading-none">
                A
              </span>
            </div>
            <span className="font-bold text-2xl tracking-tight text-black">
              Admin<span className="text-gray-300 font-medium">Panel</span>
            </span>
          </div>

          <nav className="flex flex-col gap-1.5 px-6">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-4 mb-2 mt-2">
              Quản lý chung
            </p>
            <div className="flex items-center gap-4 px-4 py-3.5 bg-gray-100 text-black rounded-2xl font-semibold text-[15px] cursor-pointer">
              <ChartBarIcon className="size-5" /> Tổng quan
            </div>
            <div className="flex items-center gap-4 px-4 py-3.5 text-gray-500 hover:bg-gray-50 hover:text-black rounded-2xl font-medium text-[15px] cursor-pointer">
              <UsersIcon className="size-5" /> Người dùng
            </div>
            <div className="flex items-center gap-4 px-4 py-3.5 text-gray-500 hover:bg-gray-50 hover:text-black rounded-2xl font-medium text-[15px] cursor-pointer">
              <BriefcaseIcon className="size-5" /> Việc làm & Tuyển dụng
            </div>

            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-4 mb-2 mt-6">
              Bảo mật & Cảnh báo
            </p>
            <div className="flex items-center gap-4 px-4 py-3.5 text-gray-500 hover:bg-gray-50 hover:text-black rounded-2xl font-medium text-[15px] cursor-pointer">
              <FlagIcon className="size-5" /> Tố cáo & Vi phạm
            </div>
            <div className="flex items-center gap-4 px-4 py-3.5 text-gray-500 hover:bg-gray-50 hover:text-black rounded-2xl font-medium text-[15px] cursor-pointer">
              <DocumentMagnifyingGlassIcon className="size-5" /> Kiểm duyệt hồ
              sơ
            </div>
          </nav>
        </div>

        <div className="px-6">
          <div className="w-full h-px bg-gray-100 mb-6"></div>
          <div
            onClick={() => navigate("/login")}
            className="flex items-center gap-4 px-4 py-3.5 text-red-500 hover:bg-red-50 rounded-2xl font-semibold text-[15px] cursor-pointer"
          >
            <ArrowRightStartOnRectangleIcon className="size-5" /> Đăng xuất
            quyền Admin
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto h-screen relative no-scrollbar">
        <header className="sticky top-0 bg-[#F8F4FC]/80 backdrop-blur-xl border-b border-gray-100 z-10 px-12 py-5 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-black">
              Tổng quan Hệ thống
            </h1>
            <p className="text-gray-500 text-sm mt-1 font-medium">
              Cập nhật số liệu Real-time của platform.
            </p>
          </div>
          <div className="flex items-center gap-6">
            <button className="relative text-gray-400 hover:text-black outline-none">
              <BellIcon className="size-6" />
              <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[#f8f9fa]"></span>
            </button>
            <div className="w-px h-8 bg-gray-200"></div>
            <div className="flex items-center gap-4 cursor-pointer">
              <div className="text-right">
                <p className="text-sm font-bold text-black">Administrator</p>
                <p className="text-xs text-gray-400 font-medium mt-0.5">
                  Super Admin
                </p>
              </div>
              <div className="w-11 h-11 bg-white rounded-full border border-gray-200 shadow-sm flex items-center justify-center">
                <span className="font-bold text-gray-900 border border-gray-100 w-full h-full flex items-center justify-center rounded-full bg-gray-50">
                  S
                </span>
              </div>
            </div>
          </div>
        </header>

        <div className="px-12 py-10 pb-20 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {[
              {
                label: "Tổng người dùng",
                val: stats.totalUsers,
                growth: "+100%",
                color: "text-green-600",
              },
              {
                label: "Công ty đối tác",
                val: stats.totalCompanies,
                growth: "+100%",
                color: "text-green-600",
              },
              {
                label: "Việc làm đang mở",
                val: stats.totalJobs,
                growth: "+100%",
                color: "text-green-600",
              },
              {
                label: "Hồ sơ ứng tuyển",
                val: stats.totalApplications,
                growth: "+100%",
                color: "text-green-600",
              },
            ].map((stat, i) => (
              <div
                key={i}
                className="bg-white p-6 rounded-3xl border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)]"
              >
                <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">
                  {stat.label}
                </p>
                <div className="mt-4 flex items-end justify-between">
                  <h3 className="text-3xl font-black text-gray-900 tracking-tight">
                    {stat.val}
                  </h3>
                  <span className={`${stat.color} text-sm font-bold mb-1 ml-2`}>
                    {stat.growth}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-3xl border border-gray-100 shadow-[0_2px_20px_rgba(0,0,0,0.02)] overflow-hidden">
            <div className="px-10 py-7 border-b border-gray-50 flex justify-between items-center">
              <h2 className="text-[17px] font-bold text-black">
                Người dùng hệ thống
              </h2>
              <button className="text-sm font-semibold text-gray-400 hover:text-black">
                Xem tất cả
              </button>
            </div>
            
            {loading ? (
              <div className="p-12 text-center text-gray-500 font-medium">Đang tải danh sách người dùng...</div>
            ) : users.length === 0 ? (
              <div className="p-12 text-center text-gray-500 font-medium">Chưa có người dùng nào</div>
            ) : (
              <div className="divide-y divide-gray-50/80">
                {users.map((u, i) => (
                  <div
                    key={u._id}
                    className="px-10 py-6 flex items-center justify-between hover:bg-gray-50/50 cursor-pointer group"
                  >
                    <div className="flex items-center gap-5 w-1/3">
                      <div className="w-11 h-11 bg-purple-50 border border-purple-100 rounded-full flex items-center justify-center text-[13px] font-bold text-[#9346F5] group-hover:border-[#9346F5]/40">
                        {(u.fullName || u.username).charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 text-[15px]">
                          {u.fullName || u.username}
                        </h4>
                        <p className="text-xs text-gray-400 font-medium mt-0.5">
                          {u.email}
                        </p>
                      </div>
                    </div>
                    <div className="w-1/5 text-[13px] font-semibold text-gray-400 group-hover:text-black truncate">
                      {u._id}
                    </div>
                    <div className="w-1/4 text-sm font-bold text-gray-600">
                      {u.role === 'admin' ? 'Quản trị viên' : (u.role === 'company' ? 'Doanh nghiệp' : 'Ứng viên')}
                    </div>
                    <div className="w-1/6 text-right">
                      <span
                        className="px-4 py-1.5 rounded-full text-[12px] font-bold tracking-wide bg-[#f0fdf4] text-[#16a34a] border border-[#dcfce7]"
                      >
                        Hoạt động
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
