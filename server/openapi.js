import { RESUME_TEMPLATE_KEYS } from "../shared/resumeTemplates.js";

const ref = (name) => ({ $ref: `#/components/schemas/${name}` });

const jsonResponse = (description, schema = "AnyObject", example) => ({
  description,
  content: {
    "application/json": {
      schema: ref(schema),
      ...(example === undefined ? {} : { example }),
    },
  },
});

const requestBody = (schema, example) => ({
  required: true,
  content: {
    "application/json": {
      schema: ref(schema),
      ...(example === undefined ? {} : { example }),
    },
  },
});

const standardErrors = {
  "400": jsonResponse("Dữ liệu gửi lên không hợp lệ", "ErrorResponse"),
  "401": jsonResponse("Chưa đăng nhập hoặc phiên đăng nhập đã hết hạn", "ErrorResponse"),
  "403": jsonResponse("Không có quyền thực hiện thao tác", "ErrorResponse"),
  "404": jsonResponse("Không tìm thấy tài nguyên", "ErrorResponse"),
  "429": jsonResponse("Quá nhiều yêu cầu", "ErrorResponse"),
  "500": jsonResponse("Lỗi xử lý phía server", "ErrorResponse"),
};

const secured = (operation) => ({
  ...operation,
  security: [{ cookieAuth: [] }],
  responses: {
    ...standardErrors,
    ...operation.responses,
  },
});

const publicOperation = (operation) => ({
  ...operation,
  responses: {
    ...standardErrors,
    ...operation.responses,
  },
});

const idParameter = (name = "id", description = "MongoDB ObjectId") => ({
  name,
  in: "path",
  required: true,
  description,
  schema: { type: "string", example: "65f1a8b7c9d0123456789012" },
});

const queryParameter = (name, description, schema = { type: "string" }) => ({
  name,
  in: "query",
  required: false,
  description,
  schema,
});

