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
- OCR & PDF Engine: `pdfjs-dist@6.2.108`, `tesseract.js@7.0.0` (LSTM WASM `tesseract.js-core@7.0.0` + `@tesseract.js-data/vie@1.0.0` & `@tesseract.js-data/eng@1.0.0` `4.0.0_best_int`, giấy phép Apache-2.0).

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
- **Điền các mục CV còn thiếu có xem trước & chọn lọc (BL-09):** Nút **AI điền CV** không bao giờ tự ghi vào bản nháp, lịch sử hoàn tác hay kích hoạt autosave trước khi người dùng xác nhận trong hộp thoại xem trước (`src/Components/ResumeAiFillDialog.jsx`, `src/utils/resumeAiFill.js`). Giao diện phân biệt rõ đề xuất **Từ hồ sơ tài khoản** và **AI đề xuất**, chỉ mặc định tích chọn các ô trống an toàn có nguồn (mọi kỹ năng/ngoại ngữ/chứng chỉ/giải thưởng/kinh nghiệm/số liệu do AI tự tạo đều để chưa chọn kèm cảnh báo **Cần xác nhận**), bỏ hoàn toàn ghép nhầm theo vị trí mảng, kiểm tra lại các sửa đổi mới nhất ngay lúc áp dụng và gộp vào đúng 1 bước **Hoàn tác / Làm lại** (`Ctrl+Z` / `Ctrl+Shift+Z`). Request AI luôn được hủy bằng `AbortController` + generation khi đóng, đổi route hoặc đổi tài khoản, chỉ cho phép **"Thử lại"** thủ công khi lỗi và không gửi PII nhạy cảm thừa lên API.
- **Review toàn bộ CV & điều hướng sửa thủ công (BL-10):** Hộp thoại Radix **Review toàn bộ CV** (`src/Components/ResumeForm.jsx`, `src/utils/resumeReview.js`) hiển thị điểm tổng quan, 5 nhóm tiêu chí, điểm tốt, đề xuất theo mức ưu tiên và mục còn thiếu. Mọi góp ý/mục còn thiếu khớp danh sách 10 mục chuẩn (`Thông tin liên hệ`, `Tiểu sử`, `Kinh nghiệm`, `Học vấn`, `Kỹ năng`, `Dự án`, `Chứng chỉ`, `Ngoại ngữ`, `Giải thưởng`, `Bố cục và ATS`) đều có nút **"Mở mục để sửa"** giúp đóng modal, mở ngăn chỉnh sửa trên mobile (hoặc mở `ResumeLayoutEditor` với `Bố cục và ATS`), cuộn và focus đúng vùng mà không tự ghi đè CV hay tạo lịch sử hoàn tác; mục `"Khác"` hoặc nhãn lạ giữ ở dạng tham khảo chung. Kết quả được kiểm tra schema chặt chẽ, lưu cache trong phiên theo từng CV/tài khoản kèm cảnh báo **"Bản review cũ"** khi CV thay đổi, chỉ gọi lại AI khi bấm **"Review lại"** hoặc **"Thử lại"**, và tự hủy request cũ qua `AbortController` + generation khi đóng, đổi CV hoặc đổi tài khoản.
- Phỏng vấn thử theo vị trí, cấp độ và loại phỏng vấn; AI hỏi từng câu, chấm câu
  trả lời và tổng kết buổi luyện tập.

Trong **Phỏng vấn AI**, ứng viên chọn một hình thức luyện tập:

- **Sàng lọc**: trình bày kinh nghiệm liên quan, động lực và hiểu biết về vị trí. Đánh giá mức liên hệ với công việc, minh chứng và diễn đạt.
- **Chuyên môn**: xử lý tình huống thực tế theo vai trò và cấp độ. Đánh giá độ đúng, lập luận và cách kiểm chứng phương án.
- **Hành vi**: kể một tình huống đã trải qua theo STAR. Đánh giá bối cảnh và nhiệm vụ, hành động của ứng viên, kết quả và bài học.
- **Kết hợp**: lần lượt luyện sàng lọc, chuyên môn, hành vi. Ví dụ buổi 5 câu gồm 1 câu sàng lọc, 2 câu chuyên môn và 2 câu hành vi.

Mỗi tiêu chí được chấm từ 0 đến 4 kèm giải thích. Điểm câu được quy đổi về
100, còn điểm tổng là trung bình các câu đã đánh giá. Khi kết thúc sớm,
các câu chưa trả lời không được tính điểm. Đây là điểm luyện tập.

