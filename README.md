# RabbitCV

RabbitCV là đồ án web tuyển dụng cá nhân, hỗ trợ ứng viên tạo CV, tìm việc,
ứng tuyển và trao đổi với doanh nghiệp. Doanh nghiệp có thể đăng tin, xem CV đã
nộp và cập nhật trạng thái hồ sơ. Hệ thống cũng có dashboard quản trị cơ bản.

## Công nghệ

- Frontend: React 18, Vite, Tailwind CSS, React Router, Tiptap.
- Backend: Node.js, Express, MongoDB/Mongoose.
- Realtime: Socket.IO.
- Xác thực: JWT trong HTTP-only cookie.
- AI: Groq Free với model OpenAI GPT-OSS và Structured Outputs.

## Cài đặt

Yêu cầu Node.js 20 trở lên và một MongoDB database dành cho local/demo.

```bash
npm ci
copy .env.example .env
npm run start:all
```

- Frontend: `http://localhost:4000`
- Backend: `http://localhost:5000`
- Health check: `http://localhost:5000/api/health`
- Swagger UI: `http://localhost:5000/api-docs`
- OpenAPI JSON: `http://localhost:5000/api-docs.json`

Sau khi chạy backend, mở Swagger UI để xem các API theo nhóm và bấm `Try it
out` để gửi thử request. Gọi `POST /api/login` trước để tạo cookie đăng nhập;
các API có yêu cầu xác thực sẽ dùng cookie HTTP-only của phiên hiện tại. Tài
khoản thử nghiệm local là `admin` / `1111`. Swagger UI chỉ mô tả API HTTP;
luồng Socket.IO realtime được quan sát trong DevTools ở mục `Network` → `WS`.

Không dùng database production để chạy seed hoặc test thủ công.

## Cấu hình

Sao chép `.env.example` thành `.env` và cập nhật:

- `MONGODB_URI`: MongoDB connection string.
- `MONGO_DB_NAME`: tên database, mặc định `RabbitCV`.
- `JWT_SECRET`: chuỗi bí mật dùng ký token.
- `CLIENT_URL`: địa chỉ frontend.
- `VITE_SOCKET_URL`: URL Socket.IO trên Render, ví dụ
  `https://rabbitcv-realtime.onrender.com`; để trống khi chạy local.
- `REALTIME_SERVER_URL`: URL Render mà Vercel dùng để chuyển tiếp sự kiện chat.
- `REALTIME_SHARED_SECRET`: khóa nội bộ giống nhau trên Vercel và Render.
- `GROQ_API_KEY`: khóa Groq, chỉ cấu hình ở backend hoặc Vercel Environment
  Variables. Không đặt khóa này trong biến bắt đầu bằng `VITE_`.
- `GROQ_MODEL`: model AI, mặc định `openai/gpt-oss-120b`.
- `AI_ENABLED`: đặt `false` để tắt toàn bộ tính năng AI.
- `AI_DAILY_LIMIT`: số lượt AI tối đa cho mỗi tài khoản mỗi ngày, mặc định `100`.
- `AI_REQUEST_TIMEOUT_MS`: thời gian chờ Groq tối đa, mặc định `20000`.
- `CRON_SECRET`: chuỗi bí mật bảo vệ endpoint cập nhật tin hết hạn trên môi
  trường production.
- `PORT`: cổng backend.

## Realtime trên Render

File `render.yaml` tạo một Web Service miễn phí dành cho Socket.IO. Sau khi tạo
service, cấu hình `JWT_SECRET` và `REALTIME_SHARED_SECRET` trên Render. Hai giá
trị này phải giống với biến trên Vercel.

Trên Vercel, thêm:

- `VITE_SOCKET_URL`: URL public của service Render.
- `REALTIME_SERVER_URL`: cùng URL public đó.
- `REALTIME_SHARED_SECRET`: khóa nội bộ đã đặt trên Render.

Sau khi lưu biến, redeploy cả Render và Vercel. REST API vẫn chạy trên Vercel;
chỉ kết nối Socket.IO lâu dài được chuyển sang Render.

