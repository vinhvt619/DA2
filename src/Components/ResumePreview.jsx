import React, { useLayoutEffect, useRef } from "react";
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

      applyScale(1);
      let scale = 1;
      let attempts = 0;

      const measure = () => {
        if (cancelled) return;

        const pageHeight = page.clientHeight;
        const requiredHeight = template.scrollHeight;
        if (!pageHeight || !requiredHeight) return;

        const renderedHeight = requiredHeight * scale;
        if (renderedHeight <= pageHeight + 1 || attempts >= 6) return;

        const nextScale = Math.max(
          MIN_RESUME_FIT_SCALE,
          Math.min(scale, pageHeight / requiredHeight - 0.003),
        );
        if (Math.abs(nextScale - scale) < 0.001) return;

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
    images.forEach((image) => image.addEventListener("load", fitContent));

    const resizeObserver = new ResizeObserver(fitContent);
    resizeObserver.observe(page);

    return () => {
      cancelled = true;
      cancelAnimationFrame(animationFrame);
      resizeObserver.disconnect();
      images.forEach((image) => image.removeEventListener("load", fitContent));
    };
  });

  return (
    <div ref={pageRef} className="h-full w-full overflow-hidden bg-white">
      <div
        ref={contentRef}
        className="resume-fit-content origin-top-left overflow-visible"
      >
        {children}
      </div>
    </div>
  );
}