Ứng viên có thể mở bài luyện từ một tin tuyển dụng, dán mô tả công việc
hoặc chọn vị trí mẫu. Chọn **Luyện có hướng dẫn** để xem nhận xét sau
từng câu, hoặc **Mô phỏng** để xem nhận xét khi kết thúc. Buổi luyện và
báo cáo tạm được giữ trong 7 ngày và có thể xóa trên trang luyện tập.
Máy chủ cần `GROQ_API_KEY` để chấm câu trả lời. Khi chưa cấu hình khóa,
ứng viên vẫn có thể mở bộ câu hỏi mẫu theo yêu cầu đã chọn.

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

### Tự động lưu CV và Bảo vệ điều hướng (BL-08)

Trình chỉnh sửa CV (`src/Pages/Resume.jsx`, `src/hooks/useResumeAutosave.js`, `src/utils/resumeSaveCoordinator.js`, `src/utils/resumeSavePolicy.js`) áp dụng kiến trúc single-flight autosave và điều phối lỗi an toàn:

- **Chỉ tự động lưu khi CV đã có danh tính (`_id`):** Tự động lưu kích hoạt sau `1.200 ms` dừng thao tác đối với CV đã lưu trước đó; bản nháp CV mới (`/resume`) giữ trạng thái chưa lưu cho tới khi người dùng bấm **"Lưu CV"** lần đầu rồi thay URL an toàn sang `/resume/:resumeId` (`{ replace: true }`).
- **Single-flight & bảo toàn sửa đổi mới nhất:** Không gửi request chồng chéo (chặn double-click tạo trùng, xếp hàng thao tác lưu thủ công khi đang autosave), chỉ đánh dấu đã lưu đối với ảnh chụp được gửi đi, gộp các thay đổi mới phát sinh trong lúc request đang chạy để lưu tiếp, và giữ nguyên con trỏ/lịch sử hoàn tác-làm lại.
- **Trạng thái, thử lại có giới hạn & bảo mật:** Hiển thị trạng thái rõ ràng (`Chưa lưu`, `Đang tự động lưu...`, `Đang lưu...`, `Đã lưu lúc ...`, nút **"Thử lại"** khi thất bại), xác thực phản hồi máy chủ (`resume._id` hợp lệ khi tạo và khớp ID khi cập nhật, không coi JSON hỏng/timeout/abort là đã lưu), chỉ tự thử lại tối đa 1 lần cho lỗi tạm thời khi cập nhật CV đã có `_id` (giữ bản chỉnh sửa mới nhất và báo lỗi rõ ràng nếu tạo mới `!_id` thất bại), tự động phục hồi khi hết tạm dừng (`ConfirmPopUp`/`AI Fill`) hoặc khi có kết nối `online` lại (riêng CV chưa có `_id` hướng dẫn bấm **"Lưu CV"** thủ công), giữ dữ liệu trên màn hình kèm cảnh báo `role="alert"` khi gặp `DUPLICATE_RESUME_TITLE`/lỗi dữ liệu, hủy request cũ theo generation/tài khoản, và **không** lưu bản nháp PII vào `localStorage`.
- **Bảo vệ rời trang SPA & trình duyệt:** `src/Pages/App.jsx` sử dụng React Data Router (`createBrowserRouter` + `RouterProvider`) giữ nguyên toàn bộ route/layout/`RoleAccessGuard`; `Resume.jsx` dùng `useBlocker` hiển thị đúng một hộp thoại `ConfirmPopUp` khi rời trang (bao gồm nút **Thư viện**, chuyển CV hoặc trình duyệt **Back/Forward**) lúc còn thay đổi chưa lưu hoặc đang lưu, kết hợp `beforeunload` cho đóng/tải lại tab, đồng thời tự động mở khóa khi chuyển trạng thái mất quyền/đăng xuất.

## Nhập CV từ PDF & Mô-đun OCR cục bộ (BL-07B)

RabbitCV hỗ trợ ứng viên (vai trò `employee`) nhập hồ sơ từ tệp PDF có sẵn để tạo nhanh bản CV trên website:

