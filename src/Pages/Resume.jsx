import React from "react";
import Header from "../Components/Header";
import ResumeForm from "../Components/ResumeForm";
import ResumePreview from "../Components/ResumePreview";

export default function CreateResume() {
  return (
    <div className="bg-[#F8F4FC] h-full">
      <Header />
      <div className="pt-10 flex  items-start h-screen justify-evenly">
        <ResumeForm />
        <ResumePreview />
      </div>
      ádzcxzczzz
    </div>
  );
}
