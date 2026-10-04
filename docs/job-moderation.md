# Kiểm duyệt tin tuyển dụng và quản lý tin tức

- Doanh nghiệp tự đăng ký có `companyAccountApprovalStatus: pending`, `companyVerificationStatus: unverified`. Có thể đăng nhập để cập nhật hồ sơ và xem trạng thái, nhưng backend không cho gửi/lưu tin khi tài khoản chưa được admin duyệt.
- Admin vào `/admin/companies`, chọn **Xem hồ sơ**, đọc thông tin và duyệt/từ chối tài khoản (từ chối cần lý do). Duyệt tài khoản không tự gắn nhãn xác minh. Admin có thể tạo tài khoản thủ công, được duyệt ngay, với lựa chọn xác minh mặc định tắt; mật khẩu ban đầu được băm bcrypt và không trả lại trong API.
- Doanh nghiệp đã được duyệt nhưng chưa xác minh gửi tin tại `/CompanyDashboard`. Tin mới có `status: Pending`, `approvalStatus: Pending`, không xuất hiện công khai và không nhận ứng tuyển trước khi admin duyệt.
- Admin có thể **Xác minh doanh nghiệp** sau khi kiểm tra hồ sơ. Tin mới/nội dung chỉnh sửa của doanh nghiệp có nhãn xác minh được công khai ngay (`Active`, `Approved`, `approvalSource: company_verification`), không giả mạo người duyệt admin. Bản nháp vẫn riêng tư. Tin bị admin ẩn không thể tự công khai lại dù doanh nghiệp đã xác minh.
- **Thu hồi xác minh** áp dụng yêu cầu duyệt cho các lần gửi/sửa tin tiếp theo, không tự gỡ các tin đã công khai trước đó. Admin vẫn có thể ẩn/đóng/xóa từng tin. **Mở khóa** không tự duyệt tài khoản hoặc gắn nhãn xác minh.
- Theo yêu cầu chuyển tiếp, các tài khoản doanh nghiệp hiện có trước `2026-10-02T15:27:31.168Z` được duyệt và xác minh một lần bằng `node scripts/verify-existing-companies.mjs --apply`. Không mở khóa tài khoản bị khóa hoặc khôi phục tài khoản đã xóa. Chạy không có `--apply` chỉ kiểm tra số tài khoản.
- Script lưu danh sách ID và trạng thái trước cập nhật tại collection `appMigrations`, đánh dấu hoàn tất để không chạy lại và không tự bật lại xác minh đã bị admin thu hồi. Không cập nhật mật khẩu hoặc các tin tuyển dụng hiện có. Tài khoản đăng ký sau mốc cố định vẫn phải chờ duyệt; không có cơ chế tự xác minh khi khởi động server.
- Đợt cập nhật tin cũ riêng theo yêu cầu: `node scripts/publish-existing-company-jobs.mjs --apply` công khai các tin chờ duyệt/thiếu dấu duyệt, còn hạn, được tạo trước `2026-10-02T15:33:22.541Z`, thuộc danh sách doanh nghiệp chuyển tiếp và vẫn đang được xác minh. Giữ nguyên tin nháp, đóng/hết hạn, từ chối, ẩn hoặc xóa. Script sao lưu trạng thái và ID trước cập nhật vào `appMigrations`, chỉ chạy một lần; không chỉnh nội dung hoặc giả mạo admin đã duyệt.
- Trang admin phân biệt tin bị ẩn, đóng, hết hạn và chờ duyệt; không gắn nhãn chờ duyệt chỉ vì tin cũ thiếu trường `approvalStatus`. Khi admin chủ động bấm **Hiện lại**, tin cũ còn hạn của doanh nghiệp đã xác minh được cấp dấu miễn duyệt và bỏ ẩn. Không cho khôi phục tin đã xóa, hết hạn, bị từ chối, hoặc thuộc tài khoản đã bị vô hiệu hóa. Kiểm tra `updatedAt` ngăn thao tác ghi đè quyết định đồng thời. Giao diện hiển thị lý do lỗi backend thay vì thông báo chung.
- Admin mở `/admin/jobs`, bấm tiêu đề để đọc nội dung. Duyệt làm tin được công khai; không duyệt yêu cầu lý do, doanh nghiệp có thể sửa và gửi lại. Backend kiểm tra `updatedAt` để tránh duyệt phiên bản đã bị chỉnh sửa.
- Doanh nghiệp chưa xác minh sửa nội dung tin đã duyệt sẽ gửi duyệt lại. Đóng/mở tin đã duyệt chỉ đổi trạng thái, không cần duyệt lại. Tin hết hạn hoặc bị admin ẩn không thể được doanh nghiệp tự mở lại.
- Tin cũ không có `approvalStatus: Approved` cũng cần admin duyệt trước khi công khai. Không có thao tác tự động duyệt hay cập nhật dữ liệu thật khi khởi động để bỏ qua quy trình này.
- Xóa doanh nghiệp là xóa mềm: giữ User để bảo toàn tham chiếu lịch sử, khóa tài khoản và gỡ các Job trong cùng MongoDB transaction. Các hồ sơ ứng tuyển và bản CV đã nộp được giữ nguyên. MongoDB cần replica set (MongoDB Atlas đáp ứng điều kiện này).
- Admin quản lý tin tức tại `/admin/news`: tạo, sửa, công khai, lưu nháp/ẩn và xóa. Bài viết ban đầu trong dữ liệu mẫu được quản lý bằng bản ghi ghi đè; dấu xóa trong MongoDB ngăn bài mẫu xuất hiện trở lại. Tất cả trang tin tức phía người dùng đọc API, không tự khôi phục dữ liệu mẫu khi API lỗi.

## Kiểm tra

`npm run check` chạy ESLint, Node Test Runner và build.

`npm run test:e2e -- e2e/job-visibility.spec.js --workers=1` kiểm tra hiển thị công khai khi admin ẩn/hiện/xóa tin. File `admin-content.spec.js` đã được xóa theo yêu cầu; quy trình duyệt doanh nghiệp/tin tuyển dụng và quản lý tin tức cần kiểm tra thủ công, không xem bộ hiện tại là bao phủ đầy đủ các luồng này.

Các bài kiểm thử mới dùng model giả lập/API mock, không ghi lên cơ sở dữ liệu thật. Việc triển khai Vercel/Render và kiểm tra tích hợp trên MongoDB Atlas cần thực hiện riêng trên dữ liệu thử nghiệm.
