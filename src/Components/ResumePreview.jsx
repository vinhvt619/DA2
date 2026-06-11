import React from "react";
import {
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  GlobeAltIcon,
} from "@heroicons/react/24/outline";

const ContactItem = ({ icon: _Icon, text, link }) => {
  if (!text) return null;
  const content = (
    <div className="flex items-center gap-1.5 text-xs text-gray-600">
      <_Icon className="w-3.5 h-3.5 shrink-0" />
      <span className="truncate">{text}</span>
    </div>
  );
  return link ? (
    <a
      href={link}
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
  return link ? (
    <a
      href={link}
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
  <div className="p-10 min-h-[297mm] h-fit bg-white font-sans text-gray-800">
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

    <div className="grid grid-cols-12 gap-8">
      <div className="col-span-4 flex flex-col gap-6">
        {skill?.length > 0 && (
          <section>
            <h3 className="text-xs font-bold uppercase tracking-widest border-b border-gray-300 pb-1 mb-3 text-gray-900">
              Skills
            </h3>
            <div className="flex flex-col gap-3 text-xs text-gray-700">
              {skill.map((item) => (
                <div key={item.id}>
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
                    <div
                      className="mt-1 text-gray-600"
                      dangerouslySetInnerHTML={{ __html: item.description }}
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
                <div key={item.id}>
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
                <div key={awardItem.id}>
                  <div className="flex justify-between items-baseline mb-0.5">
                    <div className="text-xs font-bold text-gray-900">
                      {awardItem.title}
                    </div>
                    <div className="text-[11px] text-blue-500">
                      {awardItem.date}
                    </div>
                  </div>
                  <div className="text-[11px] text-gray-600 font-semibold">
                    {awardItem.awarder}
                  </div>
                  {awardItem.description && (
                    <div
                      className="text-xs text-gray-600 leading-relaxed list-disc pl-4 mt-1"
                      dangerouslySetInnerHTML={{
                        __html: awardItem.description,
                      }}
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

      <div className="col-span-8 flex flex-col gap-6">
        {bio && (
          <section>
            <h3 className="text-xs font-bold uppercase tracking-widest border-b border-gray-300 pb-1 mb-3 text-gray-900">
              Profile
            </h3>
            <div
              className="text-xs text-gray-700 leading-relaxed text-justify"
              dangerouslySetInnerHTML={{ __html: bio }}
            />
          </section>
        )}

        {experience?.length > 0 && (
          <section>
            <h3 className="text-xs font-bold uppercase tracking-widest border-b border-gray-300 pb-1 mb-3 text-gray-900">
              Experience
            </h3>
            <div className="flex flex-col gap-5">
              {experience.map((item) => (
                <div key={item.id}>
                  <div className="flex justify-between items-start mb-0.5">
                    <h4 className="text-sm font-bold text-gray-900">
                      {item.title}
                    </h4>
                    <span className="text-[11px] text-blue-500 font-medium whitespace-nowrap">
                      {item.startDate} - {item.endDate}
                    </span>
                  </div>
                  <div className="text-xs font-semibold text-gray-700 mb-2">
                    {item.company}
                    {item.location ? ` • ${item.location}` : ""}
                  </div>
                  <div
                    className="text-xs text-gray-600 leading-relaxed list-disc pl-4"
                    dangerouslySetInnerHTML={{ __html: item.description }}
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {education?.length > 0 && (
          <section>
            <h3 className="text-xs font-bold uppercase tracking-widest border-b border-gray-300 pb-1 mb-3 text-gray-900">
              Education
            </h3>
            <div className="flex flex-col gap-4">
              {education.map((edu) => (
                <div key={edu.id}>
                  <div className="flex justify-between items-baseline mb-0.5">
                    <h4 className="text-sm font-bold text-gray-900">
                      {edu.title}
                    </h4>
                    <span className="text-[11px] text-blue-500 font-medium whitespace-nowrap">
                      {edu.startDate} - {edu.endDate}
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
                    <div
                      className="text-xs text-gray-600 leading-relaxed list-disc pl-4 mt-1"
                      dangerouslySetInnerHTML={{ __html: edu.description }}
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
              Projects
            </h3>
            <div className="flex flex-col gap-5">
              {project.map((i) => (
                <div key={i.id}>
                  <div className="flex justify-between items-start mb-0.5">
                    <h4 className="text-sm font-bold text-gray-900">
                      {i.title}
                    </h4>
                    <span className="text-[11px] text-blue-500 font-medium whitespace-nowrap">
                      {i.date}
                    </span>
                  </div>
                  {i.link && (
                    <a
                      href={i.link}
                      className="text-[11px] text-blue-600 hover:underline block mb-1 truncate"
                    >
                      {i.link}
                    </a>
                  )}
                  <div
                    className="text-xs text-gray-600 leading-relaxed list-disc pl-4 mt-1"
                    dangerouslySetInnerHTML={{ __html: i.description }}
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
                <div key={i.id}>
                  <div className="flex justify-between items-start mb-0.5">
                    <h4 className="text-sm font-bold text-gray-900">
                      {i.title}
                    </h4>
                    <span className="text-[11px] text-blue-500 font-medium whitespace-nowrap">
                      {i.date}
                    </span>
                  </div>
                  <div className="text-[11px] text-gray-600 font-semibold mb-1">
                    {i.publisher}
                  </div>
                  {i.description && (
                    <div
                      className="text-xs text-gray-600 leading-relaxed list-disc pl-4 mt-1"
                      dangerouslySetInnerHTML={{ __html: i.description }}
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
  <div className="min-h-[297mm] h-fit font-sans text-gray-800 flex flex-col bg-white">
    <div className="grid grid-cols-12 min-h-[297mm]">
      <div className="col-span-8 p-10 bg-white flex flex-col gap-6">
        <div className="mb-4 text-center md:text-left">
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 mb-1">
            {personalInfo.fullName}
          </h1>
          <h2 className="text-base font-medium text-blue-700 uppercase tracking-widest">
            {personalInfo.jobTitle}
          </h2>

          <div className="flex flex-wrap gap-x-4 gap-y-2 mt-4 justify-center md:justify-start">
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
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-900 mb-2 border-b-2 border-gray-100 pb-1">
              Tiểu sử
            </h3>
            <div
              className="text-xs text-gray-700 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: bio }}
            />
          </section>
        )}

        {experience?.length > 0 && (
          <section>
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-900 mb-4 pb-1 border-b-2 border-gray-100">
              Kinh nghiệm làm việc
            </h3>
            <div className="flex flex-col gap-6">
              {experience.map((exp) => (
                <div key={exp.id}>
                  <div className="flex justify-between items-baseline mb-1">
                    <h4 className="text-sm font-bold text-gray-900">
                      {exp.title}
                    </h4>
                    <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-sm">
                      {exp.startDate} - {exp.endDate}
                    </span>
                  </div>
                  <div className="text-xs font-semibold text-gray-700 mb-2">
                    {exp.company}
                    {exp.location ? ` • ${exp.location}` : ""}
                  </div>
                  <div
                    className="text-xs text-gray-600 leading-relaxed list-disc pl-4"
                    dangerouslySetInnerHTML={{ __html: exp.description }}
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {education?.length > 0 && (
          <section>
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-900 mb-4 pb-1 border-b-2 border-gray-100">
              Học vấn
            </h3>
            <div className="flex flex-col gap-6">
              {education.map((i) => (
                <div key={i.id}>
                  <div className="flex justify-between items-baseline mb-1">
                    <h4 className="text-sm font-bold text-gray-900">
                      {i.title}
                    </h4>
                    <span className="text-[11px] font-semibold text-blue-500 bg-gray-100 px-2 py-0.5 rounded-sm">
                      {i.startDate} - {i.endDate}
                    </span>
                  </div>
                  <div className="text-xs font-semibold text-gray-700 mb-2">
                    {i.company}
                    {i.location ? ` • ${i.location}` : ""}
                  </div>
                  {(i.major || i.score) && (
                    <div className="text-[11px] text-gray-600 mb-2">
                      {i.major}
                      {i.major && i.score ? " - " : ""}
                      {i.score}
                    </div>
                  )}
                  {i.description && (
                    <div
                      className="text-xs text-gray-600 leading-relaxed list-disc pl-4 mt-1"
                      dangerouslySetInnerHTML={{ __html: i.description }}
                    />
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {project?.length > 0 && (
          <section>
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-900 mb-4 pb-1 border-b-2 border-gray-100">
              Dự án
            </h3>
            <div className="flex flex-col gap-5">
              {project.map((i) => (
                <div key={i.id}>
                  <div className="flex justify-between items-baseline mb-1">
                    <h4 className="text-sm font-bold text-gray-900">
                      {i.title}
                    </h4>
                    <span className="text-[11px] font-semibold text-blue-500 bg-gray-100 px-2 py-0.5 rounded-sm">
                      {i.date}
                    </span>
                  </div>
                  {i.link && (
                    <a
                      href={i.link}
                      className="text-[11px] text-blue-600 hover:underline block mb-1 truncate"
                    >
                      {i.link}
                    </a>
                  )}
                  <div
                    className="text-xs text-gray-600 leading-relaxed list-disc pl-4"
                    dangerouslySetInnerHTML={{ __html: i.description }}
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {certificate?.length > 0 && (
          <section>
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-900 mb-4 pb-1 border-b-2 border-gray-100">
              Chứng chỉ
            </h3>
            <div className="flex flex-col gap-5">
              {certificate.map((i) => (
                <div key={i.id}>
                  <div className="flex justify-between items-baseline mb-1">
                    <h4 className="text-sm font-bold text-gray-900">
                      {i.title}
                    </h4>
                    <span className="text-[11px] font-semibold text-blue-500 bg-gray-100 px-2 py-0.5 rounded-sm">
                      {i.date}
                    </span>
                  </div>
                  <div className="text-xs font-semibold text-gray-700 mb-2">
                    {i.publisher}
                  </div>
                  {i.description && (
                    <div
                      className="text-xs text-gray-600 leading-relaxed list-disc pl-4"
                      dangerouslySetInnerHTML={{ __html: i.description }}
                    />
                  )}
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      <div className="col-span-4 bg-gray-50 p-10 flex flex-col gap-8 border-l border-gray-200">
        <div className="flex justify-center mb-2">
          {image && (
            <img
              src={image}
              alt="Profile"
              className="w-32 h-32 rounded-xl object-cover shadow-sm"
            />
          )}
        </div>

        {skill?.length > 0 && (
          <section>
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-900 mb-4 pb-1 border-b-2 border-gray-200">
              Kỹ năng
            </h3>
            <div className="flex flex-col gap-3">
              {skill.map((i) => (
                <div key={i.id}>
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
                    <div
                      className="mt-1 text-xs text-gray-600"
                      dangerouslySetInnerHTML={{ __html: i.description }}
                    />
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {language?.length > 0 && (
          <section>
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-900 mb-4 pb-1 border-b-2 border-gray-200">
              Ngoại ngữ
            </h3>
            <div className="flex flex-col gap-3">
              {language.map((i) => (
                <div key={i.id}>
                  <div className="font-semibold text-gray-900 text-xs">
                    {i.title}
                  </div>
                  {i.description && (
                    <div className="mt-0.5 text-[11px] text-gray-600">
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
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-900 mb-4 pb-1 border-b-2 border-gray-200">
              Giải thưởng
            </h3>
            <div className="flex flex-col gap-3">
              {award.map((i) => (
                <div key={i.id}>
                  <h4 className="text-xs font-bold text-gray-900">{i.title}</h4>
                  <div className="text-[11px] text-gray-700 font-semibold mt-0.5">
                    {i.awarder}
                  </div>
                  <div className="text-[11px] text-blue-500 mt-0.5">
                    {i.date}
                  </div>
                  {i.description && (
                    <div
                      className="text-xs text-gray-600 leading-relaxed list-disc pl-4 mt-1"
                      dangerouslySetInnerHTML={{ __html: i.description }}
                    />
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {hobby?.length > 0 && (
          <section>
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-900 mb-4 pb-1 border-b-2 border-gray-200">
              Sở thích
            </h3>
            <div className="flex flex-wrap gap-2">
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
  <div className="flex bg-white min-h-[297mm] font-sans">
    <div className="w-[30%] bg-gray-900 text-white p-8 flex flex-col gap-8 shrink-0">
      <div className="flex flex-col items-center text-center">
        {image ? (
          <img
            src={image}
            alt="Profile"
            className="w-32 h-32 rounded-full object-cover border-2 border-gray-600 mb-4"
          />
        ) : (
          <div className="w-32 h-32 rounded-full bg-gray-800 border-2 border-gray-600 flex items-center justify-center mb-4">
            <span className="text-gray-500 font-bold text-2xl uppercase">
              {personalInfo?.fullName?.charAt(0) ?? "?"}
            </span>
          </div>
        )}
        <h1 className="text-2xl font-bold uppercase tracking-tight mb-1 leading-tight">
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
              <div key={i.id}>
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
                  <div
                    className="mt-1.5 text-[10px] text-gray-400"
                    dangerouslySetInnerHTML={{ __html: i.description }}
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
              <div key={i.id}>
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

    <div className="w-[70%] p-10 flex flex-col gap-6 text-gray-800">
      {bio && (
        <section>
          <h3 className="text-xs font-bold uppercase tracking-widest text-gray-900 border-b border-gray-200 pb-1 mb-3">
            Tiểu sử
          </h3>
          <div
            className="text-xs text-gray-700 leading-relaxed text-justify"
            dangerouslySetInnerHTML={{ __html: bio }}
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
              <div key={i.id}>
                <div className="flex justify-between items-baseline mb-0.5">
                  <h4 className="text-sm font-bold text-gray-900">{i.title}</h4>
                  <span className="text-[11px] text-blue-500 font-medium whitespace-nowrap ml-2">
                    {i.startDate} - {i.endDate}
                  </span>
                </div>
                <div className="text-xs font-semibold text-gray-600 mb-1.5">
                  {i.company}
                  {i.location ? ` • ${i.location}` : ""}
                </div>
                <div
                  className="text-xs text-gray-600 leading-relaxed list-disc pl-4"
                  dangerouslySetInnerHTML={{ __html: i.description }}
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
              <div key={i.id}>
                <div className="flex justify-between items-baseline mb-0.5">
                  <h4 className="text-sm font-bold text-gray-900">{i.title}</h4>
                  <span className="text-[11px] text-blue-500 font-medium whitespace-nowrap ml-2">
                    {i.startDate} - {i.endDate}
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
                  <div
                    className="text-xs text-gray-600 leading-relaxed list-disc pl-4 mt-1"
                    dangerouslySetInnerHTML={{ __html: i.description }}
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
              <div key={i.id}>
                <div className="flex justify-between items-baseline mb-0.5">
                  <h4 className="text-sm font-bold text-gray-900">{i.title}</h4>
                  <span className="text-[11px] text-blue-500 font-medium whitespace-nowrap ml-2">
                    {i.date}
                  </span>
                </div>
                {i.link && (
                  <a
                    href={i.link}
                    className="text-[11px] text-blue-600 hover:underline block mb-1 truncate"
                  >
                    {i.link}
                  </a>
                )}
                <div
                  className="text-xs text-gray-600 leading-relaxed list-disc pl-4 mt-1"
                  dangerouslySetInnerHTML={{ __html: i.description }}
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
              <div key={i.id}>
                <div className="flex justify-between items-baseline mb-0.5">
                  <h4 className="text-sm font-bold text-gray-900">{i.title}</h4>
                  <span className="text-[11px] text-blue-500 font-medium whitespace-nowrap ml-2">
                    {i.date}
                  </span>
                </div>
                <div className="text-xs font-semibold text-gray-700 mb-1">
                  {i.publisher}
                </div>
                {i.description && (
                  <div
                    className="text-xs text-gray-600 leading-relaxed list-disc pl-4 mt-1"
                    dangerouslySetInnerHTML={{ __html: i.description }}
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
              <div key={i.id}>
                <div className="flex justify-between items-baseline mb-0.5">
                  <h4 className="text-sm font-bold text-gray-900">{i.title}</h4>
                  <span className="text-[11px] text-blue-500 font-medium whitespace-nowrap ml-2">
                    {i.date}
                  </span>
                </div>
                <div className="text-xs font-semibold text-gray-600 mb-1">
                  {i.awarder}
                </div>
                {i.description && (
                  <div
                    className="text-xs text-gray-600 leading-relaxed list-disc pl-4 mt-1"
                    dangerouslySetInnerHTML={{ __html: i.description }}
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
          {selectedTemplate === "classic" && <BasicTemplate {...commonProps} />}
          {selectedTemplate === "modern" && <ModernTemplate {...commonProps} />}
          {selectedTemplate === "professional" && (
            <ProfessionalTemplate {...commonProps} />
          )}
        </div>
      </div>
    </div>
  );
}