const openapiSpec = {
  openapi: "3.0.3",
  info: {
    title: "RabbitCV Backend API",
    version: "1.0.0",
    description: [
      "Tài liệu API backend của RabbitCV.",
      "",
      "Đăng nhập bằng POST /api/login trước khi gọi các API có biểu tượng khóa.",
      "Backend dùng cookie HTTP-only để xác thực; Swagger UI sẽ sử dụng cookie của phiên trình duyệt hiện tại.",
      "",
      "Socket.IO realtime chạy tại /socket.io và được kiểm tra trong DevTools Network > WS.",
    ].join("\n"),
  },
  servers: [
    {
      url: "/",
      description: "Backend hiện tại",
    },
  ],
  tags: [
    { name: "System", description: "Kiểm tra trạng thái và tác vụ hệ thống" },
    { name: "Auth", description: "Đăng ký, đăng nhập và phiên người dùng" },
    { name: "Users", description: "Thông tin cá nhân và hồ sơ người dùng" },
    { name: "Resumes", description: "Tạo, đọc, cập nhật và xóa CV" },
    { name: "Jobs", description: "Tin tuyển dụng và ứng tuyển" },
    { name: "Saved jobs", description: "Việc làm đã lưu" },
    { name: "Chat", description: "Tin nhắn và hội thoại" },
    { name: "Notifications", description: "Thông báo người dùng" },
    { name: "AI", description: "Các chức năng AI của RabbitCV" },
    { name: "Admin", description: "Chức năng dành cho tài khoản quản trị" },
  ],
  paths: {
    "/api/health": {
      get: publicOperation({
        tags: ["System"],
        summary: "Kiểm tra trạng thái backend",
        responses: {
          "200": jsonResponse("Backend và database đang hoạt động", "HealthResponse", { ok: true }),
          "503": jsonResponse("Backend hoặc database chưa sẵn sàng", "HealthResponse", { ok: false }),
        },
      }),
    },
    "/api/admin/health/details": {
      get: secured({
        tags: ["System", "Admin"],
        summary: "Xem chi tiết trạng thái hệ thống",
        description: "Chỉ tài khoản admin được phép gọi API này.",
        responses: {
          "200": jsonResponse("Chi tiết môi trường, database và xác thực", "HealthDetails"),
        },
      }),
    },
    "/api/cron/job-expiry": {
      get: publicOperation({
        tags: ["System"],
        summary: "Chạy kiểm tra tin tuyển dụng hết hạn",
        description: "Ở production cần gửi Authorization: Bearer CRON_SECRET.",
        responses: {
          "200": jsonResponse("Đã chạy kiểm tra hết hạn", "AnyObject"),
          "401": jsonResponse("Cron token không hợp lệ", "ErrorResponse"),
        },
      }),
    },
    "/api/register": {
      post: publicOperation({
        tags: ["Auth"],
        summary: "Đăng ký tài khoản",
        requestBody: requestBody("RegisterRequest", {
          username: "candidate01",
          email: "candidate01@example.com",
          password: "password123",
          fullName: "Nguyễn Thành Vinh",
          role: "employee",
        }),
        responses: {
          "201": jsonResponse("Đăng ký thành công", "AuthResponse"),
        },
      }),
    },
    "/api/login": {
      post: publicOperation({
        tags: ["Auth"],
        summary: "Đăng nhập",
        description: "Ví dụ tài khoản thử nghiệm: admin / 1111.",
        requestBody: requestBody("LoginRequest", {
          username: "admin",
          password: "1111",
        }),
        responses: {
          "200": jsonResponse("Đăng nhập thành công và tạo cookie phiên", "AuthResponse"),
        },
      }),
    },
    "/api/logout": {
      post: publicOperation({
        tags: ["Auth"],
        summary: "Đăng xuất",
        responses: {
          "200": jsonResponse("Đã xóa cookie phiên", "MessageResponse"),
        },
      }),
    },
    "/api/me": {
      get: secured({
        tags: ["Auth"],
        summary: "Lấy tài khoản hiện tại",
        responses: {
          "200": jsonResponse("Thông tin người dùng hiện tại", "User"),
        },
      }),
    },
    "/api/users/search": {
      get: secured({
        tags: ["Users"],
        summary: "Tìm kiếm người dùng để nhắn tin",
        parameters: [queryParameter("q", "Từ khóa tìm kiếm")],
        responses: {
          "200": jsonResponse("Danh sách người dùng", "UserList"),
        },
      }),
    },
    "/api/user/profile/{userId}": {
      get: secured({
        tags: ["Users"],
        summary: "Xem hồ sơ công khai của người dùng",
        parameters: [idParameter("userId")],
        responses: {
          "200": jsonResponse("Hồ sơ người dùng", "User"),
        },
      }),
    },
    "/api/user/profile": {
      put: secured({
        tags: ["Users"],
        summary: "Cập nhật thông tin cá nhân hoặc doanh nghiệp",
        requestBody: requestBody("ProfileUpdateRequest", {
          fullName: "Nguyễn Thành Vinh",
          phoneNumber: "0900000000",
          address: "Thành phố Hồ Chí Minh",
        }),
        responses: {
          "200": jsonResponse("Đã cập nhật hồ sơ", "User"),
        },
      }),
    },
    "/api/user/security": {
      put: secured({
        tags: ["Users"],
        summary: "Cập nhật thiết lập bảo mật",
        requestBody: requestBody("SecurityRequest", {
          twoFactorEnabled: false,
        }),
        responses: {
          "200": jsonResponse("Đã cập nhật thiết lập bảo mật", "MessageResponse"),
        },
      }),
    },
    "/api/user/password": {
      put: secured({
        tags: ["Users"],
        summary: "Đổi mật khẩu",
        requestBody: requestBody("PasswordRequest", {
          oldPassword: "old-password",
          newPassword: "new-password",
          contact: "candidate@example.test",
        }),
        responses: {
          "200": jsonResponse("Đã đổi mật khẩu", "MessageResponse"),
        },
      }),
    },
    "/api/resumes": {
      get: secured({
        tags: ["Resumes"],
        summary: "Lấy danh sách CV của người dùng hiện tại",
        responses: {
          "200": jsonResponse("Danh sách CV", "ResumeList"),
        },
      }),
    },
    "/api/resume/{id}": {
      get: secured({
        tags: ["Resumes"],
        summary: "Lấy một CV",
        parameters: [idParameter()],
        responses: {
          "200": jsonResponse("Dữ liệu CV", "Resume"),
        },
      }),
      delete: secured({
        tags: ["Resumes"],
        summary: "Xóa CV",
        parameters: [idParameter()],
        responses: {
          "200": jsonResponse("CV đã được xóa", "MessageResponse"),
        },
      }),
    },
    "/api/resume": {
      post: secured({
        tags: ["Resumes"],
        summary: "Tạo hoặc lưu CV",
        requestBody: requestBody("ResumePayload", {
          title: "CV Frontend Developer",
          targetRole: "Frontend Developer",
          bio: "Mô tả ngắn về ứng viên",
          skill: [{ title: "ReactJS" }],
        }),
        responses: {
          "200": jsonResponse("CV đã được lưu", "ResumeResponse"),
        },
      }),
    },
    "/api/resumes/view/{id}": {
      get: secured({
        tags: ["Resumes"],
        summary: "Xem CV theo quyền truy cập",
        parameters: [idParameter()],
        responses: {
          "200": jsonResponse("Dữ liệu CV được phép xem", "Resume"),
        },
      }),
    },
    "/api/jobs": {
      get: publicOperation({
        tags: ["Jobs"],
        summary: "Lấy danh sách tin tuyển dụng",
        parameters: [
          queryParameter("search", "Từ khóa tìm kiếm"),
          queryParameter("location", "Địa điểm"),
          queryParameter("jobType", "Loại công việc"),
        ],
        responses: {
          "200": jsonResponse("Danh sách việc làm", "JobList"),
        },
      }),
      post: secured({
        tags: ["Jobs"],
        summary: "Doanh nghiệp tạo tin tuyển dụng",
        description: "Yêu cầu tài khoản company.",
        requestBody: requestBody("JobPayload", {
          title: "Frontend Developer",
          companyName: "RabbitCV",
          location: "Thành phố Hồ Chí Minh",
          status: "Active",
          description: "Mô tả công việc",
        }),
        responses: {
          "201": jsonResponse("Tin tuyển dụng đã được tạo", "JobResponse"),
        },
      }),
    },
    "/api/jobs/{id}": {
      get: publicOperation({
        tags: ["Jobs"],
        summary: "Lấy chi tiết tin tuyển dụng",
        parameters: [idParameter()],
        responses: {
          "200": jsonResponse("Chi tiết tin tuyển dụng", "Job"),
        },
      }),
      put: secured({
        tags: ["Jobs"],
        summary: "Cập nhật tin tuyển dụng",
        parameters: [idParameter()],
        requestBody: requestBody("JobPayload"),
        responses: {
          "200": jsonResponse("Tin tuyển dụng đã cập nhật", "JobResponse"),
        },
      }),
      delete: secured({
        tags: ["Jobs"],
        summary: "Xóa tin tuyển dụng",
        parameters: [idParameter()],
        responses: {
          "200": jsonResponse("Tin tuyển dụng đã xóa", "MessageResponse"),
        },
      }),
    },
    "/api/jobs/my": {
      get: secured({
        tags: ["Jobs"],
        summary: "Lấy tin tuyển dụng của doanh nghiệp hiện tại",
        responses: {
          "200": jsonResponse("Danh sách tin tuyển dụng", "JobList"),
        },
      }),
    },
    "/api/jobs/applications": {
      get: secured({
        tags: ["Jobs"],
        summary: "Lấy hồ sơ ứng tuyển của doanh nghiệp",
        responses: {
          "200": jsonResponse("Danh sách hồ sơ ứng tuyển", "ApplicationList"),
        },
      }),
    },
    "/api/jobs/applications/mine": {
      get: secured({
        tags: ["Jobs"],
        summary: "Lấy hồ sơ ứng tuyển của ứng viên hiện tại",
        responses: {
          "200": jsonResponse("Danh sách hồ sơ đã ứng tuyển", "ApplicationList"),
        },
      }),
    },
    "/api/jobs/apply": {
      post: secured({
        tags: ["Jobs"],
        summary: "Ứng tuyển bằng CV đã lưu",
        description: "Server lưu bản sao nội dung CV đã lưu tại thời điểm nộp. Những lần chỉnh sửa hoặc xóa CV gốc sau đó không thay đổi hồ sơ đã nộp.",
        requestBody: requestBody("JobApplicationRequest", {
          jobId: "65f1a8b7c9d0123456789012",
          resumeId: "65f1a8b7c9d0123456789034",
        }),
        responses: {
          "201": jsonResponse("Ứng tuyển thành công", "ApplicationResponse"),
        },
      }),
    },
    "/api/jobs/apply-file": {
      post: secured({
        tags: ["Jobs"],
        summary: "Ứng tuyển bằng file CV",
        requestBody: requestBody("FileApplicationRequest", {
          jobId: "65f1a8b7c9d0123456789012",
          fileName: "cv-nguyen-thanh-vinh.pdf",
          fileData: "data:application/pdf;base64,...",
        }),
        responses: {
          "201": jsonResponse("Ứng tuyển bằng file thành công", "ApplicationResponse"),
        },
      }),
    },
    "/api/jobs/applications/{id}": {
      put: secured({
        tags: ["Jobs"],
        summary: "Cập nhật trạng thái hồ sơ ứng tuyển",
        parameters: [idParameter()],
        requestBody: requestBody("ApplicationStatusRequest", { status: "Interview" }),
        responses: {
          "200": jsonResponse("Đã cập nhật trạng thái hồ sơ", "ApplicationResponse"),
          "409": jsonResponse("Hồ sơ đã bị từ chối, không thể đổi trạng thái", "MessageResponse"),
        },
      }),
    },
    "/api/jobs/applications/{id}/resume": {
      get: secured({
        tags: ["Jobs"],
        summary: "Xem bản CV đã nộp cùng hồ sơ ứng tuyển",
        description: "Lưu nội dung, mẫu, bố cục và file PDF tại thời điểm nộp; không theo dõi CV gốc. Hồ sơ cũ chưa có bản lưu chỉ giữ được phiên bản còn tồn tại, với resumeSnapshotOrigin là legacy.",
        parameters: [idParameter()],
        responses: {
          "200": jsonResponse("Bản CV của hồ sơ ứng tuyển", "Resume"),
          "403": jsonResponse("Không có quyền xem hồ sơ", "MessageResponse"),
          "404": jsonResponse("Không tìm thấy hồ sơ ứng tuyển", "MessageResponse"),
          "410": jsonResponse("Hồ sơ cũ không còn CV để lưu lại", "MessageResponse"),
        },
      }),
    },
    "/api/saved-jobs": {
      get: secured({
        tags: ["Saved jobs"],
        summary: "Lấy danh sách việc làm đã lưu",
        responses: {
          "200": jsonResponse("Danh sách việc làm đã lưu", "JobList"),
        },
      }),
    },
    "/api/saved-jobs/{jobId}": {
      post: secured({
        tags: ["Saved jobs"],
        summary: "Lưu một việc làm",
        parameters: [idParameter("jobId")],
        responses: {
          "201": jsonResponse("Đã lưu việc làm", "MessageResponse"),
        },
      }),
      delete: secured({
        tags: ["Saved jobs"],
        summary: "Bỏ lưu một việc làm",
        parameters: [idParameter("jobId")],
        responses: {
          "200": jsonResponse("Đã bỏ lưu việc làm", "MessageResponse"),
        },
      }),
    },
    "/api/messages": {
      get: secured({
        tags: ["Chat"],
        summary: "Lấy tin nhắn trong một phòng chat",
        parameters: [queryParameter("room", "Tên phòng chat", { type: "string", example: "userA_userB" })],
        responses: {
          "200": jsonResponse("Danh sách tin nhắn", "MessageList"),
        },
      }),
      post: secured({
        tags: ["Chat"],
        summary: "Gửi tin nhắn",
        description: "Sau khi lưu thành công, server phát sự kiện Socket.IO newMessage.",
        requestBody: requestBody("MessageRequest", {
          senderId: "65f1a8b7c9d0123456789012",
          senderName: "Nguyễn Thành Vinh",
          content: "Xin chào",
          room: "userA_userB",
          image: "",
        }),
        responses: {
          "201": jsonResponse("Tin nhắn đã được lưu", "MessageResponse"),
        },
      }),
    },
    "/api/chat/users": {
      get: secured({
        tags: ["Chat"],
        summary: "Lấy người dùng có thể nhắn tin",
        responses: {
          "200": jsonResponse("Danh sách người dùng", "UserList"),
        },
      }),
    },
    "/api/chat/threads": {
      get: secured({
        tags: ["Chat"],
        summary: "Lấy danh sách hội thoại",
        responses: {
          "200": jsonResponse("Danh sách hội thoại", "AnyArray"),
        },
      }),
    },
    "/api/chat/unread-count": {
      get: secured({
        tags: ["Chat"],
        summary: "Đếm tin nhắn chưa đọc",
        responses: {
          "200": jsonResponse("Số tin nhắn chưa đọc", "CountResponse"),
        },
      }),
    },
    "/api/chat/mark-all-read": {
      patch: secured({
        tags: ["Chat"],
        summary: "Đánh dấu tất cả tin nhắn đã đọc",
        responses: {
          "200": jsonResponse("Đã đánh dấu tin nhắn", "MessageResponse"),
        },
      }),
    },
    "/api/chat/threads/{room}/read": {
      patch: secured({
        tags: ["Chat"],
        summary: "Đánh dấu một hội thoại đã đọc",
        parameters: [{ ...idParameter("room"), description: "Tên phòng chat" }],
        responses: {
          "200": jsonResponse("Đã đánh dấu hội thoại", "MessageResponse"),
        },
      }),
    },
    "/api/chat/threads/{room}/hide": {
      patch: secured({
        tags: ["Chat"],
        summary: "Ẩn một hội thoại",
        parameters: [{ ...idParameter("room"), description: "Tên phòng chat" }],
        responses: {
          "200": jsonResponse("Đã ẩn hội thoại", "MessageResponse"),
        },
      }),
    },
    "/api/notifications/unread-count": {
      get: secured({
        tags: ["Notifications"],
        summary: "Đếm thông báo chưa đọc",
        responses: {
          "200": jsonResponse("Số thông báo chưa đọc", "CountResponse"),
        },
      }),
    },
    "/api/notifications": {
      get: secured({
        tags: ["Notifications"],
        summary: "Lấy danh sách thông báo",
        parameters: [
          queryParameter("page", "Trang hiện tại", { type: "integer", minimum: 1, default: 1 }),
          queryParameter("limit", "Số lượng mỗi trang", { type: "integer", minimum: 1, maximum: 100, default: 20 }),
        ],
        responses: {
          "200": jsonResponse("Danh sách thông báo", "NotificationList"),
        },
      }),
    },
    "/api/notifications/{id}/read": {
      put: secured({
        tags: ["Notifications"],
        summary: "Đánh dấu thông báo đã đọc",
        parameters: [idParameter()],
        responses: {
          "200": jsonResponse("Đã đánh dấu thông báo", "MessageResponse"),
        },
      }),
    },
    "/api/notifications/mark-all-read": {
      put: secured({
        tags: ["Notifications"],
        summary: "Đánh dấu tất cả thông báo đã đọc",
        responses: {
          "200": jsonResponse("Đã đánh dấu tất cả thông báo", "MessageResponse"),
        },
      }),
    },
    "/api/notifications/{id}": {
      delete: secured({
        tags: ["Notifications"],
        summary: "Xóa thông báo",
        parameters: [idParameter()],
        responses: {
          "200": jsonResponse("Đã xóa thông báo", "MessageResponse"),
        },
      }),
    },
    "/api/ai/status": {
      get: secured({
        tags: ["AI"],
        summary: "Xem trạng thái và hạn mức AI",
        responses: {
          "200": jsonResponse("Trạng thái AI và số lượt còn lại", "AiStatus"),
        },
      }),
    },
    "/api/ai/resume/review": {
      post: secured({
        tags: ["AI"],
        summary: "Review toàn bộ CV",
        requestBody: requestBody("AiResumeContextRequest"),
        responses: {
          "200": jsonResponse("Điểm mạnh, điểm cần cải thiện và hướng sửa", "AiResponse"),
        },
      }),
    },
    "/api/ai/resume/fill": {
      post: secured({
        tags: ["AI"],
        summary: "AI điền các phần còn thiếu trong CV",
        requestBody: requestBody("AiResumeContextRequest"),
        responses: {
          "200": jsonResponse("Nội dung CV được AI gợi ý điền", "AiResponse"),
        },
      }),
    },
    "/api/ai/interview/turn": {
      post: secured({
        tags: ["AI"],
        summary: "Thực hiện một lượt phỏng vấn AI",
        requestBody: requestBody("AiInterviewRequest", {
          action: "start",
          settings: {
            role: "Frontend Developer",
            level: "Junior",
            totalQuestions: 5,
          },
          answeredQuestions: 0,
          messages: [],
        }),
        responses: {
          "200": jsonResponse("Câu hỏi, feedback hoặc tổng kết phỏng vấn", "AiResponse"),
        },
      }),
    },
    "/api/admin/stats": {
      get: secured({
        tags: ["Admin"],
        summary: "Lấy thống kê quản trị",
        description: "Chỉ tài khoản admin được phép gọi API này.",
        responses: {
          "200": jsonResponse("Thống kê người dùng, việc làm và ứng tuyển", "AdminStats"),
        },
      }),
    },
    "/api/admin/jobs": {
      get: secured({
        tags: ["Admin"],
        summary: "Lấy danh sách việc làm cho admin",
        responses: {
          "200": jsonResponse("Danh sách việc làm quản trị", "JobList"),
        },
      }),
    },
    "/api/admin/jobs/{id}/hide": {
      put: secured({
        tags: ["Admin"],
        summary: "Ẩn tin tuyển dụng",
        parameters: [idParameter()],
        responses: {
          "200": jsonResponse("Đã ẩn tin tuyển dụng", "MessageResponse"),
        },
      }),
    },
    "/api/admin/jobs/{id}/unhide": {
      put: secured({
        tags: ["Admin"],
        summary: "Hiện lại tin còn hạn đã duyệt hoặc tin cũ của doanh nghiệp xác minh",
        parameters: [idParameter()],
        responses: {
          "200": jsonResponse("Đã hiện lại tin tuyển dụng", "MessageResponse"),
          "400": jsonResponse('Tin hết hạn, không bị ẩn, bị từ chối hoặc chưa đủ điều kiện', 'ErrorResponse'),
          "409": jsonResponse('Tin đã thay đổi hoặc chủ sở hữu bị vô hiệu hóa', 'ErrorResponse'),
        },
      }),
    },
    "/api/admin/jobs/{id}": {
      delete: secured({
        tags: ["Admin"],
        summary: "Xóa tin tuyển dụng với quyền admin",
        parameters: [idParameter()],
        responses: {
          "200": jsonResponse("Đã xóa tin tuyển dụng", "MessageResponse"),
        },
      }),
    },
    "/api/admin/companies": {
      post: secured({ tags: ['Admin'], summary: 'Admin tạo tài khoản doanh nghiệp đã duyệt, tùy chọn xác minh', requestBody: requestBody('CompanyCreateRequest'), responses: { '201': jsonResponse('Đã tạo tài khoản', 'UserResponse'), '409': jsonResponse('Tên đăng nhập hoặc email trùng', 'ErrorResponse') } }),
      get: secured({
        tags: ["Admin"],
        summary: "Lấy danh sách doanh nghiệp",
        responses: {
          "200": jsonResponse("Danh sách doanh nghiệp", "UserList"),
        },
      }),
    },
    "/api/admin/companies/{id}/verification": {
      put: secured({
        tags: ["Admin"],
        summary: "Duyệt hoặc xử lý trạng thái doanh nghiệp",
        parameters: [idParameter()],
        requestBody: requestBody("CompanyVerificationRequest", { action: "approve" }),
        responses: {
          "200": jsonResponse("Đã cập nhật trạng thái doanh nghiệp", "UserResponse"),
        },
      }),
    },
    "/api/admin/users/{id}/ban": {
      put: secured({
        tags: ["Admin"],
        summary: "Khóa tài khoản người dùng",
        parameters: [idParameter()],
        responses: {
          "200": jsonResponse("Đã khóa tài khoản", "UserResponse"),
        },
      }),
    },
    "/api/admin/users/{id}": {
      delete: secured({
        tags: ["Admin"],
        summary: "Xóa tài khoản người dùng",
        parameters: [idParameter()],
        responses: {
          "200": jsonResponse("Đã xóa tài khoản", "MessageResponse"),
        },
      }),
    },
  },
  components: {
    securitySchemes: {
      cookieAuth: {
        type: "apiKey",
        in: "cookie",
        name: "token",
        description: "Cookie HTTP-only được tạo sau khi gọi POST /api/login.",
      },
    },
    schemas: {
      AnyObject: {
        type: "object",
        additionalProperties: true,
      },
      AnyArray: {
        type: "array",
        items: { type: "object", additionalProperties: true },
      },
      ErrorResponse: {
        type: "object",
        properties: {
          message: { type: "string", example: "Yêu cầu không hợp lệ" },
          code: { type: "string", example: "VALIDATION_ERROR" },
        },
        additionalProperties: true,
      },
      MessageResponse: {
        type: "object",
        properties: {
          message: { type: "string", example: "Thao tác thành công" },
          data: { type: "object", additionalProperties: true },
        },
        additionalProperties: true,
      },
      HealthResponse: {
        type: "object",
        required: ["ok"],
        properties: { ok: { type: "boolean", example: true } },
      },
      HealthDetails: {
        type: "object",
        properties: {
          ok: { type: "boolean" },
          environment: { type: "string", example: "development" },
          missingEnv: { type: "array", items: { type: "string" } },
          auth: {
            type: "object",
            properties: {
              jwtConfigured: { type: "boolean" },
              usingDefaultJwtSecret: { type: "boolean" },
            },
          },
          database: {
            type: "object",
            properties: {
              readyState: { type: "integer", example: 1 },
              connected: { type: "boolean" },
              name: { type: "string", nullable: true },
              host: { type: "string", nullable: true },
            },
          },
        },
      },
      LoginRequest: {
        type: "object",
        required: ["username", "password"],
        properties: {
          username: { type: "string", example: "admin" },
          password: { type: "string", format: "password", example: "1111" },
        },
      },
      RegisterRequest: {
        type: "object",
        required: ["username", "email", "password"],
        properties: {
          username: { type: "string" },
          email: { type: "string", format: "email" },
          password: { type: "string", format: "password" },
          fullName: { type: "string", description: 'Bắt buộc với đăng ký doanh nghiệp', maxLength: 200 },
          companyTaxCode: { type: 'string', maxLength: 50 },
          role: { type: "string", enum: ["employee", "company"] },
        },
        additionalProperties: true,
      },
      AuthResponse: {
        type: "object",
        properties: {
          user: { $ref: "#/components/schemas/User" },
          message: { type: "string" },
        },
      },
      User: {
        type: "object",
        properties: {
          _id: { type: "string" },
          username: { type: "string" },
          email: { type: "string", format: "email" },
          fullName: { type: "string" },
          role: { type: "string", enum: ["employee", "company", "admin"] },
          status: { type: "string" },
          isBanned: { type: "boolean" },
          companyAccountApprovalStatus: { type: 'string', enum: ['pending', 'approved', 'rejected'] },
          companyAccountRejectionReason: { type: 'string' },
          companyVerificationStatus: { type: 'string', enum: ['unverified', 'pending', 'verified', 'rejected'] },
        },
        additionalProperties: true,
      },
      UserList: {
        type: "array",
        items: ref("User"),
      },
      ProfileUpdateRequest: {
        type: "object",
        properties: {
          fullName: { type: "string" },
          phoneNumber: { type: "string" },
          address: { type: "string" },
          country: { type: "string" },
          hometown: { type: "string" },
          companyIndustry: { type: "string" },
          companySize: { type: "string" },
          companyWebsite: { type: "string", format: "uri" },
        },
        additionalProperties: true,
      },
      SecurityRequest: {
        type: "object",
        additionalProperties: true,
      },
      PasswordRequest: {
        type: "object",
        required: ["oldPassword", "newPassword", "contact"],
        properties: {
          oldPassword: { type: "string", format: "password" },
          newPassword: { type: "string", format: "password", minLength: 8, description: "Tối đa 72 byte UTF-8; phải khác mật khẩu hiện tại." },
          contact: { type: "string", maxLength: 254, description: "Email hoặc số điện thoại khớp với tài khoản đang đăng nhập." },
        },
      },
      ResumePayload: {
        type: "object",
        required: ["title"],
        properties: {
          _id: { type: "string", nullable: true },
          title: { type: "string", example: "CV Frontend Developer" },
          targetRole: { type: "string" },
          selectedTemplate: { type: "string", enum: RESUME_TEMPLATE_KEYS },
          customSections: {
            type: "array", maxItems: 30,
            items: { type: "object", required: ["id", "title"], properties: {
              id: { type: "string" }, title: { type: "string", maxLength: 120 },
              fields: { type: "object", properties: Object.fromEntries(["organization", "location", "dates", "link", "description"].map((key) => [key, { type: "boolean" }])) },
              items: { type: "array", maxItems: 50, items: { type: "object", properties: {
                id: { type: "string" }, title: { type: "string", maxLength: 200 },
                organization: { type: "string" }, location: { type: "string" }, startDate: { type: "string" }, endDate: { type: "string" },
                link: { type: "string" }, description: { type: "string", description: "Nội dung rich text" },
                details: { type: "array", maxItems: 12, items: { type: "object", properties: { id: { type: "string" }, label: { type: "string" }, value: { type: "string" } } } },
              } } },
            } },
          },
          layout: { type: "object", properties: {
            version: { type: "integer", enum: [1] },
            customizedTemplates: { type: "array", items: { type: "string" } },
            byTemplate: { type: "object", additionalProperties: { type: "object", properties: {
              main: { type: "array", items: { type: "string" } },
              sidebar: { type: "array", items: { type: "string" } },
            } } },
          } },
          bio: { type: "string" },
          personalInfo: { type: "object", additionalProperties: true },
          skill: { type: "array", items: { type: "object", properties: { title: { type: "string" } } } },
          experiences: { type: "array", items: { type: "object", additionalProperties: true } },
          education: { type: "array", items: { type: "object", additionalProperties: true } },
          projects: { type: "array", items: { type: "object", additionalProperties: true } },
        },
        additionalProperties: true,
      },
      Resume: {
        allOf: [ref("ResumePayload"), { type: "object", properties: { _id: { type: "string" } } }],
      },
      ResumeList: {
        type: "array",
        items: ref("Resume"),
      },
      ResumeResponse: {
        type: "object",
        properties: { resume: ref("Resume"), message: { type: "string" } },
        additionalProperties: true,
      },
      JobPayload: {
        type: "object",
        required: ["title"],
        properties: {
          title: { type: "string" },
          companyName: { type: "string" },
          location: { type: "string" },
          description: { type: "string" },
          status: { type: "string", enum: ['Draft', 'Pending', 'Active', 'Expired', 'Rejected', 'Deleted'] },
          approvalStatus: { type: 'string', enum: ['Pending', 'Approved', 'Rejected'] },
          deadline: { type: "string", format: "date" },
        },
        additionalProperties: true,
      },
      Job: {
        allOf: [ref("JobPayload"), { type: "object", properties: { _id: { type: "string" } } }],
      },
      JobList: {
        type: "array",
        items: ref("Job"),
      },
      JobResponse: {
        type: "object",
        properties: { job: ref("Job"), message: { type: "string" } },
        additionalProperties: true,
      },
      JobApplicationRequest: {
        type: "object",
        required: ["jobId", "resumeId"],
        properties: {
          jobId: { type: "string" },
          resumeId: { type: "string" },
        },
      },
      FileApplicationRequest: {
        type: "object",
        required: ["jobId", "fileName", "fileData"],
        properties: {
          jobId: { type: "string" },
          fileName: { type: "string" },
          fileData: { type: "string", description: "Data URL base64 của file PDF" },
        },
      },
      ApplicationResponse: {
        type: "object",
        properties: { application: { type: "object", additionalProperties: true }, message: { type: "string" } },
        additionalProperties: true,
      },
      ApplicationList: {
        type: "array",
        items: { type: "object", additionalProperties: true },
      },
      ApplicationStatusRequest: {
        type: "object",
        required: ["status"],
        properties: { status: { type: "string", example: "Interview" } },
      },
      MessageRequest: {
        type: "object",
        required: ["content", "room"],
        properties: {
          senderId: { type: "string" },
          senderName: { type: "string" },
          content: { type: "string" },
          room: { type: "string" },
          image: { type: "string", nullable: true },
        },
      },
      MessageList: {
        type: "array",
        items: { type: "object", additionalProperties: true },
      },
      NotificationList: {
        type: "object",
        properties: {
          notifications: { type: "array", items: { type: "object", additionalProperties: true } },
          pagination: { type: "object", additionalProperties: true },
        },
        additionalProperties: true,
      },
      CountResponse: {
        type: "object",
        properties: { count: { type: "integer", example: 0 }, unreadCount: { type: "integer", example: 0 } },
        additionalProperties: true,
      },
      AiStatus: {
        type: "object",
        properties: {
          enabled: { type: "boolean" },
          remaining: { type: "integer", example: 100 },
          limit: { type: "integer", example: 100 },
          used: { type: "integer", example: 0 },
        },
        additionalProperties: true,
      },
      AiResponse: {
        type: "object",
        properties: {
          result: { type: "object", additionalProperties: true },
          usage: { type: "object", additionalProperties: true },
          disclaimer: { type: "string" },
        },
        additionalProperties: true,
      },
      AiResumeContextRequest: {
        type: "object",
        properties: {
          resumeId: { type: "string" },
          resumeContext: { type: "object", additionalProperties: true },
        },
        additionalProperties: true,
      },
      AiInterviewRequest: {
        type: "object",
        required: ["action", "settings"],
        properties: {
          action: { type: "string", enum: ["start", "answer", "finish"] },
          settings: { type: "object", additionalProperties: true },
          answeredQuestions: { type: "integer", minimum: 0 },
          messages: { type: "array", items: { type: "object", additionalProperties: true } },
        },
        additionalProperties: true,
      },
      AdminStats: {
        type: "object",
        properties: {
          users: { type: "object", additionalProperties: true },
          jobs: { type: "object", additionalProperties: true },
          applications: { type: "object", additionalProperties: true },
        },
        additionalProperties: true,
      },
      UserResponse: {
        type: "object",
        properties: { user: ref("User"), company: ref("User"), message: { type: "string" } },
        additionalProperties: true,
      },
      CompanyVerificationRequest: {
        type: "object",
        required: ["action"],
        properties: { action: { type: "string", enum: ["approve", "reject", "verify", "unverify", "suspend", "restore"] }, reason: { type: 'string', description: 'Bắt buộc khi từ chối tài khoản', maxLength: 2000 } },
      },
      CompanyCreateRequest: { type: 'object', required: ['username', 'email', 'password', 'fullName'], properties: { username: { type: 'string' }, email: { type: 'string', format: 'email' }, password: { type: 'string', minLength: 8, maxLength: 72, writeOnly: true }, fullName: { type: 'string' }, companyTaxCode: { type: 'string' }, companyWebsite: { type: 'string' }, verified: { type: 'boolean', default: false } } },
    },
  },
};

