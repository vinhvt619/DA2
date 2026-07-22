# RabbitCV

RabbitCV là đồ án web tuyển dụng cá nhân, hỗ trợ ứng viên tạo CV, tìm việc,
ứng tuyển và trao đổi với doanh nghiệp. Doanh nghiệp có thể đăng tin, xem CV đã
nộp và cập nhật trạng thái hồ sơ. Hệ thống cũng có dashboard quản trị cơ bản.

## Công nghệ

- Frontend: React 18, Vite, Tailwind CSS, React Router, Tiptap.
- Backend: Node.js, Express, MongoDB/Mongoose.
- Realtime: Socket.IO.
- Xác thực: JWT trong HTTP-only cookie.

## Cài đặt

Yêu cầu Node.js 20 trở lên và một MongoDB database dành cho local/demo.

```bash
npm ci
copy .env.example .env
npm run start
```

Mở terminal thứ hai để chạy frontend:

```bash
npm run dev
```

- Frontend: `http://localhost:4000`
- Backend: `http://localhost:5000`
- Health check: `http://localhost:5000/api/health`

Không dùng database production để chạy seed hoặc test thủ công.

## Cấu hình

Sao chép `.env.example` thành `.env` và cập nhật:

- `MONGODB_URI`: MongoDB connection string.
- `MONGO_DB_NAME`: tên database, mặc định `RabbitCV`.
- `JWT_SECRET`: chuỗi bí mật dùng ký token.
- `CLIENT_URL`: địa chỉ frontend.
- `PORT`: cổng backend.

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

Hoặc chạy toàn bộ:

```bash
npm run check
```

Test hiện có kiểm tra:

- Chỉ nhận dữ liệu PDF hợp lệ.
- Từ chối DOC/DOCX và nội dung giả PDF.
- Giới hạn PDF 5 MB.
- CSS preview và print khai báo đúng khổ A4.

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
