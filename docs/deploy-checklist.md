# Kiểm tra trước khi push và triển khai RabbitCV

## Phạm vi bản cập nhật

- Giữ nguyên các file kiểm thử đã xóa; không khôi phục chúng.
- Không triển khai quên mật khẩu qua email, SMS, OTP hoặc link reset. Đổi mật khẩu khi đã đăng nhập vẫn yêu cầu mật khẩu hiện tại và email/số điện thoại khớp tài khoản.
- Vercel cho phép website yêu cầu mic qua `Permissions-Policy: microphone=(self)`. Trình duyệt vẫn yêu cầu sự đồng ý của người dùng; không cấp quyền tự động cho iframe hoặc website khác.

## Biến môi trường cần kiểm tra trong dashboard

Không commit `.env` hoặc giá trị bí mật. `.env.example` chỉ là mẫu; Vercel/Render cần được cấu hình riêng.

### Vercel

- `MONGODB_URI` hoặc `MONGO_URI`: URI MongoDB Atlas đúng database.
- `MONGO_DB_NAME`: giữ đúng tên database hiện đang dùng, không đổi sang database mới khi deploy.
- `JWT_SECRET`: giữ khóa hiện tại; không dùng khóa mẫu.
- `CLIENT_URL`: origin website production, ví dụ `https://rabbitcv.vercel.app`.
- `VITE_SOCKET_URL`: URL HTTPS server realtime Render; đây là biến public, không chứa bí mật. Cần build lại sau khi thay đổi.
- `REALTIME_SERVER_URL`: cùng URL Render để relay sự kiện từ API.
- `REALTIME_SHARED_SECRET`: giống giá trị trên Render. Nếu dùng `REALTIME_JWT_SECRET`, cũng cần giống trên hai backend.
- `GROQ_API_KEY`, `GROQ_MODEL`, `AI_ENABLED` và hạn mức AI: giữ cấu hình đang dùng.
- `CRON_SECRET`: khóa bảo vệ `/api/cron/job-expiry`.
- Dùng môi trường production (`NODE_ENV=production`), không sao chép `development` từ `.env.example`.

### Render

- `NODE_ENV=production`; `CLIENT_URL` là origin website Vercel.
- Khai báo URI MongoDB và đúng database nếu chạy đầy đủ `server/server.js` như `render.yaml` hiện tại.
- `JWT_SECRET` và `REALTIME_SHARED_SECRET` là secrets, nhập trong dashboard; không đưa vào YAML.
- Các mục `sync: false` trong Blueprint yêu cầu nhập giá trị khi tạo mới; không thay thế việc kiểm tra biến của service đã tồn tại.
- Giữ URL và các khóa đang dùng để tránh mất kết nối giữa Vercel và Render.
- Không chạy các script migration `--apply` trên database thật chỉ để kiểm tra deploy.

## Kiểm tra local

```powershell
npm run lint
npm run test:unit
npm run test:e2e -- --workers=1
$env:UV_THREADPOOL_SIZE="1"
npm run build
```

`UV_THREADPOOL_SIZE` chỉ áp dụng cho terminal hiện tại để giảm mức song song khi nén build; không bắt buộc đưa lên production. Test dùng mock không chứng minh đã chạy tích hợp với database hoặc dịch vụ thật. Các phạm vi test đã bị xóa phải được kiểm tra thủ công khi cần.

## Push và kiểm tra production

1. Kiểm tra `git status` và danh sách file staged, gồm các thay đổi/xóa mong muốn; không có secrets hoặc báo cáo sinh tự động.
2. Commit và push nhánh production sau khi các lệnh kiểm tra thành công.
3. Kiểm tra deployment mới trên Vercel và Render cùng đúng commit. Không coi build local là xác nhận deploy cloud thành công.
4. Mở website: đăng nhập, lưu/xem CV, PDF A4, tin tuyển dụng, chức năng admin và đổi mật khẩu.
5. Thử chat/thông báo bằng hai tài khoản ở các phiên trình duyệt độc lập; ngắt/kết nối lại để kiểm tra đồng bộ.
6. Thử mic thật trên HTTPS: cấp/từ chối quyền, chọn mic, nói, dừng, sửa bản chép lời rồi xác nhận gửi.

Nguồn cấu hình: [Vercel vercel.json](https://vercel.com/docs/project-configuration/vercel-json), [Render Environment Variables](https://render.com/docs/configure-environment-variables).
