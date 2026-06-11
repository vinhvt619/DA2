export const jobsData = [
  {
    id: "castus-it-de",
    title: "Dịch thuật văn bản IT sang tiếng Đức",
    company: "Castus Corporation",
    location: "Quận 1, TP. Hồ Chí Minh",
    type: "Full-time",
    salary: "12-18 triệu",
    postedAt: "1 ngày trước",
    description:
      "Bạn sẽ phối hợp cùng team Product và Engineering để dịch tài liệu kỹ thuật, UI text và nội dung release note. Công việc phù hợp với ứng viên có nền tảng CNTT và khả năng tiếng Đức tốt.",
    requirements: [
      "Tiếng Đức tối thiểu B2",
      "Có kinh nghiệm dịch tài liệu kỹ thuật",
      "Hiểu biết cơ bản về phần mềm/web app",
    ],
    benefits: ["Lương tháng 13", "Linh hoạt giờ làm", "Review lương 2 lần/năm"],
    tags: ["Hợp đồng", "Tại văn phòng", "Tiếng Đức"],
  },
  {
    id: "frontend-intern-react",
    title: "Frontend Intern (React)",
    company: "RabbitCV",
    location: "Thủ Đức, TP. Hồ Chí Minh",
    type: "Intern",
    salary: "4-8 triệu",
    postedAt: "2 ngày trước",
    description:
      "Bạn sẽ làm việc cùng mentor để xây dựng các màn hình người dùng, tối ưu UI/UX và xử lý dữ liệu từ API. Đây là vị trí phù hợp cho sinh viên năm cuối muốn có kinh nghiệm thực chiến.",
    requirements: [
      "Nắm cơ bản HTML/CSS/JS",
      "Đã làm dự án React cá nhân hoặc môn học",
      "Chủ động học hỏi và làm việc nhóm",
    ],
    benefits: ["Mentor 1-1", "Hỗ trợ dấu mộc thực tập", "Cơ hội lên chính thức"],
    tags: ["Hybrid", "React", "Sinh viên"],
  },
  {
    id: "uiux-designer-junior",
    title: "UI/UX Designer Junior",
    company: "Nova Studio",
    location: "Quận 7, TP. Hồ Chí Minh",
    type: "Full-time",
    salary: "10-15 triệu",
    postedAt: "3 ngày trước",
    description:
      "Bạn sẽ nghiên cứu người dùng, xây dựng wireframe/prototype và phối hợp với đội frontend để triển khai giao diện. Vị trí yêu cầu tư duy thẩm mỹ và khả năng giải quyết vấn đề.",
    requirements: [
      "Sử dụng tốt Figma",
      "Hiểu nguyên tắc UX cơ bản",
      "Có portfolio cá nhân",
    ],
    benefits: ["Bảo hiểm đầy đủ", "Phụ cấp ăn trưa", "Team building hằng quý"],
    tags: ["Figma", "SaaS", "Junior"],
  },{
    id: "uiux-designer-senior",
    title: "UI/UX Designer Senior",
    company: "Nova Studio",
    location: "Quận 7, TP. Hồ Chí Minh",
    type: "Full-time",
    salary: "10-15 triệu",
    postedAt: "3 ngày trước",
    description:
      "Bạn sẽ nghiên cứu người dùng, xây dựng wireframe/prototype và phối hợp với đội frontend để triển khai giao diện. Vị trí yêu cầu tư duy thẩm mỹ và khả năng giải quyết vấn đề.",
    requirements: [
      "Sử dụng tốt Figma",
      "Hiểu nguyên tắc UX cơ bản",
      "Có portfolio cá nhân",
    ],
    benefits: ["Bảo hiểm đầy đủ", "Phụ cấp ăn trưa", "Team building hằng quý"],
    tags: ["Figma", "SaaS", "Junior"],
  },
];

export const getJobById = (jobId) => jobsData.find((job) => job.id === jobId);
