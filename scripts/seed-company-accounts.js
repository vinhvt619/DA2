import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { jobsData } from "../src/data/jobsData.js";
import Job from "../server/models/Job.js";
import User from "../server/models/User.js";

dotenv.config();

const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || process.env.ATLAS_MONGO_URI;
const TEST_PASSWORD = "RabbitCV@123";

// username, industry, size, website, founded year, address, phone, description
const companies = {
  "FPT Software": ["fpt", "Information Technology & Software Outsourcing", "20,000+ nhân viên", "https://fptsoftware.com", "1999", "FPT Tower, 10 Phạm Văn Bạch, Cầu Giấy, Hà Nội", "028 7300 7300", "Công ty công nghệ toàn cầu cung cấp dịch vụ chuyển đổi số, phát triển phần mềm, cloud, AI, dữ liệu và tự động hóa cho khách hàng doanh nghiệp."],
  "VNG Corporation": ["vng", "Internet, Gaming & Digital Services", "3,000+ nhân viên", "https://vng.com.vn", "2004", "VNG Campus, Quận 7, TP. Hồ Chí Minh", "028 3962 3888", "Doanh nghiệp công nghệ Việt Nam phát triển trò chơi trực tuyến, nền tảng kết nối, thanh toán số và các dịch vụ đám mây."],
  "Nova Studio": ["novastudio", "Product Design & Creative Technology", "51-200 nhân viên", "https://novastudio.example", "2018", "Quận 1, TP. Hồ Chí Minh", "028 7777 2018", "Studio sản phẩm số tập trung vào nghiên cứu người dùng, thiết kế UI/UX, nhận diện thương hiệu và phát triển trải nghiệm web, mobile."],
  "MoMo (M-Service)": ["momo", "Fintech & Digital Payments", "2,000+ nhân viên", "https://momo.vn", "2007", "Tòa nhà Phú Mỹ Hưng, Quận 7, TP. Hồ Chí Minh", "028 5414 7667", "Nền tảng tài chính số cung cấp ví điện tử, thanh toán, chuyển tiền và hệ sinh thái dịch vụ cho người dùng và đối tác tại Việt Nam."],
  "Tiki Corporation": ["tiki", "E-commerce & Logistics Technology", "1,000+ nhân viên", "https://tiki.vn", "2010", "Quận 10, TP. Hồ Chí Minh", "1900 6035", "Nền tảng thương mại điện tử Việt Nam vận hành hệ thống bán lẻ, kho vận và giao nhận dựa trên dữ liệu cùng công nghệ cloud."],
  "KMS Technology": ["kms", "Software Engineering & Consulting", "1,000+ nhân viên", "https://kms-technology.com", "2009", "E-Town, Quận Tân Bình, TP. Hồ Chí Minh", "028 3811 9977", "Công ty tư vấn và phát triển sản phẩm phần mềm, kiểm thử chất lượng, dữ liệu và trí tuệ nhân tạo cho thị trường quốc tế."],
  "Zalo AI": ["zaloai", "Artificial Intelligence Research", "201-500 nhân viên", "https://zalo.ai", "2017", "VNG Campus, Quận 7, TP. Hồ Chí Minh", "028 3962 3888", "Đơn vị nghiên cứu và ứng dụng AI cho xử lý ngôn ngữ tự nhiên, thị giác máy tính, giọng nói và các sản phẩm phục vụ hàng triệu người dùng."],
  "Castus Corporation": ["castus", "Localization & Technology Services", "51-200 nhân viên", "https://castus.example", "2016", "Quận 1, TP. Hồ Chí Minh", "028 7777 1616", "Doanh nghiệp dịch vụ nội dung đa ngôn ngữ chuyên bản địa hóa phần mềm, tài liệu kỹ thuật và sản phẩm số cho thị trường châu Âu."],
  "Shopee": ["shopee", "E-commerce & Digital Services", "10,000+ nhân viên", "https://shopee.vn", "2015", "Saigon Centre, Quận 1, TP. Hồ Chí Minh", "1900 1221", "Nền tảng thương mại điện tử kết nối người mua, nhà bán hàng và các dịch vụ thanh toán, vận chuyển trong khu vực Đông Nam Á."],
  "TechBase VN": ["techbasevn", "Offshore Software Development", "201-500 nhân viên", "https://www.techbasevn.com", "2015", "Quận 4, TP. Hồ Chí Minh", "028 7309 8080", "Công ty phát triển phần mềm cho khách hàng Nhật Bản, chuyên web application, mobile, nền tảng dữ liệu và vận hành hệ thống."],
  "VPBank": ["vpbank", "Banking & Financial Technology", "10,000+ nhân viên", "https://www.vpbank.com.vn", "1993", "89 Láng Hạ, Đống Đa, Hà Nội", "1900 545415", "Ngân hàng thương mại phát triển mạnh các sản phẩm tài chính số, dữ liệu khách hàng, ngân hàng lõi và hệ sinh thái thanh toán hiện đại."],
  "Elsa Speak": ["elsaspeak", "EdTech & Artificial Intelligence", "201-500 nhân viên", "https://elsaspeak.com", "2015", "Quận 3, TP. Hồ Chí Minh", "028 7309 9968", "Công ty công nghệ giáo dục ứng dụng AI nhận diện giọng nói để hỗ trợ người học cải thiện phát âm và giao tiếp tiếng Anh."],
  "Nashtech Vietnam": ["nashtech", "Technology Consulting & Outsourcing", "2,000+ nhân viên", "https://www.nashtechglobal.com", "2000", "E-Town, Quận Tân Bình, TP. Hồ Chí Minh", "028 3810 6200", "Doanh nghiệp tư vấn công nghệ và phát triển phần mềm toàn cầu, cung cấp kỹ thuật số, cloud, dữ liệu, kiểm thử và dịch vụ vận hành."],
  "Amanotes": ["amanotes", "Music Technology & Mobile Games", "201-500 nhân viên", "https://amanotes.com", "2014", "Quận 1, TP. Hồ Chí Minh", "028 7300 9798", "Công ty công nghệ âm nhạc phát triển trò chơi và ứng dụng di động dành cho người dùng toàn cầu, kết hợp dữ liệu với trải nghiệm sáng tạo."],
  "CMC Telecom": ["cmctelecom", "Cloud, Data Center & Telecommunications", "500-1,000 nhân viên", "https://cmctelecom.vn", "2008", "11 Duy Tân, Cầu Giấy, Hà Nội", "1900 2010", "Nhà cung cấp hạ tầng số, trung tâm dữ liệu, kết nối, cloud và giải pháp bảo mật cho doanh nghiệp trong nước và quốc tế."],
  "Viettel Cyber Security": ["viettelcybersecurity", "Cyber Security", "500-1,000 nhân viên", "https://viettelcybersecurity.com", "2014", "Keangnam Landmark, Nam Từ Liêm, Hà Nội", "024 6266 2266", "Đơn vị an toàn thông tin cung cấp giám sát, kiểm thử xâm nhập, ứng cứu sự cố và các nền tảng bảo mật cho tổ chức, doanh nghiệp."],
  "Kyber Network": ["kybernetwork", "Blockchain & Decentralized Finance", "51-200 nhân viên", "https://kyber.network", "2017", "Quận Phú Nhuận, TP. Hồ Chí Minh", "028 7777 2017", "Đội ngũ blockchain xây dựng hạ tầng thanh khoản phi tập trung, smart contract và các sản phẩm Web3 cho cộng đồng toàn cầu."],
  "VCCorp": ["vccorp", "Digital Media, Advertising & Cloud", "1,000+ nhân viên", "https://vccorp.vn", "2006", "85 Vũ Trọng Phụng, Thanh Xuân, Hà Nội", "024 3974 3410", "Công ty công nghệ và nội dung số vận hành các nền tảng truyền thông, quảng cáo, thương mại điện tử và hạ tầng cloud quy mô lớn."],
  "Viindoo": ["viindoo", "Enterprise Management Software", "51-200 nhân viên", "https://viindoo.com", "2019", "Quận Hồng Bàng, Hải Phòng", "0225 730 9838", "Doanh nghiệp phát triển và triển khai phần mềm quản trị tổng thể dựa trên Odoo cho tài chính, bán hàng, kho, sản xuất và nhân sự."],
  "GearVN": ["gearvn", "Technology Retail & E-commerce", "500-1,000 nhân viên", "https://gearvn.com", "2011", "Quận 10, TP. Hồ Chí Minh", "1800 6975", "Hệ thống bán lẻ công nghệ chuyên máy tính, laptop và gaming gear, kết hợp thương mại điện tử với dịch vụ kỹ thuật và hậu mãi."],
};

