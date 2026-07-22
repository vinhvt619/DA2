import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Header from "../Components/Header.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import {
  AcademicCapIcon,
  ArrowLeftIcon,
  ArrowTopRightOnSquareIcon,
  BriefcaseIcon,
  BuildingOffice2Icon,
  CalendarDaysIcon,
  CodeBracketIcon,
  ChatBubbleLeftRightIcon,
  EnvelopeIcon,
  GlobeAltIcon,
  LinkIcon,
  MapPinIcon,
  PhoneIcon,
  SparklesIcon,
  UserIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";

const fallbackCandidateSkills = ["React.js", "JavaScript", "Node.js", "MongoDB"];
const fallbackCompanyTech = ["React", "JavaScript", "Node.js", "MongoDB", "Cloud"];

function getInitials(user) {
  return (user?.fullName || user?.username || "RC")
    .split(" ")
    .filter(Boolean)
    .map((word) => word[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function getDisplayName(user) {
  return user?.fullName || user?.username || "Người dùng RabbitCV";
}

function getLocation(user) {
  return [user?.address, user?.hometown || user?.country].filter(Boolean).join(", ");
}

function safeWebsiteUrl(url) {
  if (!url) return "";
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

function formatMonthYear(value, fallback = "Đang cập nhật") {
  if (!value) return fallback;

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return new Intl.DateTimeFormat("vi-VN", {
    month: "2-digit",
    year: "numeric",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(date);
}

function formatDateRange(startDate, endDate, endFallback = "Hiện tại") {
  if (!startDate && !endDate) return "";
  return `${formatMonthYear(startDate)} - ${formatMonthYear(endDate, endFallback)}`;
}

function getJobTypeLabel(type) {
  return {
    "Full-time": "Toàn thời gian",
    "Part-time": "Bán thời gian",
    Remote: "Làm từ xa",
    Hybrid: "Kết hợp",
  }[type] || type;
}

function Card({ children, className = "" }) {
  return (
    <section className={`rounded-[10px] border border-violet-100 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.02)] ${className}`}>
      {children}
    </section>
  );
}

function SectionTitle({ icon: Icon, children }) {
  return (
    <h2 className="flex items-center gap-1.5 text-[15px] font-extrabold tracking-[-0.025em] text-[#292332]">
      <Icon className="h-4 w-4 text-violet-700" />
      {children}
    </h2>
  );
}

function Pill({ children, tone = "violet" }) {
  const tones = {
    violet: "bg-violet-50 text-violet-700 ring-violet-100",
    slate: "bg-slate-100 text-slate-600 ring-slate-200",
    mint: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  };

  return (
    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold ring-1 ${tones[tone]}`}>
      {children}
    </span>
  );
}

function EmptyState({ children }) {
  return (
    <div className="rounded-[9px] border border-dashed border-violet-100 bg-violet-50/30 px-3 py-3 text-[11px] font-medium text-slate-400">
      {children}
    </div>
  );
}

function InfoRow({ icon: Icon, label, value, href }) {
  if (!value) return null;

  const inner = (
    <>
      <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
      <span>
        <span className="block text-[10px] font-bold text-slate-500">{label}</span>
        <span className="mt-0.5 block break-words text-[12px] font-semibold text-[#51475d]">{value}</span>
      </span>
    </>
  );

  if (href) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className="flex gap-2.5 transition hover:text-violet-700">
        {inner}
      </a>
    );
  }

  return <div className="flex gap-2.5">{inner}</div>;
}

function TimelineItem({ title, subtitle, meta, description, active = false }) {
  return (
    <article className="relative pl-6">
      <span className={`absolute left-0 top-1.5 h-3 w-3 rounded-full border-2 ${active ? "border-violet-700 bg-violet-700" : "border-violet-300 bg-white"}`} />
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-[12px] font-extrabold text-[#292332]">{title || "Đang cập nhật"}</h3>
          {meta && <p className="mt-0.5 text-[10px] font-semibold text-slate-500">{meta}</p>}
        </div>
        {subtitle && <Pill>{subtitle}</Pill>}
      </div>
      {description && <p className="mt-1.5 text-[12px] leading-5 text-[#665d70]">{description}</p>}
    </article>
  );
}

function CandidateProfile({ user, locationText }) {
  const navigate = useNavigate();
  const experiences = user.experiences || [];
  const educations = user.educations || [];
  const activities = user.activities || [];
  const headline = experiences[0]?.position || "Ứng viên RabbitCV";
  const skills = user.skills?.length ? user.skills : fallbackCandidateSkills;
  const aboutText =
    user.bio ||
    user.description ||
    "Ứng viên đang hoàn thiện phần giới thiệu cá nhân. Các thông tin bên dưới được tổng hợp từ hồ sơ RabbitCV của người dùng.";

  return (
    <main className="mx-auto grid w-full max-w-[920px] gap-4 px-4 py-6 lg:grid-cols-[260px_minmax(0,1fr)]">
      <aside className="space-y-4">
        <Card className="p-4 text-center">
          <div className="mx-auto flex h-18 w-18 items-center justify-center rounded-full border-[3px] border-violet-100 bg-gradient-to-br from-violet-100 to-fuchsia-50 text-[18px] font-black text-violet-700 shadow-sm">
            {getInitials(user)}
          </div>
          <h1 className="mt-3.5 text-[17px] font-extrabold tracking-[-0.035em] text-[#292332]">{getDisplayName(user)}</h1>
          <p className="mt-1 text-[12px] font-semibold text-[#756b7f]">{headline}</p>
          {locationText && (
            <p className="mt-2 flex items-center justify-center gap-1 text-[10px] font-semibold text-[#756b7f]">
              <MapPinIcon className="h-3.5 w-3.5" />
              {locationText}
            </p>
          )}

          <div className="mt-3.5 flex justify-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-50 text-violet-700">
              <CodeBracketIcon className="h-4 w-4" />
            </span>
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-50 text-violet-700">
              <BriefcaseIcon className="h-4 w-4" />
            </span>
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-50 text-violet-700">
              <GlobeAltIcon className="h-4 w-4" />
            </span>
          </div>

          <div className="mt-3.5 space-y-2">
            <button
              type="button"
              onClick={() => navigate(`/Message?partnerId=${user._id}`)}
              className="flex h-8 w-full items-center justify-center gap-1.5 rounded-[8px] bg-violet-700 px-3 text-[10px] font-bold text-white shadow-sm transition hover:bg-violet-800"
            >
              <ChatBubbleLeftRightIcon className="h-4 w-4" />
              Nhắn tin
            </button>
            {user.email && (
              <a
                href={`mailto:${user.email}`}
                className="flex h-8 w-full items-center justify-center gap-1.5 rounded-[8px] bg-[#241b2b] px-3 text-[10px] font-bold text-white transition hover:bg-black"
              >
                <EnvelopeIcon className="h-4 w-4" />
                Tuyển dụng tôi
              </a>
            )}
          </div>
        </Card>

        <Card className="p-4">
          <h2 className="text-[15px] font-extrabold tracking-[-0.025em] text-[#292332]">Thông tin thêm</h2>
          <div className="mt-3 divide-y divide-violet-100">
            <div className="flex items-center justify-between py-2 text-[10px]">
              <span className="text-[#756b7f]">Kinh nghiệm</span>
              <strong className="text-[#292332]">{experiences.length ? `${experiences.length} mục` : "Đang cập nhật"}</strong>
            </div>
            <div className="flex items-center justify-between py-2 text-[10px]">
              <span className="text-[#756b7f]">Email</span>
              <strong className="text-[#292332]">{user.email ? "Đã có" : "Chưa có"}</strong>
            </div>
            <div className="flex items-center justify-between py-2 text-[10px]">
              <span className="text-[#756b7f]">Trạng thái</span>
              <Pill tone="mint">{user.status === "active" ? "Đang mở" : user.status || "Đang cập nhật"}</Pill>
            </div>
          </div>
        </Card>
      </aside>

      <div className="space-y-4">
        <Card className="p-4">
          <SectionTitle icon={UserIcon}>Giới thiệu</SectionTitle>
          <p className="mt-2 text-[12px] leading-5 text-[#665d70]">{aboutText}</p>
        </Card>

        <Card className="p-4">
          <SectionTitle icon={CodeBracketIcon}>Kỹ năng công nghệ</SectionTitle>
          <div className="mt-3 flex flex-wrap gap-2">
            {skills.map((skill) => (
              <Pill key={skill}>{skill}</Pill>
            ))}
          </div>
        </Card>

        <Card className="p-4">
          <SectionTitle icon={BriefcaseIcon}>Kinh nghiệm làm việc</SectionTitle>
          <div className="relative mt-3.5 space-y-4 before:absolute before:left-[5px] before:top-3 before:h-[calc(100%-24px)] before:w-px before:bg-violet-200">
            {experiences.length > 0 ? (
              experiences.map((exp, index) => (
                <TimelineItem
                  key={`${exp.company || "exp"}-${index}`}
                  active={index === 0}
                  title={exp.position || exp.company}
                  subtitle={exp.company}
                  meta={formatDateRange(exp.startDate, exp.endDate)}
                  description={exp.description}
                />
              ))
            ) : (
              <EmptyState>Ứng viên chưa cập nhật kinh nghiệm làm việc.</EmptyState>
            )}
          </div>
        </Card>

        {activities.length > 0 && (
          <section>
            <SectionTitle icon={SparklesIcon}>Dự án / hoạt động nổi bật</SectionTitle>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              {activities.map((activity, index) => (
                <Card key={`${activity.name || "activity"}-${index}`} className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <h3 className="text-[13px] font-extrabold text-[#292332]">{activity.name || "Hoạt động"}</h3>
                    <ArrowTopRightOnSquareIcon className="h-4 w-4 text-slate-400" />
                  </div>
                  <p className="mt-2 text-[12px] leading-5 text-[#665d70]">{activity.role || activity.description || "Đang cập nhật mô tả."}</p>
                </Card>
              ))}
            </div>
          </section>
        )}

        <Card className="p-4">
          <SectionTitle icon={AcademicCapIcon}>Học vấn</SectionTitle>
          <div className="mt-3 space-y-2.5">
            {educations.length > 0 ? (
              educations.map((edu, index) => (
                <div key={`${edu.school || "edu"}-${index}`} className="flex gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] bg-violet-100 text-violet-700">
                    <AcademicCapIcon className="h-4 w-4" />
                  </span>
                  <div>
                    <h3 className="text-[13px] font-extrabold text-[#292332]">{edu.school || "Trường học"}</h3>
                    <p className="mt-0.5 text-[11px] font-semibold text-[#756b7f]">{[edu.degree, edu.major].filter(Boolean).join(" - ") || "Chuyên ngành đang cập nhật"}</p>
                    <p className="mt-0.5 text-[11px] text-[#756b7f]">{formatDateRange(edu.startDate, edu.endDate, "Đã hoàn thành")}</p>
                  </div>
                </div>
              ))
            ) : (
              <EmptyState>Ứng viên chưa cập nhật học vấn.</EmptyState>
            )}
          </div>
        </Card>
      </div>
    </main>
  );
}

function CompanyProfile({ user, companyJobs, locationText }) {
  const website = safeWebsiteUrl(user.companyWebsite);
  const techStack = user.companyTech?.length ? user.companyTech : fallbackCompanyTech;
  const description =
    user.companyDescription ||
    "Doanh nghiệp đang hoàn thiện phần giới thiệu. Các thông tin bên dưới được tổng hợp từ hồ sơ công ty trên RabbitCV.";

  return (
    <main className="mx-auto w-full max-w-[1040px] px-5 py-5">
      <section className="overflow-hidden rounded-xl border border-violet-100 bg-white shadow-sm">
        <div className="relative h-[210px] bg-gradient-to-br from-[#ede3ff] via-[#f7efff] to-[#fff7fb]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(126,34,206,0.22),transparent_28%),radial-gradient(circle_at_80%_10%,rgba(168,85,247,0.2),transparent_25%),linear-gradient(135deg,rgba(30,20,42,0.18),rgba(30,20,42,0.02))]" />
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent" />
        </div>

        <div className="relative flex flex-col gap-4 px-6 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="-mt-14 flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="flex h-24 w-24 items-center justify-center rounded-xl border-4 border-white bg-white text-3xl font-black text-violet-700 shadow-lg">
              {getInitials(user)}
            </div>
            <div className="pb-1">
              <h1 className="text-2xl font-black tracking-[-0.05em] text-[#292332]">{getDisplayName(user)}</h1>
              <div className="mt-2 flex flex-wrap gap-2">
                <Pill>{user.companyIndustry || "Đang cập nhật lĩnh vực"}</Pill>
                <Pill tone="slate">{user.companySize || "Đang cập nhật quy mô"}</Pill>
              </div>
            </div>
          </div>

          <button
            type="button"
            className="inline-flex h-10 items-center justify-center rounded-lg bg-violet-700 px-6 text-xs font-bold text-white shadow-md shadow-violet-100 transition hover:bg-violet-800"
          >
            + Theo dõi
          </button>
        </div>
      </section>

      <div className="mt-7 grid gap-5 lg:grid-cols-[310px_minmax(0,1fr)]">
        <aside>
          <Card className="p-5">
            <h2 className="text-lg font-extrabold tracking-[-0.03em] text-[#292332]">Thông tin công ty</h2>
            <div className="mt-5 space-y-4">
              <InfoRow icon={UsersIcon} label="Quy mô" value={user.companySize} />
              <InfoRow icon={BuildingOffice2Icon} label="Trụ sở chính" value={locationText} />
              <InfoRow icon={CalendarDaysIcon} label="Thành lập" value={user.companyFoundedYear} />
              <InfoRow icon={LinkIcon} label="Trang web" value={user.companyWebsite} href={website} />
              <InfoRow icon={PhoneIcon} label="Điện thoại" value={user.phoneNumber} />
              <InfoRow icon={EnvelopeIcon} label="Email" value={user.email} />
            </div>
            <div className="mt-5 border-t border-violet-100 pt-4">
              <div className="flex gap-3">
                {website && (
                  <a href={website} target="_blank" rel="noreferrer" className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-50 text-violet-700 transition hover:bg-violet-100">
                    <GlobeAltIcon className="h-5 w-5" />
                  </a>
                )}
                {user.email && (
                  <a href={`mailto:${user.email}`} className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-50 text-violet-700 transition hover:bg-violet-100">
                    <EnvelopeIcon className="h-5 w-5" />
                  </a>
                )}
              </div>
            </div>
          </Card>
        </aside>

        <div className="space-y-6">
          <Card className="p-6">
            <SectionTitle icon={BuildingOffice2Icon}>Về chúng tôi</SectionTitle>
            <p className="mt-4 text-sm leading-7 text-[#665d70]">{description}</p>
          </Card>

          <section>
            <h2 className="text-lg font-extrabold tracking-[-0.03em] text-[#292332]">Văn hóa kỹ thuật</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <Card className="bg-violet-50/50 p-5">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-100 text-violet-700">
                  <BuildingOffice2Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 text-sm font-extrabold text-[#292332]">Linh hoạt không gian</h3>
                <p className="mt-2 text-sm leading-6 text-[#665d70]">Môi trường làm việc linh hoạt, phù hợp với đội ngũ công nghệ và dự án hiện đại.</p>
              </Card>
              <Card className="bg-violet-50/50 p-5">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700">
                  <CodeBracketIcon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 text-sm font-extrabold text-[#292332]">Quy trình linh hoạt và CI/CD</h3>
                <p className="mt-2 text-sm leading-6 text-[#665d70]">Ưu tiên quy trình rõ ràng, phản hồi nhanh và cải tiến liên tục trong sản phẩm.</p>
              </Card>
            </div>
          </section>

          <Card className="p-6">
            <SectionTitle icon={CodeBracketIcon}>Công nghệ chúng tôi sử dụng</SectionTitle>
            <div className="mt-4 flex flex-wrap gap-2.5">
              {techStack.map((tech) => (
                <Pill key={tech}>{tech}</Pill>
              ))}
            </div>
          </Card>

          <section>
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-lg font-extrabold tracking-[-0.03em] text-[#292332]">Vị trí đang tuyển nổi bật</h2>
              <Link to="/Jobs" className="text-sm font-bold text-violet-700 hover:text-violet-800">
                Xem tất cả {companyJobs.length} vị trí →
              </Link>
            </div>
            <div className="mt-4 space-y-3">
              {companyJobs.length > 0 ? (
                companyJobs.map((job) => (
                  <Link key={job._id} to={`/jobs/${job._id}`} className="flex flex-col gap-3 rounded-xl border border-violet-100 bg-white p-4 shadow-sm transition hover:border-violet-200 hover:bg-violet-50/30 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="text-base font-extrabold tracking-[-0.03em] text-[#292332]">{job.title}</h3>
                      <div className="mt-1.5 flex flex-wrap gap-3 text-[11px] font-semibold text-[#756b7f]">
                        <span className="inline-flex items-center gap-1"><MapPinIcon className="h-4 w-4" />{job.location}</span>
                        <span>• {getJobTypeLabel(job.type)}</span>
                        <span className="text-emerald-600">{job.salary}</span>
                      </div>
                    </div>
                    <span className="inline-flex h-9 items-center justify-center rounded-lg border border-[#b9afc2] px-5 text-xs font-bold text-[#292332]">
                      Ứng tuyển
                    </span>
                  </Link>
                ))
              ) : (
                <EmptyState>Công ty này chưa có vị trí tuyển dụng đang mở.</EmptyState>
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

export default function PublicProfile() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [userData, setUserData] = useState(null);
  const [companyJobs, setCompanyJobs] = useState([]);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        setError("");

        const res = await fetch(`/api/user/profile/${userId}`, {
          credentials: "include",
        });
        const data = await res.json();

        if (!res.ok) {
          setError(data.message || "Không thể tải thông tin hồ sơ.");
          return;
        }

        setUserData(data.user);

        if (data.user?.role === "company") {
          const jobsRes = await fetch("/api/jobs");
          if (jobsRes.ok) {
            const jobs = await jobsRes.json();
            setCompanyJobs(jobs.filter((job) => String(job.companyId) === String(data.user._id)).slice(0, 12));
          }
        }
      } catch {
        setError("Lỗi kết nối đến máy chủ.");
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [userId]);

  const isCompany = userData?.role === "company";
  const locationText = useMemo(() => getLocation(userData), [userData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fff6fd] font-sans text-[#292332]">
        {currentUser?.role !== "company" && <Header />}
        <main className="grid min-h-[70vh] place-items-center px-5">
          <Card className="px-9 py-8 text-center">
            <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-violet-700 border-t-transparent" />
            <p className="mt-4 text-sm font-bold text-[#756b7f]">Đang tải hồ sơ...</p>
          </Card>
        </main>
      </div>
    );
  }

  if (error || !userData) {
    return (
      <div className="min-h-screen bg-[#fff6fd] font-sans text-[#292332]">
        {currentUser?.role !== "company" && <Header />}
        <main className="grid min-h-[70vh] place-items-center px-5">
          <Card className="max-w-md px-9 py-8 text-center">
            <h1 className="text-lg font-extrabold text-rose-600">Không thể mở hồ sơ</h1>
            <p className="mt-3 text-sm leading-6 text-[#756b7f]">{error || "Không tìm thấy người dùng."}</p>
            <button type="button" onClick={() => navigate(-1)} className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-violet-700 hover:text-violet-800">
              <ArrowLeftIcon className="h-4 w-4" />
              Quay lại
            </button>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fff6fd] font-sans text-[#292332]">
      {currentUser?.role !== "company" && <Header />}
      {isCompany ? (
        <CompanyProfile user={userData} companyJobs={companyJobs} locationText={locationText} />
      ) : (
        <CandidateProfile user={userData} locationText={locationText} />
      )}
    </div>
  );
}
