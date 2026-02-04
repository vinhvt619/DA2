import React from "react";
import Header from "../Components/Header";
import ResumeForm from "../Components/ResumeForm";
import ResumePreview from "../Components/ResumePreview";

export default function CreateResume() {
  return (
    <div className="bg-[#F8F4FC] h-screen flex flex-col ">
      <Header />
      <div className="py-5 flex flex-1 items-start justify-evenly overflow-hidden">
        <ResumeForm />
        <ResumePreview />
      </div>
    </div>
  );
}
