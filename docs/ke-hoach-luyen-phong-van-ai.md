# Kế hoạch cải thiện nghiệp vụ Luyện tập phỏng vấn AI của RabbitCV

Khảo sát ngày 13/11/2026. Phạm vi là công cụ tự luyện cho ứng viên trước phỏng vấn thật. Bản đề xuất này dựa trên tài liệu công khai của các sản phẩm và mã RabbitCV hiện tại. Khảo sát xác minh tính năng được công bố, chưa đo chất lượng chấm điểm, độ trễ hay trải nghiệm bên trong các tài khoản trả phí.

## 1. Quyết định sản phẩm

RabbitCV nên giúp ứng viên trả lời được ba câu hỏi sau mỗi buổi: **Tin tuyển dụng đòi hỏi năng lực nào? Câu trả lời của mình đã chứng minh được gì? Mình cần luyện lại câu nào và sửa điểm gì?**

Ưu tiên luồng **Tin tuyển dụng → Năng lực cần luyện → Câu hỏi có mục tiêu → Nhận xét có dẫn chứng → Luyện lại**. Đây là lợi thế của RabbitCV vì tin việc làm và CV đã nằm trong cùng sản phẩm. Cho phép bắt đầu từ một vị trí mẫu hoặc JD do ứng viên nhập khi họ chưa có tin cụ thể. JD là bản mô tả công việc.

Tách hai lựa chọn trên màn thiết lập:

| Lựa chọn | Câu hỏi dành cho người dùng | Các giá trị |
| --- | --- | --- |
| Nội dung luyện | Bạn muốn được hỏi về điều gì? | Sàng lọc, Chuyên môn, Hành vi, Kết hợp |
| Cách luyện | Khi nào bạn muốn xem nhận xét? | Luyện có hướng dẫn sau từng câu, Mô phỏng nhận báo cáo cuối buổi |

Phần cốt lõi cần chứng minh được bằng một buổi 5 câu chạy thật. Bản đầu tiếp tục có tùy chọn 8 và 12 câu nếu bộ câu hỏi đủ chất lượng. Video, chấm nét mặt, chấm giọng và chạy mã trong trình duyệt thuộc phạm vi mở rộng. Điểm chỉ phục vụ người luyện và không dùng để xếp hạng hoặc chuyển trạng thái hồ sơ tuyển dụng.

## 2. So sánh các công cụ tham khảo

