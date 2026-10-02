import mongoose from "mongoose";
import Resume from "./models/Resume.js";

const seedData = {
  image: "",
  personalInfo: {
    fullName: "",
    jobTitle: "",
    email: "",
    website: "",
    phone: "",
    location: "",
  },
  bio: "",
  profile: [{ networkName: "", username: "", link: "" }],
  experience: [
    {
      title: "",
      company: "",
      location: "",
      startDate: "",
      endDate: "",
      description: "",
    },
  ],
  education: [
    {
      title: "",
      company: "",
      location: "",
      startDate: "",
      endDate: "",
      description: "",
    },
  ],
  skill: [{ title: "" }],
  language: [{ title: "", description: "" }],
  certificate: [{ title: "", date: "", publisher: "", description: "" }],
  project: [
    {
      title: "",
      company: "",
      location: "",
      startDate: "",
      endDate: "",
      date: "",
      link: "",
      description: "",
    },
  ],
  award: [{ title: "", awarder: "", date: "", description: "" }],
};

import dotenv from "dotenv";
dotenv.config();

// Kết nối tài khoản MongoDB Compass (Local)
const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

async function importData() {
  try {
    await mongoose.connect(MONGO_URI, {
      family: 4,
      serverSelectionTimeoutMS: 5000,
    });
    console.log("Đã kết nối MongoDB Local!");

    await Resume.deleteMany({});
    console.log("Đã xóa dữ liệu CV cũ");

    const newResume = new Resume(seedData);
    await newResume.save();
    console.log("Đã Import dữ liệu CV thành công vào MongoDB!");

    process.exit();
  } catch (error) {
    console.error("Lỗi khi tải dữ liệu lên:", error);
    process.exit(1);
  }
}

importData();
