import React, { useLayoutEffect, useRef, useState } from "react";
import {
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  GlobeAltIcon,
} from "@heroicons/react/24/outline";
import {
  formatResumeDate,
  formatResumeDateRange,
} from "../utils/dateTime.js";
import RichTextContent from "./RichTextContent.jsx";
import { normalizeCustomSections, normalizeSkillNames } from "../../shared/resumeCustomSections.js";
import { getTemplateLayout, isTemplateLayoutCustomized, customSectionKey, RESUME_SECTION_LABELS } from "../utils/resumeLayout.js";
import { RESUME_TEMPLATE_KEYS, ADDITIONAL_RESUME_TEMPLATES } from "../../shared/resumeTemplates.js";
import "./ResumeTypography.css";
import "./AdditionalResumeTemplates.css";
import ResumePages from "./ResumePages.jsx";
import { normalizeResumePageCount } from "../../shared/resumePages.js";

const safeExternalUrl = (value) => {
  if (typeof value !== "string" || !value.trim()) return undefined;
  if (
    /^[a-z][a-z\d+.-]*:/i.test(value.trim()) &&
    !/^https?:\/\//i.test(value.trim())
  ) {
    return undefined;
  }
  const candidate = /^https?:\/\//i.test(value.trim())
    ? value.trim()
    : `https://${value.trim()}`;

  try {
    const parsedUrl = new URL(candidate);
    return ["http:", "https:"].includes(parsedUrl.protocol)
      ? candidate
      : undefined;
  } catch {
    return undefined;
  }
};

const formatDateRange = formatResumeDateRange;

const MIN_RESUME_FIT_SCALE = 0.74;

function AutoFitResumePage({ children }) {
  const pageRef = useRef(null);
  const contentRef = useRef(null);
  const [status, setStatus] = useState({ ready: false, overflow: false });

  useLayoutEffect(() => {
    const page = pageRef.current;
    const content = contentRef.current;
    const template = content?.firstElementChild;
    if (!page || !content || !template) return undefined;

    let animationFrame;
    let cancelled = false;

    const applyScale = (scale) => {
      const inverseScale = 100 / scale;
      content.style.transform = `scale(${scale})`;
      content.style.width = `${inverseScale}%`;
      content.style.height = `${inverseScale}%`;
    };

    const fitContent = () => {
      if (cancelled) return;

      cancelAnimationFrame(animationFrame);
      page.dataset.fitReady = "false";
      page.dataset.resumeOverflow = "false";
      setStatus((current) =>
        current.ready || current.overflow ? { ready: false, overflow: false } : current,
      );
      applyScale(1);
      let scale = 1;
      let attempts = 0;

      const measure = () => {
        if (cancelled) return;

        const pageHeight = page.clientHeight;
        const pageWidth = page.clientWidth;
        const requiredHeight = template.scrollHeight;
        if (!pageHeight || !pageWidth || !requiredHeight) {
          return;
        }

        const currentImages = Array.from(content.querySelectorAll("img"));
        if (currentImages.some((image) => !image.complete)) {
          return;
        }

        const renderedHeight = requiredHeight * scale;
        if (renderedHeight <= pageHeight + 1) {
          page.dataset.resumeOverflow = "false";
          page.dataset.fitReady = "true";
          setStatus((current) =>
            current.ready && !current.overflow ? current : { ready: true, overflow: false },
          );
          return;
        }

        const nextScale = Math.max(
          MIN_RESUME_FIT_SCALE,
          Math.min(scale, pageHeight / requiredHeight - 0.003),
        );
        if (attempts >= 6 || Math.abs(nextScale - scale) < 0.001) {
          const didOverflow = renderedHeight > pageHeight + 1;
          page.dataset.resumeOverflow = String(didOverflow);
          page.dataset.fitReady = "true";
          setStatus((current) =>
            current.ready && current.overflow === didOverflow
              ? current
              : { ready: true, overflow: didOverflow },
          );
          return;
        }

        scale = nextScale;
        attempts += 1;
        applyScale(scale);
        animationFrame = requestAnimationFrame(measure);
      };

      animationFrame = requestAnimationFrame(measure);
    };

    fitContent();
    document.fonts?.ready.then(fitContent);

    const images = Array.from(content.querySelectorAll("img"));
    images.forEach((image) => {
      image.addEventListener("load", fitContent);
      image.addEventListener("error", fitContent);
    });

    const resizeObserver = new ResizeObserver(fitContent);
    resizeObserver.observe(page);

    return () => {
      cancelled = true;
      cancelAnimationFrame(animationFrame);
      resizeObserver.disconnect();
      images.forEach((image) => {
        image.removeEventListener("load", fitContent);
        image.removeEventListener("error", fitContent);
      });
    };
  }, [children]);

  return (
    <div
      ref={pageRef}
      data-fit-ready={status.ready}
      data-resume-overflow={status.overflow}
      className="relative h-full w-full overflow-hidden bg-white"
    >
      <div
        ref={contentRef}
        className="resume-fit-content origin-top-left overflow-visible"
      >
        {children}
      </div>
      {status.overflow && (
        <p
          role="alert"
          className="cv-pagination-error print:hidden absolute inset-x-0 top-0 z-20"
        >
          Nội dung vượt quá 1 trang A4. Hãy chọn bố cục 2 trang hoặc rút gọn nội dung trước khi xuất PDF.
        </p>
      )}
    </div>
  );
}

const ContactItem = ({ icon: _Icon, text, link }) => {
  if (!text) return null;
  const content = (
    <div className="flex min-w-0 max-w-full items-start gap-1.5 text-[11px] leading-4 text-gray-600">
      <_Icon className="mt-0.5 w-3.5 h-3.5 shrink-0" />
      <span className="min-w-0 break-words [overflow-wrap:break-word]">{text}</span>
    </div>
  );
  const safeLink = safeExternalUrl(link);
  return safeLink ? (
    <a
      href={safeLink}
      target="_blank"
      rel="noreferrer"
      className="min-w-0 max-w-full hover:text-blue-600"
    >
      {content}
    </a>
  ) : (
    content
  );
};

const SidebarContactItem = ({ icon: _Icon, text, link }) => {
  if (!text) return null;
  const content = (
    <div className="flex min-w-0 max-w-full items-start gap-2 text-[11px] leading-4 text-gray-300">
      <_Icon className="mt-0.5 w-3.5 h-3.5 text-gray-400 shrink-0" />
      <span className="min-w-0 break-words [overflow-wrap:break-word]">{text}</span>
    </div>
  );
  const safeLink = safeExternalUrl(link);
  return safeLink ? (
    <a
      href={safeLink}
      target="_blank"
      rel="noreferrer"
      className="min-w-0 max-w-full hover:text-white"
    >
      {content}
    </a>
  ) : (
    content
  );
};

