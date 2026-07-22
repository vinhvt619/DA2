import {
  AcademicCapIcon,
  BriefcaseIcon,
  BuildingOffice2Icon,
  EnvelopeIcon,
  GlobeAltIcon,
  MapPinIcon,
  TrashIcon,
  UserCircleIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const getPartnerId = (partner) => partner?.id || partner?._id || "";

export default function ProfileChatBox({ partner, onHideChat }) {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(partner || null);
  const initialPartnerId = getPartnerId(partner);
  const initialPartnerName = partner?.name || partner?.fullName || partner?.username || "";
  const initialPartnerRole = partner?.role || "";

  useEffect(() => {
    if (!initialPartnerId) return undefined;

    setProfile((currentProfile) => (
      getPartnerId(currentProfile) === initialPartnerId
        ? currentProfile
        : {
            id: initialPartnerId,
            name: initialPartnerName,
            role: initialPartnerRole,
          }
    ));

    let cancelled = false;
    fetch(`/api/user/profile/${initialPartnerId}`, { credentials: "include" })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (!cancelled && data) setProfile(data.user || data);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [initialPartnerId, initialPartnerName, initialPartnerRole]);

  const name = profile?.fullName || profile?.name || profile?.username || "Đang tải...";
  const isCompany = profile?.role === "company";
  const initials = useMemo(
    () => name.split(" ").filter(Boolean).map((part) => part[0]).join("").slice(0, 2).toUpperCase(),
    [name],
  );
  const education = profile?.educations?.[0];
  const partnerId = getPartnerId(profile) || initialPartnerId;

  const details = isCompany
    ? [
        { icon: BuildingOffice2Icon, text: profile?.companyIndustry || "Chưa cập nhật ngành nghề" },
        { icon: MapPinIcon, text: profile?.address || profile?.country || "Chưa cập nhật địa chỉ" },
        { icon: UsersIcon, text: profile?.companySize || "Chưa cập nhật quy mô" },
        { icon: GlobeAltIcon, text: profile?.companyWebsite || "Chưa cập nhật website" },
      ]
    : [
        { icon: MapPinIcon, text: profile?.address || profile?.country || "Chưa cập nhật địa chỉ" },
        { icon: EnvelopeIcon, text: profile?.email || "Chưa cập nhật email" },
        { icon: AcademicCapIcon, text: education?.school || education?.schoolName || "Chưa cập nhật học vấn" },
        { icon: BriefcaseIcon, text: profile?.experiences?.length ? `${profile.experiences.length} kinh nghiệm đã cập nhật` : "Chưa cập nhật kinh nghiệm" },
      ];

  return (
    <aside className="flex min-h-full w-full flex-col bg-white px-5 py-6">
      <div className="relative mx-auto">
        <div className="grid h-16 w-16 place-items-center rounded-full bg-violet-600 text-lg font-bold text-white">
          {initials || "TK"}
        </div>
        <span className="absolute bottom-0 right-0 h-4 w-4 rounded-full border-2 border-white bg-emerald-500" />
      </div>

      <h2 className="mt-3 text-center text-sm font-bold text-slate-900">{name}</h2>
      <p className="mt-0.5 text-center text-[10px] font-semibold uppercase tracking-wide text-slate-400">
        {isCompany ? "Doanh nghiệp" : "Ứng viên"}
      </p>

      <button
        type="button"
        onClick={() => partnerId && navigate(`/profile/${partnerId}`)}
        disabled={!partnerId}
        className="mx-auto mt-4 flex items-center gap-1.5 rounded-lg border border-violet-200 bg-violet-50 px-3 py-2 text-xs font-semibold text-violet-700 hover:bg-violet-100 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <UserCircleIcon className="size-4" />
        Xem hồ sơ
      </button>

      <section className="mt-6 border-t border-slate-200 pt-4">
        <h3 className="text-xs font-bold text-slate-800">
          {isCompany ? "Thông tin doanh nghiệp" : "Thông tin ứng viên"}
        </h3>
        <div className="mt-2 space-y-1">
          {details.map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-start gap-2.5 py-2 text-xs leading-relaxed text-slate-500">
              <Icon className="mt-0.5 size-4 shrink-0 text-violet-500" />
              <span className="break-words">{text}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-3 border-t border-slate-200 pt-4">
        <div className="rounded-xl bg-violet-50 p-3">
          <p className="text-[10px] font-medium text-slate-400">Cuộc trò chuyện</p>
          <p className="mt-1 text-xs font-semibold text-slate-700">Trao đổi tuyển dụng trực tiếp</p>
          <p className="mt-1 text-[10px] leading-relaxed text-slate-500">
            Tin nhắn và tệp đính kèm được lưu trong cuộc trò chuyện này.
          </p>
        </div>
      </section>

      {onHideChat && (
        <button
          type="button"
          onClick={() => {
            if (window.confirm("Bạn có chắc chắn muốn xóa/ẩn đoạn chat này không?")) onHideChat();
          }}
          className="mt-auto flex w-full items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-xs font-semibold text-red-600 hover:bg-red-100"
        >
          <TrashIcon className="size-4" />
          Xóa đoạn chat
        </button>
      )}
    </aside>
  );
}
