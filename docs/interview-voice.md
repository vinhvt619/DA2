# Trả lời phỏng vấn bằng mic

Trang `/ai-interview` có nút **Trả lời bằng mic** khi bắt đầu buổi phỏng vấn.

1. Bấm nút và cho phép trình duyệt sử dụng mic.
2. Nói bằng tiếng Việt; lời nói xuất hiện trong ô câu trả lời.
3. Bấm **Dừng mic**, chờ hoàn tất nhận dạng, kiểm tra và sửa văn bản nếu cần.
4. Bấm **Gửi** để gửi văn bản đến API phỏng vấn hiện có.

## Chọn microphone khi có nhiều thiết bị

- Trên Chrome/Edge máy tính với Chromium 135 trở lên, có mục **Microphone** ngay phía trên nút trả lời bằng mic.
- Bấm **Tải danh sách mic**, cấp quyền khi được hỏi, rồi chọn mic laptop, mic USB, tai nghe... Thiết bị chỉ mở tạm thời để cấp quyền/đọc tên và được đóng ngay; không ghi âm hay gửi câu trả lời trong bước này.
- Bấm **Trả lời bằng mic** để mở thiết bị đã chọn bằng `getUserMedia({audio: {deviceId: {exact: id}}})` và truyền audio track cho `SpeechRecognition.start(track)`.
- Chỉ đổi thiết bị khi mic đã dừng. Nếu thiết bị không khả dụng/bị rút, báo lỗi và giữ bản nháp, không âm thầm chuyển sang mic mặc định.
- Lựa chọn chỉ giữ trong buổi phỏng vấn hiện tại, không lưu tên/ID mic lên server.
- Safari, điện thoại và các trình duyệt chưa hỗ trợ `start(audioTrack)` vẫn dùng mic mặc định; đổi mic trong cài đặt trình duyệt/hệ điều hành. Ứng dụng kiểm tra bảo thủ theo phiên bản desktop Chromium vì engine cũ có thể bỏ qua audio track mà không báo lỗi.
- Kiểm tra thủ công với hai mic thật: chọn từng thiết bị, nói và kiểm tra bản chép lời, thử rút mic đang dùng, từ chối quyền, dừng mic và rời trang. Kiểm thử tự động chỉ mô phỏng thiết bị/nhận dạng.

Tham khảo: [MDN SpeechRecognition.start](https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition/start), [dữ liệu tương thích MDN](https://github.com/mdn/browser-compat-data/blob/main/api/SpeechRecognition.json).

## Phạm vi và giới hạn

- Dùng Web Speech API (`SpeechRecognition` hoặc `webkitSpeechRecognition`) của trình duyệt; không cần thêm API key hay dịch vụ backend.
- Yêu cầu HTTPS hoặc localhost và trình duyệt có hỗ trợ. Nếu không hỗ trợ hoặc bị từ chối quyền, người dùng vẫn gõ chữ được.
- Trình duyệt có thể gửi âm thanh đến dịch vụ nhận dạng của nhà cung cấp trình duyệt. Không cam kết nhận dạng offline hoặc hoàn toàn trên thiết bị.
- Ứng dụng không tải âm thanh lên backend, không tự gửi bản chép lời, không lưu file ghi âm. Chỉ gửi văn bản người dùng xác nhận qua `/api/ai/interview/turn`.
- Nhận dạng có thể sai tiếng Việt hoặc thuật ngữ chuyên môn; cần kiểm tra bản chép lời. AI đánh giá nội dung, không đánh giá phát âm, giọng điệu hoặc độ tự tin.
- Giữ giới hạn câu trả lời hiện có: 1200 ký tự. Nếu đạt giới hạn, mic dừng và có cảnh báo rõ ràng về phần văn bản được giữ lại. Phiên mic tự dừng sau 2 phút.
- Mic được dừng khi trang bị ẩn, đóng/rời trang hoặc buổi phỏng vấn kết thúc. Không tự mở lại mic.

## Kiểm tra

- Các file kiểm thử riêng cho giọng nói đã được xóa theo yêu cầu; không dùng lại các lệnh trỏ đến chúng. Bộ kiểm thử hiện tại không bảo đảm đã kiểm tra riêng mic/nhận dạng giọng nói.
- Trên Vercel, `Permissions-Policy` cần có `microphone=(self)` để website được yêu cầu quyền mic. Người dùng vẫn phải cấp quyền trong trình duyệt.
- Kiểm tra thủ công bằng mic thật: thử cấp/từ chối quyền, nói một câu tiếng Việt có thuật ngữ chuyên môn, dừng, sửa bản chép lời, gửi và xác nhận AI tiếp tục hỏi. Thử thêm trên các trình duyệt/điện thoại mục tiêu trước khi demo.

Tham khảo: [MDN SpeechRecognition](https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition).