- **Điểm truy cập:** Tại trang **CV của tôi** (`/ResumeSelection`), ứng viên bấm nút **"Nhập CV từ PDF"** để mở hộp thoại tải tệp. Chức năng yêu cầu tài khoản ứng viên đã đăng nhập, không phục vụ tài khoản vãng lai.
- **Quy tắc bảo mật & riêng tư:** Toàn bộ quá trình trích xuất văn bản và nhận diện OCR diễn ra **hoàn toàn cục bộ trên trình duyệt người dùng** qua Same-Origin `/ocr/*` (không gửi tệp hoặc dữ liệu PII sang bất kỳ cloud API hay máy chủ OCR bên thứ ba nào; tuyệt đối không ghi log PII).
- **Chính sách CSP sản xuất (Production CSP):** Được định tuyến phân tầng trong `vercel.json`: phạm vi worker `/ocr/(.*)` được cấp CSP hẹp `script-src 'self' 'wasm-unsafe-eval'` để WebAssembly biên dịch hợp lệ; tài liệu chính `/((?!ocr/).*)` được bảo vệ nghiêm ngặt với `script-src 'self'` (không eval).
- **Kiến trúc phân tầng 2 cấp (Tiered Local Pipeline):**
  - **Tầng 1 (Direct PDF Text):** Ưu tiên hàng đầu — sử dụng `pdfjs-dist` trích xuất trực tiếp lớp văn bản số, tự động tái tạo thứ tự đọc 1 cột / 2 cột và loại bỏ các lớp chữ giả mạo/chỉ có số trang ("Page 2 of 2").
  - **Tầng 2 (Local OCR):** Đối với các trang tài liệu quét ảnh (scanned page) hoặc thiếu lớp văn bản số, hệ thống tự động kích hoạt bộ nhận diện quang học cục bộ `tesseract.js@7.0.0` (`tesseract.js-core@7.0.0` LSTM WASM) cùng dữ liệu ngôn ngữ tiếng Việt & tiếng Anh (`@tesseract.js-data/vie@1.0.0` và `@tesseract.js-data/eng@1.0.0` phiên bản `4.0.0_best_int`, giấy phép `Apache-2.0`).
  - *Lưu ý thuật ngữ độ tin cậy:* Chỉ số phần trăm hiển thị (ví dụ `~89%`) là điểm tin cậy ước tính nội tại của engine Tesseract (heuristic engine confidence), không phải tỷ lệ đo lường độ chính xác ký tự theo ground truth thực nghiệm (CER/WER).
  - *Hạn chế trang lai:* Với trang đã có đủ lớp văn bản số đạt chuẩn (`meaningfulCharCount >= 80`), hệ thống ưu tiên text gốc và không quét OCR các hình ảnh tĩnh chèn trong trang nhằm tiết kiệm CPU và pin thiết bị.
- **Giới hạn tệp hỗ trợ:**
  - Định dạng: Tệp PDF (`.pdf`), kiểm tra MIME và magic bytes `%PDF-`.
  - Dung lượng tối đa: $\le 5\text{ MB}$ (kiểm tra metadata ngay trước khi đọc buffer nhị phân).
  - Số trang tối đa: $\le 3$ trang A4 (từ chối tệp trống hoặc $> 3$ trang).
  - Không hỗ trợ tệp PDF được đặt mật khẩu hoặc mã hóa (`/Encrypt`).
  - Giới hạn phân giải & bộ nhớ render: Kích thước cạnh dài tối đa 1.800 px, ngân sách tối đa 2.400.000 pixel/trang và 6.600.000 pixel toàn bộ tài liệu. Toàn bộ các bước chờ đều được chặn bởi deadline tổng thời gian.