## Tính năng AI

AI chỉ được gọi từ Express backend. Frontend không nhận và không lưu
`GROQ_API_KEY`.

- Viết mới, cải thiện hoặc rút gọn phần tiểu sử CV nhưng không tự động ghi đè
  nội dung đang có.
- Điền các mục CV còn thiếu dựa trên thông tin hồ sơ và nội dung người dùng đã
  nhập; kết quả vẫn cần được người dùng xem lại trước khi lưu.
- Review toàn bộ CV, nêu điểm tốt, vấn đề và cách cải thiện theo mức ưu tiên.
- Phỏng vấn thử theo vị trí, cấp độ và loại phỏng vấn; AI hỏi từng câu, chấm câu
  trả lời và tổng kết buổi luyện tập.

Mỗi tài khoản có quota theo ngày và rate limit riêng cho nhóm API `/api/ai`.
Nội dung đầu vào được làm sạch, loại thông tin liên hệ khỏi CV trước khi gửi
Groq qua HTTPS. Database chỉ lưu thống kê token, độ trễ, trạng thái và hash đầu
vào, không lưu prompt hoặc nội dung CV.

Khi deploy Vercel, thêm `GROQ_API_KEY`, `CRON_SECRET` và các biến cần thiết cho
từng môi trường, sau đó redeploy. Nếu chưa có khóa AI, website vẫn chạy bình
thường và API AI trả thông báo chưa được cấu hình.

## CV và ứng tuyển

Ứng viên có hai cách nộp CV:

1. Chọn CV đã tạo bằng editor trên website.
2. Tải CV PDF từ máy tính, tối đa 5 MB.

DOC và DOCX không được hỗ trợ. Doanh nghiệp mở CV từ danh sách hồ sơ ứng tuyển:

- CV tạo trên web được render bằng template đã lưu theo khổ A4.
- CV PDF được xem trực tiếp và có thể tải file gốc.

CSS in sử dụng khổ A4 `210 × 297 mm`. Nội dung CV dài cần được kiểm tra bằng
Print Preview để bảo đảm không bị cắt ở cuối trang.

## Kiểm tra project

```bash
npm run lint
npm test
npm run build
```

Kiểm thử trình duyệt bằng Playwright dùng API mock, không kết nối MongoDB hoặc
Groq production. Lệnh sẽ tự khởi động và dừng Vite; máy cần cài Google Chrome:

```bash
npm run test:e2e
```

Muốn quan sát trình duyệt khi test:

```bash
npm run test:e2e:headed
```

Hoặc chạy toàn bộ:

```bash
npm run check:all
```

Test hiện có kiểm tra:

- Chỉ nhận dữ liệu PDF hợp lệ.
- Từ chối DOC/DOCX và nội dung giả PDF.
- Giới hạn PDF 5 MB.
- CSS preview và print khai báo đúng khổ A4.
- Làm sạch dữ liệu trước khi gửi AI và loại thông tin liên hệ khỏi CV.
- Khóa Groq không xuất hiện trong mã nguồn frontend.
- Trang chào mừng và validation đăng nhập hoạt động trong trình duyệt.
- Đăng nhập ứng viên, doanh nghiệp và admin chuyển đến đúng cổng.
- Ứng viên không thể truy cập trực tiếp trang quản trị.

## Checklist demo

1. Đăng nhập ứng viên, tạo và lưu một CV trên web.
2. Nộp CV đó vào một job trong database.
3. Đăng nhập doanh nghiệp sở hữu job và mở CV từ danh sách ứng viên.
4. Lặp lại với một file PDF A4 tải từ máy tính.
5. Kiểm tra preview, tải file gốc và cập nhật trạng thái application.
6. Mở Print Preview với CV web và xác nhận khổ giấy A4, không mất nội dung.

## Cấu trúc chính

```text
src/                  React pages, components, contexts và hooks
server/server.js      Express API và Socket.IO
server/models/        Mongoose models
server/utils/         Notification và PDF validation
server/cron/          Job expiry notifications
test/                 Node test suite
scripts/              Migration scripts
```
