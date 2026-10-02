# Thông báo realtime RabbitCV

Sau khi `createNotification` hoặc `createNotificationsBulk` lưu thông báo thành công,
backend phát sự kiện Socket.IO `newNotification` vào room `user_<recipientId>`.
Các luồng ứng tuyển, thay đổi trạng thái hồ sơ và cron hết hạn Job cùng sử dụng cơ chế này.

Frontend đăng ký sự kiện tại `SocketProvider` để cập nhật các query thông báo đang
hiển thị và hiện toast một lần cho mỗi thông báo. Khi socket kết nối lại, frontend
tải lại dữ liệu để lấy các thông báo bị bỏ lỡ. REST API tiếp tục phục vụ lịch sử,
số chưa đọc và đánh dấu đã đọc. Chu kỳ 30 giây là cơ chế dự phòng khi realtime gián đoạn.

## Triển khai Vercel và Render

Triển khai mã backend mới trên Render trước, sau đó triển khai backend/frontend
trên Vercel. Render cần có endpoint `POST /api/realtime/notifications` mới.

- Vercel: `REALTIME_SERVER_URL` là URL HTTPS của server realtime Render.
- Frontend Vercel: `VITE_SOCKET_URL` là URL của server realtime Render; thay đổi
  biến này cần build lại frontend.
- Cả hai backend: `REALTIME_SHARED_SECRET` phải khớp nhau.
- Giữ nguyên cấu hình `REALTIME_JWT_SECRET`/socket ticket và CORS đang dùng cho chat.
- Không đưa giá trị bí mật vào các biến có tiền tố `VITE_`.

Relay thông báo yêu cầu `X-Realtime-Secret` hợp lệ và ID người nhận phải khớp với
`notification.recipient`. Socket vẫn chỉ tham gia room xác định từ token đã xác thực.
Nếu phát realtime thất bại, thông báo đã lưu không bị mất và vẫn được lấy qua REST.

## Kiểm tra sau triển khai

1. Mở hai phiên trình duyệt, đăng nhập ứng viên và doanh nghiệp.
2. Ứng viên nộp hồ sơ: doanh nghiệp thấy toast và số chưa đọc đổi ngay.
3. Doanh nghiệp đổi trạng thái hồ sơ: ứng viên nhận thông báo ngay.
4. Tạm ngắt kết nối phía người nhận rồi tạo một thông báo; khi kết nối lại,
   danh sách và số chưa đọc được đồng bộ từ MongoDB.

Các kiểm thử tự động nằm ở `test/notificationRealtime.test.js` và
`e2e/notifications-realtime.spec.js`. Kiểm thử trình duyệt mô phỏng Socket.IO và
REST, không ghi dữ liệu vào MongoDB production.