- **Giao diện So sánh & Biên soạn trước khi tạo (Preview/Edit/Confirm):**
  - Bắt buộc người dùng xem trước và xác nhận trước khi tạo bản ghi CV trong cơ sở dữ liệu.
  - Hiển thị thanh tiến trình chi tiết và huy hiệu nguồn theo từng trang (`Trang X: Văn bản gốc (PDF)` hoặc `Trang X: Nhận diện ảnh quét (OCR ~độ tin cậy%)`).
  - Khung xem trước văn bản gốc (`data-ocr-raw-text`) đặt cạnh biểu mẫu phân mục đã bóc tách (thông tin cá nhân, vị trí ứng tuyển, liên hệ, kinh nghiệm, học vấn, kỹ năng, dự án, chứng chỉ).
  - Cảnh báo các trường chưa rõ ràng (uncertain fields) hoặc dòng chữ chưa phân mục (unmapped lines) với nút đưa vào mục thông tin bổ sung.
  - Cho phép người dùng trực tiếp chỉnh sửa tiêu đề, mẫu thiết kế, số trang và nội dung trước khi bấm **"Xác nhận và Tạo CV"**.
  - Khóa gửi lặp (double-submit protection), hủy request lưu khi đóng modal/chuyển tài khoản, và bảo lưu dữ liệu bản nháp khi phát hiện tên CV bị trùng (`400 DUPLICATE_RESUME_TITLE`) hoặc lỗi kết nối (không tự động POST lại khi thất bại).
  - *Trạng thái:* Đã được nghiệm thu xác minh cục bộ (Local verification accepted 10/11/2026, Job `2883e33f-fc35-4a9c-b6ef-3dff4ebc0272`): Đã vượt qua kiểm tra hồi quy độc lập (late loader destroy once, hung cleanup timeout, cleanup rejection caught, production CSP scan/mixed OCR, overlap file selection, SPA navigation cancel và 73/73 E2E tests với `--retries=0`). Lưu ý: Môi trường deploy thực tế trên Vercel và cơ sở dữ liệu live MongoDB vẫn chưa được xác minh (unverified).

### Tìm kiếm, Lọc, Sắp xếp và Phân trang Việc làm Công khai (Public Jobs)

Hệ thống danh sách việc làm (`/AllJobs` và `/Jobs`) được tái cấu trúc toàn diện theo kiến trúc server-side query và đồng bộ canonical URL:

- **Hợp đồng truy vấn an toàn (`shared/jobQueryPolicy.js`):**
  - Kiểm tra và xác thực nghiêm ngặt các tham số scalar (`keyword` hoặc `q`, không nhận đồng thời cả hai; `location`, `category`, `sort` thuộc `newest`/`salary`/`match`, `page` >= 1, `limit` từ 1 đến 50, `companyId` đúng định dạng ObjectId 24 ký tự hex).
  - Tham số `workTypes` chỉ chấp nhận chuỗi phân tách bởi dấu phẩy (tối đa 200 ký tự trước khi tách) với các giá trị hợp lệ (`full-time`, `intern`, `remote`, `part-time`), từ chối mảng, object, tham số lặp hoặc giá trị lạ (HTTP 400).
  - Bảo toàn nguyên vẹn ký tự đặc biệt như `C++`, `.NET` khi escape regex và chuẩn hóa Unicode NFC trước khi dựng `buildVietnameseRegexPattern`; ánh xạ alias địa danh (`LOCATION_ALIASES`, `resolveCanonicalLocation`) và chuẩn hóa giá trị lọc hợp lệ (`VALID_CATEGORIES`, `VALID_WORK_TYPES`).
  - Chia sẻ `parsePublicJobsSearchParams` giữa server và frontend để phát hiện URL chia sẻ sai định dạng trên UI.
- **Bảo toàn phạm vi công khai & Pipeline Aggregation (`server/services/publicJobsService.js`):**
  - Thực thi bất biến `publicJobsFilter(now)` và ép kiểu BSON `mongoose.Types.ObjectId` tường minh cho `companyId` trong `$match` của `JobModel.aggregate(pipeline)` (không dùng fallback `find()`/JS sort).
  - Lược bỏ các trường nặng (`description`, `requirements`, `benefits`) qua projection trong `$facet`.
  - Chuẩn hóa lương `sort=salary` theo văn phạm neo toàn chuỗi hàng tháng dùng chung (`SALARY_MILLION_REGEX_SOURCE`, `SALARY_VND_REGEX_SOURCE`, `$regexFind` + `$convert` với `onError: null`, không dùng `$regexFindAll`/`$toInt`): chỉ nhận giá trị đơn dương hoặc dải tăng dần 2 đầu mút (`0 < lo <= hi <= 10 tỷ VND`) gắn trực tiếp với đơn vị triệu (`triệu`/`tr`/`m`, có thể kèm `VND`/`đ`) hoặc VND (`VND`/`đ`) và hậu tố chu kỳ tháng tùy chọn (`/tháng`, `/month`, `/th`) vào nhóm xếp hạng chính (`__salaryBucket: 1`); mọi chuỗi kèm chú thích/giờ làm (`20 triệu/tháng (40 giờ/tuần)`), số âm/0 (`-20 triệu`, `0-20 triệu`), dải giảm dần hoặc có đầu vượt ngưỡng (`50-30 triệu`, `20-999999 triệu`), dấu ngăn cách lẫn lộn (`10.000,500 VND`), chu kỳ không phải tháng (`/năm`, `/tuần`, `/giờ`), ngoại tệ (USD...), lương thỏa thuận hoặc thiếu đơn vị đều rơi về nhóm phụ (`__salaryBucket: 0`) ổn định theo `createdAt` và `_id`. Chế độ `sort=match` công khai sử dụng độ dài `tags` như heuristic xếp hạng khi chưa có ngữ cảnh hồ sơ cá nhân.
  - Khai báo compound index trên `JobSchema`: `{ status, approvalStatus, deletedAt, isAdminHidden, createdAt: -1 }` và `{ companyId, createdAt: -1 }`.
