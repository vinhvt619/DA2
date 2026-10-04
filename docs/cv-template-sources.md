# Nguồn tham khảo của 7 mẫu CV bổ sung

Các mẫu bổ sung được sửa ngày 03/10/2026 để dựa trên mẫu công khai của tác giả thực tế. Không dùng ImageGen, hình ảnh CV do AI sinh hoặc thiết kế không có nguồn. Đây là **bản chuyển thể sang React/CSS của RabbitCV**, không phải renderer LaTeX/JSON Resume nguyên bản, không phải sản phẩm được các tác giả nguồn bảo trợ.

| Mã lưu trong dữ liệu | Tên trước đây | Mẫu tham khảo và tác giả | Bản xem trước | Giấy phép nguồn |
| --- | --- | --- | --- | --- |
| executive | Điều hành | [Awesome-CV](https://github.com/posquit0/Awesome-CV), Byungjin Park (posquit0) | [PDF](https://github.com/posquit0/Awesome-CV/blob/master/examples/resume.pdf) | [LPPL-1.3c](https://github.com/posquit0/Awesome-CV/blob/master/LICENCE) |
| timeline | Dòng thời gian | [AltaCV](https://github.com/liantze/AltaCV), LianTze Lim | [PDF mẫu](https://github.com/liantze/AltaCV/blob/main/sample.pdf) | [LPPL-1.3c, thông báo trong class](https://github.com/liantze/AltaCV/blob/main/altacv.cls) |
| editorial | Biên tập | [ModernCV Banking](https://github.com/xdanaux/moderncv), Xavier Danaux | [PDF banking/red](https://github.com/xdanaux/moderncv/blob/master/examples/template_banking_red.pdf) | [LPPL-1.3c, thông báo trong class](https://github.com/xdanaux/moderncv/blob/master/moderncv.cls) |
| technology | Công nghệ | [Deedy Resume OpenFonts](https://github.com/deedy/Deedy-Resume), Debarghya Das | [PDF](https://github.com/deedy/Deedy-Resume/blob/master/OpenFonts/deedy_resume-openfont.pdf) | [Apache-2.0](https://github.com/deedy/Deedy-Resume/blob/master/LICENSE) |
| graduate | Sinh viên | [Jake’s Resume](https://www.overleaf.com/latex/templates/jakes-resume/syzfjbzwjncs), Jake Gutierrez; dựa trên mẫu của Sourabh Bajaj | [PDF](https://www.overleaf.com/latex/templates/jakes-resume/syzfjbzwjncs.pdf) | [MIT, thông báo trong mã nguồn](https://github.com/jakegut/resume/blob/master/resume.tex) |
| nordic | Bắc Âu | [JSON Resume Even](https://github.com/rbardini/jsonresume-theme-even), Rafael Bardini | [Demo](https://jsonresume-theme-even.rbrd.in/) | [MIT](https://github.com/rbardini/jsonresume-theme-even/blob/main/LICENSE) |
| portfolio | Hồ sơ sáng tạo | [Twenty Seconds CV](https://github.com/spagnuolocarmine/TwentySecondsCurriculumVitae-LaTex), Carmine Spagnuolo | [PDF](https://github.com/spagnuolocarmine/TwentySecondsCurriculumVitae-LaTex/blob/master/Twenty-Seconds_cv.pdf) | [MIT](https://github.com/spagnuolocarmine/TwentySecondsCurriculumVitae-LaTex/blob/master/LICENSE) |

## Đặc điểm lấy từ mẫu gốc

- **Awesome-CV:** một cột, tên căn giữa với độ đậm khác nhau, chức danh đỏ, tiền tố tiêu đề đỏ và đường kẻ nối tiếp tiêu đề.
- **AltaCV:** hai cột khoảng 60/40 trên nền trắng, ảnh tròn phía trên bên phải, tiêu đề đỏ trầm, đường kẻ vàng nhạt và nét đứt giữa các mục kinh nghiệm.
- **ModernCV Banking (red):** chữ serif, tên và chức danh đặt cạnh nhau ở giữa đầu trang, màu đỏ nhạt và đường kẻ mảnh dưới các mục.
- **Deedy OpenFonts:** tên lớn nhẹ nét, đường phân cách ngang, hai cột bất đối xứng với học vấn/kỹ năng bên trái và kinh nghiệm/dự án bên phải; màu đen/xám.
- **Jake’s Resume:** một cột đen trắng, tên serif căn giữa, thông tin liên hệ ngang, học vấn trước kinh nghiệm, tiêu đề kiểu small caps với đường kẻ đen.
- **Even:** đầu trang xám nhạt, nhãn các mục ở một cột hẹp căn phải bên trái và nội dung bên phải, chữ sans-serif và liên kết xanh.
- **Twenty Seconds:** cột danh tính xám bên trái có ảnh tròn, tên xanh, thông tin cá nhân/tóm tắt/kỹ năng trong cột phụ; tiền tố tiêu đề cột nội dung nền xanh.

## Những thay đổi của bản chuyển thể RabbitCV

- Viết lại renderer React/CSS tại `src/Components/ResumePreview.jsx` và `src/Components/AdditionalResumeTemplates.css`; không đưa engine LaTeX hoặc gói theme JSON Resume vào runtime.
- Dùng các trường dữ liệu CV sẵn có, tiêu đề tiếng Việt, mục tự tạo, nội dung HTML đã làm sạch và bố cục người dùng đã lưu. Không sao chép tên, thông tin cá nhân, ảnh hoặc nội dung CV của tác giả nguồn.
- Dùng font hệ thống thay vì nhúng các bộ font gốc; kích thước chữ, khoảng cách và tỷ lệ được điều chỉnh để phù hợp cơ chế co nội dung một trang A4 hiện có. Không cam kết giống bản gốc từng pixel hoặc điểm ATS.
- Mẫu một cột vẫn hiển thị các mục người dùng từng đặt ở `sidebar` theo một khối tiếp nối phía dưới; không xóa dữ liệu hay tự đổi thứ tự đã lưu. Mẫu Even dùng cột nhãn, không phải cột phụ chứa kỹ năng riêng.
- Giữ nguyên mã mẫu để CV cũ/API/MongoDB không bị đổi định danh. Tên mới và metadata nguồn dùng chung tại `shared/resumeTemplates.js`.
- Link xem mẫu gốc, tác giả và giấy phép hiển thị ngoài trang giấy ở trình chọn mẫu và thư viện. Không chèn link tham khảo vào PDF của người dùng.
- Giấy phép và ghi nhận nguồn được giữ trong `docs/licenses/`. Thông tin này chỉ áp dụng cho nguồn/bản chuyển thể tương ứng, không tự thay giấy phép toàn bộ dự án.

Ghi nhận bản quyền nguồn Deedy: Copyright 2014 Debarghya Das, Apache License 2.0. Mã chuyển thể có tên khác với các class LaTeX gốc và các thay đổi được mô tả ở trên; các tác giả nguồn không chịu trách nhiệm hỗ trợ bản RabbitCV.

Universal Resume của WebPraktikos không được chọn vì bản giấy phép hiện tại có giới hạn phi thương mại; Even là nguồn thay thế đã đối chiếu.

## Kiểm tra

Các file `resumeTemplates.test.js` và `resume-layout.spec.js` đã được xóa theo yêu cầu. Bộ kiểm thử còn lại chạy bằng `npm run test:unit` và `npm run test:e2e -- --workers=1`, nhưng không thay thế toàn bộ phạm vi kiểm tra riêng của các file đã xóa. Khi đổi typography/layout hoặc triển khai, cần kiểm tra thủ công từng mẫu: lưu/mở lại, mục tùy chỉnh, không tràn A4, PDF/in và link nguồn nằm ngoài trang giấy.
