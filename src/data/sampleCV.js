export const SAMPLE_CVS = [
  {
    title: "CV Frontend Developer (ReactJS)",
    personalInfo: {
      fullName: "Nguyễn Văn A",
      jobTitle: "Senior Frontend Developer",
      email: "nguyenvana.dev@email.com",
      phone: "0901 234 567",
      location: "TP. Hồ Chí Minh, Việt Nam",
      website: "github.com/nguyenvana",
    },
    bio: "Lập trình viên Frontend với hơn 4 năm kinh nghiệm trong việc xây dựng các ứng dụng web tương tác cao bằng ReactJS và hệ sinh thái Modern JavaScript. Đam mê tối ưu hóa hiệu suất (Performance) và mang lại trải nghiệm người dùng (UX) mượt mà. Có khả năng làm việc độc lập và kỹ năng giải quyết vấn đề tốt.",
    profile: [
      { id: "p1", networkName: "LinkedIn", username: "nguyen-van-a", link: "https://linkedin.com/in/nguyenvana" },
      { id: "p2", networkName: "GitHub", username: "nguyenvana-dev", link: "https://github.com/nguyenvana-dev" }
    ],
    experience: [
      {
        id: "e1",
        title: "Senior Frontend Developer",
        company: "Tech Solutions VN",
        location: "TP. HCM",
        startDate: "2021-05",
        endDate: "Hiện tại",
        description: "- Dẫn dắt nhóm 3 frontend developers xây dựng nền tảng CRM nội bộ cho hơn 50,000 người dùng.\n- Chuyển đổi kiến trúc từ monolith sang micro-frontend bằng Webpack Module Federation.\n- Cải thiện tốc độ tải trang (FCP) lên 40% bằng các kỹ thuật Lazy Loading, Code Splitting và Caching.\n- Phối hợp chặt chẽ với UI/UX designer để triển khai hệ thống Design System."
      },
      {
        id: "e2",
        title: "Frontend Developer",
        company: "E-commerce Group",
        location: "Hà Nội",
        startDate: "2019-06",
        endDate: "2021-04",
        description: "- Tham gia phát triển trang chủ và trang chi tiết sản phẩm cho website thương mại điện tử lớn với hàng triệu lượt truy cập mỗi ngày.\n- Sử dụng ReactJS, Redux Toolkit và Tailwind CSS để tối ưu giao diện responsive.\n- Tích hợp cổng thanh toán VNPay và Momo.\n- Viết unit test bằng Jest và React Testing Library đạt độ bao phủ (coverage) 80%."
      }
    ],
    education: [
      {
        id: "ed1",
        title: "Cử nhân Công nghệ Thông tin",
        company: "Đại học Khoa Học Tự Nhiên TP.HCM",
        location: "TP. HCM",
        major: "Kỹ thuật phần mềm",
        score: "3.2/4.0",
        startDate: "2015-09",
        endDate: "2019-07",
        description: "Đồ án tốt nghiệp: Xây dựng hệ thống quản lý học tập (LMS) bằng MERN stack (Điểm: 9.0/10). Nhận học bổng sinh viên xuất sắc năm 2018."
      }
    ],
    skill: [
      { id: "s1", title: "ReactJS / Next.js", performance: "Xuất sắc", description: "Hooks, Context API, SSR/SSG, Server Actions" },
      { id: "s2", title: "JavaScript / TypeScript", performance: "Xuất sắc", description: "ES6+, Type Safety, Generics" },
      { id: "s3", title: "HTML/CSS", performance: "Xuất sắc", description: "Tailwind CSS, SASS, Responsive Design, CSS Modules" },
      { id: "s4", title: "State Management", performance: "Giỏi", description: "Redux Toolkit, Zustand, React Query" }
    ],
    language: [
      { id: "l1", title: "Tiếng Anh", description: "IELTS 6.5 - Giao tiếp trôi chảy và đọc hiểu tài liệu kỹ thuật chuyên ngành tốt." },
      { id: "l2", title: "Tiếng Việt", description: "Bản ngữ" }
    ],
    certificate: [
      {
        id: "c1",
        title: "AWS Certified Developer - Associate",
        date: "2022-10",
        publisher: "Amazon Web Services",
        description: "Chứng chỉ cấp độ Associate cho nhà phát triển ứng dụng trên nền tảng AWS."
      },
      {
        id: "c2",
        title: "Meta Front-End Developer Professional Certificate",
        date: "2021-05",
        publisher: "Coursera",
        description: "Chứng chỉ chuyên nghiệp do Meta cấp, bao gồm React, UI/UX, Version Control."
      }
    ],
    project: [
      {
        id: "pr1",
        title: "Job Portal Platform",
        date: "2023",
        link: "https://job-portal-demo.com",
        description: "- Xây dựng nền tảng tìm kiếm việc làm cho phép người dùng tạo CV và ứng tuyển trực tiếp.\n- Công nghệ: ReactJS, TailwindCSS, Firebase Auth, Node.js.\n- Vai trò: Fullstack Developer (Tự xây dựng từ A-Z, xử lý hàng nghìn records)."
      }
    ],
    award: [
      {
        id: "a1",
        title: "Nhân viên xuất sắc của năm",
        awarder: "Tech Solutions VN",
        date: "2022",
        description: "Được vinh danh vì những đóng góp vượt bậc trong việc tối ưu hóa hiệu năng hệ thống CRM giúp giảm tải 30% tài nguyên server."
      }
    ],
    hobby: [
      { id: "h1", title: "Đọc sách kỹ thuật & Clean Code" },
      { id: "h2", title: "Tham gia các buổi Meetup về công nghệ" },
      { id: "h3", title: "Viết blog chia sẻ kiến thức lập trình" }
    ]
  },
  {
    title: "CV Backend Engineer (NodeJS/Microservices)",
    personalInfo: {
      fullName: "Trần Thị B",
      jobTitle: "Senior Backend Developer",
      email: "tranthib@email.com",
      phone: "0988 765 432",
      location: "Hà Nội, Việt Nam",
      website: "gitlab.com/tranthib",
    },
    bio: "Kỹ sư Backend với 5 năm kinh nghiệm chuyên sâu về hệ sinh thái NodeJS và kiến trúc Microservices. Đam mê thiết kế các hệ thống chịu tải cao (high concurrency), tối ưu hóa database và xây dựng hạ tầng Cloud vững chắc. Đã từng triển khai thành công nhiều dự án lớn phục vụ hàng triệu người dùng.",
    profile: [
      { id: "p1", networkName: "GitLab", username: "tranthib-backend", link: "https://gitlab.com/tranthib" },
      { id: "p2", networkName: "Medium", username: "tranthib-tech", link: "https://medium.com/@tranthib" }
    ],
    experience: [
      {
        id: "e1",
        title: "Senior Backend Engineer",
        company: "Zalo Group",
        location: "Hà Nội",
        startDate: "2020-01",
        endDate: "Hiện tại",
        description: "- Phát triển hệ thống message processing real-time phục vụ hơn 5 triệu active users hàng ngày bằng Socket.io và Redis Pub/Sub.\n- Tối ưu hóa các câu truy vấn phức tạp trên MongoDB và PostgreSQL, giảm thời gian phản hồi API trung bình từ 500ms xuống còn 150ms.\n- Thiết kế kiến trúc Event-driven sử dụng Apache Kafka để đồng bộ hóa dữ liệu giữa các microservices.\n- Tham gia vào quá trình phỏng vấn và đánh giá ứng viên Backend."
      },
      {
        id: "e2",
        title: "Backend Developer",
        company: "Tech Fintech Startup",
        location: "Hà Nội",
        startDate: "2017-08",
        endDate: "2019-12",
        description: "- Viết API RESTful bằng Express và NestJS cho hệ thống ví điện tử.\n- Tích hợp các cổng thanh toán quốc tế (Stripe, PayPal) và xử lý transaction với tính toàn vẹn dữ liệu (ACID).\n- Thiết lập pipeline CI/CD cơ bản bằng GitLab CI/CD và Docker."
      }
    ],
    education: [
      {
        id: "ed1",
        title: "Cử nhân Khoa học Máy tính",
        company: "Đại học Bách Khoa Hà Nội",
        location: "Hà Nội",
        major: "Hệ thống thông tin phân tán",
        score: "8.5/10",
        startDate: "2013-09",
        endDate: "2017-07",
        description: "Tốt nghiệp loại Giỏi. Thành viên nòng cốt của CLB Olympic Tin học."
      }
    ],
    skill: [
      { id: "s1", title: "Node.js / NestJS / Express", performance: "Xuất sắc", description: "Event Loop, Streams, REST, GraphQL" },
      { id: "s2", title: "Database & Cache", performance: "Xuất sắc", description: "PostgreSQL, MongoDB, Redis, Elasticsearch" },
      { id: "s3", title: "Message Brokers", performance: "Giỏi", description: "RabbitMQ, Apache Kafka" },
      { id: "s4", title: "DevOps & Cloud", performance: "Giỏi", description: "Docker, Kubernetes, AWS (EC2, S3, RDS)" }
    ],
    language: [
      { id: "l1", title: "Tiếng Anh", description: "TOEIC 850 - Đọc hiểu document kỹ thuật, giao tiếp công việc hàng ngày tốt." }
    ],
    certificate: [
      {
        id: "c1",
        title: "AWS Certified Solutions Architect – Associate",
        date: "2022-03",
        publisher: "Amazon",
        description: "Chứng chỉ thiết kế kiến trúc hệ thống trên AWS."
      },
      {
        id: "c2",
        title: "MongoDB Node.js Developer Path",
        date: "2020-11",
        publisher: "MongoDB University",
        description: "Chứng chỉ hoàn thành khóa học chuyên sâu về MongoDB cho Node.js Developer."
      }
    ],
    project: [
      {
        id: "pr1",
        title: "E-wallet Payment Gateway",
        date: "2019",
        link: "",
        description: "- Hệ thống xử lý giao dịch nội bộ cho phép hàng trăm giao dịch mỗi giây mà không bị deadlock.\n- Vai trò: Core Backend Developer thiết kế schema database và viết logic xử lý giao dịch."
      }
    ],
    award: [
      {
        id: "a1",
        title: "Giải Nhì - Hackathon Fintech 2019",
        awarder: "Vietnam Tech Association",
        date: "2019",
        description: "Dự án ví điện tử cho sinh viên với mô hình P2P lending."
      }
    ],
    hobby: [
      { id: "h1", title: "Chơi cờ vua" },
      { id: "h2", title: "Tham gia giải quyết thuật toán trên LeetCode" }
    ]
  },
  {
    title: "CV UI/UX Designer (Product Designer)",
    personalInfo: {
      fullName: "Lê Minh C",
      jobTitle: "Senior Product Designer",
      email: "leminhc@email.com",
      phone: "0912 345 678",
      location: "Đà Nẵng, Việt Nam",
      website: "behance.net/leminhc",
    },
    bio: "Product Designer có tư duy phản biện và đam mê giải quyết vấn đề bằng thiết kế. Với hơn 4 năm kinh nghiệm từ nghiên cứu người dùng (User Research) đến việc tạo ra các prototype sắc nét, tôi luôn cố gắng cân bằng giữa mục tiêu kinh doanh và sự thỏa mãn của người dùng. Từng thiết kế hệ thống Design System cho nhiều công ty.",
    profile: [
      { id: "p1", networkName: "Behance", username: "leminhc", link: "https://behance.net/leminhc" },
      { id: "p2", networkName: "Dribbble", username: "leminh_design", link: "https://dribbble.com/leminhc" }
    ],
    experience: [
      {
        id: "e1",
        title: "Senior Product Designer",
        company: "Creative Studio / Fintech Product",
        location: "Đà Nẵng",
        startDate: "2021-03",
        endDate: "Hiện tại",
        description: "- Dẫn dắt quá trình thiết kế toàn bộ ứng dụng quản lý tài chính cá nhân từ con số không, thu hút 100,000 lượt tải trong 6 tháng đầu.\n- Tiến hành phỏng vấn sâu (In-depth interview) và A/B testing để tối ưu hóa quy trình Onboarding, giúp tăng 20% tỷ lệ giữ chân người dùng.\n- Xây dựng và duy trì Design System tập trung bằng Figma, tiết kiệm 30% thời gian thiết kế cho các dự án sau này."
      },
      {
        id: "e2",
        title: "UI/UX Designer",
        company: "Agency XYZ",
        location: "Đà Nẵng",
        startDate: "2018-09",
        endDate: "2021-02",
        description: "- Thiết kế giao diện (UI) và trải nghiệm (UX) cho hơn 15 dự án Web và Mobile app đa ngành nghề (E-commerce, Healthcare, Booking).\n- Vẽ user flows, wireframes và tạo interactive prototypes báo cáo khách hàng.\n- Hợp tác chặt chẽ với team Dev để đảm bảo sản phẩm cuối cùng chính xác 95% so với bản thiết kế."
      }
    ],
    education: [
      {
        id: "ed1",
        title: "Cử nhân Thiết kế Mỹ thuật Công nghiệp",
        company: "Đại học Kiến Trúc Đà Nẵng",
        location: "Đà Nẵng",
        major: "Thiết kế Đồ họa",
        score: "3.5/4.0",
        startDate: "2014-09",
        endDate: "2018-06",
        description: "Tốt nghiệp loại Khá giỏi. Đồ án nhận giải Thiết kế Sáng tạo của khoa."
      }
    ],
    skill: [
      { id: "s1", title: "Figma", performance: "Xuất sắc", description: "Auto layout, Components, Variants, Prototyping" },
      { id: "s2", title: "User Research", performance: "Giỏi", description: "Persona, Journey Mapping, Usability Testing" },
      { id: "s3", title: "Adobe Suite", performance: "Giỏi", description: "Illustrator, Photoshop, After Effects (Basic)" },
      { id: "s4", title: "HTML/CSS cơ bản", performance: "Khá", description: "Hiểu biết cách Frontend hoạt động để bàn giao thiết kế dễ dàng" }
    ],
    language: [
      { id: "l1", title: "Tiếng Anh", description: "Giao tiếp trôi chảy, có thể thuyết trình ý tưởng thiết kế bằng tiếng Anh." },
      { id: "l2", title: "Tiếng Nhật", description: "JLPT N4 - Giao tiếp cơ bản" }
    ],
    certificate: [
      {
        id: "c1",
        title: "Google UX Design Professional Certificate",
        date: "2020-08",
        publisher: "Coursera",
        description: "Hoàn thành lộ trình 7 khóa học chuyên sâu về UX do Google cung cấp."
      }
    ],
    project: [
      {
        id: "pr1",
        title: "Eco-tracking App Redesign",
        date: "2022",
        link: "behance.net/eco-tracking",
        description: "- Tái thiết kế toàn bộ ứng dụng theo dõi thói quen sống xanh.\n- Đơn giản hóa kiến trúc thông tin (Information Architecture) giúp thời gian hoàn thành task của user nhanh hơn 40%."
      }
    ],
    award: [
      {
        id: "a1",
        title: "Best Mobile UI - Vietnam Design Week",
        awarder: "Vietnam Design Association",
        date: "2021",
        description: "Giải thưởng cho giao diện ứng dụng di động có tính thẩm mỹ và dễ sử dụng nhất năm."
      }
    ],
    hobby: [
      { id: "h1", title: "Nhiếp ảnh đường phố" },
      { id: "h2", title: "Sưu tầm Typography" },
      { id: "h3", title: "Du lịch trải nghiệm văn hóa" }
    ]
  },
  {
    title: "CV Data Analyst / BI Analyst",
    personalInfo: {
      fullName: "Phạm D",
      jobTitle: "Senior Data Analyst",
      email: "phamd.data@email.com",
      phone: "0999 888 777",
      location: "TP. Hồ Chí Minh",
      website: "linkedin.com/in/phamd",
    },
    bio: "Chuyên viên phân tích dữ liệu với 3.5 năm kinh nghiệm. Có khả năng chuyển đổi các dữ liệu thô (raw data) phức tạp thành những câu chuyện dễ hiểu (data storytelling) để hỗ trợ Ban Giám đốc ra quyết định chiến lược. Đặc biệt xuất sắc trong việc xây dựng các báo cáo tự động bằng Power BI và truy vấn dữ liệu lớn bằng SQL/Python.",
    profile: [
      { id: "p1", networkName: "Kaggle", username: "pham-d-data", link: "https://kaggle.com/phamd" }
    ],
    experience: [
      {
        id: "e1",
        title: "Senior Data Analyst",
        company: "Shopee VN",
        location: "TP. HCM",
        startDate: "2021-08",
        endDate: "Hiện tại",
        description: "- Xây dựng hệ thống Dashboard tương tác bằng Power BI để giám sát chỉ số kinh doanh cốt lõi (GMV, Conversion Rate, Retention) hàng ngày.\n- Phân tích hành vi mua sắm của hàng triệu user, phát hiện điểm rơi (drop-off points) trong phễu mua hàng, đề xuất giải pháp giúp tăng tỷ lệ chuyển đổi (CR) thêm 15%.\n- Hợp tác với team Data Engineer để tối ưu hóa quy trình ETL, giảm 50% thời gian xử lý dữ liệu báo cáo."
      },
      {
        id: "e2",
        title: "Junior Business Intelligence Analyst",
        company: "FMCG Company",
        location: "TP. HCM",
        startDate: "2019-10",
        endDate: "2021-07",
        description: "- Truy xuất và làm sạch dữ liệu bán hàng đa kênh bằng SQL Server.\n- Sử dụng Python (Pandas) để dự báo nhu cầu hàng hóa (Demand Forecasting), giảm lượng hàng tồn kho 12% trong năm 2020.\n- Thiết kế các báo cáo Excel Pivot tự động cho phòng Sales."
      }
    ],
    education: [
      {
        id: "ed1",
        title: "Thạc sĩ Kinh Tế (Định lượng)",
        company: "Đại học Kinh Tế TP.HCM",
        location: "TP. HCM",
        major: "Toán Tài Chính - Thống Kê",
        score: "3.8/4.0",
        startDate: "2017-09",
        endDate: "2019-07",
        description: "Hoàn thành xuất sắc luận văn về mô hình dự báo rủi ro tín dụng bằng Machine Learning."
      }
    ],
    skill: [
      { id: "s1", title: "SQL", performance: "Xuất sắc", description: "Complex Joins, Window Functions, CTEs, Query Optimization" },
      { id: "s2", title: "Data Visualization", performance: "Xuất sắc", description: "Power BI (DAX, Data Modeling), Tableau" },
      { id: "s3", title: "Python", performance: "Giỏi", description: "Pandas, NumPy, Matplotlib, Scikit-learn (cơ bản)" },
      { id: "s4", title: "Thống kê (Statistics)", performance: "Giỏi", description: "A/B Testing, Hypothesis Testing, Regression" }
    ],
    language: [
      { id: "l1", title: "Tiếng Anh", description: "IELTS 7.0 - Giao tiếp trôi chảy với team đa quốc gia" }
    ],
    certificate: [
      {
        id: "c1",
        title: "Microsoft Certified: Data Analyst Associate (PL-300)",
        date: "2021-12",
        publisher: "Microsoft",
        description: "Chứng chỉ quốc tế chứng nhận khả năng phân tích và trực quan hóa dữ liệu với Power BI."
      }
    ],
    project: [
      {
        id: "pr1",
        title: "Dự án Tối ưu hóa chuỗi cung ứng",
        date: "2020",
        link: "",
        description: "Xây dựng mô hình phân tích tối ưu tuyến đường giao hàng giúp giảm chi phí logistics 10% cho khu vực miền Nam."
      }
    ],
    award: [
      {
        id: "a1",
        title: "Giải nhất Cuộc thi Datathon 2019",
        awarder: "Data Science Vietnam",
        date: "2019",
        description: "Vượt qua hơn 50 đội thi trong thử thách giải quyết bài toán phân khúc khách hàng."
      }
    ],
    hobby: [
      { id: "h1", title: "Chơi Sudoku và Board games" },
      { id: "h2", title: "Trekking các cung đường núi" }
    ]
  },
  {
    title: "CV Marketing Specialist (Digital Marketing)",
    personalInfo: {
      fullName: "Hoàng Ngân E",
      jobTitle: "Digital Marketing Specialist",
      email: "hoangngan.e@email.com",
      phone: "0945 678 123",
      location: "Hà Nội, Việt Nam",
      website: "linkedin.com/in/nganhoang",
    },
    bio: "Chuyên gia Digital Marketing với 4 năm kinh nghiệm trong lĩnh vực Thương mại điện tử (E-commerce) và B2B. Thành thạo việc lên chiến lược đa kênh (Omnichannel), trực tiếp thiết lập và tối ưu chiến dịch quảng cáo (Ads), và có tư duy phân tích dữ liệu sâu sắc để tối ưu hóa ROI (Return on Investment).",
    profile: [],
    experience: [
      {
        id: "e1",
        title: "Senior Performance Marketer",
        company: "Tiki Corporation",
        location: "Hà Nội",
        startDate: "2021-05",
        endDate: "Hiện tại",
        description: "- Quản lý ngân sách Digital Marketing lên tới 2 tỷ VNĐ/tháng cho các chiến dịch Mega Sale (11.11, 12.12).\n- Tối ưu hóa quảng cáo Facebook, Google Search, và TikTok Ads, xuất sắc giảm CPA (Cost per Acquisition) xuống 25% trong 2 quý liên tiếp.\n- Phối hợp với team Design để liên tục test (A/B testing) các mẫu quảng cáo (creatives), tăng CTR lên 3.5%.\n- Theo dõi và lập báo cáo hiệu suất chiến dịch qua Google Analytics và Data Studio."
      },
      {
        id: "e2",
        title: "Content & SEO Specialist",
        company: "Startup EdTech",
        location: "Hà Nội",
        startDate: "2018-06",
        endDate: "2021-04",
        description: "- Chịu trách nhiệm lập kế hoạch nội dung cho Fanpage và Blog hàng tháng.\n- Tối ưu hóa SEO On-page và Off-page, giúp đẩy 20 từ khóa mảng giáo dục lên Top 3 Google tìm kiếm trong vòng 6 tháng.\n- Tổ chức 3 chiến dịch Email Marketing thu về 15,000 leads mới."
      }
    ],
    education: [
      {
        id: "ed1",
        title: "Cử nhân Truyền thông & Marketing",
        company: "Đại học Ngoại Thương (FTU)",
        location: "Hà Nội",
        major: "Marketing Quốc tế",
        score: "3.6/4.0",
        startDate: "2014-09",
        endDate: "2018-07",
        description: "Phó chủ tịch Câu lạc bộ Marketing. Sinh viên 5 tốt cấp trường."
      }
    ],
    skill: [
      { id: "s1", title: "Quảng cáo (Ads)", performance: "Xuất sắc", description: "Facebook Ads, Google Ads (Search/Display), TikTok Ads" },
      { id: "s2", title: "Phân tích số liệu", performance: "Giỏi", description: "Google Analytics 4, Tag Manager, Looker Studio" },
      { id: "s3", title: "SEO", performance: "Khá", description: "Nghiên cứu từ khóa (Ahrefs), Tối ưu On-page" },
      { id: "s4", title: "Content Strategy", performance: "Giỏi", description: "Copywriting, Lên plan social media" }
    ],
    language: [
      { id: "l1", title: "Tiếng Anh", description: "IELTS 7.5 - Có khả năng làm việc hoàn toàn bằng tiếng Anh" }
    ],
    certificate: [
      {
        id: "c1",
        title: "Google Ads Search Certification",
        date: "2022-01",
        publisher: "Google Skillshop",
        description: "Chứng chỉ xác nhận chuyên môn về thiết lập chiến dịch tìm kiếm Google."
      }
    ],
    project: [],
    award: [
      {
        id: "a1",
        title: "Marketer of the Quarter",
        awarder: "Tiki",
        date: "2022",
        description: "Ghi nhận chiến dịch Mega Sale mang lại doanh thu vượt 150% chỉ tiêu."
      }
    ],
    hobby: [
      { id: "h1", title: "Viết lách và làm Podcast" },
      { id: "h2", title: "Du lịch khám phá" }
    ]
  },
  {
    title: "CV Mobile App Developer (Flutter)",
    personalInfo: {
      fullName: "Vũ F",
      jobTitle: "Senior Mobile Engineer",
      email: "vuf.mobile@email.com",
      phone: "0933 222 111",
      location: "Đà Nẵng, Việt Nam",
      website: "github.com/vuf",
    },
    bio: "Kỹ sư phát triển ứng dụng di động với trọng tâm là Flutter và React Native. Có kiến thức nền tảng vững chắc về Native (Android/iOS) và từng đưa hơn 10 ứng dụng lên các chợ ứng dụng (App Store, Google Play). Rất chú trọng vào độ mượt mà của Animation và tối ưu hóa bộ nhớ cho ứng dụng di động.",
    profile: [
      { id: "p1", networkName: "GitHub", username: "vuf-flutter", link: "https://github.com/vuf" }
    ],
    experience: [
      {
        id: "e1",
        title: "Mobile Tech Lead",
        company: "Elsa Speak",
        location: "Đà Nẵng",
        startDate: "2021-02",
        endDate: "Hiện tại",
        description: "- Chịu trách nhiệm kiến trúc mã nguồn cho module Học từ vựng (Flutter), giúp giảm 20% lượng crash app trên các thiết bị cũ.\n- Tích hợp in-app purchase, push notification và xử lý state management phức tạp bằng Bloc/Riverpod.\n- Đào tạo và mentor cho 3 lập trình viên Junior.\n- Cải thiện CI/CD pipeline cho Mobile app (Fastlane) giúp rút ngắn thời gian release app mới lên store."
      },
      {
        id: "e2",
        title: "Mobile Developer (Native Android)",
        company: "Outsourcing Tech",
        location: "Đà Nẵng",
        startDate: "2018-08",
        endDate: "2021-01",
        description: "- Phát triển các ứng dụng bằng Java và Kotlin.\n- Tham gia vào các dự án ví điện tử yêu cầu bảo mật cao, mã hóa dữ liệu local (Encrypted SharedPreferences) và chống Reverse Engineering."
      }
    ],
    education: [
      {
        id: "ed1",
        title: "Cử nhân Công nghệ phần mềm",
        company: "Đại học FPT",
        location: "Đà Nẵng",
        major: "Kỹ thuật phần mềm",
        score: "3.1/4.0",
        startDate: "2014-09",
        endDate: "2018-07",
        description: "Tham gia nhiều dự án đồ án thực tế về ứng dụng di động."
      }
    ],
    skill: [
      { id: "s1", title: "Flutter/Dart", performance: "Xuất sắc", description: "Custom UI, Animations, State Management (Bloc, GetX)" },
      { id: "s2", title: "Native Mobile", performance: "Khá", description: "Kotlin (Android), Swift (iOS - cơ bản), giao tiếp qua Method Channel" },
      { id: "s3", title: "Firebase & CI/CD", performance: "Giỏi", description: "Auth, Firestore, Crashlytics, Fastlane" }
    ],
    language: [
      { id: "l1", title: "Tiếng Anh", description: "Đọc tài liệu chuyên ngành nhanh nhạy." }
    ],
    certificate: [],
    project: [
      {
        id: "pr1",
        title: "Ứng dụng Đặt vé xe buýt (Open Source)",
        date: "2021",
        link: "github.com/vuf/bus-ticket",
        description: "Dự án cá nhân nhận được 500+ stars trên Github, sử dụng Flutter và Firebase."
      }
    ],
    award: [],
    hobby: [
      { id: "h1", title: "Độ bàn phím cơ (Custom Keyboard)" },
      { id: "h2", title: "Bơi lội" }
    ]
  },
  {
    title: "CV QA/QC Engineer (Automation)",
    personalInfo: {
      fullName: "Đỗ H",
      jobTitle: "Automation QA/QC Engineer",
      email: "doh.qa@email.com",
      phone: "0909 999 000",
      location: "Hà Nội, Việt Nam",
      website: "linkedin.com/in/doh",
    },
    bio: "Kỹ sư kiểm thử chất lượng phần mềm với 4 năm kinh nghiệm. Bắt đầu từ kiểm thử thủ công (Manual Testing) và đã chuyển đổi thành công sang kỹ sư kiểm thử tự động (Automation Testing). Luôn khắt khe với chất lượng (Quality First) và am hiểu quy trình làm việc Agile/Scrum.",
    profile: [],
    experience: [
      {
        id: "e1",
        title: "Automation Test Engineer",
        company: "KMS Technology",
        location: "Hà Nội",
        startDate: "2020-07",
        endDate: "Hiện tại",
        description: "- Xây dựng framework kiểm thử tự động từ đầu sử dụng Cypress và JavaScript cho nền tảng E-commerce đa quốc gia.\n- Tích hợp các bộ test tự động (Automated Test Suites) vào luồng CI/CD của GitLab, đảm bảo 100% build không có lỗi nghiêm trọng trước khi deploy.\n- Thực hiện API Testing bằng Postman và RestAssured.\n- Đào tạo team Manual QA cách viết script tự động đơn giản."
      },
      {
        id: "e2",
        title: "Manual QA Tester",
        company: "IT Startup",
        location: "Hà Nội",
        startDate: "2018-05",
        endDate: "2020-06",
        description: "- Viết Test Plan, Test Case và Báo cáo lỗi (Bug Report) chi tiết trên Jira.\n- Thực hiện kiểm thử trên nhiều nền tảng: Web (Cross-browser), Mobile App (iOS/Android).\n- Tham gia đầy đủ các buổi họp Scrum (Sprint Planning, Daily, Retrospective)."
      }
    ],
    education: [
      {
        id: "ed1",
        title: "Cử nhân Công nghệ Thông tin",
        company: "Học viện Công nghệ Bưu chính Viễn thông",
        location: "Hà Nội",
        major: "An toàn thông tin",
        score: "3.2/4.0",
        startDate: "2014-09",
        endDate: "2018-06",
        description: ""
      }
    ],
    skill: [
      { id: "s1", title: "Automation Testing", performance: "Xuất sắc", description: "Cypress, Selenium WebDriver, Appium" },
      { id: "s2", title: "API Testing", performance: "Giỏi", description: "Postman, Newman, REST API" },
      { id: "s3", title: "Manual Testing", performance: "Xuất sắc", description: "Black-box, Regression, Test Design Techniques" },
      { id: "s4", title: "Lập trình", performance: "Khá", description: "JavaScript/TypeScript cơ bản để viết test script" }
    ],
    language: [
      { id: "l1", title: "Tiếng Anh", description: "IELTS 6.0 - Viết bug report và tài liệu kiểm thử bằng tiếng Anh thành thạo." }
    ],
    certificate: [
      {
        id: "c1",
        title: "ISTQB Certified Tester Foundation Level (CTFL)",
        date: "2019-11",
        publisher: "ISTQB",
        description: "Chứng chỉ nền tảng quốc tế cho chuyên viên kiểm thử."
      }
    ],
    project: [],
    award: [],
    hobby: [
      { id: "h1", title: "Giải đố logic" },
      { id: "h2", title: "Nấu ăn" }
    ]
  },
  {
    title: "CV IT Business Analyst (BA)",
    personalInfo: {
      fullName: "Ngô K",
      jobTitle: "Senior IT Business Analyst",
      email: "ngok.ba@email.com",
      phone: "0987 654 321",
      location: "TP. Hồ Chí Minh, Việt Nam",
      website: "",
    },
    bio: "Chuyên gia phân tích nghiệp vụ IT với hơn 5 năm kinh nghiệm làm cầu nối vững chắc giữa đội ngũ lập trình viên (Dev Team) và khách hàng. Thế mạnh trong việc khơi gợi và quản lý yêu cầu (Requirement Gathering), mô hình hóa quy trình (BPMN, UML) và làm rõ luồng dữ liệu của các hệ thống tài chính/ERP phức tạp.",
    profile: [
      { id: "p1", networkName: "LinkedIn", username: "ngok-ba", link: "https://linkedin.com/in/ngok" }
    ],
    experience: [
      {
        id: "e1",
        title: "Senior Business Analyst",
        company: "FPT Software",
        location: "TP. HCM",
        startDate: "2020-03",
        endDate: "Hiện tại",
        description: "- Phụ trách lấy yêu cầu trực tiếp từ khách hàng thị trường Nhật (Logistics & ERP).\n- Phân tích và viết tài liệu nghiệp vụ cực kỳ chi tiết: FRS (Functional Requirement Spec), SRS, Use Case, User Stories.\n- Thiết kế Mockup/Wireframe cơ bản bằng Balsamiq/Figma để chốt luồng UI/UX với khách hàng.\n- Hỗ trợ UAT (User Acceptance Testing) đảm bảo sản phẩm bàn giao đúng yêu cầu."
      },
      {
        id: "e2",
        title: "IT Business Analyst",
        company: "Ngân hàng Thương mại",
        location: "TP. HCM",
        startDate: "2017-09",
        endDate: "2020-02",
        description: "- Phân tích nghiệp vụ nâng cấp hệ thống Core Banking.\n- Vẽ sơ đồ quy trình nghiệp vụ (Business Process) bằng Microsoft Visio.\n- Đóng vai trò Scrum Master cho dự án App Mobile ngân hàng trong 6 tháng."
      }
    ],
    education: [
      {
        id: "ed1",
        title: "Cử nhân Hệ thống Thông tin Quản lý",
        company: "Đại học Kinh tế - Luật TP.HCM",
        location: "TP. HCM",
        major: "Hệ thống thông tin",
        score: "3.4/4.0",
        startDate: "2013-09",
        endDate: "2017-06",
        description: ""
      }
    ],
    skill: [
      { id: "s1", title: "Requirement Analysis", performance: "Xuất sắc", description: "Use Case, User Story, FRS/SRS, Backlog Grooming" },
      { id: "s2", title: "Modeling & Diagram", performance: "Xuất sắc", description: "UML, BPMN, ERD, Data Flow Diagram, Visio, Draw.io" },
      { id: "s3", title: "Database / SQL", performance: "Khá", description: "Truy vấn cơ sở dữ liệu để đối soát dữ liệu (Data Mapping)" },
      { id: "s4", title: "Communication", performance: "Xuất sắc", description: "Kỹ năng giao tiếp, thuyết trình, đàm phán giải pháp" }
    ],
    language: [
      { id: "l1", title: "Tiếng Nhật", description: "JLPT N2 - Làm việc trực tiếp với khách hàng Nhật không cần BrSE." },
      { id: "l2", title: "Tiếng Anh", description: "Giao tiếp văn phòng" }
    ],
    certificate: [
      {
        id: "c1",
        title: "CBAP (Certified Business Analysis Professional)",
        date: "2021-08",
        publisher: "IIBA",
        description: "Chứng chỉ quốc tế uy tín nhất cho chuyên gia Phân tích nghiệp vụ."
      },
      {
        id: "c2",
        title: "Professional Scrum Master (PSM I)",
        date: "2019",
        publisher: "Scrum.org",
        description: ""
      }
    ],
    project: [],
    award: [],
    hobby: [
      { id: "h1", title: "Tham gia CLB Tiếng Nhật" },
      { id: "h2", title: "Trồng cây cảnh" }
    ]
  },
  {
    title: "CV DevOps / Cloud Engineer",
    personalInfo: {
      fullName: "Đặng L",
      jobTitle: "Senior DevOps Engineer",
      email: "dang.devops@email.com",
      phone: "0922 444 666",
      location: "Hà Nội, Việt Nam",
      website: "github.com/dangdevops",
    },
    bio: "Chuyên gia tự động hóa quy trình (CI/CD) và kiến trúc hạ tầng Cloud với 5 năm kinh nghiệm. Đam mê văn hóa DevOps, Infrastructure as Code (IaC) và thiết kế hệ thống có tính sẵn sàng cao (High Availability), chịu lỗi tốt. Đã có kinh nghiệm xử lý các sự cố hệ thống production (Incident Response) nghiêm trọng.",
    profile: [
      { id: "p1", networkName: "GitHub", username: "dangdevops", link: "https://github.com/dangdevops" }
    ],
    experience: [
      {
        id: "e1",
        title: "Senior DevOps Engineer",
        company: "VinAI Research",
        location: "Hà Nội",
        startDate: "2021-01",
        endDate: "Hiện tại",
        description: "- Triển khai và quản lý hàng chục cụm Kubernetes cluster trên nền tảng AWS (EKS) và On-premise.\n- Viết script Infrastructure as Code (IaC) bằng Terraform để tự động cấp phát tài nguyên.\n- Tối ưu hóa pipeline CI/CD trên GitLab, giảm thời gian build và deploy các service AI từ 30 phút xuống còn dưới 5 phút.\n- Cài đặt hệ thống Monitor & Alert toàn diện sử dụng Prometheus, Grafana và ELK Stack."
      },
      {
        id: "e2",
        title: "System / DevOps Admin",
        company: "Tech Service JSC",
        location: "Hà Nội",
        startDate: "2018-05",
        endDate: "2020-12",
        description: "- Quản trị hệ thống máy chủ Linux (CentOS, Ubuntu) cho 50+ dự án.\n- Viết Bash/Python script tự động hóa các tác vụ backup dữ liệu hàng ngày.\n- Cấu hình Nginx, HAProxy Load Balancer."
      }
    ],
    education: [
      {
        id: "ed1",
        title: "Cử nhân Mạng Máy Tính",
        company: "Đại học Công Nghệ - ĐHQGHN",
        location: "Hà Nội",
        major: "Mạng máy tính và Truyền thông",
        score: "3.1/4.0",
        startDate: "2014-09",
        endDate: "2018-06",
        description: ""
      }
    ],
    skill: [
      { id: "s1", title: "Containers & Orchestration", performance: "Xuất sắc", description: "Docker, Kubernetes (K8s), Helm" },
      { id: "s2", title: "Cloud & IaC", performance: "Xuất sắc", description: "AWS (EKS, VPC, EC2, S3), Terraform, Ansible" },
      { id: "s3", title: "CI/CD & Scripting", performance: "Giỏi", description: "GitLab CI/CD, Jenkins, Bash, Python" },
      { id: "s4", title: "Monitoring", performance: "Giỏi", description: "Prometheus, Grafana, ELK Stack, Datadog" }
    ],
    language: [
      { id: "l1", title: "Tiếng Anh", description: "TOEIC 750" }
    ],
    certificate: [
      {
        id: "c1",
        title: "Certified Kubernetes Administrator (CKA)",
        date: "2022-05",
        publisher: "Cloud Native Computing Foundation (CNCF)",
        description: "Chứng chỉ uy tín nhất về quản trị Kubernetes."
      },
      {
        id: "c2",
        title: "AWS Certified DevOps Engineer – Professional",
        date: "2021-11",
        publisher: "Amazon Web Services",
        description: ""
      }
    ],
    project: [],
    award: [],
    hobby: [
      { id: "h1", title: "Nghiên cứu công nghệ Cloud mới" },
      { id: "h2", title: "Chơi bóng bàn" }
    ]
  },
  {
    title: "CV Human Resources (HRBP)",
    personalInfo: {
      fullName: "Bùi G",
      jobTitle: "HR Business Partner",
      email: "buig.hr@email.com",
      phone: "0977 444 555",
      location: "TP. Hồ Chí Minh",
      website: "linkedin.com/in/buig",
    },
    bio: "Chuyên viên nhân sự (HR) hiện đại với tư duy quản trị nguồn nhân lực chiến lược. Mạnh về mảng Tuyển dụng (Talent Acquisition) trong khối ngành IT và Xây dựng văn hóa doanh nghiệp. Luôn lấy con người làm trọng tâm để thúc đẩy sự phát triển của công ty và nâng cao trải nghiệm nhân viên (Employee Experience).",
    profile: [
      { id: "p1", networkName: "LinkedIn", username: "bui-g-hr", link: "https://linkedin.com/in/buig" }
    ],
    experience: [
      {
        id: "e1",
        title: "HR Business Partner",
        company: "Kỳ lân công nghệ VN",
        location: "TP. HCM",
        startDate: "2020-05",
        endDate: "Hiện tại",
        description: "- Đối tác nhân sự chiến lược cho khối Engineering (hơn 200 nhân sự), tư vấn cho các Giám đốc kỹ thuật về cơ cấu tổ chức và quản trị hiệu suất (Performance Review).\n- Tuyển dụng thành công hơn 100 nhân sự IT cấp cao (Senior, Lead, Architect) thông qua headhunt và LinkedIn.\n- Thiết kế và triển khai chương trình Đào tạo lãnh đạo (Leadership Training) nội bộ.\n- Xử lý các vấn đề quan hệ lao động (Employee Relations) và giảm tỷ lệ nghỉ việc (Turnover rate) xuống dưới 8%."
      },
      {
        id: "e2",
        title: "Talent Acquisition Specialist",
        company: "Outsourcing Company",
        location: "TP. HCM",
        startDate: "2017-07",
        endDate: "2020-04",
        description: "- Đăng tuyển, sàng lọc CV, tổ chức phỏng vấn và gửi Offer cho ứng viên ngành phần mềm.\n- Tổ chức các sự kiện Job Fair tại các trường Đại học Bách Khoa, KHTN để tuyển Fresher.\n- Làm thủ tục Onboarding cho nhân viên mới."
      }
    ],
    education: [
      {
        id: "ed1",
        title: "Cử nhân Quản trị Nhân lực",
        company: "Đại học Kinh tế TP.HCM",
        location: "TP. HCM",
        major: "Quản trị nhân lực",
        score: "8.0/10",
        startDate: "2013-09",
        endDate: "2017-06",
        description: "Bí thư chi đoàn lớp Quản trị nhân lực K39."
      }
    ],
    skill: [
      { id: "s1", title: "Tuyển dụng (TA)", performance: "Xuất sắc", description: "Sourcing, Phỏng vấn hành vi (BEI), Thương lượng lương" },
      { id: "s2", title: "Nhân sự chiến lược", performance: "Giỏi", description: "HRBP, Quản trị hiệu suất (KPIs/OKRs), Lộ trình thăng tiến" },
      { id: "s3", title: "Luật lao động", performance: "Giỏi", description: "Nắm vững Bộ luật lao động, BHXH, Thuế TNCN" },
      { id: "s4", title: "Truyền thông nội bộ", performance: "Khá", description: "Tổ chức sự kiện, viết bài PR nội bộ" }
    ],
    language: [
      { id: "l1", title: "Tiếng Anh", description: "IELTS 6.5 - Có khả năng phỏng vấn chuyên gia nước ngoài." }
    ],
    certificate: [
      {
        id: "c1",
        title: "Certified Human Resources Professional (CHRP)",
        date: "2019",
        publisher: "Viện Quản trị Nhân sự",
        description: ""
      }
    ],
    project: [],
    award: [],
    hobby: [
      { id: "h1", title: "Tham gia các workshop về tâm lý học" },
      { id: "h2", title: "Yoga" }
    ]
  }
];
