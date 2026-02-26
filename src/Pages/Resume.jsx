import React, { useState } from "react";
import Header from "../Components/Header";
import ResumeForm from "../Components/ResumeForm";
import ResumePreview from "../Components/ResumePreview";
import ResumeTemplate from "../Components/ResumeTemplate";
import {
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
} from "@heroicons/react/24/outline";

export default function CreateResume() {
  const [showForm, setShowForm] = useState(true);
  const [showTemplates, setShowTemplates] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState("modern");

  const [image, setImage] = useState(null);
  const [bio, setBio] = useState(
    "<p>Hello World! Try selecting text or checking the floating menu on a new line.</p>",
  );
  const [personalInfo, setPersonalInfo] = useState({
    fullName: "Vinh Nguyen",
    jobTitle: "Frontend Developer",
    email: "vinhvt619@gmail.com",
    website: "https://github.com/vinhvt619",
    phone: "0123 456 789",
    location: "Hà Nội, Việt Nam",
  });
  const [profile, setProfile] = useState([
    {
      id: 1,
      username: "vinhvt619",
      networkName: "github",
      link: "https://github.com/vinhvt619",
    },
  ]);
  const [experience, setExperience] = useState([
    {
      id: 1,
      title: "Frontend Developer",
      company: "Company A",
      location: "Location A",
      startDate: "2022-01-01",
      endDate: "2022-12-31",
      description: "Description A",
    },
  ]);
  const [education, setEducation] = useState([
    {
      id: 1,
      title: "Frontend Developer",
      company: "Company A",
      location: "Location A",
      startDate: "2022-01-01",
      endDate: "2022-12-31",
      description: "Description A",
    },
  ]);
  const [skill, setSkill] = useState([
    {
      id: 1,
      title: "Frontend Developer",
      description: "Description A",
      performance: "Tốt",
    },
  ]);
  const [language, setLanguage] = useState([
    {
      id: 1,
      title: "Frontend Developer",
      description: "Description A",
    },
  ]);
  const [certificate, setCertificate] = useState([
    {
      id: 1,
      title: "Frontend Developer",
      date: "2022-01-01",
      publisher: "Company A",
      description: "Description A",
    },
  ]);
  const [project, setProject] = useState([
    {
      id: 1,
      title: "Frontend Developer",
      date: "2022-01-01",
      link: "https://github.com/example/project",
      description: "Description A",
    },
  ]);
  const [award, setAward] = useState([
    {
      id: 1,
      title: "Frontend Developer",
      awarder: "Company A",
      date: "2022-01-01",
      description: "Description A",
    },
  ]);

  return (
    <div className="bg-[#F8F4FC] h-screen flex flex-col ">
      <Header />
      <div className="flex flex-1 overflow-hidden relative">
        {/* Left Sidebar Toggle */}
        <button
          onClick={() => setShowForm(!showForm)}
          className={`absolute top-4 z-20 bg-white p-1 rounded-r-lg shadow-md hover:bg-gray-50 transition-all duration-300 ${
            showForm ? "left-[30%]" : "left-0"
          }`}
          title={showForm ? "Thu gọn Form" : "Mở rộng Form"}
        >
          {showForm ? (
            <ChevronDoubleLeftIcon className="w-5 h-5 text-gray-600" />
          ) : (
            <ChevronDoubleRightIcon className="w-5 h-5 text-gray-600" />
          )}
        </button>

        {/* Left Sidebar (Resume Form) */}
        <div
          className={`transition-all duration-300 ease-in-out border-r border-gray-200 bg-white overflow-hidden ${
            showForm ? "w-[30%]" : "w-0"
          }`}
        >
          <div className="w-full h-full overflow-y-auto">
            <ResumeForm
              image={image}
              setImage={setImage}
              personalInfo={personalInfo}
              setPersonalInfo={setPersonalInfo}
              bio={bio}
              setBio={setBio}
              profile={profile}
              setProfile={setProfile}
              experience={experience}
              setExperience={setExperience}
              education={education}
              setEducation={setEducation}
              skill={skill}
              setSkill={setSkill}
              language={language}
              setLanguage={setLanguage}
              certificate={certificate}
              setCertificate={setCertificate}
              project={project}
              setProject={setProject}
              award={award}
              setAward={setAward}
            />
          </div>
        </div>

        {/* Center Canvas (Preview) */}
        <div className="flex-1 bg-gray-100 overflow-hidden flex justify-center py-8">
          <ResumePreview
            selectedTemplate={selectedTemplate}
            image={image}
            personalInfo={personalInfo}
            bio={bio}
            profile={profile}
            experience={experience}
            education={education}
            skill={skill}
            language={language}
            certificate={certificate}
            project={project}
            award={award}
          />
        </div>

        {/* Right Sidebar Toggle */}
        <button
          onClick={() => setShowTemplates(!showTemplates)}
          className={`absolute top-4 z-20 bg-white p-1 rounded-l-lg shadow-md hover:bg-gray-50 transition-all duration-300 ${
            showTemplates ? "right-[20%]" : "right-0"
          }`}
          title={showTemplates ? "Thu gọn Templates" : "Mở rộng Templates"}
        >
          {showTemplates ? (
            <ChevronDoubleRightIcon className="w-5 h-5 text-gray-600" />
          ) : (
            <ChevronDoubleLeftIcon className="w-5 h-5 text-gray-600" />
          )}
        </button>

        {/* Right Sidebar (Templates) */}
        <div
          className={`transition-all duration-300 ease-in-out border-l border-gray-200 bg-white overflow-hidden ${
            showTemplates ? "w-[20%]" : "w-0"
          }`}
        >
          <ResumeTemplate
            selectedTemplate={selectedTemplate}
            setSelectedTemplate={setSelectedTemplate}
          />
        </div>
      </div>
    </div>
  );
}