- **Đồng bộ Canonical URL & Trạng thái UI (`src/Pages/AllJobs.jsx`, `src/Pages/Jobs.jsx`, `src/hooks/usePublicJobs.js`):**
  - `useSearchParams()` là nguồn sự thật duy nhất (loại bỏ `location.state.searchKeyword` trên `/AllJobs`). Khi URL chia sẻ sai tham số, UI hiển thị cảnh báo `role="alert"` có nút đặt lại mặc định và không gọi `/api/jobs`.
  - `placeholderData` chỉ giữ danh sách cũ khi chuyển trang trên cùng bộ lọc/sort/limit/companyId; khi đổi bộ lọc, card cũ và tổng số cũ được ẩn thay bằng skeleton tải trang; điều chỉnh trang vượt ngưỡng chỉ thực hiện với `{ replace: true }` sau khi nhận phản hồi khớp request hiện tại (`isMatchingSuccess`).
  - `/Jobs` điều hướng SPA sang `/AllJobs` bảo lưu toàn bộ tham số tìm kiếm đã chọn.
- **Tối ưu hóa hook TanStack Query (`src/hooks/usePublicJobs.js`):**
  - Khóa truy vấn chuẩn tắc tiền tố `['public-jobs']`, tích hợp `AbortSignal` hủy request thừa khi gõ nhanh, sử dụng `requestSignature` + `isMatchingSuccess` và `placeholderData` có điều kiện.
  - Loại bỏ polling vô điều kiện 15s gây lãng phí băng thông; giới hạn truy vấn việc làm liên quan trên `JobDetail.jsx` (`limit=8`) và `PublicProfile.jsx` (`limit=12`).
- *Trạng thái kiểm tra:* Đã kiểm tra cục bộ với ESLint, Node unit/HTTP aggregate-evaluator test (`test/publicJobs.test.js`), production build (`vite build`) và Playwright E2E API mock (`e2e/jobs-search.spec.js` `TC-01`..`TC-11`, `e2e/job-visibility.spec.js` với `--retries=0`). Lưu ý: Môi trường live MongoDB Atlas và deploy production Vercel chưa được kiểm thử trực tiếp (unverified).

## Kiểm tra project

```bash
npm run lint
npm test
npm run build
```

Kiểm thử âm thanh phỏng vấn (tách độc lập khỏi test runner):

```bash
npm run qa:voice
```

Kiểm thử trình duyệt bằng Playwright dùng API mock, không kết nối MongoDB hoặc
Groq production. Lệnh sẽ tự khởi động và dừng Vite; máy cần cài Google Chrome và tiện ích Poppler (`pdftoppm`) nếu chạy kiểm tra chuyển đổi hình ảnh PDF:

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

- Tự động lưu CV & bảo vệ điều hướng (`test/resumeAutosave.test.js`, `e2e/cv-editing.spec.js`): kiểm tra debounce 1,2 giây chỉ chạy sau khi có `_id`, chống tạo trùng khi bấm lưu nhanh, single-flight & gộp sửa đổi trong lúc đang lưu, xử lý `DUPLICATE_RESUME_TITLE`/500/`Thử lại`/offline-online, hủy phản hồi cũ theo generation/tài khoản, `useBlocker` `ConfirmPopUp` (bao gồm Back/Forward trình duyệt), `beforeunload` và chuyển hướng khi mất quyền/vai trò.
- Nhập CV từ PDF và OCR phân tầng cục bộ: kiểm tra định dạng, kích thước, magic bytes, trích xuất văn bản trực tiếp (Tier 1), nhận diện ảnh quét (Tier 2 OCR), khử trùng lặp header/footer, bảo toàn bản nháp khi trùng tên và chống double-click.
- Xuất PDF có lớp văn bản vector (selectable/searchable text layer) cho hệ thống ATS và người dùng.
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