const ContactItem = ({ icon: _Icon, text, link }) => {
  if (!text) return null;
  const content = (
    <div className="flex items-center gap-1.5 text-xs text-gray-600">
      <_Icon className="w-3.5 h-3.5 shrink-0" />
      <span className="truncate">{text}</span>
    </div>
  );
  const safeLink = safeExternalUrl(link);
  return safeLink ? (
    <a
      href={safeLink}
      target="_blank"
      rel="noreferrer"
      className="hover:text-blue-600"
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
    <div className="flex items-center gap-2 text-xs text-gray-300">
      <_Icon className="w-4 h-4 text-gray-400 shrink-0" />
      <span className="truncate">{text}</span>
    </div>
  );
  const safeLink = safeExternalUrl(link);
  return safeLink ? (
    <a
      href={safeLink}
      target="_blank"
      rel="noreferrer"
      className="hover:text-white"
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
        {skill?.length > 0 && (
          <section>
            <h3 className="text-xs font-bold uppercase tracking-widest border-b border-gray-300 pb-1 mb-3 text-gray-900">
              Kỹ năng
            </h3>
            <div className="flex flex-col gap-3 text-xs text-gray-700">
              {skill.map((item) => (
                <div key={item.id} className="break-inside-avoid">
                  <div className="flex flex-wrap gap-1.5 items-center">
                    <span className="font-semibold text-gray-900">
                      {item.title}
                    </span>
                    {item.performance && (
                      <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-sm">
                        {item.performance}
                      </span>
                    )}
                  </div>
                  {item.description && (
                    <RichTextContent
                      className="mt-1 text-gray-600"
                      content={item.description}
                    />
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

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
                      className="text-[11px] text-blue-600 hover:underline block mb-1 truncate"
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
        <div className="mb-4 print:mb-2 text-center md:text-left">
          <h1 className="text-4xl print:text-3xl font-extrabold tracking-tight text-gray-900 mb-1">
            {personalInfo.fullName}
          </h1>
          <h2 className="text-base print:text-sm font-medium text-blue-700 uppercase tracking-widest">
            {personalInfo.jobTitle}
          </h2>

          <div className="flex flex-wrap gap-x-4 gap-y-2 mt-4 print:mt-2 justify-center md:justify-start">
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
                      className="text-[11px] text-blue-600 hover:underline block mb-1 print:mb-0.5 truncate"
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

        {skill?.length > 0 && (
          <section>
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-900 mb-4 print:mb-2 pb-1 border-b-2 border-gray-200">
              Kỹ năng
            </h3>
            <div className="flex flex-col gap-3 print:gap-1.5">
              {skill.map((i) => (
                <div key={i.id} className="break-inside-avoid">
                  <div className="flex flex-wrap gap-1.5 items-center">
                    <span className="font-semibold text-gray-900 text-xs">
                      {i.title}
                    </span>
                    {i.performance && (
                      <span className="text-[10px] bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded-sm">
                        {i.performance}
                      </span>
                    )}
                  </div>
                  {i.description && (
                    <RichTextContent
                      className="mt-1 print:mt-0.5 text-xs text-gray-600 print:leading-normal"
                      content={i.description}
                    />
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

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
    <div className="cv-sidebar flex w-[30%] shrink-0 flex-col gap-5 bg-gray-900 p-6 text-white print:gap-4 print:p-5">
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
        <h1 className="mb-1 text-xl font-bold uppercase leading-tight tracking-tight">
          {personalInfo.fullName}
        </h1>
        <h2 className="text-xs font-medium text-gray-400 uppercase tracking-widest">
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

      {skill?.length > 0 && (
        <section>
          <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3 border-b border-gray-700 pb-1">
            Kỹ năng
          </h3>
          <div className="flex flex-col gap-3">
            {skill.map((i) => (
              <div key={i.id} className="break-inside-avoid">
                <div className="flex justify-between items-center mb-1">
                  <div className="text-xs font-medium text-gray-300">
                    {i.title}
                  </div>
                  {i.performance && (
                    <div className="text-[10px] text-gray-500">
                      {i.performance}
                    </div>
                  )}
                </div>
                <div className="w-full bg-gray-800 h-1 rounded-full overflow-hidden">
                  <div
                    className="bg-gray-400 h-full"
                    style={{
                      width:
                        i.performance === "Xuất sắc"
                          ? "100%"
                          : i.performance === "Tốt"
                            ? "80%"
                            : i.performance === "Tạm được"
                              ? "60%"
                              : i.performance === "Trung bình"
                                ? "40%"
                                : "20%",
                    }}
                  ></div>
                </div>
                {i.description && (
                  <RichTextContent
                    className="mt-1.5 text-[10px] text-gray-400"
                    content={i.description}
                  />
                )}
              </div>
            ))}
          </div>
        </section>
      )}

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

    <div className="cv-main-content flex w-[70%] flex-col gap-5 p-8 text-gray-800 print:gap-3 print:p-6">
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
                    className="text-[11px] text-blue-600 hover:underline block mb-1 truncate"
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

const TemplateSectionTitle = ({ children, className = "" }) => (
  <h3 className={`mb-3 border-b pb-2 text-[11px] font-bold uppercase tracking-[0.18em] ${className}`}>
    {children}
  </h3>
);

const TemplateBio = ({ bio, headingClass }) => {
  if (!bio) return null;

  return (
    <section className="break-inside-avoid">
      <TemplateSectionTitle className={headingClass}>Giới thiệu</TemplateSectionTitle>
      <RichTextContent
        className="text-[11px] leading-[1.75] text-slate-600"
        content={bio}
      />
    </section>
  );
};

const TemplateExperience = ({ items, headingClass, dateClass = "text-slate-500" }) => {
  if (!items?.length) return null;

  return (
    <section>
      <TemplateSectionTitle className={headingClass}>Kinh nghiệm</TemplateSectionTitle>
      <div className="space-y-5">
        {items.map((item, index) => (
          <article key={item.id || `${item.title}-${index}`} className="break-inside-avoid">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h4 className="text-[13px] font-bold text-slate-900">{item.title}</h4>
                <p className="mt-0.5 text-[11px] font-semibold text-slate-600">
                  {item.company}{item.location ? ` • ${item.location}` : ""}
                </p>
              </div>
              <span className={`shrink-0 text-[10px] font-semibold ${dateClass}`}>
                {formatDateRange(item.startDate, item.endDate)}
              </span>
            </div>
            {item.description && (
              <RichTextContent
                className="mt-2 pl-3 text-[11px] leading-[1.65] text-slate-600"
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
            <p className={`mt-0.5 text-[10px] font-semibold leading-4 ${secondaryClass}`}>{item.company}</p>
            <p className={`mt-1 text-[10px] ${dateClass}`}>
              {formatDateRange(item.startDate, item.endDate)}
            </p>
            {(item.major || item.score) && (
              <p className={`mt-1 text-[10px] leading-4 ${secondaryClass}`}>
                {[item.major, item.score].filter(Boolean).join(" • ")}
              </p>
            )}
          </article>
        ))}
      </div>
    </section>
  );
};

const TemplateProjects = ({ items, headingClass, accentClass = "text-violet-700" }) => {
  if (!items?.length) return null;

  return (
    <section>
      <TemplateSectionTitle className={headingClass}>Dự án</TemplateSectionTitle>
      <div className="space-y-4">
        {items.map((item, index) => (
          <article key={item.id || `${item.title}-${index}`} className="break-inside-avoid">
            <div className="flex items-start justify-between gap-3">
              <h4 className="text-[12px] font-bold text-slate-900">{item.title}</h4>
              {item.date && <span className={`shrink-0 text-[10px] font-semibold ${accentClass}`}>{formatResumeDate(item.date)}</span>}
            </div>
            {item.link && <p className={`mt-1 truncate text-[10px] ${accentClass}`}>{item.link}</p>}
            {item.description && (
              <RichTextContent
                className="mt-1.5 pl-3 text-[11px] leading-[1.65] text-slate-600"
                content={item.description}
              />
            )}
          </article>
        ))}
      </div>
    </section>
  );
};

const TemplateCredentials = ({ items, title, headingClass, metaKey }) => {
  if (!items?.length) return null;

  return (
    <section>
      <TemplateSectionTitle className={headingClass}>{title}</TemplateSectionTitle>
      <div className="space-y-3">
        {items.map((item, index) => (
          <article key={item.id || `${item.title}-${index}`} className="break-inside-avoid">
            <div className="flex items-start justify-between gap-3">
              <h4 className="text-[11px] font-bold leading-4 text-slate-900">{item.title}</h4>
              {item.date && <span className="shrink-0 text-[9px] font-semibold text-slate-500">{formatResumeDate(item.date)}</span>}
            </div>
            {item[metaKey] && <p className="mt-0.5 text-[10px] font-semibold text-slate-500">{item[metaKey]}</p>}
            {item.description && (
              <RichTextContent
                className="mt-1 text-[10px] leading-4 text-slate-600"
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
      <div className="space-y-2.5">
        {items.map((item, index) => (
          <div key={item.id || `${item.title}-${index}`} className="break-inside-avoid">
            <div className="flex items-center gap-2">
              <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${dotClass}`} />
              <span className={`text-[11px] font-bold ${titleClass}`}>{item.title}</span>
            </div>
            {item.description && <p className={`mt-0.5 pl-3.5 text-[9px] leading-4 ${secondaryClass}`}>{item.description}</p>}
          </div>
        ))}
      </div>
    </section>
  );
};

const TemplatePlainSkills = ({
  items,
  headingClass,
  titleClass = "text-slate-900",
  secondaryClass = "text-slate-500",
  dividerClass = "border-slate-200",
}) => {
  if (!items?.length) return null;

  return (
    <section>
      <TemplateSectionTitle className={headingClass}>Kỹ năng</TemplateSectionTitle>
      <div className={`divide-y ${dividerClass}`}>
        {items.map((item, index) => (
          <div key={item.id || `${item.title}-${index}`} className="break-inside-avoid py-2 first:pt-0">
            <div className="flex items-baseline justify-between gap-3">
              <span className={`text-[11px] font-bold ${titleClass}`}>{item.title}</span>
              {item.performance && <span className={`shrink-0 text-[9px] font-semibold ${secondaryClass}`}>{item.performance}</span>}
            </div>
            {item.description && (
              <RichTextContent
                className={`mt-0.5 text-[9px] leading-4 ${secondaryClass}`}
                content={item.description}
              />
            )}
          </div>
        ))}
      </div>
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
      <div className="space-y-1">
        {items.map((item, index) => (
          <div key={item.id || `${item.title}-${index}`} className="break-inside-avoid text-[10px] leading-[1.4] text-slate-700">
            <span className="font-bold text-slate-900">{item.title}</span>
            {item.performance && <span> — {item.performance}</span>}
            {item.description && (
              <RichTextContent className="text-[9px] text-slate-600" content={item.description} />
            )}
          </div>
        ))}
      </div>
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
        {[personalInfo.email, personalInfo.phone, personalInfo.location, personalInfo.website].filter(Boolean).map((item) => <span key={item}>{item}</span>)}
        {profile?.map((item, index) => <span key={item.id || index}>{item.networkName || item.link}</span>)}
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
        {[personalInfo.email, personalInfo.phone, personalInfo.location, personalInfo.website].filter(Boolean).map((item) => <span key={item}>{item}</span>)}
        {profile?.map((item, index) => <span key={item.id || index}>{item.link || item.username || item.networkName}</span>)}
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

export default function ResumePreview({
  selectedTemplate = "modern",
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
  const template = [
    "classic",
    "modern",
    "professional",
    "elegant",
    "creative",
    "compact",
  ].includes(selectedTemplate)
    ? selectedTemplate
    : "modern";

  const commonProps = {
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
  };

  return (
    <AutoFitResumePage>
      {template === "classic" && <BasicTemplate {...commonProps} />}
      {template === "modern" && <ModernTemplate {...commonProps} />}
      {template === "professional" && (
        <ProfessionalTemplate {...commonProps} />
      )}
      {template === "elegant" && <ElegantTemplate {...commonProps} />}
      {template === "creative" && <CreativeTemplate {...commonProps} />}
      {template === "compact" && <CompactTemplate {...commonProps} />}
    </AutoFitResumePage>
  );
}
