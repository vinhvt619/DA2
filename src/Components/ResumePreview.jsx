import React from "react";
import {
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  GlobeAltIcon,
} from "@heroicons/react/24/solid";

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
}) => (
  <div className="bg-white p-10 min-h-[297mm] h-fit">
    <div className="border-b-2 border-gray-800 pb-5 mb-5 flex gap-5 items-end">
      {image && (
        <img
          src={image}
          alt="Profile"
          className="w-24 h-24 object-cover border border-gray-300"
        />
      )}
      <div>
        <h1 className="text-4xl font-bold uppercase tracking-wider text-gray-900">
          {personalInfo.fullName}
        </h1>
        <h2 className="text-xl font-medium text-gray-600 mt-1">
          {personalInfo.jobTitle}
        </h2>
      </div>
    </div>

    <div className="grid grid-cols-1 gap-1 text-sm text-gray-700 mb-8">
      <div className="flex flex-wrap gap-4">
        <div className="flex items-center gap-1">
          <EnvelopeIcon className="w-4 h-4" />
          <span>{personalInfo.email}</span>
        </div>
        <div className="flex items-center gap-1">
          <PhoneIcon className="w-4 h-4" />
          <span>{personalInfo.phone}</span>
        </div>
        <div className="flex items-center gap-1">
          <MapPinIcon className="w-4 h-4" />
          <span>{personalInfo.location}</span>
        </div>
        {personalInfo.website && (
          <div className="flex items-center gap-1">
            <GlobeAltIcon className="w-4 h-4" />
            <a href={personalInfo.website} className="hover:underline">
              {personalInfo.website}
            </a>
          </div>
        )}
      </div>
    </div>

    {/* Content Sections */}
    <div className="space-y-6">
      <section>
        <h3 className="text-lg font-bold uppercase border-b border-gray-400 mb-2">
          Tiểu sử
        </h3>
        <div
          className="text-gray-700 text-sm leading-relaxed"
          dangerouslySetInnerHTML={{ __html: bio }}
        />
      </section>

      {experience.length > 0 && (
        <section>
          <h3 className="text-lg font-bold uppercase border-b border-gray-400 mb-2">
            Kinh nghiệm làm việc
          </h3>
          {experience.map((exp) => (
            <div key={exp.id} className="mb-4">
              <div className="flex justify-between font-bold text-gray-800">
                <span>{exp.title}</span>
                <span className="text-sm font-normal text-gray-600">
                  {exp.startDate} - {exp.endDate}
                </span>
              </div>
              <div className="text-gray-700 italic text-sm mb-1">
                {exp.company}
              </div>
              <div
                className="text-gray-600 text-sm pl-4 list-disc"
                dangerouslySetInnerHTML={{ __html: exp.description }}
              />
            </div>
          ))}
        </section>
      )}

      {project.length > 0 && (
        <section>
          <h3 className="text-lg font-bold uppercase border-b border-gray-400 mb-2">
            Dự án
          </h3>
          {project.map((proj) => (
            <div key={proj.id} className="mb-4">
              <div className="flex justify-between font-bold text-gray-800">
                <span>{proj.title}</span>
                <span className="text-sm font-normal text-gray-600">
                  {proj.date}
                </span>
              </div>
              {proj.link && (
                <a
                  href={proj.link}
                  className="text-blue-600 text-sm hover:underline block mb-1"
                >
                  {proj.link}
                </a>
              )}
              <div
                className="text-gray-600 text-sm pl-4 list-disc"
                dangerouslySetInnerHTML={{ __html: proj.description }}
              />
            </div>
          ))}
        </section>
      )}

      {education.length > 0 && (
        <section>
          <h3 className="text-lg font-bold uppercase border-b border-gray-400 mb-2">
            Học vấn
          </h3>
          {education.map((edu) => (
            <div key={edu.id} className="mb-2">
              <div className="font-bold text-gray-800">{edu.company}</div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>{edu.title}</span>
                <span>
                  {edu.startDate} - {edu.endDate}
                </span>
              </div>
            </div>
          ))}
        </section>
      )}

      {skill.length > 0 && (
        <section>
          <h3 className="text-lg font-bold uppercase border-b border-gray-400 mb-2">
            Kỹ năng
          </h3>
          <div className="flex flex-wrap gap-2">
            {skill.map((s) => (
              <span
                key={s.id}
                className="bg-gray-100 px-2 py-1 rounded text-sm text-gray-700"
              >
                {s.title}
              </span>
            ))}
          </div>
        </section>
      )}
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
}) => (
  <div className="p-10 text-sm h-full">
    {/* Header */}
    <div className="flex gap-6 mb-8">
      <div className="w-32 h-32 shrink-0 border-2 border-gray-100 rounded-full overflow-hidden bg-gray-50">
        {image ? (
          <img
            src={image}
            alt="Profile"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300 bg-gray-100">
            <span className="text-4xl font-bold text-gray-300">Avatar</span>
          </div>
        )}
      </div>
      <div className="flex-1">
        <h1 className="text-3xl font-bold text-gray-800 uppercase mb-2 tracking-wide">
          {personalInfo.fullName}
        </h1>
        <h2 className="text-xl text-blue-600 font-medium mb-4">
          {personalInfo.jobTitle}
        </h2>

        <div className="grid grid-cols-2 gap-y-2 text-gray-600 text-sm">
          <div className="flex items-center gap-2">
            <EnvelopeIcon className="w-4 h-4 text-gray-400" />
            <span>{personalInfo.email}</span>
          </div>
          <div className="flex items-center gap-2">
            <PhoneIcon className="w-4 h-4 text-gray-400" />
            <span>{personalInfo.phone}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPinIcon className="w-4 h-4 text-gray-400" />
            <span>{personalInfo.location}</span>
          </div>
          {personalInfo.website && (
            <div className="flex items-center gap-2">
              <GlobeAltIcon className="w-4 h-4 text-gray-400" />
              <a
                href={personalInfo.website}
                target="_blank"
                rel="noreferrer"
                className="hover:underline hover:text-blue-500 truncate max-w-[150px]"
              >
                {personalInfo.website}
              </a>
            </div>
          )}
          {profile
            .filter((p) => p.link)
            .map((p, index) => (
              <div key={index} className="flex items-center gap-2">
                <GlobeAltIcon className="w-4 h-4 text-gray-400" />
                <a
                  href={p.link}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:underline hover:text-blue-500 truncate max-w-[150px]"
                >
                  {p.link}
                </a>
              </div>
            ))}
        </div>
      </div>
    </div>

    <div className="grid grid-cols-12 gap-8">
      {/* Left Column (Main Content) */}
      <div className="col-span-8 flex flex-col gap-6">
        {/* Summary */}
        <section>
          <h3 className="text-lg font-bold text-gray-800 uppercase border-b-2 border-gray-200 pb-1 mb-3">
            Tiểu sử
          </h3>
          <div
            className="text-gray-700 leading-relaxed text-sm resume-content"
            dangerouslySetInnerHTML={{ __html: bio }}
          />
        </section>

        {/* Experience */}
        {experience.length > 0 && (
          <section>
            <h3 className="text-lg font-bold text-gray-800 uppercase border-b-2 border-gray-200 pb-1 mb-3">
              Kinh nghiệm làm việc
            </h3>
            <div className="flex flex-col gap-4">
              {experience.map((exp) => (
                <div key={exp.id}>
                  <div className="flex justify-between items-baseline mb-1">
                    <h4 className="font-bold text-gray-700 text-base">
                      {exp.title}
                    </h4>
                    <span className="text-xs text-gray-500 font-medium whitespace-nowrap bg-gray-100 px-2 py-0.5 rounded">
                      {exp.startDate} - {exp.endDate}
                    </span>
                  </div>
                  <div className="text-blue-600 font-medium text-sm mb-1">
                    {exp.company}
                  </div>
                  <div
                    className="text-gray-600 text-sm mt-1 list-disc pl-4 resume-content"
                    dangerouslySetInnerHTML={{ __html: exp.description }}
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Projects */}
        {project.length > 0 && (
          <section>
            <h3 className="text-lg font-bold text-gray-800 uppercase border-b-2 border-gray-200 pb-1 mb-3">
              Dự án
            </h3>
            <div className="flex flex-col gap-4">
              {project.map((proj) => (
                <div key={proj.id}>
                  <div className="flex justify-between items-baseline mb-1">
                    <h4 className="font-bold text-gray-700 text-base">
                      {proj.title}
                    </h4>
                    <span className="text-xs text-gray-500 font-medium whitespace-nowrap bg-gray-100 px-2 py-0.5 rounded">
                      {proj.date}
                    </span>
                  </div>
                  {proj.link && (
                    <div className="text-blue-600 font-medium text-sm mb-1">
                      <a
                        href={proj.link}
                        target="_blank"
                        rel="noreferrer"
                        className="hover:underline"
                      >
                        {proj.link}
                      </a>
                    </div>
                  )}
                  <div
                    className="text-gray-600 text-sm mt-1 list-disc pl-4 resume-content"
                    dangerouslySetInnerHTML={{ __html: proj.description }}
                  />
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Right Column (Sidebar) */}
      <div className="col-span-4 flex flex-col gap-6">
        {/* Education */}
        {education.length > 0 && (
          <section>
            <h3 className="text-lg font-bold text-gray-800 uppercase border-b-2 border-gray-200 pb-1 mb-3">
              Học vấn
            </h3>
            <div className="flex flex-col gap-4">
              {education.map((edu) => (
                <div key={edu.id}>
                  <h4 className="font-bold text-gray-700">{edu.title}</h4>
                  <div className="text-blue-600 text-sm mb-1">
                    {edu.company}
                  </div>
                  <div className="text-xs text-gray-500 mb-1">
                    {edu.startDate} - {edu.endDate}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Skills */}
        {skill.length > 0 && (
          <section>
            <h3 className="text-lg font-bold text-gray-800 uppercase border-b-2 border-gray-200 pb-1 mb-3">
              Kỹ năng
            </h3>
            <div className="flex flex-col gap-2">
              {skill.map((s) => (
                <div
                  key={s.id}
                  className="bg-gray-50 p-2 rounded border border-gray-100"
                >
                  <div className="font-bold text-gray-700 text-sm">
                    {s.title}
                  </div>
                  {s.description && (
                    <div className="text-xs text-gray-500 mt-1 lines-clamp-2">
                      {s.description.replace(/<[^>]+>/g, "")}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Awards */}
        {award.length > 0 && (
          <section>
            <h3 className="text-lg font-bold text-gray-800 uppercase border-b-2 border-gray-200 pb-1 mb-3">
              Giải thưởng
            </h3>
            <div className="flex flex-col gap-3">
              {award.map((a) => (
                <div key={a.id}>
                  <div className="font-bold text-gray-700 text-sm">
                    {a.title}
                  </div>
                  <div className="text-blue-600 text-xs">{a.company}</div>
                  <div className="text-xs text-gray-400">{a.startDate}</div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Profile Links */}
        {profile.length > 0 && (
          <section>
            <h3 className="text-lg font-bold text-gray-800 uppercase border-b-2 border-gray-200 pb-1 mb-3">
              Liên kết
            </h3>
            <div className="flex flex-col gap-2">
              {profile.map((p) => (
                <div key={p.id} className="text-sm">
                  <span className="font-semibold text-gray-700 block">
                    {p.networkName}
                  </span>
                  <a
                    href={p.link}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-500 hover:underline text-xs break-all"
                  >
                    {p.username}
                  </a>
                </div>
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
}) => (
  <div className="flex bg-white min-h-[297mm]">
    <div className="w-1/3 bg-slate-800 text-white p-6 pt-10 flex flex-col gap-6">
      <div className="flex justify-center mb-4">
        {image ? (
          <img
            src={image}
            alt="Profile"
            className="w-32 h-32 rounded-full object-cover border-4 border-slate-600"
          />
        ) : (
          <div className="w-32 h-32 rounded-full bg-slate-600 flex items-center justify-center">
            <span>IMG</span>
          </div>
        )}
      </div>

      <section>
        <h3 className="text-slate-400 font-bold uppercase tracking-widest text-xs mb-3">
          Liên hệ
        </h3>
        <div className="flex flex-col gap-3 text-sm text-slate-300">
          <div>{personalInfo.email}</div>
          <div>{personalInfo.phone}</div>
          <div>{personalInfo.location}</div>
          {personalInfo.website && (
            <a href={personalInfo.website} className="hover:text-white">
              {personalInfo.website}
            </a>
          )}
        </div>
      </section>

      {skill.length > 0 && (
        <section>
          <h3 className="text-slate-400 font-bold uppercase tracking-widest text-xs mb-3">
            Kỹ năng
          </h3>
          <div className="flex flex-col gap-2">
            {skill.map((s) => (
              <div key={s.id}>
                <div className="font-semibold text-sm">{s.title}</div>
                <div className="w-full bg-slate-700 h-1.5 mt-1 rounded-full overflow-hidden">
                  <div
                    className="bg-blue-400 h-full"
                    style={{
                      width:
                        s.performance === "Xuất sắc"
                          ? "100%"
                          : s.performance === "Tốt"
                            ? "80%"
                            : s.performance === "Tạm được"
                              ? "60%"
                              : "40%",
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {education.length > 0 && (
        <section>
          <h3 className="text-slate-400 font-bold uppercase tracking-widest text-xs mb-3">
            Học vấn
          </h3>
          <div className="flex flex-col gap-4 text-sm">
            {education.map((edu) => (
              <div key={edu.id}>
                <div className="font-bold text-white">{edu.title}</div>
                <div className="text-slate-400">{edu.company}</div>
                <div className="text-slate-500 text-xs">
                  {edu.startDate} - {edu.endDate}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>

    {/* Main Content Right */}
    <div className="w-2/3 p-8">
      <div className="mb-10 border-b border-gray-200 pb-6">
        <h1 className="text-4xl font-bold text-slate-800 mb-2 uppercase">
          {personalInfo.fullName}
        </h1>
        <h2 className="text-xl text-blue-600 tracking-wide">
          {personalInfo.jobTitle}
        </h2>
        <div
          className="mt-4 text-gray-600 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: bio }}
        />
      </div>

      {experience.length > 0 && (
        <section className="mb-8">
          <h3 className="text-xl font-bold text-slate-800 uppercase mb-4 flex items-center gap-2">
            <span className="w-2 h-8 bg-blue-600 inline-block"></span>
            Kinh nghiệm
          </h3>
          <div className="space-y-6">
            {experience.map((exp) => (
              <div key={exp.id}>
                <div className="flex justify-between items-baseline">
                  <h4 className="text-lg font-bold text-gray-800">
                    {exp.title}
                  </h4>
                  <span className="text-sm font-semibold text-blue-600">
                    {exp.startDate} - {exp.endDate}
                  </span>
                </div>
                <div className="font-semibold text-gray-600 mb-2">
                  {exp.company}
                </div>
                <div
                  className="text-gray-600 text-sm list-disc pl-4"
                  dangerouslySetInnerHTML={{ __html: exp.description }}
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {project.length > 0 && (
        <section>
          <h3 className="text-xl font-bold text-slate-800 uppercase mb-4 flex items-center gap-2">
            <span className="w-2 h-8 bg-blue-600 inline-block"></span>
            Dự án nổi bật
          </h3>
          <div className="grid grid-cols-1 gap-6">
            {project.map((proj) => (
              <div
                key={proj.id}
                className="bg-gray-50 p-4 border-l-4 border-blue-600"
              >
                <div className="flex justify-between items-start mb-1">
                  <h4 className="font-bold text-gray-800">{proj.title}</h4>
                  <span className="text-xs text-gray-500 font-mono">
                    {proj.date}
                  </span>
                </div>
                {proj.link && (
                  <a
                    href={proj.link}
                    className="text-blue-500 text-xs hover:underline mb-2 block"
                  >
                    {proj.link}
                  </a>
                )}
                <div
                  className="text-gray-600 text-sm"
                  dangerouslySetInnerHTML={{ __html: proj.description }}
                />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
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
}) {
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
  };

  return (
    <div className="w-full flex justify-center h-full overflow-hidden">
      <div className="h-full overflow-y-auto no-scrollbar pb-10 w-full flex justify-center custom-scrollbar">
        <div
          className="
            bg-white shadow-lg
            w-[210mm] min-h-[297mm] h-fit
            scale-90 origin-top
          "
          style={{ width: "210mm", minHeight: "297mm" }}
        >
          {selectedTemplate === "basic" && <BasicTemplate {...commonProps} />}
          {selectedTemplate === "modern" && <ModernTemplate {...commonProps} />}
          {selectedTemplate === "professional" && (
            <ProfessionalTemplate {...commonProps} />
          )}
        </div>
      </div>
    </div>
  );
}