| Sản phẩm | Cách thiết lập và luyện tập được công bố | Cách phản hồi được công bố | Áp dụng cho RabbitCV |
| --- | --- | --- | --- |
| Google Interview Warmup | Bộ câu hỏi do chuyên gia chọn theo lĩnh vực, kèm chép lời. Đây là tham chiếu lịch sử. Đường dẫn công cụ tại thời điểm khảo sát chuyển sang trang hướng dẫn chuẩn bị phỏng vấn. | Phân tích từ ngữ theo công việc, từ lặp và ý đã trình bày. | Dùng bộ câu hỏi mẫu có chủ đề rõ, cho xem lại lời đã nói và chỉ ra ý còn thiếu. [Bài công bố của Google](https://blog.google/company-news/outreach-and-initiatives/grow-with-google/interview-warmup/) · [Trang Grow with Google hiện tại](https://grow.google/grow-your-career/articles/interview-tips/) |
| Big Interview PracticeAI | Bắt đầu bằng JD hoặc vị trí mẫu, có thể thêm CV. Câu hỏi thích ứng theo JD, CV và câu trả lời. | Báo cáo có câu hỏi, câu trả lời, điểm từng tiêu chí và gợi ý trả lời. Công cụ Answer Builder hướng dẫn lập dàn ý theo STAR. | Lấy JD làm căn cứ chính, CV là tùy chọn. Trong báo cáo đặt câu trả lời gốc cạnh dẫn chứng, nhận xét và dàn ý để luyện lại. [PracticeAI](https://support.biginterview.com/en/article/practiceai-qxju4/) · [Answer Builder](https://support.biginterview.com/en/article/the-answer-builder-17twbwl/) |
| Yoodli | Chọn vị trí, công ty, câu hỏi có sẵn hoặc tự thêm. AI kết hợp câu hỏi định trước với câu hỏi tiếp nối theo câu trả lời. | Người dùng có thể mở phân tích sau buổi hoặc tiếp tục luyện câu hỏi bổ sung. | Chốt câu hỏi chính theo kế hoạch. Chỉ hỏi sâu khi có một chỗ cụ thể cần làm rõ và ghi nhận câu hỏi sâu vào cùng câu chính. [Hướng dẫn luyện với Yoodli](https://support.yoodli.ai/en/articles/9550465-practice-with-yoodli) |
| Huru | Luyện theo vị trí, JD hoặc tin đăng. Có buổi hội thoại hỏi sâu và cách luyện từng câu. | Phản hồi từng câu, điểm, một điểm cần sửa và phiên bản trả lời tốt hơn. Huru phân biệt nội dung với cách nói. | Cung cấp hai cách luyện và một hành động sửa cụ thể cho mỗi câu. Trước mắt chấm nội dung văn bản người dùng đã kiểm tra, kể cả khi văn bản đến từ mic. [Huru](https://huru.ai/about/) |
| Aced, trước đây là Exponent | Tách các dạng như Behavioral, System Design, SQL, Frontend và luyện câu lẻ với AI. Một số phiên luyện với người khác có trình soạn mã. | Công bố nhận xét theo tiêu chí cho một số loại phiên, tùy hình thức và quyền truy cập. | Tách dạng bài trong Chuyên môn theo năng lực của vị trí. Khởi đầu với phân tích tình huống và giải thích phương án, xem xét bài chạy mã như một loại bài riêng. [Aced Practice](https://www.tryexponent.com/practice) |

Nguyên tắc nghiệp vụ lấy từ phỏng vấn có cấu trúc: câu hỏi gắn với năng lực công việc, thứ tự và tiêu chí có thể giải thích, dùng mốc mô tả chất lượng câu trả lời. OPM phân biệt câu hỏi tình huống giả định và câu hỏi yêu cầu kể lại hành vi đã xảy ra. RabbitCV áp dụng nguyên tắc thiết kế đó cho việc tự luyện. Những nguyên tắc này không xác lập độ tin cậy tuyển dụng cho điểm của AI. [OPM về phỏng vấn có cấu trúc](https://www.opm.gov/policy-data-oversight/assessment-and-selection/other-assessment-methods/structured-interviews/)

Microsoft nêu cách phân tích vấn đề, nói rõ giả định và kiểm thử phương án ở phỏng vấn kỹ thuật. Amazon hướng dẫn dùng STAR để trình bày ví dụ đã trải qua trong phần hành vi. Đây là ví dụ về hai loại bằng chứng khác nhau mà RabbitCV cần chấm. [Microsoft Careers](https://careers.microsoft.com/v2/global/en/hiring-tips/technical-interviewing.html) · [Amazon về phỏng vấn hành vi và kỹ thuật](https://www.amazon.jobs/content/en/how-we-hire/university/data)

## 3. RabbitCV hiện tại và khoảng cách cần lấp

| Hạng mục | Đã có trong mã | Khoảng cách |
| --- | --- | --- |
| Thiết lập | Tên vị trí, cấp độ, hình thức, 5/8/12 câu. Có giải thích, câu mẫu và thang điểm. | Chưa dùng nội dung của một tin tuyển dụng hoặc một bộ năng lực theo nghề. Ví dụ chuyên môn trong giao diện vẫn thiên về phần mềm. |
| Câu hỏi | Có kế hoạch theo nhóm và chủ đề. Server quyết định thứ tự, số câu và điều kiện kết thúc. | Chủ đề còn chung. AI viết câu hỏi theo từng lượt. Chưa khóa danh sách câu hỏi, bối cảnh và tiêu chí theo JD ở đầu phiên. Kiểm tra câu trùng chủ yếu dựa trên khớp văn bản. |
| Hội thoại | Nhập văn bản, mic chép lời để ứng viên sửa trước khi gửi. Câu đang nhập được giữ khi gửi lỗi. | Chưa có quy tắc hỏi sâu, bỏ qua câu, tiếp tục sau tải lại hoặc phân biệt thời điểm hiện phản hồi giữa hai cách luyện. |
| Chấm và tổng kết | Mỗi nhóm có ba tiêu chí, điểm 0–4 kèm giải thích, quy đổi /100. Điểm tổng là trung bình các câu đã đánh giá. Có xác nhận kết thúc sớm. | Mốc 0–4 đang dùng chung. Chưa có mốc riêng theo năng lực, trích đoạn đối chiếu tự động, tỷ lệ bao phủ yêu cầu JD hoặc luồng luyện lại một câu. |
| Vòng đời | React giữ lịch sử và tiến độ trong trang. API nhận hội thoại từ client, kiểm tra vai trò và thứ tự. | Chưa có phiên do server quản lý, kết quả lưu bền, lịch sử luyện hoặc khóa gửi lại để tránh chấm trùng. |
| Nghiệm thu | Có kiểm thử quy tắc, luồng trình duyệt dùng phản hồi mô phỏng và mic ở hai kích thước. | Môi trường DA2 chưa có `GROQ_API_KEY` tại thời điểm rà soát. Chưa xác minh chất lượng câu hỏi và nhận xét qua Groq thật. |

Đối chiếu mã: `shared/interviewPractice.js`, `server/utils/interviewDataSanitizer.js`, `server/routes/aiRoutes.js`, `src/Pages/AiInterview.jsx`, `e2e/interview-practice.spec.js`.

## 4. Quy tắc nghiệp vụ theo hình thức

| Hình thức | Câu hỏi cần tạo | Câu hỏi sâu phù hợp | Nội dung đánh giá |
| --- | --- | --- | --- |
| Sàng lọc | Hỏi về kinh nghiệm liên quan, động lực và hiểu biết công việc. Ví dụ, “Việc nào trong đồ án của bạn liên quan nhất đến trách nhiệm trong tin này?” | “Phần nào do chính bạn phụ trách và nó liên quan thế nào đến vị trí?” | Liên hệ đúng yêu cầu JD, có ví dụ hoặc lý do cụ thể, trả lời rõ trọng tâm. |
| Chuyên môn | Đặt bài toán đặc trưng của nghề với mục tiêu và dữ kiện đủ để giải thích phương án. Ví dụ Frontend, “Danh sách chậm khi lọc, bạn sẽ khoanh vùng và đo lại thế nào?” Ví dụ Chăm sóc khách hàng, “Đơn giao trễ, hệ thống chưa có ngày giao mới, bạn xử lý cuộc gọi và cập nhật khách thế nào?” | Làm rõ giả định, lý do chọn phương án hoặc cách đo kết quả. | Độ đúng của phương án trong bối cảnh đã cho, lập luận và cách kiểm chứng hoặc kiểm soát rủi ro. Công nhận nhiều hướng xử lý hợp lý. |
| Hành vi | Yêu cầu kể một việc đã trải qua. Ví dụ, “Kể lần nhóm bất đồng về phương án và phần việc bạn làm để giải quyết.” | “Bạn trực tiếp nói hoặc làm gì? Sau đó điều gì thay đổi?” | Bối cảnh và nhiệm vụ, hành động cá nhân, kết quả và bài học. Ví dụ học tập hay dự án phù hợp với thực tập sinh. |
| Kết hợp | Giữ ba phần có thứ tự. Đề xuất giữ phân bổ hiện có 5 câu là 1/2/2, 8 câu là 2/3/3, 12 câu là 2/5/5. | Áp dụng quy tắc của câu chính. Không đổi loại câu để bù câu bị bỏ qua. | Dùng tiêu chí của từng phần. Báo số câu được chấm và điểm theo phần bên cạnh điểm tổng. |

Cấp độ ảnh hưởng đến phạm vi bài và kỳ vọng, không chỉ độ dài. Ví dụ cùng năng lực xử lý hiệu năng, thực tập sinh cần nêu cách phân biệt thời gian chờ API và thời gian hiển thị. Senior cần thêm đánh đổi, tác động hệ thống, cách đo và kế hoạch giảm rủi ro. Không dùng ví dụ công việc quá khứ làm điều kiện chấm kỹ thuật nếu câu hỏi đã cho tình huống giả định.

## 5. Luồng hoàn chỉnh đề xuất

1. **Chọn ngữ cảnh.** Nút **Luyện phỏng vấn cho vị trí này** trên tin công khai điền sẵn vị trí và trách nhiệm. Trang luyện độc lập có vị trí mẫu hoặc ô dán JD. Nếu chỉ có tên vị trí, ghi rõ đang luyện theo mẫu chung. Nếu tin đã đóng hoặc bị ẩn trước khi bắt đầu, thông báo và cho chọn vị trí mẫu hay JD thủ công.
2. **Xác nhận nội dung.** Hiện tối đa 3–5 năng lực rút từ JD, mỗi năng lực có phần văn bản JD liên quan. Ứng viên chỉnh hoặc bỏ năng lực trước khi bắt đầu. CV là tùy chọn ở giai đoạn sau. Khi có, ứng viên chọn dữ liệu liên quan như kinh nghiệm, kỹ năng hoặc dự án và xem trước nội dung sẽ gửi AI. Tên, địa chỉ, email và điện thoại không cần cho việc đặt câu.
3. **Chốt buổi luyện.** Chọn cấp độ, hình thức, cách luyện và số câu. Hệ thống lưu phiên bản JD, năng lực và bộ câu hỏi của phiên, gồm mã câu, nhóm, mục tiêu, dữ kiện và tiêu chí. Dùng bộ câu hỏi mẫu đã rà soát cho các vị trí hỗ trợ. AI có thể cá nhân hóa cách hỏi theo JD trong giới hạn các năng lực đã xác nhận. Kiểm tra đủ số câu, đúng nhóm và tránh câu trùng ý trước khi bắt đầu.
4. **Trả lời từng câu.** Hiện một câu chính, tiến độ và ô nhập. Mic tiếp tục tạo bản chép lời có thể sửa. Sau khi gửi, nếu thiếu đúng một thông tin quan trọng, AI có thể hỏi thêm một lần trong cùng năng lực. Câu hỏi sâu không tăng bộ đếm. Trong chế độ mô phỏng, hỏi sâu bằng câu trung tính và giữ điểm, gợi ý đến cuối buổi. Nếu ứng viên chọn **Bỏ qua**, ghi trạng thái riêng và tiếp tục. Chọn **Kết thúc sớm** cần xác nhận.
5. **Xử lý gián đoạn.** Giữ bản nháp khi mất mạng hoặc AI lỗi. Khôi phục phiên khi tải lại. Nếu đã lưu câu trả lời nhưng chưa chấm được, hiển thị **Chờ đánh giá** và cho thử chấm lại câu đó. Không tự gửi lại thao tác đã chấm xong. Kiểm tra quyền sở hữu phiên theo tài khoản, không theo dữ liệu hội thoại client gửi.
6. **Báo cáo.** Hiện số câu đã chấm, bỏ qua, chưa chấm, các năng lực đã được hỏi và năng lực còn thiếu dữ liệu. Mỗi câu mở ra câu hỏi, câu trả lời gốc, câu hỏi sâu, điểm theo tiêu chí, dẫn chứng và một việc cần sửa. Nếu lỗi dịch vụ khi viết tổng kết, vẫn hiển thị điểm và đánh giá từng câu đã có.
7. **Luyện lại.** Nút **Luyện lại câu này** giữ câu và tiêu chí cũ, lưu lượt trả lời mới và so sánh từng tiêu chí. Nút **Luyện năng lực này** dùng câu tương đương khác. Chỉ so điểm khi cùng năng lực và cùng phiên bản tiêu chí. Lịch sử cho phép xem lại và xóa phiên.

## 6. Cách chấm và ví dụ có thể bảo vệ

Giữ thang 0–4 và trọng số đều cho bản đầu. Thêm mốc chấm riêng theo năng lực. Ví dụ, với tiêu chí **Kiểm chứng** của câu tối ưu danh sách:

| Điểm | Bằng chứng cần thấy |
| --- | --- |
| 0 | Không nêu cách kiểm tra hoặc trả lời lệch tiêu chí. |
| 1 | Nói sẽ kiểm tra lại nhưng không nêu đo gì. |
| 2 | Có chỉ số hoặc phép thử cụ thể nhưng thiếu mốc so sánh hay điều kiện đo. |
| 3 | Đo trước và sau cùng điều kiện, nêu tiêu chí chấp nhận. |
| 4 | Đáp ứng mức 3 và kiểm tra thêm tình huống quan trọng hoặc rủi ro phù hợp cấp độ, ví dụ dữ liệu lớn hay kết quả lọc bị sai. |

Ví dụ ứng viên nói: “Em đo thời gian phản hồi API trước và sau khi phân trang.” Có thể chấm Kiểm chứng **2/4**, dẫn chứng từ chính câu trả lời và gợi ý “Đo với cùng bộ lọc và số bản ghi, rồi kiểm tra kết quả lọc vẫn đúng.” Nếu AI đưa trích dẫn không xuất hiện trong nội dung đã gửi, backend bỏ trích dẫn đó hoặc yêu cầu đánh giá lại. Chỗ còn thiếu được ghi là “chưa nêu”. Mẫu dàn ý có thể dùng chỗ trống để ứng viên điền dữ kiện thật.

Điểm câu = tổng điểm tiêu chí ÷ điểm tối đa của các tiêu chí × 100. Điểm tổng = trung bình điểm các câu đã chấm. Ví dụ hai câu đạt 75 và 50 thì báo **63/100, đã đánh giá 2/5 câu**. Các câu bỏ qua, chưa trả lời hoặc lỗi chấm được đếm riêng. Nếu chưa có câu nào được đánh giá, hiển thị trạng thái chưa có điểm. Độ bao phủ là số năng lực đã có câu trả lời được đánh giá trên tổng số năng lực trong kế hoạch, tách khỏi điểm chất lượng.

## 7. Lộ trình triển khai theo ưu tiên

| Thứ tự | Việc thực hiện | Điều kiện hoàn thành |
| --- | --- | --- |
| P0.1 · Ngữ cảnh nghề | Nút luyện từ tin việc làm, JD thủ công, vị trí mẫu. Xây bộ năng lực mẫu cho Frontend, Backend và Chăm sóc khách hàng để bao phủ cả kỹ thuật và phi kỹ thuật. Cho ứng viên xác nhận năng lực. | Cùng hình thức Chuyên môn nhưng hai JD khác nghề tạo bài toán khác nhau. Có thể lần từ câu hỏi về năng lực và đoạn JD. |
| P0.2 · Phiên và câu hỏi | Lưu phiên trong MongoDB, chốt kế hoạch ở đầu phiên, hỗ trợ tiếp tục sau tải lại và chống gửi trùng. Cho chọn Luyện có hướng dẫn hoặc Mô phỏng. Giữ giới hạn tối đa một câu hỏi sâu trên một câu chính. | Buổi 5 câu chạy đúng 1/2/2. Hai lần gửi cùng mã thao tác chỉ ghi một lần. Phiên mô phỏng không trả điểm hay gợi ý cho client trước khi kết thúc. |
| P0.3 · Chấm và luyện lại | Bổ sung mốc chấm theo năng lực, trích dẫn có kiểm tra, báo cáo từng câu và luyện lại một câu. Tách trạng thái lỗi đánh giá khỏi trạng thái buổi luyện. | Điểm tính lại được từ tiêu chí. Câu bỏ qua và chưa chấm được ghi riêng. Lượt luyện lại có thể đối chiếu với lượt đầu. |
| P0.4 · Nghiệm thu Groq và demo | Chạy ca trình duyệt dùng API mô phỏng cho lỗi và trạng thái hiếm. Chạy Groq thật với JD, CV và câu trả lời tổng hợp. Rà chất lượng với người đọc độc lập. | Hoàn thành các tiêu chí mục 8. Có hai kịch bản demo theo nghề và một ca mất mạng. |
| P1 · Cá nhân hóa và lịch sử | Thêm chọn phần CV, xem lịch sử và so sánh tiến bộ theo năng lực. Thêm bài luyện chuyên sâu theo dữ liệu sử dụng thực tế. | CV do ứng viên chọn, có xem trước và có thể bỏ chọn. Điểm giữa các lượt chỉ so khi cùng tiêu chí. |
| P2 · Mở rộng hình thức | Cân nhắc đọc câu hỏi bằng giọng, luyện tiếng Anh hoặc bài thực hành riêng khi đã ổn định chất lượng nội dung. | Mỗi hình thức mới có mục tiêu, tiêu chí và ca kiểm thử riêng. |

Hướng triển khai: tái dùng dữ liệu tin tuyển dụng công khai, bộ lọc nội dung CV và mic hiện có. Tách dữ liệu phiên, câu trả lời và đánh giá khỏi giao diện hội thoại. Mỗi lần gửi có mã thao tác, mỗi câu có mã ổn định, và mọi ghi điểm gắn với phiên bản tiêu chí. Nếu Groq giới hạn hoặc lỗi, giới hạn số lần gọi lại và cho tiếp tục sau. Việc chọn tin hay CV chỉ dùng để chuẩn bị bài luyện.

Đề xuất chính sách lưu cho bản đầu: phiên tạm và báo cáo của phiên tạm có thời hạn 7 ngày. Kết quả chỉ vào lịch sử dài hạn khi người dùng chọn lưu, có nút xóa. Bản đầu cần khôi phục phiên tạm và so sánh hai lượt của cùng một câu. Màn lịch sử nhiều phiên thuộc P1. Xác nhận thời hạn trước khi triển khai. Không lưu âm thanh ở RabbitCV. Dịch vụ nhận dạng của trình duyệt có thể xử lý âm thanh theo thiết lập hiện có. Không ghi transcript hoặc CV vào log, chỉ ghi mã phiên, trạng thái và số liệu vận hành cần thiết. JD, CV và câu trả lời được coi là dữ liệu để phân tích, kể cả khi bên trong có chữ yêu cầu AI đổi quy tắc.

**Quy tắc trạng thái để lập trình và kiểm thử**

| Phạm vi | Trạng thái và cách chuyển |
| --- | --- |
| Buổi luyện | Đang luyện → Hoàn thành khi xử lý hết các câu chính, hoặc Đã kết thúc sớm sau xác nhận. Phiên đang luyện có thể tiếp tục trong thời hạn. Phiên đã kết thúc vẫn xem báo cáo được. |
| Câu hỏi | Chưa trả lời → Chờ bổ sung nếu có câu hỏi sâu → Chờ đánh giá → Đã đánh giá. Nếu chấm lỗi, giữ câu trả lời ở Chờ đánh giá với tùy chọn thử lại. Bỏ qua là trạng thái riêng. |
| Lượt luyện lại | Tạo lượt mới tham chiếu mã câu gốc và phiên bản tiêu chí. Báo cáo gốc giữ nguyên. So sánh hai lượt theo từng tiêu chí. |
| Đồng thời | Server nhận một lần gửi cho mỗi mã thao tác. Nếu nhận lại, trả kết quả đã có hoặc trạng thái đang xử lý. Khi hai tab gửi hai nội dung khác nhau cho cùng một câu, chỉ nhận lần ghi hợp lệ đầu tiên và yêu cầu tab kia tải trạng thái mới. |

## 8. Kế hoạch nghiệm thu và demo

| Kiểm tra | Cách kiểm chứng | Điều kiện đạt đề xuất |
| --- | --- | --- |
| Phân biệt nghiệp vụ | Hai người đọc 30 câu mẫu, có hai nhóm nghề, ít nhất hai cấp độ và đủ ba loại câu. Xem câu và tiêu chí rồi phân loại độc lập. | Ít nhất 27/30 câu được cả hai người xếp đúng nhóm. Không có câu xin dữ liệu nhạy cảm hoặc giả danh câu hỏi thật của doanh nghiệp. |
| Bám JD | Người đọc tìm năng lực và đoạn JD mà câu dựa vào. So sánh câu theo JD với câu dùng vị trí mẫu. | Ít nhất 27/30 câu theo JD có liên hệ cụ thể có thể chỉ ra. Nếu JD thiếu dữ kiện, hệ thống báo hoặc dùng vị trí mẫu có nhãn rõ. |
| Tính nhất quán | Chuẩn bị 12 cặp câu trả lời yếu và tốt hơn theo mốc chấm. Đưa cùng một câu trả lời vào ba lần với cùng câu hỏi, tiêu chí và cấu hình. | Điểm của câu trả lời tốt hơn cao hơn trong ít nhất 10/12 cặp. Ghi mức dao động và rà các tiêu chí chênh trên 1/4. Đây là ngưỡng nghiệm thu nội bộ, không phải chứng nhận độ chính xác. |
| Nhận xét có căn cứ | Kiểm tra trích dẫn khớp transcript, nội dung thiếu được ghi rõ và đề xuất có thể áp dụng. | Mọi trích dẫn hiển thị đều đối chiếu được. Không tự thêm công ty, thành tích, số liệu hay kỹ năng chưa nêu. |
| Trạng thái và quyền | Tải lại, đổi tài khoản, bấm gửi hai lần, mất mạng, hết quota, hết phiên, kết thúc sớm, bỏ qua và xóa lịch sử. | Không trùng câu trả lời hoặc điểm. Khôi phục đúng phiên, giữ bản nháp và phản hồi phù hợp. Tài khoản khác không đọc, sửa hoặc xóa được phiên. |
| Trình duyệt và dịch vụ thật | Chạy desktop và mobile, gõ và dùng mic. Chạy ít nhất một buổi 5 câu hoàn chỉnh với Groq thật và một buổi kết thúc sớm. | Hiện đúng điểm theo cách luyện. Báo cáo đúng số câu và có thể luyện lại. Đo độ trễ, số lần gọi AI và lỗi để chốt giới hạn vận hành. |

**Kịch bản bảo vệ 5 phút**

1. Mở một tin Frontend Intern có yêu cầu React, API và kiểm thử. Bấm luyện và cho hội đồng thấy ba năng lực lấy từ tin.
2. Chọn **Kết hợp · 5 câu**. Chỉ ra kế hoạch 1/2/2. Nêu bằng ví dụ vì sao câu hỏi về động lực thuộc Sàng lọc, câu tối ưu tải danh sách thuộc Chuyên môn, và câu kể lần bất đồng với đồng đội thuộc Hành vi.
3. Trả lời một câu chuyên môn còn thiếu cách đo. Cho xem câu hỏi sâu hoặc lý do điểm Kiểm chứng 2/4, trích đúng câu đã nói.
4. Kết thúc sớm. Cho xem tỷ lệ đã chấm, một nhận xét có dẫn chứng và thao tác **Luyện lại câu này**. So câu trả lời trước và sau bằng cùng tiêu chí.
5. Mở một tin Chăm sóc khách hàng để chứng minh chế độ Chuyên môn thay đổi theo nghề và không mặc định hỏi lập trình.
