# RabbitCV

RabbitCV là ứng dụng web kết hợp trình tạo CV và cổng tuyển dụng. Ứng viên có thể tạo CV, tìm việc và theo dõi hồ sơ đã nộp. Doanh nghiệp quản lý tin tuyển dụng, xem CV và cập nhật trạng thái hồ sơ. Quản trị viên kiểm duyệt tin và quản lý tài khoản.

[Demo RabbitCV](https://rabbitcv.vercel.app/)

## Tính năng

| Vai trò | Luồng sử dụng |
| --- | --- |
| Ứng viên | Tạo CV theo mẫu A4, xuất PDF, tìm việc, ứng tuyển bằng CV đã lưu hoặc tải lên PDF tối đa 5 MB, theo dõi trạng thái hồ sơ. |
| Doanh nghiệp | Đăng và quản lý tin tuyển dụng, xem CV của ứng viên, cập nhật trạng thái hồ sơ và trao đổi qua chat. |
| Quản trị viên | Kiểm duyệt tin tuyển dụng và quản lý tài khoản trên hệ thống. |

Ở luồng ứng tuyển bằng CV đã lưu, hệ thống lưu một bản chụp dữ liệu CV tại thời điểm nộp. Doanh nghiệp xem đúng nội dung ứng viên đã gửi, kể cả khi ứng viên chỉnh sửa CV sau đó. Chat và thông báo cập nhật theo thời gian thực qua Socket.IO.

Ứng viên cũng có thể dùng AI để nhận góp ý cho CV hoặc luyện phỏng vấn theo vị trí, cấp độ và loại phỏng vấn. Khi luyện, hệ thống hỏi từng câu, phản hồi cho câu trả lời và tổng kết buổi luyện tập. Các tính năng này cần cấu hình dịch vụ AI trên backend.

## Công nghệ

| Thành phần | Công nghệ |
| --- | --- |
| Giao diện | React, Vite, Tailwind CSS, Tiptap |
| API | Node.js, Express, OpenAPI và Swagger UI |
| Cơ sở dữ liệu | MongoDB, Mongoose |
| Phiên đăng nhập | JWT qua cookie HttpOnly |
| Chat và thông báo | Socket.IO |

## Chạy trên máy

Cần **Node.js 22 LTS (từ 22.13) hoặc 24 LTS** và một cơ sở dữ liệu MongoDB dành cho phát triển.

Trên Windows PowerShell, chạy các lệnh sau từ thư mục gốc. Trên macOS/Linux, dùng `cp .env.example .env` để sao chép tệp cấu hình.

```powershell
npm ci
Copy-Item .env.example .env
```

Trong `.env`, đặt `MONGODB_URI`, `MONGO_DB_NAME` và `JWT_SECRET`. Giữ `CLIENT_URL=http://localhost:4000` nếu dùng cổng mặc định. Đặt `AI_ENABLED=false` để chạy các luồng tuyển dụng và CV mà không cần API key. Để dùng các tính năng AI, đặt `AI_ENABLED=true` và cung cấp `GROQ_API_KEY`.

```bash
npm run start:all
```

| Thành phần | Địa chỉ mặc định |
| --- | --- |
| Giao diện | `http://localhost:4000` |
| Swagger UI | `http://localhost:5000/api-docs` |
| Kiểm tra backend | `http://localhost:5000/api/health` |

Chạy `npm run check` để kiểm tra lint, chạy unit test và build frontend. Khi đã cài Google Chrome, chạy `npm run test:e2e` để kiểm tra các luồng trên trình duyệt bằng Playwright.

## Mã nguồn

- `src/` chứa giao diện ứng viên, doanh nghiệp và quản trị.
- `server/` chứa API, xác thực, lớp dữ liệu và xử lý nghiệp vụ.
- `shared/` chứa định nghĩa dùng chung giữa frontend và backend.
- `test/` và `e2e/` chứa các bài kiểm thử.

Các mẫu CV chuyển thể ghi rõ tác giả, nguồn tham khảo và điều khoản sử dụng. [Nguồn và giấy phép mẫu CV](docs/cv-template-sources.md)