const BasicTemplate = ({
  image,
  personalInfo,
  bio,
  profile,
  experience,
  education,
  skill,
  project,
  award,
  hobby,
  language,
  certificate,
}) => (
  <div className="cv-print-layout cv-basic-layout h-full min-h-0 min-w-0 w-full overflow-hidden bg-white p-10 font-sans text-gray-800 print:p-6">
    <div className="flex flex-col items-center text-center mb-8">
      {image && (
        <img
          src={image}
          alt="Profile"
          className="w-24 h-24 rounded-full object-cover mb-4"
        />
      )}
      <h1 className="text-3xl font-bold uppercase tracking-wider text-gray-900 mb-1">
        {personalInfo.fullName}
      </h1>
      <h2 className="text-sm font-medium tracking-wider text-gray-500 uppercase mb-4">
        {personalInfo.jobTitle}
      </h2>

      <div className="flex flex-wrap justify-center gap-x-4 gap-y-2">
        <ContactItem icon={EnvelopeIcon} text={personalInfo.email} />
        <ContactItem icon={PhoneIcon} text={personalInfo.phone} />
        <ContactItem icon={MapPinIcon} text={personalInfo.location} />
        <ContactItem
          icon={GlobeAltIcon}
          text={personalInfo.website}
          link={personalInfo.website}
        />
        {profile?.map((p, i) => (
          <ContactItem
            key={i}
            icon={GlobeAltIcon}
            text={p.networkName || p.link}
            link={p.link}
          />
        ))}
      </div>
    </div>

    <div className="resume-basic-grid grid grid-cols-12 gap-8 print:gap-4">
      <div className="col-span-4 min-w-0 flex flex-col gap-6 print:gap-3">
<TemplatePlainSkills items={skill} headingClass="border-gray-300 text-gray-900" titleClass="text-slate-900" />

        {language?.length > 0 && (
          <section>
            <h3 className="text-xs font-bold uppercase tracking-widest border-b border-gray-300 pb-1 mb-3 text-gray-900">
              Ngoại ngữ
            </h3>
            <div className="flex flex-col gap-3 text-xs text-gray-700">
              {language.map((item) => (
                <div key={item.id} className="break-inside-avoid">
                  <div className="font-semibold text-gray-900">
                    {item.title}
                  </div>
                  {item.description && (
                    <div className="mt-0.5 text-gray-600">
                      {item.description}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {award?.length > 0 && (
          <section>
            <h3 className="text-xs font-bold uppercase tracking-widest border-b border-gray-300 pb-1 mb-3 text-gray-900">
              Giải thưởng
            </h3>
            <div className="flex flex-col gap-4 text-gray-700">
              {award.map((awardItem) => (
                <div key={awardItem.id} className="break-inside-avoid">
                  <div className="flex justify-between items-baseline mb-0.5">
                    <div className="text-xs font-bold text-gray-900">
                      {awardItem.title}
                    </div>
                    <div className="text-[11px] text-blue-500">
                      {formatResumeDate(awardItem.date)}
                    </div>
                  </div>
                  <div className="text-[11px] text-gray-600 font-semibold">
                    {awardItem.awarder}
                  </div>
                  {awardItem.description && (
                    <RichTextContent
                      className="text-xs text-gray-600 leading-relaxed list-disc pl-4 mt-1"
                      content={awardItem.description}
                    />
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {hobby?.length > 0 && (
          <section>
            <h3 className="text-xs font-bold uppercase tracking-widest border-b border-gray-300 pb-1 mb-3 text-gray-900">
              Sở thích
            </h3>
            <div className="flex flex-col gap-2 text-xs text-gray-700">
              {hobby.map((hobbyItem) => (
                <div
                  key={hobbyItem.id}
                  className="flex items-center gap-1.5 font-medium"
                >
                  <div className="w-1 h-1 rounded-full bg-gray-400"></div>
                  {hobbyItem.title}
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      <div className="col-span-8 min-w-0 flex flex-col gap-6 print:gap-3">
        {bio && (
          <section>
            <h3 className="text-xs font-bold uppercase tracking-widest border-b border-gray-300 pb-1 mb-3 text-gray-900">
              Giới thiệu
            </h3>
            <RichTextContent
              className="text-xs text-gray-700 leading-relaxed text-justify"
              content={bio}
            />
          </section>
        )}

        {experience?.length > 0 && (
          <section>
            <h3 className="text-xs font-bold uppercase tracking-widest border-b border-gray-300 pb-1 mb-3 text-gray-900">
              Kinh nghiệm
            </h3>
            <div className="flex flex-col gap-5">
              {experience.map((item) => (
                <div key={item.id} className="break-inside-avoid">
                  <div className="flex justify-between items-start mb-0.5">
                    <h4 className="text-sm font-bold text-gray-900">
                      {item.title}
                    </h4>
                    <span className="text-[11px] text-blue-500 font-medium whitespace-nowrap">
                      {formatDateRange(item.startDate, item.endDate)}
                    </span>
                  </div>
                  <div className="text-xs font-semibold text-gray-700 mb-2">
                    {item.company}
                    {item.location ? ` • ${item.location}` : ""}
                  </div>
                  <RichTextContent
                    className="text-xs text-gray-600 leading-relaxed list-disc pl-4"
                    content={item.description}
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {education?.length > 0 && (
          <section>
            <h3 className="text-xs font-bold uppercase tracking-widest border-b border-gray-300 pb-1 mb-3 text-gray-900">
              Học vấn
            </h3>
            <div className="flex flex-col gap-4">
              {education.map((edu) => (
                <div key={edu.id} className="break-inside-avoid">
                  <div className="flex justify-between items-baseline mb-0.5">
                    <h4 className="text-sm font-bold text-gray-900">
                      {edu.title}
                    </h4>
                    <span className="text-[11px] text-blue-500 font-medium whitespace-nowrap">
                      {formatDateRange(edu.startDate, edu.endDate)}
                    </span>
                  </div>
                  <div className="text-xs font-semibold text-gray-700 mb-2">
                    {edu.company}
                    {edu.location ? ` • ${edu.location}` : ""}
                  </div>
                  {(edu.major || edu.score) && (
                    <div className="text-[11px] text-gray-600 mb-2">
                      {edu.major}
                      {edu.major && edu.score ? " - " : ""}
                      {edu.score}
                    </div>
                  )}
                  {edu.description && (
                    <RichTextContent
                      className="text-xs text-gray-600 leading-relaxed list-disc pl-4 mt-1"
                      content={edu.description}
                    />
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {project?.length > 0 && (
          <section>
            <h3 className="text-xs font-bold uppercase tracking-widest border-b border-gray-300 pb-1 mb-3 text-gray-900">
              Dự án
            </h3>
            <div className="flex flex-col gap-5">
              {project.map((i) => (
                <div key={i.id} className="break-inside-avoid">
                  <div className="flex justify-between items-start mb-0.5">
                    <h4 className="text-sm font-bold text-gray-900">
                      {i.title}
                    </h4>
                    <span className="text-[11px] text-blue-500 font-medium whitespace-nowrap">
                      {formatResumeDate(i.date)}
                    </span>
                  </div>
                  {i.link && (
                    <a
                      href={safeExternalUrl(i.link)}
                      className="text-[11px] text-blue-600 hover:underline block mb-1 break-all"
                    >
                      {i.link}
                    </a>
                  )}
                  <RichTextContent
                    className="text-xs text-gray-600 leading-relaxed list-disc pl-4 mt-1"
                    content={i.description}
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {certificate?.length > 0 && (
          <section>
            <h3 className="text-xs font-bold uppercase tracking-widest border-b border-gray-300 pb-1 mb-3 text-gray-900">
              Chứng chỉ
            </h3>
            <div className="flex flex-col gap-5">
              {certificate.map((i) => (
                <div key={i.id} className="break-inside-avoid">
                  <div className="flex justify-between items-start mb-0.5">
                    <h4 className="text-sm font-bold text-gray-900">
                      {i.title}
                    </h4>
                    <span className="text-[11px] text-blue-500 font-medium whitespace-nowrap">
                      {formatResumeDate(i.date)}
                    </span>
                  </div>
                  <div className="text-[11px] text-gray-600 font-semibold mb-1">
                    {i.publisher}
                  </div>
                  {i.description && (
                    <RichTextContent
                      className="text-xs text-gray-600 leading-relaxed list-disc pl-4 mt-1"
                      content={i.description}
                    />
                  )}
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  </div>
);

const ModernTemplate = ({
  image,
  personalInfo,
  bio,
  profile,
  experience,
  education,
  skill,
  project,
  award,
  hobby,
  language,
  certificate,
}) => (
  <div className="cv-print-layout min-w-0 w-full flex h-full min-h-0 flex-col overflow-hidden bg-white font-sans text-gray-800">
    <div className="resume-two-column-grid grid h-full min-h-0 grid-cols-12">
      <div className="cv-modern-main col-span-8 min-w-0 p-10 print:p-6 bg-white flex flex-col gap-6 print:gap-3">
        <div className="mb-4 print:mb-2 text-left">
          <h1 className="text-4xl print:text-3xl font-extrabold tracking-tight text-gray-900 mb-1 break-words">
            {personalInfo.fullName}
          </h1>
          <h2 className="text-base print:text-sm font-medium text-blue-700 uppercase tracking-widest break-words">
            {personalInfo.jobTitle}
          </h2>

          <div className="flex flex-wrap gap-x-4 gap-y-2 mt-4 print:mt-2 justify-start">
            <ContactItem icon={EnvelopeIcon} text={personalInfo.email} />
            <ContactItem icon={PhoneIcon} text={personalInfo.phone} />
            <ContactItem icon={MapPinIcon} text={personalInfo.location} />
            <ContactItem
              icon={GlobeAltIcon}
              text={personalInfo.website}
              link={personalInfo.website}
            />
            {profile?.map((p, i) => (
              <ContactItem
                key={i}
                icon={GlobeAltIcon}
                text={p.networkName || p.link}
                link={p.link}
              />
            ))}
          </div>
        </div>

        {bio && (
          <section>
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-900 mb-2 print:mb-1.5 border-b-2 border-gray-100 pb-1">
              Tiểu sử
            </h3>
            <RichTextContent
              className="text-xs text-gray-700 leading-relaxed print:leading-normal"
              content={bio}
            />
          </section>
        )}

        {experience?.length > 0 && (
          <section>
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-900 mb-4 print:mb-2 pb-1 border-b-2 border-gray-100">
              Kinh nghiệm làm việc
            </h3>
            <div className="flex flex-col gap-6 print:gap-3">
              {experience.map((exp) => (
                <div key={exp.id} className="break-inside-avoid">
                  <div className="flex justify-between items-baseline mb-1 print:mb-0.5">
                    <h4 className="text-sm font-bold text-gray-900 print:text-[13px]">
                      {exp.title}
                    </h4>
                    <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-sm print:py-0 print:px-1">
                      {formatDateRange(exp.startDate, exp.endDate)}
                    </span>
                  </div>
                  <div className="text-xs font-semibold text-gray-700 mb-2 print:mb-1">
                    {exp.company}
                    {exp.location ? ` • ${exp.location}` : ""}
                  </div>
                  <RichTextContent
                    className="text-xs text-gray-600 leading-relaxed print:leading-normal list-disc pl-4"
                    content={exp.description}
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {education?.length > 0 && (
          <section>
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-900 mb-4 print:mb-2 pb-1 border-b-2 border-gray-100">
              Học vấn
            </h3>
            <div className="flex flex-col gap-6 print:gap-3">
              {education.map((i) => (
                <div key={i.id} className="break-inside-avoid">
                  <div className="flex justify-between items-baseline mb-1 print:mb-0.5">
                    <h4 className="text-sm font-bold text-gray-900 print:text-[13px]">
                      {i.title}
                    </h4>
                    <span className="text-[11px] font-semibold text-blue-500 bg-gray-100 px-2 py-0.5 rounded-sm print:py-0 print:px-1">
                      {formatDateRange(i.startDate, i.endDate)}
                    </span>
                  </div>
                  <div className="text-xs font-semibold text-gray-700 mb-2 print:mb-1">
                    {i.company}
                    {i.location ? ` • ${i.location}` : ""}
                  </div>
                  {(i.major || i.score) && (
                    <div className="text-[11px] text-gray-600 mb-2 print:mb-1">
                      {i.major}
                      {i.major && i.score ? " - " : ""}
                      {i.score}
                    </div>
                  )}
                  {i.description && (
                    <RichTextContent
                      className="text-xs text-gray-600 leading-relaxed print:leading-normal list-disc pl-4 mt-1 print:mt-0.5"
                      content={i.description}
                    />
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {project?.length > 0 && (
          <section>
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-900 mb-4 print:mb-2 pb-1 border-b-2 border-gray-100">
              Dự án
            </h3>
            <div className="flex flex-col gap-5 print:gap-2.5">
              {project.map((i) => (
                <div key={i.id} className="break-inside-avoid">
                  <div className="flex justify-between items-baseline mb-1 print:mb-0.5">
                    <h4 className="text-sm font-bold text-gray-900 print:text-[13px]">
                      {i.title}
                    </h4>
                    <span className="text-[11px] font-semibold text-blue-500 bg-gray-100 px-2 py-0.5 rounded-sm print:py-0 print:px-1">
                      {formatResumeDate(i.date)}
                    </span>
                  </div>
                  {i.link && (
                    <a
                      href={safeExternalUrl(i.link)}
                      className="text-[11px] text-blue-600 hover:underline block mb-1 print:mb-0.5 break-all"
                    >
                      {i.link}
                    </a>
                  )}
                  <RichTextContent
                    className="text-xs text-gray-600 leading-relaxed print:leading-normal list-disc pl-4"
                    content={i.description}
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {certificate?.length > 0 && (
          <section>
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-900 mb-4 print:mb-2 pb-1 border-b-2 border-gray-100">
              Chứng chỉ
            </h3>
            <div className="flex flex-col gap-5 print:gap-2.5">
              {certificate.map((i) => (
                <div key={i.id} className="break-inside-avoid">
                  <div className="flex justify-between items-baseline mb-1 print:mb-0.5">
                    <h4 className="text-sm font-bold text-gray-900 print:text-[13px]">
                      {i.title}
                    </h4>
                    <span className="text-[11px] font-semibold text-blue-500 bg-gray-100 px-2 py-0.5 rounded-sm print:py-0 print:px-1">
                      {formatResumeDate(i.date)}
                    </span>
                  </div>
                  <div className="text-xs font-semibold text-gray-700 mb-2 print:mb-1">
                    {i.publisher}
                  </div>
                  {i.description && (
                    <RichTextContent
                      className="text-xs text-gray-600 leading-relaxed print:leading-normal list-disc pl-4"
                      content={i.description}
                    />
                  )}
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      <div className="cv-modern-sidebar col-span-4 min-w-0 bg-gray-50 p-10 print:p-6 flex flex-col gap-8 print:gap-4.5 border-l border-gray-200">
        <div className="flex justify-center mb-2 print:mb-0">
          {image && (
            <img
              src={image}
              alt="Profile"
              className="w-32 h-32 print:w-24 print:h-24 rounded-xl object-cover shadow-sm"
            />
          )}
        </div>

<TemplatePlainSkills items={skill} headingClass="border-gray-300 text-gray-900" titleClass="text-slate-900" />

        {language?.length > 0 && (
          <section>
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-900 mb-4 print:mb-2 pb-1 border-b-2 border-gray-200">
              Ngoại ngữ
            </h3>
            <div className="flex flex-col gap-3 print:gap-1.5">
              {language.map((i) => (
                <div key={i.id} className="break-inside-avoid">
                  <div className="font-semibold text-gray-900 text-xs">
                    {i.title}
                  </div>
                  {i.description && (
                    <div className="mt-0.5 text-[11px] text-gray-600 print:leading-normal">
                      {i.description}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {award?.length > 0 && (
          <section>
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-900 mb-4 print:mb-2 pb-1 border-b-2 border-gray-200">
              Giải thưởng
            </h3>
            <div className="flex flex-col gap-3 print:gap-1.5">
              {award.map((i) => (
                <div key={i.id} className="break-inside-avoid">
                  <h4 className="text-xs font-bold text-gray-900">{i.title}</h4>
                  <div className="text-[11px] text-gray-700 font-semibold mt-0.5">
                    {i.awarder}
                  </div>
                  <div className="text-[11px] text-blue-500 mt-0.5">
                    {formatResumeDate(i.date)}
                  </div>
                  {i.description && (
                    <RichTextContent
                      className="text-xs text-gray-600 leading-relaxed print:leading-normal list-disc pl-4 mt-1 print:mt-0.5"
                      content={i.description}
                    />
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {hobby?.length > 0 && (
          <section>
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-900 mb-4 print:mb-2 pb-1 border-b-2 border-gray-200">
              Sở thích
            </h3>
            <div className="flex flex-wrap gap-2 print:gap-1">
              {hobby.map((i) => (
                <span
                  key={i.id}
                  className="text-[11px] font-semibold text-gray-700 bg-gray-200 px-2.5 py-1 rounded-sm"
                >
                  {i.title}
                </span>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  </div>
);

const ProfessionalTemplate = ({
  image,
  personalInfo,
  bio,
  profile,
  experience,
  education,
  skill,
  project,
  award,
  hobby,
  language,
  certificate,
}) => (
  <div className="cv-print-layout flex h-full min-h-0 overflow-hidden bg-white font-sans">
    <div className="cv-sidebar flex w-[30%] min-w-0 shrink-0 flex-col gap-5 bg-gray-900 p-6 text-white print:gap-4 print:p-5">
      <div className="flex flex-col items-center text-center">
        {image ? (
          <img
            src={image}
            alt="Profile"
            className="cv-avatar mb-3 h-24 w-24 rounded-full border-2 border-gray-600 object-cover"
          />
        ) : (
          <div className="cv-avatar mb-3 flex h-24 w-24 items-center justify-center rounded-full border-2 border-gray-600 bg-gray-800">
            <span className="text-gray-500 font-bold text-2xl uppercase">
              {personalInfo?.fullName?.charAt(0) ?? "?"}
            </span>
          </div>
        )}
        <h1 className="mb-1 w-full break-words text-xl font-bold uppercase leading-tight tracking-tight">
          {personalInfo.fullName}
        </h1>
        <h2 className="w-full break-words text-xs font-medium text-gray-400 uppercase tracking-widest">
          {personalInfo.jobTitle}
        </h2>
      </div>

      <section>
        <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3 border-b border-gray-700 pb-1">
          Liên hệ
        </h3>
        <div className="flex flex-col gap-3">
          <SidebarContactItem icon={EnvelopeIcon} text={personalInfo.email} />
          <SidebarContactItem icon={PhoneIcon} text={personalInfo.phone} />
          <SidebarContactItem icon={MapPinIcon} text={personalInfo.location} />
          <SidebarContactItem
            icon={GlobeAltIcon}
            text={personalInfo.website}
            link={personalInfo.website}
          />
        </div>
      </section>

      {profile?.length > 0 && (
        <section>
          <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3 border-b border-gray-700 pb-1">
            Mạng xã hội
          </h3>
          <div className="flex flex-col gap-3">
            {profile.map((p, i) => (
              <SidebarContactItem
                key={i}
                icon={GlobeAltIcon}
                text={p.networkName || p.link}
                link={p.link}
              />
            ))}
          </div>
        </section>
      )}

<TemplatePlainSkills items={skill} headingClass="border-gray-700 text-gray-400" titleClass="text-gray-300" />

      {language?.length > 0 && (
        <section>
          <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3 border-b border-gray-700 pb-1">
            Ngoại ngữ
          </h3>
          <div className="flex flex-col gap-3">
            {language.map((i) => (
              <div key={i.id} className="break-inside-avoid">
                <div className="text-xs font-medium text-gray-300">
                  {i.title}
                </div>
                {i.description && (
                  <div className="mt-0.5 text-[10px] text-gray-400">
                    {i.description}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {hobby?.length > 0 && (
        <section>
          <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3 border-b border-gray-700 pb-1">
            Sở thích
          </h3>
          <div className="flex flex-wrap gap-2">
            {hobby.map((i) => (
              <span
                key={i.id}
                className="text-[10px] font-medium text-gray-300 border border-gray-700 px-2 py-0.5 rounded-sm"
              >
                {i.title}
              </span>
            ))}
          </div>
        </section>
      )}
    </div>

    <div className="cv-main-content flex w-[70%] min-w-0 flex-col gap-5 p-8 text-gray-800 print:gap-3 print:p-6">
      {bio && (
        <section>
          <h3 className="text-xs font-bold uppercase tracking-widest text-gray-900 border-b border-gray-200 pb-1 mb-3">
            Tiểu sử
          </h3>
          <RichTextContent
            className="text-xs text-gray-700 leading-relaxed text-justify"
            content={bio}
          />
        </section>
      )}

      {experience?.length > 0 && (
        <section>
          <h3 className="text-xs font-bold uppercase tracking-widest text-gray-900 border-b border-gray-200 pb-1 mb-4">
            Kinh nghiệm làm việc
          </h3>
          <div className="flex flex-col gap-5">
            {experience.map((i) => (
              <div key={i.id} className="break-inside-avoid">
                <div className="flex justify-between items-baseline mb-0.5">
                  <h4 className="text-sm font-bold text-gray-900">{i.title}</h4>
                  <span className="text-[11px] text-blue-500 font-medium whitespace-nowrap ml-2">
                    {formatDateRange(i.startDate, i.endDate)}
                  </span>
                </div>
                <div className="text-xs font-semibold text-gray-600 mb-1.5">
                  {i.company}
                  {i.location ? ` • ${i.location}` : ""}
                </div>
                <RichTextContent
                  className="text-xs text-gray-600 leading-relaxed list-disc pl-4"
                  content={i.description}
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {education?.length > 0 && (
        <section>
          <h3 className="text-xs font-bold uppercase tracking-widest text-gray-900 border-b border-gray-200 pb-1 mb-4">
            Học vấn
          </h3>
          <div className="flex flex-col gap-4">
            {education.map((i) => (
              <div key={i.id} className="break-inside-avoid">
                <div className="flex justify-between items-baseline mb-0.5">
                  <h4 className="text-sm font-bold text-gray-900">{i.title}</h4>
                  <span className="text-[11px] text-blue-500 font-medium whitespace-nowrap ml-2">
                    {formatDateRange(i.startDate, i.endDate)}
                  </span>
                </div>
                <div className="text-xs text-gray-600">
                  {i.company}
                  {i.location ? ` • ${i.location}` : ""}
                </div>
                {(i.major || i.score) && (
                  <div className="text-xs text-gray-500 mt-0.5">
                    {i.major}
                    {i.major && i.score ? " - " : ""}
                    {i.score}
                  </div>
                )}
                {i.description && (
                  <RichTextContent
                    className="text-xs text-gray-600 leading-relaxed list-disc pl-4 mt-1"
                    content={i.description}
                  />
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {project?.length > 0 && (
        <section>
          <h3 className="text-xs font-bold uppercase tracking-widest text-gray-900 border-b border-gray-200 pb-1 mb-4">
            Dự án nổi bật
          </h3>
          <div className="flex flex-col gap-5">
            {project.map((i) => (
              <div key={i.id} className="break-inside-avoid">
                <div className="flex justify-between items-baseline mb-0.5">
                  <h4 className="text-sm font-bold text-gray-900">{i.title}</h4>
                  <span className="text-[11px] text-blue-500 font-medium whitespace-nowrap ml-2">
                    {formatResumeDate(i.date)}
                  </span>
                </div>
                {i.link && (
                  <a
                    href={safeExternalUrl(i.link)}
                    className="text-[11px] text-blue-600 hover:underline block mb-1 break-all"
                  >
                    {i.link}
                  </a>
                )}
                <RichTextContent
                  className="text-xs text-gray-600 leading-relaxed list-disc pl-4 mt-1"
                  content={i.description}
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {certificate?.length > 0 && (
        <section>
          <h3 className="text-xs font-bold uppercase tracking-widest text-gray-900 border-b border-gray-200 pb-1 mb-4">
            Chứng chỉ
          </h3>
          <div className="flex flex-col gap-5">
            {certificate.map((i) => (
              <div key={i.id} className="break-inside-avoid">
                <div className="flex justify-between items-baseline mb-0.5">
                  <h4 className="text-sm font-bold text-gray-900">{i.title}</h4>
                  <span className="text-[11px] text-blue-500 font-medium whitespace-nowrap ml-2">
                    {formatResumeDate(i.date)}
                  </span>
                </div>
                <div className="text-xs font-semibold text-gray-700 mb-1">
                  {i.publisher}
                </div>
                {i.description && (
                  <RichTextContent
                    className="text-xs text-gray-600 leading-relaxed list-disc pl-4 mt-1"
                    content={i.description}
                  />
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {award?.length > 0 && (
        <section>
          <h3 className="text-xs font-bold uppercase tracking-widest text-gray-900 border-b border-gray-200 pb-1 mb-4">
            Giải thưởng
          </h3>
          <div className="flex flex-col gap-4">
            {award.map((i) => (
              <div key={i.id} className="break-inside-avoid">
                <div className="flex justify-between items-baseline mb-0.5">
                  <h4 className="text-sm font-bold text-gray-900">{i.title}</h4>
                  <span className="text-[11px] text-blue-500 font-medium whitespace-nowrap ml-2">
                    {formatResumeDate(i.date)}
                  </span>
                </div>
                <div className="text-xs font-semibold text-gray-600 mb-1">
                  {i.awarder}
                </div>
                {i.description && (
                  <RichTextContent
                    className="text-xs text-gray-600 leading-relaxed list-disc pl-4 mt-1"
                    content={i.description}
                  />
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  </div>
);

const ReferenceSectionLabel = ({ children }) => typeof children === "string" ? <span className="cv-section-text"><span className="cv-section-prefix">{children.slice(0, 3)}</span>{children.slice(3)}</span> : children;

const TemplateSectionTitle = ({ children, className = "" }) => (
  <h3 className={`mb-3 border-b pb-2 text-[11px] font-bold uppercase tracking-[0.18em] ${className}`}>
    {className.includes("cv-reference-heading") ? <ReferenceSectionLabel>{children}</ReferenceSectionLabel> : children}
  </h3>
);

const TemplateBio = ({ bio, headingClass, bodyClass = "text-slate-600" }) => {
  if (!bio) return null;

  return (
    <section className="break-inside-avoid">
      <TemplateSectionTitle className={headingClass}>Giới thiệu</TemplateSectionTitle>
      <RichTextContent
        className={`cv-section-body text-[11px] leading-[1.75] ${bodyClass}`}
        content={bio}
      />
    </section>
  );
};

const TemplateExperience = ({ items, headingClass, dateClass = "text-slate-500", titleClass = "text-slate-900", secondaryClass = "text-slate-600" }) => {
  if (!items?.length) return null;

  return (
    <section>
      <TemplateSectionTitle className={headingClass}>Kinh nghiệm</TemplateSectionTitle>
      <div className="space-y-5">
        {items.map((item, index) => (
          <article key={item.id || `${item.title}-${index}`} className="break-inside-avoid">
            <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
              <div className="min-w-0">
                <h4 className={`text-[13px] font-bold ${titleClass}`}>{item.title}</h4>
                <p className={`cv-item-meta mt-0.5 text-[11px] font-semibold ${secondaryClass}`}>
                  {item.company}{item.location ? ` • ${item.location}` : ""}
                </p>
              </div>
              <span className={`cv-item-date shrink-0 text-[10px] font-semibold ${dateClass}`}>
                {formatDateRange(item.startDate, item.endDate)}
              </span>
            </div>
            {item.description && (
              <RichTextContent
                className={`cv-item-description mt-2 pl-3 text-[11px] leading-[1.65] ${secondaryClass}`}
                content={item.description}
              />
            )}
          </article>
        ))}
      </div>
    </section>
  );
};

const TemplateEducation = ({
  items,
  headingClass,
  titleClass = "text-slate-900",
  secondaryClass = "text-slate-600",
  dateClass = "text-slate-500",
}) => {
  if (!items?.length) return null;

  return (
    <section>
      <TemplateSectionTitle className={headingClass}>Học vấn</TemplateSectionTitle>
      <div className="space-y-4">
        {items.map((item, index) => (
          <article key={item.id || `${item.title}-${index}`} className="break-inside-avoid">
            <h4 className={`text-[12px] font-bold leading-5 ${titleClass}`}>{item.title}</h4>
            <p className={`cv-item-meta mt-0.5 text-[10px] font-semibold leading-4 ${secondaryClass}`}>{item.company}{item.location ? ` • ${item.location}` : ""}</p>
            <p className={`cv-item-date mt-1 text-[10px] ${dateClass}`}>
              {formatDateRange(item.startDate, item.endDate)}
            </p>
            {item.description && <RichTextContent className={`cv-item-description mt-1 text-[10px] leading-[1.5] ${secondaryClass}`} content={item.description} />}
            {(item.major || item.score) && (
              <p className={`cv-item-meta mt-1 text-[10px] leading-4 ${secondaryClass}`}>
                {[item.major, item.score].filter(Boolean).join(" • ")}
              </p>
            )}
          </article>
        ))}
      </div>
    </section>
  );
};

const TemplateProjects = ({ items, headingClass, accentClass = "text-violet-700", titleClass = "text-slate-900", secondaryClass = "text-slate-600" }) => {
  if (!items?.length) return null;

  return (
    <section>
      <TemplateSectionTitle className={headingClass}>Dự án</TemplateSectionTitle>
      <div className="space-y-4">
        {items.map((item, index) => (
          <article key={item.id || `${item.title}-${index}`} className="break-inside-avoid">
            <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
              <h4 className={`text-[12px] font-bold ${titleClass}`}>{item.title}</h4>
              {item.date && <span className={`cv-item-date shrink-0 text-[10px] font-semibold ${accentClass}`}>{formatResumeDate(item.date)}</span>}
            </div>
            {item.link && <p className={`cv-item-meta mt-1 break-all text-[10px] ${accentClass}`}>{item.link}</p>}
            {item.description && (
              <RichTextContent
                className={`cv-item-description mt-1.5 pl-3 text-[11px] leading-[1.65] ${secondaryClass}`}
                content={item.description}
              />
            )}
          </article>
        ))}
      </div>
    </section>
  );
};

const TemplateCredentials = ({ items, title, headingClass, metaKey, titleClass = "text-slate-900", secondaryClass = "text-slate-500", dateClass = "text-slate-500" }) => {
  if (!items?.length) return null;

  return (
    <section>
      <TemplateSectionTitle className={headingClass}>{title}</TemplateSectionTitle>
      <div className="space-y-3">
        {items.map((item, index) => (
          <article key={item.id || `${item.title}-${index}`} className="break-inside-avoid">
            <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
              <h4 className={`text-[11px] font-bold leading-4 ${titleClass}`}>{item.title}</h4>
              {item.date && <span className={`cv-item-date shrink-0 text-[9px] font-semibold ${dateClass}`}>{formatResumeDate(item.date)}</span>}
            </div>
            {item[metaKey] && <p className={`cv-item-meta mt-0.5 text-[10px] font-semibold ${secondaryClass}`}>{item[metaKey]}</p>}
            {item.description && (
              <RichTextContent
                className={`cv-item-description mt-1 text-[10px] leading-4 ${secondaryClass}`}
                content={item.description}
              />
            )}
          </article>
        ))}
      </div>
    </section>
  );
};

const TemplateSimpleList = ({
  items,
  title,
  headingClass,
  titleClass = "text-slate-800",
  secondaryClass = "text-slate-500",
  dotClass = "bg-slate-400",
}) => {
  if (!items?.length) return null;

  return (
    <section>
      <TemplateSectionTitle className={headingClass}>{title}</TemplateSectionTitle>
      <div className="cv-simple-list space-y-2.5">
        {items.map((item, index) => (
          <div key={item.id || `${item.title}-${index}`} className="break-inside-avoid">
            <div className="flex items-center gap-2">
              <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${dotClass}`} />
              <span className={`cv-list-title text-[11px] font-bold ${titleClass}`}>{item.title}</span>
            </div>
            {item.description && <p className={`cv-item-meta mt-0.5 pl-3.5 text-[9px] leading-4 ${secondaryClass}`}>{item.description}</p>}
          </div>
        ))}
      </div>
    </section>
  );
};

const TemplatePlainSkills = ({ items, headingClass, titleClass = "text-slate-900" }) => {
  if (!items?.length) return null;
  return (
    <section>
      <TemplateSectionTitle className={headingClass}>Kỹ năng</TemplateSectionTitle>
      <ul className={`cv-skill-list list-disc space-y-1.5 pl-3.5 text-[11px] leading-[1.5] ${titleClass}`}>
        {items.map((item, index) => <li key={item.id || `${item.title}-${index}`} className="break-inside-avoid break-words">{item.title}</li>)}
      </ul>
    </section>
  );
};

const AtsSectionTitle = ({ children }) => (
  <h3 className="mb-1.5 border-b border-slate-400 pb-1 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-950">
    {children}
  </h3>
);

const CompactExperience = ({ items }) => {
  if (!items?.length) return null;

  return (
    <section>
      <AtsSectionTitle>Kinh nghiệm làm việc</AtsSectionTitle>
      <div className="space-y-2.5">
        {items.map((item, index) => (
          <article key={item.id || `${item.title}-${index}`} className="break-inside-avoid">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h4 className="text-[12px] font-bold text-slate-950">{item.title}</h4>
                <p className="mt-0.5 text-[10px] font-semibold text-slate-700">
                  {item.company}{item.location ? ` • ${item.location}` : ""}
                </p>
              </div>
              <p className="shrink-0 whitespace-nowrap text-right text-[9px] font-semibold text-slate-600">
                {formatDateRange(item.startDate, item.endDate)}
              </p>
            </div>
            {item.description && (
              <RichTextContent
                className="mt-1 text-[10px] leading-[1.45] text-slate-600"
                content={item.description}
              />
            )}
          </article>
        ))}
      </div>
    </section>
  );
};

const CompactEducation = ({ items }) => {
  if (!items?.length) return null;

  return (
    <section>
      <AtsSectionTitle>Học vấn</AtsSectionTitle>
      <div className="space-y-2.5">
        {items.map((item, index) => (
          <article key={item.id || `${item.title}-${index}`} className="break-inside-avoid">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h4 className="text-[11px] font-bold text-slate-950">{item.title}</h4>
                <p className="mt-0.5 text-[10px] font-semibold text-slate-700">
                  {item.company}{item.location ? ` • ${item.location}` : ""}
                </p>
              </div>
              <p className="shrink-0 whitespace-nowrap text-right text-[9px] font-semibold text-slate-600">
                {formatDateRange(item.startDate, item.endDate)}
              </p>
            </div>
            {(item.major || item.score) && <p className="mt-1 text-[9px] text-slate-600">{[item.major, item.score].filter(Boolean).join(" • ")}</p>}
            {item.description && <RichTextContent className="mt-0.5 text-[9px] leading-[1.45] text-slate-600" content={item.description} />}
          </article>
        ))}
      </div>
    </section>
  );
};

const AtsSkills = ({ items }) => {
  if (!items?.length) return null;
  return (
    <section>
      <AtsSectionTitle>Kỹ năng</AtsSectionTitle>
      <ul className="list-disc space-y-1 pl-3.5 text-[10px] leading-[1.4] text-slate-700">
        {items.map((item, index) => <li key={item.id || `${item.title}-${index}`} className="break-inside-avoid break-words">{item.title}</li>)}
      </ul>
    </section>
  );
};

const AtsProjects = ({ items }) => {
  if (!items?.length) return null;

  return (
    <section>
      <AtsSectionTitle>Dự án</AtsSectionTitle>
      <div className="space-y-2">
        {items.map((item, index) => (
          <article key={item.id || `${item.title}-${index}`} className="break-inside-avoid">
            <div className="flex items-start justify-between gap-4">
              <h4 className="text-[10px] font-bold text-slate-950">{item.title}</h4>
              {item.date && <span className="shrink-0 text-[9px] font-semibold text-slate-600">{formatResumeDate(item.date)}</span>}
            </div>
            {item.link && <p className="mt-0.5 text-[9px] text-slate-600">{item.link}</p>}
            {item.description && (
              <RichTextContent className="mt-0.5 text-[9px] leading-[1.45] text-slate-600" content={item.description} />
            )}
          </article>
        ))}
      </div>
    </section>
  );
};

const AtsCredentials = ({ items, title, metaKey }) => {
  if (!items?.length) return null;

  return (
    <section>
      <AtsSectionTitle>{title}</AtsSectionTitle>
      <div className="space-y-1.5">
        {items.map((item, index) => (
          <article key={item.id || `${item.title}-${index}`} className="break-inside-avoid text-[9px] leading-[1.4] text-slate-600">
            <div className="flex items-start justify-between gap-4">
              <span className="font-bold text-slate-950">{item.title}</span>
              {item.date && <span className="shrink-0 font-semibold">{formatResumeDate(item.date)}</span>}
            </div>
            {item[metaKey] && <p>{item[metaKey]}</p>}
            {item.description && <RichTextContent content={item.description} />}
          </article>
        ))}
      </div>
    </section>
  );
};

const AtsInlineList = ({ items, title }) => {
  if (!items?.length) return null;

  return (
    <section>
      <AtsSectionTitle>{title}</AtsSectionTitle>
      <p className="text-[9px] leading-[1.5] text-slate-700">
        {items.map((item, index) => (
          <React.Fragment key={item.id || `${item.title}-${index}`}>
            {index > 0 && " • "}
            <span className="font-semibold text-slate-900">{item.title}</span>
            {item.description && <span> ({item.description})</span>}
          </React.Fragment>
        ))}
      </p>
    </section>
  );
};

const ElegantTemplate = ({
  image,
  personalInfo,
  bio,
  profile,
  experience,
  education,
  skill,
  project,
  award,
  hobby,
  language,
  certificate,
}) => (
  <div className="cv-print-layout cv-basic-layout min-w-0 w-full h-full min-h-0 overflow-hidden bg-white p-10 font-sans text-slate-800 print:p-8">
    <header className="border-b-2 border-slate-900 pb-6">
      <div className="flex items-start justify-between gap-8">
        <div className="min-w-0 flex-1">
          <h1 className="text-[34px] font-semibold leading-[1.08] tracking-[-0.035em] text-slate-950">{personalInfo.fullName}</h1>
          <h2 className="mt-2 text-[13px] font-medium uppercase tracking-[0.18em] text-slate-500">{personalInfo.jobTitle}</h2>
        </div>
        {image && <img src={image} alt="Profile" className="h-20 w-20 shrink-0 rounded-sm object-cover grayscale" />}
      </div>
      <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2">
        <ContactItem icon={EnvelopeIcon} text={personalInfo.email} />
        <ContactItem icon={PhoneIcon} text={personalInfo.phone} />
        <ContactItem icon={MapPinIcon} text={personalInfo.location} />
        <ContactItem icon={GlobeAltIcon} text={personalInfo.website} link={personalInfo.website} />
        {profile?.map((item, index) => <ContactItem key={item.id || index} icon={GlobeAltIcon} text={item.networkName || item.link} link={item.link} />)}
      </div>
    </header>

    <div className="mt-7">
      <TemplateBio bio={bio} headingClass="border-slate-300 text-slate-950" />
    </div>

    <div className="resume-two-column-grid mt-6 grid grid-cols-12 gap-8">
      <main className="col-span-8 min-w-0 space-y-6">
        <TemplateExperience items={experience} headingClass="border-slate-300 text-slate-950" dateClass="text-slate-500" />
        <TemplateEducation items={education} headingClass="border-slate-300 text-slate-950" dateClass="text-slate-500" />
        <TemplateProjects items={project} headingClass="border-slate-300 text-slate-950" accentClass="text-slate-700" />
        <TemplateCredentials items={certificate} title="Chứng chỉ" headingClass="border-slate-300 text-slate-950" metaKey="publisher" />
        <TemplateCredentials items={award} title="Giải thưởng" headingClass="border-slate-300 text-slate-950" metaKey="awarder" />
      </main>
      <aside className="col-span-4 min-w-0 space-y-6 border-l border-slate-200 pl-6">
        <TemplatePlainSkills items={skill} headingClass="border-slate-300 text-slate-950" />
        <TemplateSimpleList items={language} title="Ngoại ngữ" headingClass="border-slate-300 text-slate-950" dotClass="bg-slate-800" />
        <TemplateSimpleList items={hobby} title="Sở thích" headingClass="border-slate-300 text-slate-950" dotClass="bg-slate-800" />
      </aside>
    </div>
  </div>
);

const CreativeTemplate = ({
  image,
  personalInfo,
  bio,
  profile,
  experience,
  education,
  skill,
  project,
  award,
  hobby,
  language,
  certificate,
}) => (
  <div className="cv-print-layout min-w-0 w-full flex h-full min-h-0 flex-col overflow-hidden bg-white font-sans text-slate-800">
    <header className="bg-teal-800 px-10 py-8 text-white print:py-7">
      <div className="flex items-center gap-7">
        {image ? (
          <img src={image} alt="Profile" className="h-24 w-24 shrink-0 rounded-full border-4 border-white/30 object-cover" />
        ) : (
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border border-white/30 bg-white/10 text-3xl font-black">
            {personalInfo.fullName?.charAt(0) || "CV"}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="text-[36px] font-black leading-[1.08] tracking-[-0.04em]">{personalInfo.fullName}</h1>
          <h2 className="mt-2 text-[13px] font-semibold uppercase tracking-[0.16em] text-teal-100">{personalInfo.jobTitle}</h2>
        </div>
      </div>
      <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-[10px] text-teal-50">
        {[personalInfo.email, personalInfo.phone, personalInfo.location, personalInfo.website].filter(Boolean).map((item) => <span key={item} className="min-w-0 max-w-full break-words">{item}</span>)}
        {profile?.map((item, index) => <span key={item.id || index} className="min-w-0 max-w-full break-words">{item.networkName || item.link}</span>)}
      </div>
    </header>

    <div className="resume-two-column-grid grid min-h-0 flex-1 grid-cols-12">
      <main className="col-span-8 min-w-0 space-y-6 px-10 py-7 print:py-6">
        <TemplateBio bio={bio} headingClass="border-teal-200 text-teal-800" />
        <TemplateExperience items={experience} headingClass="border-teal-200 text-teal-800" dateClass="text-teal-700" />
        <TemplateProjects items={project} headingClass="border-teal-200 text-teal-800" accentClass="text-teal-700" />
        <TemplateCredentials items={certificate} title="Chứng chỉ" headingClass="border-teal-200 text-teal-800" metaKey="publisher" />
        <TemplateCredentials items={award} title="Giải thưởng" headingClass="border-teal-200 text-teal-800" metaKey="awarder" />
      </main>
      <aside className="col-span-4 min-w-0 space-y-6 bg-teal-50 px-7 py-7 print:py-6">
        <TemplatePlainSkills items={skill} headingClass="border-teal-300 text-teal-900" secondaryClass="text-teal-700" dividerClass="border-teal-200" />
        <TemplateEducation items={education} headingClass="border-teal-300 text-teal-900" dateClass="text-teal-700" />
        <TemplateSimpleList items={language} title="Ngoại ngữ" headingClass="border-teal-300 text-teal-900" dotClass="bg-teal-700" />
        <TemplateSimpleList items={hobby} title="Sở thích" headingClass="border-teal-300 text-teal-900" dotClass="bg-teal-700" />
      </aside>
    </div>
  </div>
);

const CompactTemplate = ({
  personalInfo,
  bio,
  profile,
  experience,
  education,
  skill,
  project,
  award,
  hobby,
  language,
  certificate,
}) => (
  <div className="cv-print-layout cv-basic-layout h-full min-h-0 overflow-hidden bg-white p-8 font-sans text-slate-800 print:p-6">
    <header className="border-b border-slate-900 pb-4">
      <h1 className="text-[28px] font-bold uppercase leading-tight tracking-[0.025em] text-slate-950">{personalInfo.fullName}</h1>
      <h2 className="mt-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-700">{personalInfo.jobTitle}</h2>
      <div className="mt-2.5 flex flex-wrap gap-x-3 gap-y-1 text-[9px] font-medium text-slate-600">
        {[personalInfo.email, personalInfo.phone, personalInfo.location, personalInfo.website].filter(Boolean).map((item) => <span key={item} className="min-w-0 max-w-full break-words">{item}</span>)}
        {profile?.map((item, index) => <span key={item.id || index} className="min-w-0 max-w-full break-words">{item.link || item.username || item.networkName}</span>)}
      </div>
    </header>

    <main className="mt-4 space-y-4">
      {bio && (
        <section>
          <AtsSectionTitle>Tóm tắt nghề nghiệp</AtsSectionTitle>
          <RichTextContent className="text-[10px] leading-[1.55] text-slate-700" content={bio} />
        </section>
      )}
      <CompactExperience items={experience} />
      <CompactEducation items={education} />
      <AtsSkills items={skill} />
      <AtsProjects items={project} />
      <AtsCredentials items={certificate} title="Chứng chỉ" metaKey="publisher" />
      <AtsCredentials items={award} title="Giải thưởng" metaKey="awarder" />
      <AtsInlineList items={language} title="Ngoại ngữ" />
      <AtsInlineList items={hobby} title="Sở thích" />
    </main>
  </div>
);

const CUSTOM_TEMPLATE_THEMES = {
  classic: {
    accent: "border-slate-300 text-slate-900",
    secondary: "text-slate-600",
    sidebar: "border-l border-slate-200 pl-6",
  },
  modern: {
    accent: "border-blue-200 text-blue-800",
    secondary: "text-blue-700",
    sidebar: "rounded-xl bg-slate-50 p-5",
  },
  professional: {
    accent: "border-gray-200 text-gray-900",
    secondary: "text-blue-600",
  },
  elegant: {
    accent: "border-slate-300 text-slate-950",
    secondary: "text-slate-500",
    sidebar: "border-l border-slate-200 pl-6",
  },
  creative: {
    accent: "border-teal-200 text-teal-800",
    secondary: "text-teal-700",
    sidebar: "rounded-xl bg-teal-50 p-5",
  },
  compact: {
    accent: "border-slate-400 text-slate-950",
    secondary: "text-slate-600",
    sidebar: "",
  },
};

const DARK_SIDEBAR_THEME = {
  accent: "border-gray-700 text-gray-400",
  title: "text-gray-100",
  secondary: "text-gray-300",
  body: "text-gray-300",
  dot: "bg-gray-400",
};

const DynamicResumeSection = ({ section, data, theme, compact }) => {
  if (section.startsWith("custom:")) {
    const item = data.customSections?.find((entry) => customSectionKey(entry.id) === section);
    if (!item) return null;
    return (
      <section data-custom-section={item.id}>
        <h3 className={`mb-3 border-b pb-1 text-xs font-bold uppercase break-words ${theme.accent}`}>{theme.reference ? <ReferenceSectionLabel>{item.title}</ReferenceSectionLabel> : item.title}</h3>
        <div className={`cv-section-body space-y-3 text-[10px] leading-[1.55] ${theme.body || "text-slate-700"}`}>
          {item.items.map((entry) => <article key={entry.id} className="break-inside-avoid break-words">
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
              {entry.title && <h4 className={`min-w-0 font-bold ${theme.title || "text-slate-900"}`}>{entry.title}</h4>}
              {item.fields.dates && (entry.startDate || entry.endDate) && <span className="cv-item-date text-[9px]">{formatDateRange(entry.startDate, entry.endDate)}</span>}
            </div>
            {(item.fields.organization || item.fields.location) && <p className="cv-item-meta">{[item.fields.organization && entry.organization, item.fields.location && entry.location].filter(Boolean).join(" · ")}</p>}
            {item.fields.link && safeExternalUrl(entry.link) && <a href={safeExternalUrl(entry.link)} target="_blank" rel="noopener noreferrer" className={`block break-all underline ${theme.secondary}`}>{entry.link}</a>}
            {item.fields.description && entry.description && <RichTextContent content={entry.description} className="mt-1" />}
            {entry.details.filter((detail) => detail.label && detail.value).map((detail, index) => <p key={`${detail.id}-${index}`} className="mt-0.5 whitespace-pre-wrap"><span className="font-semibold">{detail.label}: </span>{detail.value}</p>)}
          </article>)}
        </div>
      </section>
    );
  }
  if (compact) {
    switch (section) {
      case "bio":
        return data.bio ? (
          <section>
            <AtsSectionTitle>Tóm tắt nghề nghiệp</AtsSectionTitle>
            <RichTextContent className="text-[10px] leading-[1.55] text-slate-700" content={data.bio} />
          </section>
        ) : null;
      case "experience": return <CompactExperience items={data.experience} />;
      case "education": return <CompactEducation items={data.education} />;
      case "skill": return <AtsSkills items={data.skill} />;
      case "project": return <AtsProjects items={data.project} />;
      case "certificate": return <AtsCredentials items={data.certificate} title="Chứng chỉ" metaKey="publisher" />;
      case "award": return <AtsCredentials items={data.award} title="Giải thưởng" metaKey="awarder" />;
      case "language": return <AtsInlineList items={data.language} title="Ngoại ngữ" />;
      case "hobby": return <AtsInlineList items={data.hobby} title="Sở thích" />;
      default: return null;
    }
  }

  switch (section) {
    case "bio":
      return <TemplateBio bio={data.bio} headingClass={theme.accent} bodyClass={theme.body} />;
    case "experience":
      return <TemplateExperience items={data.experience} headingClass={theme.accent} dateClass={theme.secondary} titleClass={theme.title} secondaryClass={theme.body} />;
    case "education":
      return <TemplateEducation items={data.education} headingClass={theme.accent} dateClass={theme.secondary} titleClass={theme.title} secondaryClass={theme.body} />;
    case "project":
      return <TemplateProjects items={data.project} headingClass={theme.accent} accentClass={theme.secondary} titleClass={theme.title} secondaryClass={theme.body} />;
    case "certificate":
      return <TemplateCredentials items={data.certificate} title="Chứng chỉ" headingClass={theme.accent} metaKey="publisher" titleClass={theme.title} secondaryClass={theme.body} dateClass={theme.secondary} />;
    case "award":
      return <TemplateCredentials items={data.award} title="Giải thưởng" headingClass={theme.accent} metaKey="awarder" titleClass={theme.title} secondaryClass={theme.body} dateClass={theme.secondary} />;
    case "skill":
      return <TemplatePlainSkills items={data.skill} headingClass={theme.accent} titleClass={theme.title} />;
    case "language":
      return <TemplateSimpleList items={data.language} title="Ngoại ngữ" headingClass={theme.accent} titleClass={theme.title} secondaryClass={theme.body} dotClass={theme.dot} />;
    case "hobby":
      return <TemplateSimpleList items={data.hobby} title="Sở thích" headingClass={theme.accent} titleClass={theme.title} secondaryClass={theme.body} dotClass={theme.dot} />;
    default:
      return null;
  }
};

const CustomResumeContacts = ({ data, dark = false, centered = false }) => (
  <div className={`flex flex-wrap gap-x-4 gap-y-1.5 text-[10px] leading-4 ${centered ? "justify-center" : ""} ${dark ? "text-gray-300" : "text-slate-600"}`}>
    {[
      [EnvelopeIcon, data.personalInfo.email],
      [PhoneIcon, data.personalInfo.phone],
      [MapPinIcon, data.personalInfo.location],
      [GlobeAltIcon, data.personalInfo.website, data.personalInfo.website],
      ...(data.profile || []).map((item) => [GlobeAltIcon, item.networkName || item.link, item.link]),
    ].filter(([, text]) => text).map(([_Icon, text, link], index) => {
      const content = <><_Icon className="mt-0.5 h-3 w-3 shrink-0" /><span className="min-w-0 break-words [overflow-wrap:break-word]">{text}</span></>;
      const href = safeExternalUrl(link);
      return href ? (
        <a key={index} href={href} target="_blank" rel="noopener noreferrer" className="flex min-w-0 max-w-full items-start gap-1.5">{content}</a>
      ) : <span key={index} className="flex min-w-0 max-w-full items-start gap-1.5">{content}</span>;
    })}
  </div>
);

const CustomResumeAvatar = ({ data, className, placeholder = false }) => data.image ? (
  <img data-resume-static src={data.image} alt="Profile" className={`shrink-0 object-cover ${className}`} />
) : placeholder ? (
  <div data-resume-static className={`flex shrink-0 items-center justify-center text-2xl font-bold ${className}`}>
    {data.personalInfo.fullName?.charAt(0) || "?"}
  </div>
) : null;

const ADDITIONAL_TEMPLATE_THEMES = {
  executive: { accent: "text-neutral-800", secondary: "text-neutral-600" },
  timeline: { accent: "text-teal-800", secondary: "text-teal-700" },
  editorial: { accent: "text-rose-900", secondary: "text-neutral-600" },
  technology: { accent: "text-blue-800", secondary: "text-blue-700" },
  graduate: { accent: "text-neutral-900", secondary: "text-neutral-600" },
  nordic: { accent: "text-sky-800", secondary: "text-neutral-600" },
  portfolio: { accent: "text-teal-900", secondary: "text-teal-700" },
};

const AdditionalTemplate = ({ selectedTemplate, layout, thumbnail = false, ...data }) => {
  const zones = getTemplateLayout(layout, selectedTemplate, data.customSections);
  const definition = ADDITIONAL_RESUME_TEMPLATES.find((template) => template.id === selectedTemplate);
  const theme = ADDITIONAL_TEMPLATE_THEMES[selectedTemplate];
  const renderZone = (sections) => (thumbnail ? sections.slice(0, 3) : sections).map((section) => thumbnail ? (
    <section key={section}>
      <h3 className="mb-3 border-b pb-1 text-xs font-bold uppercase">{RESUME_SECTION_LABELS[section]}</h3>
      <div className="space-y-2"><div className="h-2 w-3/4 bg-slate-300" /><div className="h-1.5 bg-slate-200" /><div className="h-1.5 w-5/6 bg-slate-200" /></div>
    </section>
  ) : <DynamicResumeSection key={section} section={section} data={data} theme={theme} />);
  const centered = ["editorial", "graduate"].includes(selectedTemplate);
  const avatar = ["timeline", "nordic", "portfolio"].includes(selectedTemplate) ? <CustomResumeAvatar data={data} placeholder={selectedTemplate === "portfolio" || thumbnail} className="cv-reference-avatar h-24 w-24 rounded-full bg-gray-100 text-teal-800" /> : null;
  const header = (
    <header className="cv-new-header">
      <div className="cv-new-identity">
        {avatar}
        <div className="min-w-0 flex-1">
          <h1 className="cv-new-name">{data.personalInfo.fullName}</h1>
          <h2 className="cv-new-job">{data.personalInfo.jobTitle}</h2>
        </div>
      </div>
      <div className="cv-new-contact"><CustomResumeContacts data={data} centered={centered} /></div>
    </header>
  );
  const sidebarHeader = selectedTemplate === "portfolio";
  const sidebarLeft = definition.sidebarPosition === "left";
  const sidebar = <aside data-resume-zone="sidebar" className="cv-new-sidebar">{sidebarHeader && header}{renderZone(zones.sidebar)}</aside>;
  const main = <main data-resume-zone="main" className="cv-new-main">{renderZone(zones.main)}</main>;
  const columns = <>{sidebarLeft && sidebar}{main}{!sidebarLeft && sidebar}</>;
  return (
    <div data-resume-template={selectedTemplate} data-reference-template={definition.source.name} data-template-format={definition.format} className={`cv-print-layout cv-additional-template cv-new-${selectedTemplate}`}>
      {!sidebarHeader && header}
      <div className={`cv-new-grid ${definition.format !== "two-column" ? "cv-new-single" : ""}`}>{columns}</div>
    </div>
  );
};

// Reuse the real layout and palette, without mounting seven full CVs/fit observers.
export function AdditionalResumeThumbnail({ template }) {
  return <AdditionalTemplate selectedTemplate={template} thumbnail customSections={[]} profile={[]} personalInfo={{ fullName: "Họ và tên", jobTitle: "Vị trí công việc", email: "email@example.com" }} />;
}

const CustomizableTemplate = ({ selectedTemplate, layout, paginated = false, ...data }) => {
  const zones = getTemplateLayout(layout, selectedTemplate, data.customSections);
  const theme = CUSTOM_TEMPLATE_THEMES[selectedTemplate] || CUSTOM_TEMPLATE_THEMES.modern;
  const compact = selectedTemplate === "compact";
  const creative = selectedTemplate === "creative";
  const renderZone = (sections, zoneTheme = theme) => sections.map((section) => (
    <DynamicResumeSection key={section} section={section} data={data} theme={zoneTheme} compact={compact} />
  ));
  const name = data.personalInfo.fullName;
  const jobTitle = data.personalInfo.jobTitle;

  if (selectedTemplate === "classic") {
    return (
      <div data-resume-template="classic" className="cv-print-layout cv-basic-layout h-full min-h-0 min-w-0 w-full overflow-hidden bg-white p-10 font-sans text-gray-800 print:p-6">
        <header className="mb-8 flex flex-col items-center text-center">
          <CustomResumeAvatar data={data} className="mb-4 h-24 w-24 rounded-full" />
          <h1 className="mb-1 break-words text-3xl font-bold uppercase tracking-wider text-gray-900">{name}</h1>
          <h2 className="mb-4 break-words text-sm font-medium uppercase tracking-wider text-gray-500">{jobTitle}</h2>
          <CustomResumeContacts data={data} centered />
        </header>
        <div className="resume-basic-grid grid grid-cols-12 gap-8 print:gap-4">
          {zones.sidebar.length > 0 && <aside data-resume-zone="sidebar" className="col-span-4 min-w-0 space-y-6">{renderZone(zones.sidebar)}</aside>}
          <main data-resume-zone="main" className={`${zones.sidebar.length ? "col-span-8" : "col-span-12"} min-w-0 space-y-6`}>{renderZone(zones.main)}</main>
        </div>
      </div>
    );
  }

  if (selectedTemplate === "modern") {
    return (
      <div data-resume-template="modern" className="cv-print-layout min-w-0 w-full h-full min-h-0 overflow-hidden bg-white font-sans text-gray-800">
        <div className="resume-two-column-grid grid min-h-full grid-cols-12">
          <main data-resume-zone="main" className="cv-modern-main col-span-8 min-w-0 space-y-6 bg-white p-10 print:p-6">
            <header className="mb-8">
              <h1 className="mb-1 break-words text-4xl font-extrabold tracking-tight text-gray-900">{name}</h1>
              <h2 className="mb-4 break-words text-base font-medium uppercase tracking-widest text-blue-700">{jobTitle}</h2>
              <CustomResumeContacts data={data} />
            </header>
            {renderZone(zones.main)}
          </main>
          <aside data-resume-zone="sidebar" className="cv-modern-sidebar col-span-4 min-w-0 space-y-6 border-l border-gray-200 bg-gray-50 p-10 print:p-6">
            <CustomResumeAvatar data={data} className="mb-6 h-28 w-28 rounded-2xl" />
            {renderZone(zones.sidebar)}
          </aside>
        </div>
      </div>
    );
  }

  if (selectedTemplate === "professional") {
    return (
      <div data-resume-template="professional" className="cv-print-layout flex h-full min-h-0 min-w-0 w-full overflow-hidden bg-white font-sans">
        <aside data-resume-zone="sidebar" className="cv-sidebar w-[30%] min-w-0 shrink-0 space-y-6 bg-gray-900 p-6 text-white print:p-5">
          <header className="flex flex-col items-center text-center">
            <CustomResumeAvatar data={data} placeholder className="cv-avatar mb-3 h-24 w-24 rounded-full border-2 border-gray-600 bg-gray-800 text-gray-400" />
            <h1 className="mb-1 break-words text-xl font-bold uppercase leading-tight tracking-tight">{name}</h1>
            <h2 className="w-full break-words text-xs font-medium uppercase tracking-widest text-gray-400">{jobTitle}</h2>
          </header>
          <section data-resume-static>
            <TemplateSectionTitle className={DARK_SIDEBAR_THEME.accent}>Liên hệ</TemplateSectionTitle>
            <CustomResumeContacts data={data} dark />
          </section>
          {renderZone(zones.sidebar, DARK_SIDEBAR_THEME)}
        </aside>
        <main data-resume-zone="main" className="cv-main-content min-w-0 flex-1 space-y-6 p-8 print:p-6">{renderZone(zones.main)}</main>
      </div>
    );
  }

  const header = (
    <header className={creative ? "bg-teal-800 px-10 py-8 text-white" : "border-b-2 border-slate-900 pb-6"}>
      <div className={`flex items-start gap-7 ${creative ? "items-center" : "justify-between"}`}>
        {creative && <CustomResumeAvatar data={data} placeholder className="h-20 w-20 rounded-full border border-white/30 bg-white/10" />}
        <div className="min-w-0 flex-1">
          <h1 className={`break-words leading-[1.08] ${creative ? "text-[36px] font-black tracking-[-0.04em]" : "text-[34px] font-semibold tracking-[-0.035em] text-slate-950"}`}>{name}</h1>
          <h2 className={`mt-2 break-words text-[13px] font-medium uppercase tracking-[0.18em] ${creative ? "text-teal-100" : "text-slate-500"}`}>{jobTitle}</h2>
        </div>
        {!creative && !compact && <CustomResumeAvatar data={data} className="h-20 w-20 rounded-sm grayscale" />}
      </div>
      <div className="mt-5"><CustomResumeContacts data={data} dark={creative} /></div>
    </header>
  );

  if (compact) {
    return (
      <div data-resume-template="compact" className="cv-print-layout cv-basic-layout h-full min-h-0 overflow-hidden bg-white p-8 font-sans text-slate-800 print:p-6">
        {header}
        <main data-resume-zone="main" className="mt-4 space-y-4">{renderZone(zones.main)}</main>
      </div>
    );
  }

  if (creative) {
    return (
      <div data-resume-template="creative" className="cv-print-layout flex h-full min-h-0 min-w-0 w-full flex-col overflow-hidden bg-white font-sans text-slate-800">
        {header}
        <div className="resume-two-column-grid grid min-h-0 flex-1 grid-cols-12">
          <main data-resume-zone="main" className="col-span-8 min-w-0 space-y-6 px-10 py-7">{renderZone(zones.main)}</main>
          <aside data-resume-zone="sidebar" className="col-span-4 min-w-0 space-y-6 bg-teal-50 px-7 py-7">{renderZone(zones.sidebar)}</aside>
        </div>
      </div>
    );
  }

  // Keep the default full-width introduction unless the user explicitly moved it.
  const fullWidthBio = !paginated && !isTemplateLayoutCustomized(layout, selectedTemplate) && zones.main.includes("bio");
  const mainSections = fullWidthBio ? zones.main.filter((section) => section !== "bio") : zones.main;
  return (
    <div data-resume-template="elegant" className="cv-print-layout cv-basic-layout h-full min-h-0 min-w-0 w-full overflow-hidden bg-white p-10 font-sans text-slate-800 print:p-8">
      {header}
      {fullWidthBio && <div className="mt-7">{renderZone(["bio"])}</div>}
      <div className="resume-two-column-grid mt-6 grid grid-cols-12 gap-8">
        <main data-resume-zone="main" className={`${zones.sidebar.length ? "col-span-8" : "col-span-12"} min-w-0 space-y-6`}>{renderZone(mainSections)}</main>
        {zones.sidebar.length > 0 && <aside data-resume-zone="sidebar" className="col-span-4 min-w-0 space-y-6 border-l border-slate-200 pl-6">{renderZone(zones.sidebar)}</aside>}
      </div>
    </div>
  );
};

export default function ResumePreview({
  selectedTemplate = "modern",
  pageCount = 1,
  layout,
  customSections = [],
  image,
  personalInfo,
  bio,
  profile,
  experience,
  education,
  skill,
  project,
  award,
  hobby,
  language,
  certificate,
}) {
  const template = RESUME_TEMPLATE_KEYS.includes(selectedTemplate)
    ? selectedTemplate
    : "modern";

  const commonProps = {
    customSections: normalizeCustomSections(customSections),
    image,
    personalInfo,
    bio,
    profile,
    experience,
    education,
    skill: normalizeSkillNames(skill),
    project,
    award,
    hobby,
    language,
    certificate,
  };

  if (normalizeResumePageCount(pageCount) === 2) {
    return <ResumePages>{ADDITIONAL_RESUME_TEMPLATES.some((item) => item.id === template)
      ? <AdditionalTemplate selectedTemplate={template} layout={layout} {...commonProps} />
      : <CustomizableTemplate selectedTemplate={template} layout={layout} paginated {...commonProps} />}</ResumePages>;
  }

  return (
    <AutoFitResumePage>
      {ADDITIONAL_RESUME_TEMPLATES.some((item) => item.id === template) ? (
        <AdditionalTemplate selectedTemplate={template} layout={layout} {...commonProps} />
      ) : isTemplateLayoutCustomized(layout, template) || customSections.length > 0 ? (
        <CustomizableTemplate selectedTemplate={template} layout={layout} {...commonProps} />
      ) : <>
      {template === "classic" && <BasicTemplate {...commonProps} />}
      {template === "modern" && <ModernTemplate {...commonProps} />}
      {template === "professional" && (
        <ProfessionalTemplate {...commonProps} />
      )}
      {template === "elegant" && <ElegantTemplate {...commonProps} />}
      {template === "creative" && <CreativeTemplate {...commonProps} />}
      {template === "compact" && <CompactTemplate {...commonProps} />}
      </>}
    </AutoFitResumePage>
  );
}
