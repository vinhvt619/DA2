# Đổi Và Đặt Lại Mật Khẩu

- Trong tài khoản: `PUT /api/user/password` yêu cầu phiên đăng nhập. Email/số điện thoại phải khớp tài khoản đó; không nhập mật khẩu hiện tại.
- Ngoài trang đăng nhập/đăng ký: `/forgot-password` gọi `POST /api/forgot-password`. Người dùng nhập tên đăng nhập, email đã đăng ký, mật khẩu mới và xác nhận mật khẩu mới. Backend đối chiếu tên đăng nhập và email trên cùng một tài khoản trước khi đổi mật khẩu; không chấp nhận chỉ email hoặc số điện thoại.
- Hai API dùng cùng quy tắc: ít nhất 8 ký tự, tối đa 72 byte UTF-8, hai mật khẩu mới trùng nhau, không trùng mật khẩu đang lưu. Mật khẩu được băm bằng bcrypt, không lưu văn bản thuần.
- Trang quên mật khẩu chỉ nhận email; số điện thoại vẫn được dùng để đối chiếu trong trang đổi mật khẩu của tài khoản đã đăng nhập. Tài khoản bị khóa hoặc đã xóa không được đặt lại mật khẩu.

## Cấu Hình Demo

Khi không đặt `ALLOW_DEMO_PASSWORD_RESET`, luồng quên mật khẩu trực tiếp bật ở môi trường phát triển và tắt khi `NODE_ENV=production`.

- `ALLOW_DEMO_PASSWORD_RESET=true`: bật rõ ràng trên một bản triển khai demo, kể cả production/Vercel.
- `ALLOW_DEMO_PASSWORD_RESET=false`: tắt, kể cả localhost.
- Khởi động lại backend hoặc redeploy sau khi thay đổi cấu hình.

**Không bật luồng này cho tài khoản thật.** Người biết tên đăng nhập và email vẫn có thể thay mật khẩu mà không cần mã xác minh. Việc đối chiếu hai thông tin chỉ kiểm tra chúng thuộc cùng tài khoản, không chứng minh người gửi là chủ tài khoản. Trước khi sử dụng thực tế, cần thay bằng mã/link xác minh gửi tới chủ tài khoản.