const makeProfile = (name, data, index) => ({
  username: data[0],
  email: `${data[0]}@rabbitcv.test`,
  fullName: name,
  role: "company",
  status: "active",
  isBanned: false,
  companyIndustry: data[1],
  companySize: data[2],
  companyWebsite: data[3],
  companyFoundedYear: data[4],
  address: data[5],
  hometown: data[5].includes("Hà Nội") ? "Hà Nội" : data[5].includes("Hải Phòng") ? "Hải Phòng" : "TP. Hồ Chí Minh",
  country: "Việt Nam",
  phoneNumber: data[6],
  companyDescription: data[7],
  companyTaxCode: `RABBITCV-TEST-${String(index + 1).padStart(3, "0")}`,
});

async function seedCompanyAccounts() {
  if (!mongoUri) throw new Error("Không tìm thấy MONGODB_URI trong file .env.");

  await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 15000 });
  const password = await bcrypt.hash(TEST_PASSWORD, 10);
  const companyIds = new Map();

  for (const [index, [name, data]] of Object.entries(companies).entries()) {
    const profile = makeProfile(name, data, index);
    const company = await User.findOneAndUpdate(
      { $or: [{ username: profile.username }, { email: profile.email }] },
      { ...profile, password },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
    );
    companyIds.set(name, company._id);
  }

  for (const job of jobsData) {
    const companyId = companyIds.get(job.company);
    if (!companyId) throw new Error(`Thiếu hồ sơ công ty: ${job.company}`);

    await Job.findOneAndUpdate(
      { companyId, title: job.title },
      {
        title: job.title,
        company: job.company,
        companyId,
        location: job.location,
        type: job.type,
        salary: job.salary,
        description: job.description,
        requirements: job.requirements || [],
        benefits: job.benefits || [],
        tags: job.tags || [],
        status: "Active",
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
    );
  }

  console.log(`Đã tạo/cập nhật ${companyIds.size} tài khoản công ty và ${jobsData.length} tin tuyển dụng.`);
  console.log(`Mật khẩu kiểm thử chung: ${TEST_PASSWORD}`);
  console.log(`Tài khoản: ${Object.values(companies).map((company) => company[0]).join(", ")}`);
}

seedCompanyAccounts()
  .catch((error) => {
    console.error("Seed công ty thất bại:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