Object.assign(openapiSpec.paths, {
  '/api/admin/jobs/{id}/review': { put: secured({ tags: ['Admin'], summary: 'Duyệt hoặc từ chối tin sau khi đọc đúng phiên bản', parameters: [idParameter()], requestBody: requestBody('AnyObject', { action: 'approve', updatedAt: '2026-10-02T00:00:00Z', reason: '' }), responses: { '200': jsonResponse('Đã lưu quyết định'), '409': jsonResponse('Tin hoặc doanh nghiệp đã thay đổi', 'ErrorResponse') } }) },
  '/api/news': { get: publicOperation({ tags: ['News'], summary: 'Danh sách tin tức đã công khai', responses: { '200': { description: 'Các bài viết đã xuất bản', content: { 'application/json': { schema: { type: 'array', items: ref('AnyObject') } } } } } }) },
  '/api/admin/news': {
    get: secured({ tags: ['Admin'], summary: 'Quản lý tất cả tin tức và bản nháp', responses: { '200': jsonResponse('Danh sách bài viết') } }),
    post: secured({ tags: ['Admin'], summary: 'Đăng tin tức mới (chỉ admin)', requestBody: requestBody('AnyObject'), responses: { '201': jsonResponse('Đã tạo bài viết') } }),
  },
  '/api/admin/news/{slug}': {
    put: secured({ tags: ['Admin'], summary: 'Sửa nội dung hoặc ẩn tin tức', parameters: [idParameter('slug', 'Slug bài viết')], requestBody: requestBody('AnyObject'), responses: { '200': jsonResponse('Đã cập nhật') } }),
    delete: secured({ tags: ['Admin'], summary: 'Xóa tin tức', parameters: [idParameter('slug', 'Slug bài viết')], responses: { '200': jsonResponse('Đã xóa') } }),
  },
});
export default openapiSpec;
