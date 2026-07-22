import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import mongoose from "mongoose";
import Job from "../server/models/Job.js";
import User from "../server/models/User.js";

dotenv.config();

const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || process.env.ATLAS_MONGO_URI;

const account = {
  username: "fpt",
  email: "fptsoftware@rabbitcv.test",
  password: "123",
};

const companyProfile = {
  username: account.username,
  email: account.email,
  fullName: "FPT Software",
  role: "company",
  status: "active",
  isBanned: false,
  phoneNumber: "028 7300 7300",
  address: "FPT Tower, 10 Pham Van Bach, Cau Giay, Ha Noi",
  country: "Vietnam",
  hometown: "Ha Noi",
  companyIndustry: "Information Technology & Software Outsourcing",
  companySize: "20,000+ employees",
  companyWebsite: "https://fptsoftware.com",
  companyFoundedYear: "1999",
  companyTaxCode: "0101601092",
  companyDescription:
    "FPT Software la cong ty cong nghe va dich vu CNTT toan cau, cung cap giai phap chuyen doi so, phat trien phan mem, AI, cloud, data va automation cho khach hang tai nhieu thi truong.",
};

const jobData = {
  title: "Senior React Developer",
  company: "FPT Software",
  location: "Ha Noi / Ho Chi Minh City / Hybrid",
  type: "Full-time",
  salary: "35-55 trieu VND",
  description:
    "FPT Software can tuyen Senior React Developer tham gia phat trien cac san pham web quy mo lon cho khach hang doanh nghiep. Vi tri nay phu hop voi ung vien co kinh nghiem xay dung frontend hien dai, chu dong trong thiet ke component, toi uu hieu nang va mentoring thanh vien tre.",
  requirements: [
    "Tu 4 nam kinh nghiem phat trien frontend voi React.",
    "Thanh thao JavaScript/TypeScript, HTML, CSS va responsive UI.",
    "Co kinh nghiem voi REST API hoac GraphQL, state management va component architecture.",
    "Hieu ve performance optimization, accessibility va clean code.",
    "Co kinh nghiem review code, mentoring va lam viec Agile/Scrum.",
    "Doc hieu tai lieu ky thuat tieng Anh; giao tiep tieng Anh la loi the.",
  ],
  benefits: [
    "Luong canh tranh theo nang luc, review dinh ky.",
    "Bao hiem, phuc loi va ngay nghi theo chinh sach cong ty.",
    "Moi truong du an quoc te, co co hoi lam viec voi khach hang lon.",
    "Dao tao noi bo, lo trinh phat trien nghe nghiep ro rang.",
    "Che do lam viec hybrid linh hoat theo du an.",
  ],
  tags: ["React", "TypeScript", "JavaScript", "Frontend", "Senior", "Hybrid"],
  status: "Active",
  expiryDate: new Date("2027-07-17T00:00:00.000Z"),
};

async function seedFptSoftware() {
  if (!mongoUri) {
    throw new Error("Khong tim thay MONGODB_URI trong file .env.");
  }

  await mongoose.connect(mongoUri, {
    serverSelectionTimeoutMS: 15000,
  });

  const password = await bcrypt.hash(account.password, 10);

  const company = await User.findOneAndUpdate(
    { $or: [{ username: account.username }, { email: account.email }] },
    { ...companyProfile, password },
    { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
  );

  const job = await Job.findOneAndUpdate(
    { companyId: company._id, title: jobData.title },
    { ...jobData, companyId: company._id },
    { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
  );

  console.log("Seed thanh cong FPT Software.");
  console.log(`Company ID: ${company._id}`);
  console.log(`Job ID: ${job._id}`);
  console.log(`Email: ${account.email}`);
  console.log(`Username: ${account.username}`);
  console.log(`Password: ${account.password}`);
  console.log(`Public profile: /profile/${company._id}`);
}

seedFptSoftware()
  .catch((error) => {
    console.error("Seed that bai:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
