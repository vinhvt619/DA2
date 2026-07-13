import React, { useState, useEffect } from "react";
import {
  UsersIcon,
  BriefcaseIcon,
  ChartBarIcon,
  DocumentMagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import { useNavigate } from "react-router-dom";

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
    <div className="p-8 flex flex-col gap-6">
      
      {/* (2) STAT CARDS with mini sparkline SVG trends & semantic icon colors */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4.5">
        {[
          {
            label: "Tổng người dùng",
            val: stats.totalUsers,
            growthText: "+12.4% vs last month",
            icon: UsersIcon,
            iconBg: "bg-blue-50 text-blue-600 border-blue-100/50",
            trendColor: "text-blue-500",
            sparkline: "M0,15 Q15,10 30,12 T60,2",
          },
          {
            label: "Công ty đối tác",
            val: stats.totalCompanies,
            growthText: "+8.1% vs last week",
            icon: BriefcaseIcon,
            iconBg: "bg-purple-50 text-purple-600 border-purple-100/50",
            trendColor: "text-purple-500",
            sparkline: "M0,17 Q15,18 30,8 T60,4",
          },
          {
            label: "Việc làm đang mở",
            val: stats.totalJobs,
            growthText: "+15.3% this month",
            icon: ChartBarIcon,
            iconBg: "bg-emerald-50 text-emerald-600 border-emerald-100/50",
            trendColor: "text-emerald-500",
            sparkline: "M0,16 Q15,12 30,14 T60,2",
          },
          {
            label: "Hồ sơ ứng tuyển",
            val: stats.totalApplications,
            growthText: "+22.5% since yesterday",
            icon: DocumentMagnifyingGlassIcon,
            iconBg: "bg-amber-50 text-amber-600 border-amber-100/50",
            trendColor: "text-amber-500",
            sparkline: "M0,18 Q15,14 30,10 T60,1",
          },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div
              key={i}
              className="bg-white p-4 rounded-[10px] border-[0.5px] border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.01)] flex flex-col justify-between min-h-[105px]"
            >
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-[11px] font-bold uppercase tracking-wider">
                  {stat.label}
                </span>
                <div className={`p-1.5 rounded-[6px] border ${stat.iconBg}`}>
                  <Icon className="size-4" />
                </div>
              </div>
              <div className="mt-3.5 flex items-end justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-slate-800 tracking-tight leading-none">
                    {stat.val}
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-1.5 font-semibold">
                    {stat.growthText}
                  </p>
                </div>
                <div>
                  <svg className={`w-16 h-8 ${stat.trendColor}`} viewBox="0 0 60 20" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d={stat.sparkline} strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* (3) USER TABLE: Truncated to 5 entries, "Xem tất cả" navigates to /admin/users */}
      <div className="bg-white rounded-[10px] border-[0.5px] border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.01)] overflow-hidden">
        <div className="px-6 py-4 border-b-[0.5px] border-slate-200/80 flex justify-between items-center bg-slate-50/20">
          <h2 className="text-[14px] font-bold text-slate-800">
            Người dùng hệ thống
          </h2>
          <button 
            onClick={() => navigate("/admin/users")}
            className="text-[11px] font-semibold text-violet-600 hover:text-violet-800 transition-colors"
          >
            Xem tất cả
          </button>
        </div>
        
        {loading ? (
          <div className="p-12 text-center text-slate-400 font-medium">Đang tải danh sách người dùng...</div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center text-slate-400 font-medium">Chưa có người dùng nào</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b-[0.5px] border-slate-200/80 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                  <th className="px-6 py-2.5 font-bold">Người dùng</th>
                  <th className="px-6 py-2.5 font-bold">Vai trò</th>
                  <th className="px-6 py-2.5 font-bold text-right">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.slice(0, 5).map((u) => {
                  let avatarClass = "bg-blue-50 text-blue-600 border-blue-100/50";
                  let roleLabel = "Ứng viên";
                  if (u.role === "company") {
                    avatarClass = "bg-purple-50 text-purple-600 border-purple-100/50";
                    roleLabel = "Doanh nghiệp";
                  } else if (u.role === "admin") {
                    avatarClass = "bg-red-50 text-red-600 border-red-100/50";
                    roleLabel = "Quản trị viên";
                  }

                  return (
                    <tr
                      key={u._id}
                      className="hover:bg-slate-50/30 transition-colors"
                    >
                      <td className="px-6 py-3 flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full border flex items-center justify-center text-xs font-bold shrink-0 ${avatarClass}`}>
                          {(u.fullName || u.username).charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-semibold text-slate-800 text-[13px] leading-tight">
                            {u.fullName || u.username}
                          </h4>
                          <p className="text-[11px] text-slate-400 font-medium mt-0.5 truncate">
                            {u.email}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-3 text-[12px] font-medium text-slate-500">
                        {roleLabel}
                      </td>
                      <td className="px-6 py-3 text-right">
                        <span className="inline-flex items-center gap-1.5 text-left">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 ring-2 ring-emerald-100"></span>
                          <span className="text-[12px] font-medium text-slate-600">Hoạt động</span>
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
