from __future__ import annotations

import html
import math
import os
import textwrap
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable

from PIL import Image, ImageDraw, ImageFont
from docx import Document
from docx.enum.section import WD_SECTION
from docx.enum.table import WD_CELL_VERTICAL_ALIGNMENT, WD_TABLE_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_BREAK, WD_LINE_SPACING
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Cm, Inches, Pt, RGBColor
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_LEFT
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    Image as RLImage,
    ListFlowable,
    ListItem,
    LongTable,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "bao-cao" / "use-case"
DIAGRAM_DIR = OUT / "diagrams"
QA_DIR = OUT / "qa"

FONT_REGULAR = Path(r"C:\Windows\Fonts\arial.ttf")
FONT_BOLD = Path(r"C:\Windows\Fonts\arialbd.ttf")

INK = "172033"
MUTED = "5F6B7A"
VIOLET = "6C4CF1"
VIOLET_LIGHT = "EEEAFE"
BLUE = "2563EB"
BLUE_LIGHT = "EAF2FF"
GREEN = "16A34A"
GREEN_LIGHT = "EAF8EF"
ORANGE = "EA580C"
ORANGE_LIGHT = "FFF1E8"
GRAY_LIGHT = "F4F6F9"
LINE = "60708A"


@dataclass
class UseCase:
    id: str
    name: str
    actor: str
    supporting: str
    goal: str
    trigger: str
    pre: list[str]
    post: list[str]
    main: list[str]
    alt: list[str]
    errors: list[str]
    relations: str
    evidence: str


USE_CASES = [
    UseCase(
        "UC-01", "Đăng ký tài khoản", "Khách", "MongoDB",
        "Tạo tài khoản ứng viên hoặc doanh nghiệp để sử dụng các chức năng theo vai trò.",
        "Khách chọn Đăng ký và gửi tên đăng nhập, email, mật khẩu, vai trò.",
        ["Người dùng chưa đăng nhập.", "Tên đăng nhập và email chưa tồn tại."],
        ["Mật khẩu được băm trước khi lưu.", "Ứng viên ở trạng thái active; doanh nghiệp ở trạng thái pending và chờ quản trị viên xác minh."],
        ["Người dùng mở trang đăng ký.", "Chọn loại tài khoản: ứng viên hoặc doanh nghiệp.", "Nhập tên đăng nhập, email và mật khẩu.", "Hệ thống kiểm tra dữ liệu bắt buộc và trùng lặp.", "Hệ thống băm mật khẩu bằng bcrypt.", "Hệ thống tạo User với vai trò tương ứng.", "Hệ thống thông báo đăng ký thành công."],
        ["Nếu vai trò không hợp lệ, hệ thống mặc định tạo tài khoản ứng viên.", "Tài khoản doanh nghiệp được tạo ở trạng thái chờ xác minh."],
        ["Thiếu trường bắt buộc: trả lỗi 400.", "Tên đăng nhập hoặc email đã tồn tại: từ chối tạo tài khoản.", "Lỗi cơ sở dữ liệu: trả thông báo lỗi chung."],
        "Không có include/extend bắt buộc.",
        "POST /api/register; User.role, status, companyVerificationStatus. Trạng thái: đã triển khai."
    ),
    UseCase(
        "UC-02", "Đăng nhập và đăng xuất", "Ứng viên, Doanh nghiệp, Quản trị viên", "JWT, cookie HTTP-only",
        "Xác thực người dùng, duy trì phiên và điều hướng đúng khu vực theo vai trò.",
        "Người dùng gửi tên đăng nhập và mật khẩu hoặc chọn đăng xuất.",
        ["Tài khoản đã tồn tại.", "Máy chủ và cơ sở dữ liệu đang hoạt động."],
        ["Đăng nhập thành công tạo cookie JWT có thời hạn 1 ngày hoặc 30 ngày khi ghi nhớ.", "Đăng xuất xóa cookie token và trạng thái người dùng phía giao diện."],
        ["Người dùng nhập thông tin đăng nhập.", "Hệ thống tìm tài khoản và so khớp mật khẩu đã băm.", "Hệ thống kiểm tra trạng thái khóa.", "Hệ thống ký JWT chứa id, username, email và role.", "Hệ thống đặt cookie và trả thông tin người dùng an toàn.", "AuthContext lưu trạng thái phiên và RoleAccessGuard điều hướng theo vai trò."],
        ["Nếu chọn Ghi nhớ đăng nhập, token có thời hạn 30 ngày; nếu không là 1 ngày.", "Khi tải lại trang, AuthContext gọi /api/me một lần để xác nhận phiên."],
        ["Thiếu thông tin hoặc sai mật khẩu: trả lỗi 400.", "Tài khoản bị khóa: trả lỗi 403.", "Token thiếu/hết hạn: các API bảo vệ trả 401."],
        "Các Use Case cần xác thực đều phụ thuộc UC-02 như tiền điều kiện.",
        "POST /api/login, GET /api/me, POST /api/logout; AuthContext; RoleAccessGuard. Trạng thái: đã triển khai."
    ),
    UseCase(
        "UC-03", "Quản lý hồ sơ và bảo mật", "Ứng viên, Doanh nghiệp", "MongoDB",
        "Cập nhật thông tin cá nhân/doanh nghiệp, email, số điện thoại, PIN và mật khẩu.",
        "Người dùng mở trang Hồ sơ hoặc Cài đặt bảo mật và lưu thay đổi.",
        ["Người dùng đã đăng nhập."],
        ["Thông tin hợp lệ được lưu vào User.", "Mật khẩu và PIN được băm; dữ liệu nhạy cảm không xuất hiện trong phản hồi."],
        ["Hệ thống tải thông tin người dùng hiện tại.", "Người dùng chỉnh sửa trường phù hợp với vai trò.", "Hệ thống kiểm tra email/số điện thoại không trùng.", "Hệ thống làm sạch và cập nhật dữ liệu.", "Hệ thống trả hồ sơ đã cập nhật và làm mới AuthContext."],
        ["Người dùng có thể xóa PIN bằng cách gửi giá trị rỗng.", "Đổi mật khẩu yêu cầu nhập đúng mật khẩu cũ.", "Doanh nghiệp có thêm ngành nghề, quy mô, website, mô tả, năm thành lập và mã số thuế."],
        ["Email hoặc số điện thoại đã được dùng: trả lỗi 400.", "Mật khẩu cũ không đúng: không thay đổi mật khẩu.", "Phiên hết hạn: yêu cầu đăng nhập lại."],
        "Có thể xem là nhóm tổng quát của cập nhật hồ sơ, cập nhật bảo mật và đổi mật khẩu.",
        "PUT /api/user/profile, /api/user/security, /api/user/password. Trạng thái: đã triển khai."
    ),
    UseCase(
        "UC-04", "Quản lý CV", "Ứng viên", "MongoDB",
        "Tạo mới, chỉnh sửa, chọn mẫu, lưu và xóa CV thuộc sở hữu của ứng viên.",
        "Ứng viên mở danh sách CV hoặc trình soạn CV.",
        ["Ứng viên đã đăng nhập."],
        ["CV được tạo/cập nhật/xóa trong collection Resume.", "CV tải lên tạm thời có isVirtual=true không xuất hiện trong danh sách CV thường."],
        ["Hệ thống tải danh sách CV không phải CV ảo của người dùng.", "Ứng viên tạo mới hoặc mở CV thuộc sở hữu.", "Nhập thông tin cá nhân, tiểu sử, kinh nghiệm, học vấn, kỹ năng và các mục bổ sung.", "Chọn một trong các mẫu CV hợp lệ.", "Hệ thống làm sạch rich text, liên kết và dữ liệu mô tả.", "Hệ thống kiểm tra tên CV không rỗng, không trùng.", "Hệ thống tạo mới hoặc cập nhật Resume."],
        ["Ứng viên có thể xóa CV của chính mình.", "Khi cập nhật, hệ thống dùng cùng endpoint POST /api/resume với _id hợp lệ."],
        ["Tên CV trống/trùng hoặc mẫu không hợp lệ: trả lỗi 400.", "CV không thuộc người dùng: trả 404 thay vì để lộ dữ liệu.", "ID không hợp lệ: trả lỗi 400."],
        "UC-05 mở rộng UC-04; UC-06 mở rộng UC-04.",
        "GET /api/resumes, GET /api/resume/:id, POST /api/resume, DELETE /api/resume/:id. Trạng thái: đã triển khai."
    ),
    UseCase(
        "UC-05", "Xem trước và tải CV", "Ứng viên", "Trình duyệt/in PDF",
        "Kiểm tra bố cục CV và xuất bản PDF từ nội dung đang soạn hoặc đã lưu.",
        "Ứng viên chọn xem trước hoặc tải/in CV.",
        ["Ứng viên đang chỉnh sửa hoặc đã có một CV."],
        ["Bản xem trước hiển thị đúng mẫu; người dùng có thể tạo bản PDF phía trình duyệt."],
        ["Hệ thống dựng ResumeTemplate theo dữ liệu và mẫu đã chọn.", "Ứng viên xem trước toàn bộ trang A4.", "Người dùng chọn tải/in.", "useResumePrint chuẩn bị vùng in và gọi cơ chế in của trình duyệt.", "Người dùng chọn Save as PDF trong hộp thoại in."],
        ["Có thể thay đổi tỷ lệ xem mà không làm thay đổi dữ liệu CV.", "Có thể xem trước trước khi lưu; dữ liệu vẫn ở trạng thái giao diện cho đến khi UC-04 lưu."],
        ["Trình duyệt chặn hộp thoại in hoặc font tải chậm: người dùng thử lại.", "Nội dung quá dài có thể tạo nhiều trang A4."],
        "<<extend>> UC-04 vì xem/tải là thao tác tùy chọn, không bắt buộc mỗi lần lưu.",
        "ResumePreview, ResumeTemplate, useResumePrint, kiểm thử A4. Trạng thái: đã triển khai."
    ),
    UseCase(
        "UC-06", "Hỗ trợ CV bằng AI", "Ứng viên", "Dịch vụ AI",
        "Sinh nội dung mẫu, cải thiện tiểu sử và review CV có cấu trúc mà không thay người dùng quyết định.",
        "Ứng viên chọn Điền bằng AI, Cải thiện hoặc Review CV.",
        ["Ứng viên đã đăng nhập.", "Dịch vụ AI được cấu hình và còn hạn mức.", "Có đủ ngữ cảnh nghề nghiệp theo từng thao tác."],
        ["Kết quả AI được trả về dạng có cấu trúc và làm sạch.", "Chỉ khi người dùng chấp nhận/lưu thì dữ liệu mới trở thành nội dung CV."],
        ["Giao diện thu thập phần CV cần xử lý.", "Hệ thống loại bỏ dữ liệu không cần thiết và chuẩn hóa ngữ cảnh.", "Máy chủ kiểm tra quyền sở hữu CV nếu có resumeId.", "Hệ thống gửi yêu cầu có schema tới dịch vụ AI.", "Kết quả được kiểm tra, làm sạch và trả kèm cảnh báo tham khảo.", "Người dùng xem, chấp nhận hoặc bỏ qua gợi ý."],
        ["Cải thiện tiểu sử có các chế độ generate/improve tùy dữ liệu đầu vào.", "Review CV đánh giá độ rõ ràng, hoàn thiện và khả năng đọc ATS.", "Điền CV tạo nội dung mẫu chung khi thiếu dữ liệu, để người dùng sửa lại."],
        ["Không có ngữ cảnh phù hợp: trả lỗi 400.", "CV không thuộc người dùng: trả 404.", "AI chưa cấu hình, quá hạn mức hoặc trả kết quả sai schema: hiển thị lỗi an toàn."],
        "<<extend>> UC-04; kết quả không tự động ghi đè CV.",
        "POST /api/ai/resume/fill, /improve, /review; aiService + Zod schema. Trạng thái: đã triển khai, phụ thuộc cấu hình AI."
    ),
    UseCase(
        "UC-07", "Tìm kiếm và xem việc làm", "Khách, Ứng viên", "MongoDB",
        "Duyệt, tìm kiếm, lọc, sắp xếp và xem chi tiết các tin đang tuyển.",
        "Người dùng mở danh sách việc làm hoặc một đường dẫn chi tiết.",
        ["Không bắt buộc đăng nhập để xem danh sách công khai."],
        ["Người dùng thấy các tin Active, chưa hết hạn và chưa bị xóa/ẩn.", "Không làm thay đổi dữ liệu."],
        ["Giao diện gọi API danh sách việc làm.", "Máy chủ lọc bỏ Draft, Expired, Deleted, tin bị ẩn và tin quá hạn.", "Người dùng nhập từ khóa/vị trí, chọn bộ lọc và kiểu sắp xếp.", "Giao diện lọc danh sách và hiển thị số kết quả.", "Người dùng mở chi tiết tin để xem mô tả, yêu cầu, quyền lợi và công việc tương tự."],
        ["Tin đã đóng/xóa có thể vẫn xuất hiện trong lịch sử ứng tuyển bằng jobSnapshot nhưng không nhận hồ sơ mới.", "Nếu API không có dữ liệu, giao diện có thể dùng dữ liệu tĩnh cho mục đích trình diễn ở một số màn hình."],
        ["Không tìm thấy id tin: trả 404.", "Lỗi mạng: hiển thị trạng thái không tải được dữ liệu."],
        "UC-08, UC-09, UC-10 và UC-11 có thể được kích hoạt từ trang chi tiết việc làm.",
        "GET /api/jobs, GET /api/jobs/:id; AllJobs, JobDetail. Trạng thái: đã triển khai."
    ),
    UseCase(
        "UC-08", "Lưu hoặc bỏ lưu việc làm", "Ứng viên", "MongoDB, React Query",
        "Lưu tin quan tâm trên máy chủ và đồng bộ trạng thái giữa các màn hình.",
        "Ứng viên nhấn biểu tượng Lưu/Bỏ lưu.",
        ["Ứng viên đã đăng nhập.", "Tin còn khả dụng khi thực hiện lưu mới."],
        ["User.savedJobs được thêm hoặc bỏ jobId.", "Cache giao diện được cập nhật lạc quan rồi đồng bộ lại với máy chủ."],
        ["Giao diện xác định trạng thái hiện tại từ SavedJobsContext.", "Ứng viên nhấn nút lưu.", "React Query cập nhật cache lạc quan và khóa thao tác trùng đang chờ.", "Máy chủ xác thực tin và cập nhật mảng savedJobs.", "Giao diện làm mới truy vấn saved-jobs."],
        ["Bỏ lưu vẫn được cho phép khi tin đã đóng để người dùng dọn danh sách.", "Lưu trùng không tạo bản ghi thứ hai nhờ điều kiện $ne."],
        ["Chưa đăng nhập: yêu cầu đăng nhập.", "Tin không tồn tại/không còn khả dụng: trả 404/410.", "Lỗi máy chủ: cache được rollback và hiển thị thông báo."],
        "<<extend>> UC-07 vì lưu là thao tác tùy chọn khi xem việc.",
        "GET/POST/DELETE /api/saved-jobs; SavedJobsContext. Trạng thái: đã triển khai."
    ),
    UseCase(
        "UC-09", "Chấm mức phù hợp CV - việc làm bằng AI", "Ứng viên", "Dịch vụ AI",
        "Đưa ra điểm tham khảo và khuyến nghị giữa một CV thuộc người dùng và một tin tuyển dụng.",
        "Ứng viên chọn CV và nhấn Chấm điểm tại trang chi tiết việc làm.",
        ["Ứng viên đã đăng nhập.", "CV thuộc người dùng và tin tuyển dụng tồn tại.", "Dịch vụ AI được cấu hình."],
        ["Hiển thị điểm tổng thể, điểm kỹ năng/kinh nghiệm/học vấn/từ khóa và tối đa một số khuyến nghị.", "Không thay đổi CV hay quyết định tuyển dụng."],
        ["Ứng viên chọn một CV đã lưu.", "Giao diện gửi resumeId và jobId.", "Máy chủ xác minh quyền sở hữu CV và tìm tin.", "Hệ thống làm sạch dữ liệu CV/tin trước khi gửi AI.", "AI chấm theo trọng số đã quy định.", "Hệ thống kiểm tra kết quả và trả cảnh báo chỉ mang tính tham khảo."],
        ["Ứng viên có thể chấm lại sau khi chỉnh sửa CV."],
        ["Không tìm thấy CV/tin: trả 404.", "AI không khả dụng/quá hạn mức: thông báo lỗi và vẫn cho phép ứng tuyển thủ công."],
        "<<extend>> UC-07; độc lập với UC-10/UC-11 và không bắt buộc trước khi ứng tuyển.",
        "POST /api/ai/resume/score; JobDetail. Trạng thái: đã triển khai, phụ thuộc cấu hình AI."
    ),
    UseCase(
        "UC-10", "Ứng tuyển bằng CV đã lưu", "Ứng viên", "Doanh nghiệp, hệ thống thông báo",
        "Nộp một CV đã tạo trong RabbitCV cho một tin đang mở.",
        "Ứng viên chọn CV, nhập thư giới thiệu tùy chọn và nhấn Ứng tuyển.",
        ["Ứng viên đã đăng nhập.", "Tin đang khả dụng.", "CV thuộc ứng viên và isVirtual không phải true.", "Ứng viên chưa nộp hồ sơ cho tin này."],
        ["Tạo Application ở trạng thái Pending và lưu jobSnapshot.", "Tạo thông báo cho doanh nghiệp và ứng viên."],
        ["Ứng viên mở chi tiết tin.", "Hệ thống tải danh sách CV thường của ứng viên.", "Ứng viên chọn CV và có thể nhập thư giới thiệu.", "Máy chủ kiểm tra tin còn mở, quyền sở hữu CV và điều kiện chưa ứng tuyển.", "Hệ thống tạo Application cùng snapshot thông tin tin.", "Hệ thống tạo hai thông báo.", "Giao diện xác nhận nộp hồ sơ thành công."],
        ["Thư giới thiệu là tùy chọn và được làm sạch, giới hạn 5.000 ký tự."],
        ["Thiếu jobId/resumeId: lỗi 400.", "Tin đóng/hết hạn/xóa: lỗi 410.", "Đã ứng tuyển: lỗi 400 và ràng buộc unique ngăn bản ghi trùng.", "CV không thuộc người dùng: trả 404."],
        "<<include>> chọn CV; tạo thông báo là hậu xử lý bắt buộc khi nộp thành công.",
        "POST /api/jobs/apply; Application unique(jobId,candidateId). Trạng thái: đã triển khai."
    ),
    UseCase(
        "UC-11", "Ứng tuyển bằng tệp PDF", "Ứng viên", "Doanh nghiệp, hệ thống thông báo",
        "Cho phép nộp CV PDF bên ngoài mà không cần tạo CV đầy đủ trong trình soạn.",
        "Ứng viên chọn tệp PDF và nhấn Ứng tuyển bằng PDF vừa tải.",
        ["Ứng viên đã đăng nhập.", "Tin đang khả dụng.", "Tệp vượt qua kiểm tra định dạng/kích thước.", "Ứng viên chưa nộp hồ sơ cho tin này."],
        ["Tạo Resume ảo isVirtual=true chứa pdfData base64 và Application liên kết tới Resume đó.", "CV ảo không xuất hiện trong danh sách CV thường."],
        ["Giao diện đọc tệp PDF thành data URL/base64.", "Máy chủ kiểm tra fileName, MIME/chữ ký PDF và giới hạn kích thước.", "Hệ thống kiểm tra tin và trùng ứng tuyển.", "Hệ thống tạo Resume ảo với thông tin liên hệ từ User.", "Hệ thống tạo Application; nếu thất bại thì xóa Resume ảo vừa tạo.", "Hệ thống gửi thông báo cho hai phía."],
        ["Doanh nghiệp được xem CV ảo khi Resume đó gắn với hồ sơ ứng tuyển thuộc tin của mình."],
        ["Tệp không hợp lệ: trả lỗi 400.", "Tin không khả dụng: trả lỗi 410.", "Tạo Application thất bại: rollback Resume ảo.", "Đã ứng tuyển: từ chối bản ghi thứ hai."],
        "Là nhánh thay thế cho UC-10, không phải include; hai cách nộp loại trừ nhau trong một lần ứng tuyển.",
        "POST /api/jobs/apply-file; Resume.isVirtual, pdfData. Trạng thái: đã triển khai."
    ),
    UseCase(
        "UC-12", "Theo dõi hồ sơ ứng tuyển", "Ứng viên", "MongoDB",
        "Xem lịch sử và trạng thái xử lý từng hồ sơ, kể cả khi tin đã bị xóa.",
        "Ứng viên mở trang Hồ sơ đã ứng tuyển hoặc Dashboard.",
        ["Ứng viên đã đăng nhập."],
        ["Hiển thị danh sách mới nhất cùng trạng thái Pending, Reviewing, Interview, Offered, Rejected hoặc Accepted.", "Không thay đổi dữ liệu."],
        ["Giao diện gọi API hồ sơ của ứng viên.", "Máy chủ lấy Application theo candidateId và populate Job còn tồn tại.", "Giao diện phân nhóm đang xử lý/đã hoàn tất.", "Mỗi mục hiển thị công việc, công ty, thời gian, trạng thái và mô tả tương ứng."],
        ["Nếu Job đã xóa, giao diện dùng jobSnapshot và giải thích lịch sử vẫn được giữ."],
        ["Lỗi tải dữ liệu: hiển thị thông báo và cho phép thử lại."],
        "Nhận dữ liệu từ UC-10/UC-11 và thay đổi do UC-20.",
        "GET /api/jobs/applications/mine; MyApplications. Trạng thái: đã triển khai."
    ),
    UseCase(
        "UC-13", "Luyện phỏng vấn với AI", "Ứng viên", "Dịch vụ AI",
        "Mô phỏng phỏng vấn theo vị trí, cấp độ, loại phỏng vấn và số câu hỏi; trả phản hồi và tổng kết.",
        "Ứng viên cấu hình buổi luyện tập và bắt đầu.",
        ["Ứng viên đã đăng nhập.", "Đã nhập vị trí muốn luyện.", "Dịch vụ AI được cấu hình."],
        ["Buổi phỏng vấn hiển thị câu hỏi tuần tự, phản hồi, điểm và tổng kết khi kết thúc.", "Kết quả chỉ dùng luyện tập, không phải quyết định tuyển dụng."],
        ["Ứng viên chọn vị trí, cấp độ, loại và số câu hỏi.", "Hệ thống gửi action=start để nhận câu đầu tiên.", "Ứng viên trả lời từng câu.", "Mỗi lượt hệ thống làm sạch lịch sử, kiểm tra lượt cuối và gửi action=answer.", "AI trả phản hồi cùng câu hỏi kế tiếp.", "Khi đủ câu hoặc người dùng kết thúc, AI trả finalSummary và isComplete=true."],
        ["Người dùng có thể kết thúc sớm.", "Có thể bắt đầu lại một phiên mới với cấu hình khác."],
        ["Thiếu vị trí/câu trả lời: trả lỗi 400.", "AI không khả dụng hoặc sai schema: hiển thị lỗi an toàn."],
        "Use Case độc lập; sử dụng cùng dịch vụ AI với UC-06 và UC-09.",
        "POST /api/ai/interview/turn; AiInterview. Trạng thái: đã triển khai, phụ thuộc cấu hình AI."
    ),
    UseCase(
        "UC-14", "Nhắn tin thời gian thực", "Ứng viên, Doanh nghiệp", "Socket.IO, MongoDB",
        "Trao đổi văn bản/hình ảnh trong phòng riêng và duy trì chỉ báo chưa đọc qua các lần tải lại.",
        "Người dùng mở một hội thoại hoặc gửi tin nhắn.",
        ["Người dùng đã đăng nhập.", "Phòng private_ chứa id của người dùng hiện tại."],
        ["Tin nhắn được lưu trong Message và phát tới phòng socket của người nhận.", "Mốc đọc được cập nhật trong ChatReadState."],
        ["Hệ thống tải danh sách hội thoại từ tin nhắn cuối mỗi phòng.", "Người dùng mở phòng riêng.", "Máy chủ xác minh người dùng là thành viên phòng.", "Hệ thống trả tối đa 100 tin mới nhất sau hiddenAt nếu có.", "Người dùng gửi nội dung hoặc ảnh.", "Máy chủ lưu Message và phát sự kiện newMessage tới người nhận.", "Khi mở phòng, giao diện đánh dấu phòng đã đọc và làm mới số chưa đọc."],
        ["Có thể tìm người dùng để bắt đầu hội thoại.", "Tin nhắn có thể chỉ gồm ảnh hoặc chỉ gồm nội dung."],
        ["Phòng riêng không chứa id người dùng: trả 403.", "Tin nhắn không có nội dung lẫn ảnh: trả 400.", "Socket mất kết nối: tự kết nối lại; dữ liệu vẫn có thể tải qua HTTP."],
        "UC-15 mở rộng UC-14.",
        "GET/POST /api/messages; /api/chat/threads, unread/read; SocketContext. Trạng thái: đã triển khai."
    ),
    UseCase(
        "UC-15", "Ẩn cuộc trò chuyện", "Ứng viên, Doanh nghiệp", "MongoDB",
        "Ẩn lịch sử hội thoại theo góc nhìn của một người dùng mà không xóa tin nhắn vật lý.",
        "Người dùng chọn Ẩn/Xóa cuộc trò chuyện trong danh sách chat.",
        ["Người dùng đã đăng nhập.", "Phòng là hội thoại riêng, không phải general."],
        ["HiddenChat được upsert với hiddenAt hiện tại.", "Tin cũ không hiển thị; hội thoại tự xuất hiện lại nếu có tin mới sau hiddenAt."],
        ["Người dùng chọn ẩn một phòng riêng.", "Máy chủ lưu hoặc cập nhật hiddenAt cho cặp userId-room.", "Danh sách thread loại phòng nếu lastMessageAt không lớn hơn hiddenAt.", "Khi mở lại, truy vấn Message chỉ lấy createdAt > hiddenAt."],
        ["Một tin nhắn mới sau mốc ẩn làm hội thoại xuất hiện trở lại nhưng không khôi phục tin cũ."],
        ["Không cho ẩn phòng general.", "Phòng không hợp lệ: trả lỗi quyền truy cập khi tải tin."],
        "<<extend>> UC-14 vì ẩn là thao tác tùy chọn.",
        "PATCH /api/chat/threads/:room/hide; HiddenChat.hiddenAt. Trạng thái: đã triển khai."
    ),
    UseCase(
        "UC-16", "Quản lý thông báo", "Ứng viên, Doanh nghiệp", "MongoDB",
        "Xem thông báo phân trang, đếm chưa đọc, đánh dấu đã đọc và xóa thông báo của chính mình.",
        "Người dùng mở chuông thông báo hoặc trang Thông báo.",
        ["Người dùng đã đăng nhập."],
        ["Trạng thái isRead hoặc bản ghi thông báo được cập nhật đúng theo recipient."],
        ["Hệ thống đếm thông báo chưa đọc.", "Giao diện tải danh sách theo trang, mới nhất trước.", "Người dùng mở một thông báo; hệ thống đánh dấu bản ghi đó đã đọc.", "Người dùng có thể đánh dấu tất cả đã đọc.", "Người dùng có thể xóa một thông báo thuộc mình."],
        ["Thông báo được tạo tự động khi nộp hồ sơ, thay đổi trạng thái và khi tin sắp hết hạn/hết hạn."],
        ["Không tìm thấy thông báo hoặc không thuộc người dùng: trả 404.", "Lỗi mạng: chỉ báo có thể được làm mới ở lần tải sau."],
        "Được gọi gián tiếp bởi UC-10, UC-11, UC-20 và UC-25.",
        "GET/PUT/DELETE /api/notifications. Trạng thái: đã triển khai."
    ),
    UseCase(
        "UC-17", "Quản lý tin tuyển dụng", "Doanh nghiệp", "MongoDB",
        "Tạo, lưu nháp, chỉnh sửa, đóng/mở lại và xóa mềm tin tuyển dụng của doanh nghiệp.",
        "Doanh nghiệp mở Kênh tuyển dụng và thao tác trên danh sách tin.",
        ["Người dùng đã đăng nhập với role=company.", "Doanh nghiệp chỉ sửa/xóa tin do mình sở hữu."],
        ["Job được tạo/cập nhật; xóa chuyển status=Deleted và đặt deletedAt.", "Lịch sử Application và savedJobs vẫn được giữ."],
        ["Doanh nghiệp nhập tiêu đề, địa điểm, hình thức, lương, mô tả và các trường bổ sung.", "Chọn đăng ngay hoặc lưu Draft.", "Máy chủ xác minh vai trò và ngày hết hạn trong giới hạn.", "Hệ thống chuẩn hóa requirements/benefits/tags thành mảng.", "Hệ thống tạo Job gắn companyId.", "Doanh nghiệp có thể tìm, lọc, chỉnh sửa hoặc đổi trạng thái Active/Expired.", "Khi xóa, hệ thống thực hiện soft-delete."],
        ["Gia hạn tin đặt lại các mốc thông báo hết hạn và có thể chuyển Expired về Active.", "Tin Draft không xuất hiện trong danh sách công khai.", "Lưu tin nháp là biến thể theo trạng thái, không cần Use Case độc lập."],
        ["Người dùng không phải doanh nghiệp: trả 403 khi tạo.", "Không phải chủ sở hữu/admin: trả 403 khi sửa/xóa.", "Ngày hết hạn không hợp lệ: trả 400.", "Tin đã xóa: không cho chỉnh sửa."],
        "Lưu nháp là nhánh thay thế trong UC-17; UC-18 sử dụng các tin đã tạo.",
        "POST/GET /api/jobs, GET /api/jobs/my, PUT/DELETE /api/jobs/:id; CompanyDashboard. Trạng thái: đã triển khai."
    ),
    UseCase(
        "UC-18", "Xem, tìm và lọc ứng viên", "Doanh nghiệp", "MongoDB",
        "Theo dõi hồ sơ nhận được theo tin, tìm ứng viên và xem thư giới thiệu.",
        "Doanh nghiệp mở tab Duyệt ứng viên.",
        ["Doanh nghiệp đã đăng nhập.", "Có ít nhất một Job thuộc doanh nghiệp để nhận hồ sơ."],
        ["Hiển thị Application chỉ thuộc các Job của doanh nghiệp.", "Không thay đổi trạng thái nếu chưa thực hiện UC-20."],
        ["Máy chủ lấy danh sách Job theo companyId.", "Máy chủ lấy Application có jobId thuộc danh sách đó.", "Giao diện hiển thị số hồ sơ và thống kê trạng thái.", "Doanh nghiệp lọc theo tin và tìm theo tên/email/vị trí.", "Doanh nghiệp mở thư giới thiệu hoặc chuyển sang xem CV."],
        ["Tin đã xóa vẫn có thể hiện với nhãn phù hợp để bảo toàn lịch sử.", "Giao diện hiển thị phần trăm phù hợp minh họa; đây không phải kết quả AI có bằng chứng lưu trong backend."],
        ["Không có hồ sơ: hiển thị trạng thái rỗng.", "Lỗi tải dữ liệu: thông báo và giữ giao diện an toàn."],
        "UC-19 và UC-20 có thể được kích hoạt từ danh sách ứng viên.",
        "GET /api/jobs/applications; CompanyDashboard. Trạng thái: đã triển khai."
    ),
    UseCase(
        "UC-19", "Xem CV và hồ sơ ứng viên", "Doanh nghiệp", "MongoDB",
        "Cho doanh nghiệp xem CV chỉ khi ứng viên đã nộp vào một tin thuộc doanh nghiệp.",
        "Doanh nghiệp nhấn Xem CV hoặc mở hồ sơ ứng viên.",
        ["Doanh nghiệp đã đăng nhập.", "Tồn tại Application nối Resume với một Job thuộc doanh nghiệp."],
        ["CV/hồ sơ được trả ở dạng đã làm sạch.", "Không thay đổi dữ liệu."],
        ["Doanh nghiệp chọn một Application.", "Giao diện gửi resumeId hoặc userId.", "Máy chủ tìm Resume.", "Máy chủ kiểm tra người xem là chủ CV, admin hoặc doanh nghiệp tuyển dụng hợp lệ.", "Hệ thống trả dữ liệu Resume đã làm sạch và hiển thị."],
        ["CV có thể là CV soạn trên hệ thống hoặc CV ảo từ PDF tải lên.", "Admin và chính chủ CV cũng được phép dùng endpoint xem CV."],
        ["CV không tồn tại: trả 404.", "Doanh nghiệp không có Application liên quan: trả 403."],
        "<<extend>> UC-18 vì xem chi tiết là thao tác tùy chọn trên một ứng viên.",
        "GET /api/resumes/view/:id; ViewResume/PublicProfile. Trạng thái: đã triển khai."
    ),
    UseCase(
        "UC-20", "Cập nhật trạng thái hồ sơ", "Doanh nghiệp", "Ứng viên, hệ thống thông báo",
        "Chuyển hồ sơ qua các giai đoạn tuyển dụng và thông báo cho ứng viên.",
        "Doanh nghiệp chọn trạng thái mới trong danh sách ứng viên.",
        ["Doanh nghiệp đã đăng nhập.", "Application thuộc một Job của doanh nghiệp."],
        ["Application.status được cập nhật.", "Một Notification APPLICATION_STATUS_CHANGED được tạo cho ứng viên."],
        ["Doanh nghiệp mở hồ sơ trong UC-18.", "Chọn một trong Pending, Reviewing, Interview, Offered, Rejected, Accepted.", "Máy chủ kiểm tra trạng thái hợp lệ.", "Máy chủ kiểm tra Job thuộc doanh nghiệp (hoặc người gọi là admin).", "Hệ thống lưu trạng thái.", "Hệ thống tạo thông báo cho candidateId.", "Ứng viên thấy thay đổi trong UC-12 và UC-16."],
        ["Có thể chuyển trực tiếp giữa các trạng thái; backend hiện không ép buộc một state machine tuần tự."],
        ["Trạng thái ngoài enum: trả 400.", "Application không tồn tại: trả 404.", "Không có quyền: trả 403."],
        "<<extend>> UC-18; <<include>> tạo thông báo sau cập nhật thành công.",
        "PUT /api/jobs/applications/:id. Trạng thái: đã triển khai."
    ),
    UseCase(
        "UC-21", "Xem tổng quan quản trị và sức khỏe hệ thống", "Quản trị viên", "MongoDB",
        "Theo dõi số người dùng, doanh nghiệp, ứng viên, tin, hồ sơ ứng tuyển và trạng thái cấu hình hệ thống.",
        "Quản trị viên mở Dashboard quản trị.",
        ["Đã đăng nhập với role=admin."],
        ["Hiển thị thống kê và trạng thái kết nối/cấu hình; không thay đổi dữ liệu nghiệp vụ."],
        ["RoleAccessGuard đưa admin vào /admin.", "Giao diện gọi API thống kê.", "Máy chủ kiểm tra role=admin.", "Hệ thống đếm User theo vai trò, Job chưa xóa và toàn bộ Application.", "Giao diện hiển thị thống kê và danh sách người dùng.", "Khi cần, admin gọi endpoint health/details để xem môi trường, JWT và kết nối MongoDB."],
        ["Nếu một biến môi trường thiếu, health/details trả danh sách missingEnv để phục vụ chẩn đoán."],
        ["Không phải admin: trả 403 và giao diện điều hướng khỏi khu vực quản trị.", "Cơ sở dữ liệu lỗi: trả 500."],
        "UC-22, UC-23 và UC-24 được khởi tạo từ khu vực quản trị.",
        "GET /api/admin/stats, /api/admin/health/details; AdminDashboard. Trạng thái: đã triển khai."
    ),
    UseCase(
        "UC-22", "Quản lý người dùng", "Quản trị viên", "MongoDB",
        "Xem danh sách, khóa và xóa tài khoản người dùng; bảo vệ tài khoản admin đang sử dụng.",
        "Admin mở trang Người dùng và chọn thao tác.",
        ["Đã đăng nhập với role=admin."],
        ["Tài khoản được đặt isBanned=true hoặc bị xóa khỏi User.", "Không thể tự khóa/xóa tài khoản admin hiện tại."],
        ["Admin tải danh sách người dùng từ thống kê quản trị.", "Tìm/chọn người dùng cần xử lý.", "Chọn khóa hoặc xóa.", "Máy chủ xác minh role admin và id mục tiêu không phải chính mình.", "Hệ thống cập nhật/xóa User.", "Giao diện làm mới danh sách."],
        ["Endpoint hiện có khóa tài khoản; khôi phục người dùng thường chưa có endpoint riêng như doanh nghiệp."],
        ["Không phải admin: trả 403.", "Tự khóa/tự xóa: trả 400.", "Không tìm thấy tài khoản: trả 404."],
        "<<extend>> UC-21.",
        "PUT /api/admin/users/:id/ban, DELETE /api/admin/users/:id; AdminUsers. Trạng thái: đã triển khai với giới hạn nêu trên."
    ),
    UseCase(
        "UC-23", "Xác minh và quản lý doanh nghiệp", "Quản trị viên", "Doanh nghiệp",
        "Duyệt, từ chối, tạm ngưng hoặc khôi phục tài khoản doanh nghiệp.",
        "Admin mở trang Doanh nghiệp và chọn hành động xác minh.",
        ["Đã đăng nhập với role=admin.", "Tài khoản mục tiêu có role=company."],
        ["companyVerificationStatus, status và isBanned được cập nhật theo hành động.", "Doanh nghiệp bị khóa không thể đăng nhập."],
        ["Hệ thống tải danh sách doanh nghiệp cùng số tin tuyển dụng.", "Admin xem trạng thái pending/verified/rejected.", "Admin chọn approve, reject, suspend hoặc restore.", "Máy chủ xác minh hành động hợp lệ.", "Hệ thống cập nhật tài khoản doanh nghiệp.", "Giao diện làm mới trạng thái."],
        ["Approve/restore đặt verified, active và bỏ khóa.", "Reject đặt rejected và khóa.", "Suspend chỉ khóa tài khoản."],
        ["Hành động ngoài danh sách: trả 400.", "Không phải admin: trả 403.", "Không tìm thấy doanh nghiệp: trả 404."],
        "<<extend>> UC-21; liên quan hậu điều kiện của UC-01 cho tài khoản doanh nghiệp.",
        "GET /api/admin/companies; PUT /api/admin/companies/:id/verification; AdminCompanies. Trạng thái: đã triển khai."
    ),
    UseCase(
        "UC-24", "Kiểm duyệt tin tuyển dụng", "Quản trị viên", "Doanh nghiệp, MongoDB",
        "Xem toàn bộ tin, ẩn/hiện lại hoặc xóa mềm tin vi phạm.",
        "Admin mở trang Tin tuyển dụng và chọn thao tác kiểm duyệt.",
        ["Đã đăng nhập với role=admin.", "Tin mục tiêu chưa bị xóa."],
        ["Ẩn tin đặt status=Expired và isAdminHidden=true; hiện lại đặt Active nếu chưa hết hạn; xóa đặt Deleted và deletedAt."],
        ["Hệ thống tải danh sách Job chưa xóa và số ứng viên từng tin.", "Admin tìm/chọn tin.", "Chọn ẩn, hiện lại hoặc xóa.", "Máy chủ xác minh role admin.", "Hệ thống cập nhật trạng thái tương ứng.", "Tin không còn xuất hiện công khai khi bị ẩn/xóa."],
        ["Khi xóa, lịch sử ứng tuyển và savedJobs được giữ.", "Chỉ tin có isAdminHidden=true mới được hiện lại."],
        ["Tin đã hết hạn không thể hiện lại: trả 400.", "Tin không bị admin ẩn: không cho unhide.", "Không tìm thấy tin: trả 404.", "Không phải admin: trả 403."],
        "<<extend>> UC-21.",
        "GET /api/admin/jobs; PUT hide/unhide; DELETE /api/admin/jobs/:id; AdminJobs. Trạng thái: đã triển khai."
    ),
    UseCase(
        "UC-25", "Tự động xử lý tin sắp hết hạn và hết hạn", "Bộ lập lịch", "Doanh nghiệp, hệ thống thông báo",
        "Nhắc doanh nghiệp trước hạn và tự chuyển tin quá hạn sang Expired.",
        "Cron gọi endpoint bảo vệ bằng CRON_SECRET (hoặc chạy cục bộ theo cấu hình).",
        ["Máy chủ đang hoạt động.", "Cơ sở dữ liệu kết nối.", "Cron được cấu hình đúng trong môi trường triển khai."],
        ["Tin quá hạn chuyển Expired.", "Doanh nghiệp nhận thông báo sắp hết hạn/hết hạn một lần theo các mốc notifiedAt."],
        ["Bộ lập lịch gọi /api/cron/job-expiry.", "Máy chủ xác thực cron token.", "Hệ thống tìm các tin Active gần/qua expiryDate.", "Tạo thông báo JOB_EXPIRING_SOON nếu chưa gửi.", "Chuyển tin quá hạn sang Expired và tạo JOB_EXPIRED nếu chưa gửi.", "Ghi expiryNotifiedAt/expiredNotifiedAt để chống gửi lặp."],
        ["Trong môi trường local, endpoint có thể cho phép chạy để kiểm thử theo cấu hình."],
        ["CRON_SECRET sai ở production: từ chối yêu cầu.", "Lỗi từng bản ghi được ghi nhận; lần chạy sau có thể thử lại."],
        "Use Case hệ thống, hỗ trợ UC-17 và UC-16.",
        "GET /api/cron/job-expiry; server/cron/jobExpiryCron.js. Trạng thái: đã triển khai, phụ thuộc cấu hình cron."
    ),
]


DIAGRAMS = [
    {
        "key": "01-use-case-tong-quan-v2",
        "title": "Use Case tổng quan hệ thống RabbitCV",
        "actors": [("Ứng viên", "left", 225), ("Doanh nghiệp", "left", 770), ("Quản trị viên", "right", 500), ("Dịch vụ AI", "right", 210), ("Bộ lập lịch", "right", 800)],
        "cases": [
            ("Tài khoản và hồ sơ", 520, 120, "violet"), ("Tạo và quản lý CV", 520, 235, "blue"),
            ("Tìm việc, lưu việc, ứng tuyển", 520, 350, "blue"), ("Chat và thông báo", 520, 465, "violet"),
            ("Quản lý tuyển dụng", 980, 235, "green"), ("Duyệt và xử lý ứng viên", 980, 350, "green"),
            ("Quản trị hệ thống", 980, 500, "orange"), ("Hỗ trợ CV/phỏng vấn bằng AI", 520, 610, "violet"),
            ("Xử lý tin hết hạn", 980, 720, "orange"),
        ],
        "links": [(0,0),(0,1),(0,2),(0,3),(0,7),(1,0),(1,3),(1,4),(1,5),(2,6),(3,7),(4,8)],
        "relations": [],
    },
    {
        "key": "02-use-case-ung-vien-cv-ai",
        "title": "Use Case ứng viên - CV và AI",
        "actors": [("Ứng viên", "left", 500), ("Dịch vụ AI", "right", 500)],
        "cases": [
            ("Đăng nhập", 510, 110, "blue"), ("Quản lý CV", 510, 235, "blue"),
            ("Xem trước / tải CV", 920, 145, "blue_light"), ("Điền CV bằng AI", 920, 300, "violet"),
            ("Cải thiện tiểu sử", 920, 430, "violet"), ("Review CV", 920, 560, "violet"),
            ("Luyện phỏng vấn AI", 510, 735, "violet"),
        ],
        "links": [(0,0),(0,1),(0,2),(0,3),(0,4),(0,5),(0,6),(1,3),(1,4),(1,5),(1,6)],
        "relations": [("extend",2,1),("extend",3,1),("extend",4,1),("extend",5,1)],
    },
    {
        "key": "03-use-case-ung-vien-viec-lam",
        "title": "Use Case ứng viên - Tìm việc và ứng tuyển",
        "actors": [("Ứng viên", "left", 500), ("Dịch vụ AI", "right", 275), ("Doanh nghiệp", "right", 745)],
        "cases": [
            ("Tìm, lọc và xem việc", 510, 110, "blue"), ("Lưu / bỏ lưu việc", 930, 110, "blue_light"),
            ("Chấm phù hợp CV - việc", 930, 265, "violet"), ("Ứng tuyển", 510, 330, "blue"),
            ("Chọn CV đã lưu", 930, 420, "blue_light"), ("Tải CV PDF", 930, 550, "blue_light"),
            ("Theo dõi trạng thái hồ sơ", 510, 650, "blue"), ("Nhận thông báo", 930, 740, "violet"),
        ],
        "links": [(0,0),(0,1),(0,2),(0,3),(0,6),(0,7),(1,2),(2,3),(2,7)],
        "relations": [("extend",1,0),("extend",2,0),("extend",4,3),("extend",5,3),("include",3,7)],
    },
    {
        "key": "04-use-case-giao-tiep",
        "title": "Use Case giao tiếp và thông báo",
        "actors": [("Ứng viên", "left", 325), ("Doanh nghiệp", "left", 720)],
        "cases": [
            ("Tìm người / mở hội thoại", 540, 115, "violet"), ("Xem danh sách hội thoại", 950, 115, "violet"),
            ("Gửi và nhận tin thời gian thực", 540, 330, "violet"), ("Đánh dấu đã đọc", 950, 330, "violet"),
            ("Ẩn cuộc trò chuyện", 540, 555, "violet"), ("Xem thông báo", 950, 555, "blue"),
            ("Đánh dấu/xóa thông báo", 950, 745, "blue_light"),
        ],
        "links": [(0,0),(0,1),(0,2),(0,3),(0,4),(0,5),(0,6),(1,0),(1,1),(1,2),(1,3),(1,4),(1,5),(1,6)],
        "relations": [("include",0,3),("extend",4,2),("extend",6,5)],
    },
    {
        "key": "05-use-case-doanh-nghiep-v2",
        "title": "Use Case doanh nghiệp - Kênh tuyển dụng",
        "actors": [("Doanh nghiệp", "left", 500), ("Ứng viên", "right", 670), ("Bộ lập lịch", "right", 185)],
        "cases": [
            ("Quản lý hồ sơ công ty", 510, 100, "green"), ("Quản lý tin tuyển dụng", 510, 250, "green"),
            ("Lưu nháp / đóng / gia hạn", 930, 200, "green_light"), ("Xem, tìm và lọc ứng viên", 510, 440, "green"),
            ("Xem CV / hồ sơ ứng viên", 930, 430, "green_light"), ("Cập nhật trạng thái hồ sơ", 510, 650, "green"),
            ("Nhắn tin với ứng viên", 930, 650, "violet"), ("Nhận thông báo", 930, 800, "violet"),
            ("Xử lý tin sắp hết hạn", 930, 80, "orange"),
        ],
        "links": [(0,0),(0,1),(0,2),(0,3),(0,4),(0,5),(0,6),(0,7),(1,6),(1,7),(2,8)],
        "relations": [("extend",2,1),("extend",4,3),("extend",5,3),("include",5,7),("include",8,7)],
    },
    {
        "key": "06-use-case-quan-tri-v2",
        "title": "Use Case quản trị viên",
        "actors": [("Quản trị viên", "left", 500)],
        "cases": [
            ("Đăng nhập quản trị", 540, 100, "orange"), ("Xem thống kê tổng quan", 540, 250, "orange"),
            ("Xem sức khỏe hệ thống", 950, 250, "orange_light"), ("Quản lý người dùng", 540, 450, "orange"),
            ("Xác minh / quản lý doanh nghiệp", 950, 450, "orange"), ("Kiểm duyệt tin tuyển dụng", 540, 680, "orange"),
            ("Khóa / xóa tài khoản", 950, 650, "orange_light"), ("Ẩn / hiện / xóa tin", 950, 800, "orange_light"),
        ],
        "links": [(0,0),(0,1),(0,2),(0,3),(0,4),(0,5),(0,6),(0,7)],
        "relations": [("extend",2,1),("include",3,6),("include",5,7)],
    },
]


def hexrgb(value: str):
    value = value.lstrip("#")
    return tuple(int(value[i:i+2], 16) for i in (0, 2, 4))


def font(size: int, bold: bool = False):
    return ImageFont.truetype(str(FONT_BOLD if bold else FONT_REGULAR), size=size)


def wrap_for_width(draw: ImageDraw.ImageDraw, text: str, fnt, max_width: int) -> list[str]:
    words = text.split()
    lines: list[str] = []
    current = ""
    for word in words:
        candidate = f"{current} {word}".strip()
        if draw.textbbox((0, 0), candidate, font=fnt)[2] <= max_width:
            current = candidate
        else:
            if current:
                lines.append(current)
            current = word
    if current:
        lines.append(current)
    return lines


def draw_actor(draw, x: int, y: int, label: str, side: str):
    c = hexrgb(INK)
    cx = x + 55
    draw.ellipse((cx-18, y, cx+18, y+36), outline=c, width=4)
    draw.line((cx, y+36, cx, y+105), fill=c, width=4)
    draw.line((cx-42, y+62, cx+42, y+62), fill=c, width=4)
    draw.line((cx, y+105, cx-35, y+150), fill=c, width=4)
    draw.line((cx, y+105, cx+35, y+150), fill=c, width=4)
    fnt = font(24, True)
    lines = wrap_for_width(draw, label, fnt, 180)
    for i, line in enumerate(lines):
        box = draw.textbbox((0,0), line, font=fnt)
        draw.text((cx-(box[2]-box[0])/2, y+162+i*28), line, fill=c, font=fnt)


def ellipse_center(item):
    _, x, y, _ = item
    return x + 165, y + 45


def arrow_head(draw, x1, y1, x2, y2, color, width=3):
    angle = math.atan2(y2-y1, x2-x1)
    length = 14
    spread = 0.55
    p1 = (x2-length*math.cos(angle-spread), y2-length*math.sin(angle-spread))
    p2 = (x2-length*math.cos(angle+spread), y2-length*math.sin(angle+spread))
    draw.line((p1[0],p1[1],x2,y2,p2[0],p2[1]), fill=color, width=width)


def draw_dashed_line(draw, start, end, fill, width=3, dash=12, gap=8):
    x1,y1=start; x2,y2=end
    dist=math.hypot(x2-x1,y2-y1)
    if dist == 0: return
    ux=(x2-x1)/dist; uy=(y2-y1)/dist
    pos=0.0
    while pos < dist:
        e=min(pos+dash, dist)
        draw.line((x1+ux*pos,y1+uy*pos,x1+ux*e,y1+uy*e),fill=fill,width=width)
        pos += dash+gap


def actor_anchor(actor, toward):
    label, side, y = actor
    x = 85 if side == "left" else 1595
    cx=x+55; cy=y+72
    tx,ty=toward
    return (cx+45 if tx>cx else cx-45, cy)


def case_anchor(case, toward):
    _,x,y,_=case
    cx,cy=x+165,y+45
    tx,ty=toward
    dx=tx-cx; dy=ty-cy
    if abs(dx/165) > abs(dy/45):
        return (x+330 if dx>0 else x, cy)
    return (cx, y+90 if dy>0 else y)


def draw_diagram_png(spec: dict, path: Path):
    W,H=1800,1050
    im=Image.new("RGB",(W,H),"white")
    d=ImageDraw.Draw(im)
    d.rounded_rectangle((255,55,1545,990),radius=8,fill=hexrgb("FAFBFD"),outline=hexrgb(INK),width=3)
    d.text((285,73),"HỆ THỐNG RABBITCV",font=font(25,True),fill=hexrgb(INK))
    title_f=font(34,True)
    box=d.textbbox((0,0),spec["title"],font=title_f)
    d.text(((W-(box[2]-box[0]))/2,10),spec["title"],font=title_f,fill=hexrgb(INK))

    palette={
        "blue":(BLUE,BLUE_LIGHT),"blue_light":("60A5FA","EFF6FF"),
        "green":(GREEN,GREEN_LIGHT),"green_light":("4ADE80","F0FDF4"),
        "orange":(ORANGE,ORANGE_LIGHT),"orange_light":("FB923C","FFF7ED"),
        "violet":(VIOLET,VIOLET_LIGHT),
    }
    for actor in spec["actors"]:
        x=85 if actor[1]=="left" else 1595
        draw_actor(d,x,actor[2],actor[0],actor[1])

    for label,x,y,key in spec["cases"]:
        stroke,fill=palette[key]
        d.ellipse((x,y,x+330,y+90),fill=hexrgb(fill),outline=hexrgb(stroke),width=4)
        fnt=font(22,True if key in {"blue","green","orange"} else False)
        lines=wrap_for_width(d,label,fnt,275)
        total=len(lines)*26
        for i,line in enumerate(lines):
            bb=d.textbbox((0,0),line,font=fnt)
            d.text((x+165-(bb[2]-bb[0])/2,y+45-total/2+i*26),line,font=fnt,fill=hexrgb(INK))

    for aidx,cidx in spec["links"]:
        actor=spec["actors"][aidx]; case=spec["cases"][cidx]
        cc=ellipse_center(case)
        aa=actor_anchor(actor,cc)
        ca=case_anchor(case,aa)
        d.line((aa[0],aa[1],ca[0],ca[1]),fill=hexrgb(LINE),width=3)

    for kind,source_idx,target_idx in spec["relations"]:
        source=spec["cases"][source_idx]; target=spec["cases"][target_idx]
        s=case_anchor(source,ellipse_center(target)); t=case_anchor(target,ellipse_center(source))
        color=hexrgb(VIOLET if kind=="extend" else BLUE)
        draw_dashed_line(d,s,t,color,width=3)
        arrow_head(d,s[0],s[1],t[0],t[1],color,width=3)
        mx=(s[0]+t[0])/2; my=(s[1]+t[1])/2
        label=f"<<{kind}>>"
        fnt=font(18,False); bb=d.textbbox((0,0),label,font=fnt)
        d.rounded_rectangle((mx-(bb[2]-bb[0])/2-6,my-15,mx+(bb[2]-bb[0])/2+6,my+12),radius=4,fill="white")
        d.text((mx-(bb[2]-bb[0])/2,my-13),label,font=fnt,fill=color)

    legend_y=1000
    d.text((275,legend_y),"Đường liền: liên kết tác nhân",font=font(16),fill=hexrgb(MUTED))
    d.text((660,legend_y),"<<include>>: bắt buộc",font=font(16),fill=hexrgb(BLUE))
    d.text((1005,legend_y),"<<extend>>: tùy chọn/điều kiện",font=font(16),fill=hexrgb(VIOLET))
    im.save(path,quality=95)


def xml_cell(cell_id, value, style, x, y, w, h):
    return f'<mxCell id="{cell_id}" value="{html.escape(value, quote=True)}" style="{style}" vertex="1" parent="1"><mxGeometry x="{x}" y="{y}" width="{w}" height="{h}" as="geometry"/></mxCell>'


def build_drawio_page(spec: dict, page_id: str) -> str:
    cells=['<mxCell id="0"/>','<mxCell id="1" parent="0"/>']
    cells.append(xml_cell(f"{page_id}-boundary","HỆ THỐNG RABBITCV","rounded=0;whiteSpace=wrap;html=1;fillColor=#FAFBFD;strokeColor=#172033;strokeWidth=2;verticalAlign=top;fontStyle=1;fontSize=20;spacingTop=12;",255,55,1290,935))
    actor_ids=[]
    for i,(label,side,y) in enumerate(spec["actors"]):
        aid=f"{page_id}-actor-{i}"; actor_ids.append(aid)
        x=85 if side=="left" else 1595
        cells.append(xml_cell(aid,label,"shape=umlActor;verticalLabelPosition=bottom;verticalAlign=top;html=1;outlineConnect=0;fontSize=18;fontStyle=1;fontColor=#172033;strokeColor=#172033;",x,y,110,175))
    palette={"blue":("#2563EB","#EAF2FF"),"blue_light":("#60A5FA","#EFF6FF"),"green":("#16A34A","#EAF8EF"),"green_light":("#4ADE80","#F0FDF4"),"orange":("#EA580C","#FFF1E8"),"orange_light":("#FB923C","#FFF7ED"),"violet":("#6C4CF1","#EEEAFE")}
    case_ids=[]
    for i,(label,x,y,key) in enumerate(spec["cases"]):
        cid=f"{page_id}-case-{i}"; case_ids.append(cid)
        stroke,fill=palette[key]
        cells.append(xml_cell(cid,label,f"ellipse;whiteSpace=wrap;html=1;fillColor={fill};strokeColor={stroke};strokeWidth=2;fontSize=15;fontColor=#172033;",x,y,330,90))
    for i,(aidx,cidx) in enumerate(spec["links"]):
        cells.append(f'<mxCell id="{page_id}-assoc-{i}" style="edgeStyle=orthogonalEdgeStyle;rounded=1;html=1;endArrow=none;strokeColor=#60708A;strokeWidth=1.5;" edge="1" parent="1" source="{actor_ids[aidx]}" target="{case_ids[cidx]}"><mxGeometry relative="1" as="geometry"/></mxCell>')
    for i,(kind,sidx,tidx) in enumerate(spec["relations"]):
        color="#6C4CF1" if kind=="extend" else "#2563EB"
        value=f"&amp;lt;&amp;lt;{kind}&amp;gt;&amp;gt;"
        cells.append(f'<mxCell id="{page_id}-rel-{i}" value="{value}" style="edgeStyle=orthogonalEdgeStyle;rounded=1;html=1;dashed=1;endArrow=open;endFill=0;strokeColor={color};fontColor={color};fontSize=12;" edge="1" parent="1" source="{case_ids[sidx]}" target="{case_ids[tidx]}"><mxGeometry relative="1" as="geometry"/></mxCell>')
    content="\n".join(cells)
    return f'<diagram id="{page_id}" name="{html.escape(spec["title"], quote=True)}"><mxGraphModel dx="1800" dy="1050" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="1800" pageHeight="1050" math="0" shadow="0" background="#ffffff"><root>{content}</root></mxGraphModel></diagram>'


def build_drawio(path: Path):
    pages=[build_drawio_page(spec,f"rabbitcv-uc-{i+1}") for i,spec in enumerate(DIAGRAMS)]
    xml='<?xml version="1.0" encoding="UTF-8"?>\n<mxfile host="app.diagrams.net" modified="2026-08-17T00:00:00.000Z" agent="Codex" version="26.0.16" type="device">\n'+'\n'.join(pages)+'\n</mxfile>\n'
    path.write_text(xml,encoding="utf-8")


def set_cell_shading(cell, fill: str):
    tcPr=cell._tc.get_or_add_tcPr(); shd=tcPr.find(qn("w:shd"))
    if shd is None:
        shd=OxmlElement("w:shd"); tcPr.append(shd)
    shd.set(qn("w:fill"),fill)


def set_cell_margins(cell, top=100, start=120, bottom=100, end=120):
    tc=cell._tc; tcPr=tc.get_or_add_tcPr(); tcMar=tcPr.first_child_found_in("w:tcMar")
    if tcMar is None:
        tcMar=OxmlElement("w:tcMar"); tcPr.append(tcMar)
    for m,v in (("top",top),("start",start),("bottom",bottom),("end",end)):
        node=tcMar.find(qn(f"w:{m}"))
        if node is None:
            node=OxmlElement(f"w:{m}"); tcMar.append(node)
        node.set(qn("w:w"),str(v)); node.set(qn("w:type"),"dxa")


def set_repeat_table_header(row):
    trPr=row._tr.get_or_add_trPr(); tblHeader=OxmlElement("w:tblHeader"); tblHeader.set(qn("w:val"),"true"); trPr.append(tblHeader)


def set_table_widths(table, widths_cm: list[float]):
    table.autofit=False
    for row in table.rows:
        for i,w in enumerate(widths_cm):
            row.cells[i].width=Cm(w)
            tcPr=row.cells[i]._tc.get_or_add_tcPr(); tcW=tcPr.find(qn("w:tcW"))
            if tcW is None:
                tcW=OxmlElement("w:tcW"); tcPr.append(tcW)
            tcW.set(qn("w:w"),str(int(w/2.54*1440))); tcW.set(qn("w:type"),"dxa")
    tblPr=table._tbl.tblPr
    tblW=tblPr.find(qn("w:tblW"))
    if tblW is None:
        tblW=OxmlElement("w:tblW"); tblPr.append(tblW)
    tblW.set(qn("w:w"),str(int(sum(widths_cm)/2.54*1440))); tblW.set(qn("w:type"),"dxa")
    tblInd=tblPr.find(qn("w:tblInd"))
    if tblInd is None:
        tblInd=OxmlElement("w:tblInd"); tblPr.append(tblInd)
    tblInd.set(qn("w:w"),"120"); tblInd.set(qn("w:type"),"dxa")


def set_run_font(run, size=11, bold=None, color=INK, italic=None):
    run.font.name="Arial"; run._element.get_or_add_rPr().rFonts.set(qn("w:ascii"),"Arial"); run._element.get_or_add_rPr().rFonts.set(qn("w:hAnsi"),"Arial")
    run.font.size=Pt(size); run.font.color.rgb=RGBColor.from_string(color)
    if bold is not None: run.bold=bold
    if italic is not None: run.italic=italic


def set_paragraph(p, before=0, after=6, line=1.15, align=None, keep_next=False):
    pf=p.paragraph_format; pf.space_before=Pt(before); pf.space_after=Pt(after); pf.line_spacing=line
    if align is not None: p.alignment=align
    pf.keep_with_next=keep_next


def add_numbered_items(doc, items: Iterable[str]):
    for idx,item in enumerate(items,1):
        p=doc.add_paragraph(style="List Number")
        set_paragraph(p,after=4,line=1.12)
        r=p.add_run(item); set_run_font(r,10.5)


def add_bullets(doc, items: Iterable[str]):
    for item in items:
        p=doc.add_paragraph(style="List Bullet")
        set_paragraph(p,after=4,line=1.12)
        r=p.add_run(item); set_run_font(r,10.5)


def add_field_page(paragraph):
    run=paragraph.add_run(); fldChar1=OxmlElement("w:fldChar"); fldChar1.set(qn("w:fldCharType"),"begin")
    instr=OxmlElement("w:instrText"); instr.set(qn("xml:space"),"preserve"); instr.text=" PAGE "
    fldChar2=OxmlElement("w:fldChar"); fldChar2.set(qn("w:fldCharType"),"end")
    run._r.append(fldChar1); run._r.append(instr); run._r.append(fldChar2); set_run_font(run,9,color=MUTED)


def configure_doc(doc: Document):
    sec=doc.sections[0]
    sec.page_width=Inches(8.5); sec.page_height=Inches(11)
    sec.top_margin=Inches(0.8); sec.bottom_margin=Inches(0.75); sec.left_margin=Inches(0.85); sec.right_margin=Inches(0.85)
    sec.header_distance=Inches(0.35); sec.footer_distance=Inches(0.35)
    styles=doc.styles
    normal=styles["Normal"]; normal.font.name="Arial"; normal.font.size=Pt(11); normal.font.color.rgb=RGBColor.from_string(INK)
    normal._element.rPr.rFonts.set(qn("w:ascii"),"Arial"); normal._element.rPr.rFonts.set(qn("w:hAnsi"),"Arial")
    normal.paragraph_format.space_after=Pt(6); normal.paragraph_format.line_spacing=1.15
    for name,size,color,before,after in (("Title",28,INK,0,8),("Heading 1",17,VIOLET,16,8),("Heading 2",13,INK,12,6),("Heading 3",11,BLUE,8,4)):
        st=styles[name]; st.font.name="Arial"; st.font.size=Pt(size); st.font.bold=True; st.font.color.rgb=RGBColor.from_string(color)
        st._element.rPr.rFonts.set(qn("w:ascii"),"Arial"); st._element.rPr.rFonts.set(qn("w:hAnsi"),"Arial")
        st.paragraph_format.space_before=Pt(before); st.paragraph_format.space_after=Pt(after); st.paragraph_format.keep_with_next=True
    for name in ("List Bullet","List Number"):
        st=styles[name]; st.font.name="Arial"; st.font.size=Pt(10.5); st._element.rPr.rFonts.set(qn("w:ascii"),"Arial"); st._element.rPr.rFonts.set(qn("w:hAnsi"),"Arial")
        st.paragraph_format.left_indent=Cm(0.7); st.paragraph_format.first_line_indent=Cm(-0.35); st.paragraph_format.space_after=Pt(4); st.paragraph_format.line_spacing=1.12
    header=sec.header.paragraphs[0]; header.text="RABBITCV  |  ĐẶC TẢ USE CASE"; header.alignment=WD_ALIGN_PARAGRAPH.RIGHT; set_paragraph(header,after=0)
    for run in header.runs: set_run_font(run,8.5,bold=True,color=MUTED)
    footer=sec.footer.paragraphs[0]; footer.alignment=WD_ALIGN_PARAGRAPH.CENTER; set_paragraph(footer,after=0)
    r=footer.add_run("Trang "); set_run_font(r,9,color=MUTED); add_field_page(footer)


def add_metadata_table(doc, rows):
    table=doc.add_table(rows=0,cols=2); table.style="Table Grid"; table.alignment=WD_TABLE_ALIGNMENT.CENTER
    set_table_widths(table,[4.1,12.0])
    for label,value in rows:
        cells=table.add_row().cells
        set_cell_shading(cells[0],VIOLET_LIGHT)
        for c in cells: set_cell_margins(c); c.vertical_alignment=WD_CELL_VERTICAL_ALIGNMENT.CENTER
        p=cells[0].paragraphs[0]; set_paragraph(p,after=0,line=1.05); r=p.add_run(label); set_run_font(r,9.5,bold=True,color=VIOLET)
        p=cells[1].paragraphs[0]; set_paragraph(p,after=0,line=1.08); r=p.add_run(value); set_run_font(r,9.5)
    return table


def add_spec(doc, uc: UseCase):
    p=doc.add_paragraph(style="Heading 1"); p.paragraph_format.page_break_before=True
    r=p.add_run(f"{uc.id} - {uc.name}"); set_run_font(r,17,bold=True,color=VIOLET)
    add_metadata_table(doc,[
        ("Tác nhân chính",uc.actor),("Tác nhân hỗ trợ",uc.supporting),("Mục tiêu",uc.goal),("Kích hoạt",uc.trigger),("Quan hệ",uc.relations),("Bằng chứng / mức độ",uc.evidence)
    ])
    for heading,items in (("Tiền điều kiện",uc.pre),("Hậu điều kiện",uc.post),("Luồng chính",uc.main),("Luồng thay thế",uc.alt),("Ngoại lệ",uc.errors)):
        p=doc.add_paragraph(style="Heading 2"); r=p.add_run(heading); set_run_font(r,13,bold=True,color=INK)
        if heading=="Luồng chính": add_numbered_items(doc,items)
        else: add_bullets(doc,items)


def build_docx(path: Path):
    doc=Document(); configure_doc(doc)
    doc.core_properties.title="Đặc tả Use Case hệ thống RabbitCV"
    doc.core_properties.subject="Tài liệu phân tích phục vụ luận văn đồ án tốt nghiệp"
    doc.core_properties.author="RabbitCV"
    doc.core_properties.last_modified_by="RabbitCV"
    p=doc.add_paragraph(); set_paragraph(p,before=105,after=12,align=WD_ALIGN_PARAGRAPH.CENTER)
    r=p.add_run("ĐẶC TẢ USE CASE"); set_run_font(r,28,bold=True,color=VIOLET)
    p=doc.add_paragraph(); set_paragraph(p,after=24,align=WD_ALIGN_PARAGRAPH.CENTER)
    r=p.add_run("HỆ THỐNG RABBITCV"); set_run_font(r,23,bold=True,color=INK)
    p=doc.add_paragraph(); set_paragraph(p,after=10,align=WD_ALIGN_PARAGRAPH.CENTER)
    r=p.add_run("Tài liệu phân tích phục vụ luận văn đồ án tốt nghiệp"); set_run_font(r,13,color=MUTED)
    p=doc.add_paragraph(); set_paragraph(p,before=90,after=4,align=WD_ALIGN_PARAGRAPH.CENTER)
    r=p.add_run("Phạm vi: mã nguồn hiện có tại ngày 17/08/2026"); set_run_font(r,10.5,bold=True,color=BLUE)
    p=doc.add_paragraph(); set_paragraph(p,after=0,align=WD_ALIGN_PARAGRAPH.CENTER)
    r=p.add_run("Không bao gồm thông tin cá nhân của sinh viên"); set_run_font(r,10.5,color=MUTED)
    doc.add_page_break()

    doc.add_heading("1. Mục đích và phạm vi",level=1)
    p=doc.add_paragraph(); set_paragraph(p,after=8,line=1.2)
    r=p.add_run("Tài liệu mô tả các tương tác có bằng chứng trong mã nguồn RabbitCV. Nội dung được hình thành từ việc đọc route phía máy chủ, model MongoDB, màn hình React, context trạng thái và kiểm thử; đây không phải kết quả khảo sát người dùng thực địa."); set_run_font(r,11)
    add_metadata_table(doc,[
        ("Tác nhân nghiệp vụ","Khách, Ứng viên, Doanh nghiệp, Quản trị viên"),
        ("Tác nhân hỗ trợ","Dịch vụ AI, Bộ lập lịch, MongoDB, Socket.IO"),
        ("Số Use Case đặc tả",str(len(USE_CASES))),
        ("Số sơ đồ","6 sơ đồ: tổng quan, CV-AI, việc làm, giao tiếp, doanh nghiệp, quản trị"),
        ("Quy ước","include = bắt buộc/tái sử dụng; extend = tùy chọn hoặc theo điều kiện"),
    ])
    doc.add_heading("1.1. Giới hạn được ghi nhận trung thực",level=2)
    add_bullets(doc,[
        "CV PDF tải lên được lưu dạng base64 trong MongoDB qua Resume ảo. Cách này phù hợp quy mô đồ án nhưng nên chuyển sang object storage khi triển khai production.",
        "Điểm phù hợp hiển thị cố định trong một phần giao diện doanh nghiệp không phải kết quả AI được lưu ở backend; tài liệu không xem đó là chức năng chấm ứng viên chính thức.",
        "Backend cập nhật trạng thái hồ sơ theo enum nhưng chưa ép buộc thứ tự chuyển trạng thái như một state machine.",
        "Không có API riêng cho kiểm duyệt CV, xử lý báo cáo hay nhật ký hệ thống; vì vậy các mục này không được đưa vào Use Case hiện hành.",
        "Các chức năng AI phụ thuộc khóa/cấu hình, hạn mức và tính sẵn sàng của dịch vụ AI.",
    ])

    doc.add_page_break(); doc.add_heading("2. Danh mục Use Case",level=1)
    table=doc.add_table(rows=1,cols=4); table.style="Table Grid"; table.alignment=WD_TABLE_ALIGNMENT.CENTER
    set_table_widths(table,[2.2,6.4,4.1,3.4]); set_repeat_table_header(table.rows[0])
    headers=["Mã","Tên Use Case","Tác nhân chính","Mức độ"]
    for i,h in enumerate(headers):
        set_cell_shading(table.rows[0].cells[i],VIOLET); set_cell_margins(table.rows[0].cells[i])
        p=table.rows[0].cells[i].paragraphs[0]; set_paragraph(p,after=0,align=WD_ALIGN_PARAGRAPH.CENTER); r=p.add_run(h); set_run_font(r,9,bold=True,color="FFFFFF")
    for uc in USE_CASES:
        row=table.add_row().cells
        values=[uc.id,uc.name,uc.actor,"Đã triển khai" if "phụ thuộc" not in uc.evidence and "giới hạn" not in uc.evidence else "Có điều kiện/giới hạn"]
        for i,v in enumerate(values):
            set_cell_margins(row[i]); row[i].vertical_alignment=WD_CELL_VERTICAL_ALIGNMENT.CENTER
            p=row[i].paragraphs[0]; set_paragraph(p,after=0,line=1.05); r=p.add_run(v); set_run_font(r,8.5,bold=(i==0),color=VIOLET if i==0 else INK)

    doc.add_page_break(); doc.add_heading("3. Bộ sơ đồ Use Case",level=1)
    for idx,spec in enumerate(DIAGRAMS,1):
        if idx>1: doc.add_page_break()
        p=doc.add_paragraph(style="Heading 2"); r=p.add_run(f"3.{idx}. {spec['title']}"); set_run_font(r,13,bold=True,color=INK)
        doc.add_picture(str(DIAGRAM_DIR/f"{spec['key']}.png"),width=Inches(6.75))
        p=doc.add_paragraph(); set_paragraph(p,before=3,after=0,align=WD_ALIGN_PARAGRAPH.CENTER)
        r=p.add_run(f"Hình 3.{idx}. {spec['title']}"); set_run_font(r,9.5,italic=True,color=MUTED)

    doc.add_page_break(); doc.add_heading("4. Đặc tả chi tiết",level=1)
    p=doc.add_paragraph(); set_paragraph(p,after=8)
    r=p.add_run("Mỗi Use Case dưới đây nêu tác nhân, mục tiêu, tiền/hậu điều kiện, luồng chính, nhánh thay thế, ngoại lệ, quan hệ UML và bằng chứng triển khai tương ứng."); set_run_font(r,11)
    for uc in USE_CASES: add_spec(doc,uc)

    doc.add_page_break(); doc.add_heading("5. Ma trận truy vết Use Case - thành phần",level=1)
    trace=[
        ("UC-01..03","User, AuthContext, RoleAccessGuard","/api/register, /api/login, /api/me, /api/user/*"),
        ("UC-04..06","Resume, ResumeForm, ResumeTemplate, aiRoutes","/api/resume*, /api/ai/resume/*"),
        ("UC-07..13","Job, Application, AllJobs, JobDetail, AiInterview","/api/jobs*, /api/ai/resume/score, /api/ai/interview/turn"),
        ("UC-14..16","Message, HiddenChat, ChatReadState, Notification","/api/messages, /api/chat/*, /api/notifications/*"),
        ("UC-17..20","CompanyDashboard, Job, Application, Resume","/api/jobs/my, /api/jobs/applications*, /api/resumes/view/*"),
        ("UC-21..24","AdminDashboard, AdminUsers, AdminCompanies, AdminJobs","/api/admin/*"),
        ("UC-25","jobExpiryCron, Notification","/api/cron/job-expiry"),
    ]
    table=doc.add_table(rows=1,cols=3); table.style="Table Grid"; set_table_widths(table,[2.7,6.5,6.9]); set_repeat_table_header(table.rows[0])
    for i,h in enumerate(("Use Case","Thành phần chính","API/Bằng chứng")):
        set_cell_shading(table.rows[0].cells[i],VIOLET); set_cell_margins(table.rows[0].cells[i]); p=table.rows[0].cells[i].paragraphs[0]; set_paragraph(p,after=0,align=WD_ALIGN_PARAGRAPH.CENTER); r=p.add_run(h); set_run_font(r,9,bold=True,color="FFFFFF")
    for values in trace:
        row=table.add_row().cells
        for i,v in enumerate(values):
            set_cell_margins(row[i]); p=row[i].paragraphs[0]; set_paragraph(p,after=0,line=1.08); r=p.add_run(v); set_run_font(r,8.8,bold=(i==0),color=VIOLET if i==0 else INK)

    doc.add_heading("5.1. Kết luận sử dụng trong luận văn",level=2)
    p=doc.add_paragraph(); set_paragraph(p,line=1.2)
    r=p.add_run("Bộ Use Case phản ánh một hệ thống end-to-end gồm ba vai trò nghiệp vụ, luồng CV - việc làm - ứng tuyển - xử lý hồ sơ, giao tiếp thời gian thực, thông báo, AI hỗ trợ và quản trị. Khi đưa vào luận văn, nên đặt các sơ đồ tổng quan trong chương Phân tích yêu cầu và chuyển các bảng chi tiết dài sang phụ lục để giữ mạch đọc."); set_run_font(r,11)

    path.parent.mkdir(parents=True,exist_ok=True)
    doc.save(path)


def build_readme(path: Path):
    text="""# Bộ đặc tả Use Case RabbitCV\n\n- `Dac_ta_Use_Case_RabbitCV.docx`: bản Word có thể chỉnh sửa.\n- `Dac_ta_Use_Case_RabbitCV.pdf`: bản PDF để nộp/xem.\n- `RabbitCV-Use-Case-Chi-Tiet.drawio`: nguồn diagrams.net gồm 6 trang.\n- `diagrams/*.png`: ảnh sơ đồ độ phân giải cao để chèn vào luận văn.\n\nNội dung được đối chiếu với mã nguồn ngày 17/08/2026. Không đưa vào các chức năng không có API/bằng chứng triển khai.\n"""
    path.write_text(text,encoding="utf-8")


def pdf_safe(value: str) -> str:
    return html.escape(str(value).replace("–", "-").replace("—", "-").replace("‑", "-"))


def build_pdf(path: Path):
    pdfmetrics.registerFont(TTFont("Arial", str(FONT_REGULAR)))
    pdfmetrics.registerFont(TTFont("Arial-Bold", str(FONT_BOLD)))
    styles = getSampleStyleSheet()
    body = ParagraphStyle("BodyRabbit", parent=styles["BodyText"], fontName="Arial", fontSize=9.6, leading=13.2, textColor=colors.HexColor(f"#{INK}"), spaceAfter=6)
    small = ParagraphStyle("SmallRabbit", parent=body, fontSize=8.2, leading=10.5, spaceAfter=2)
    label = ParagraphStyle("LabelRabbit", parent=small, fontName="Arial-Bold", textColor=colors.HexColor(f"#{VIOLET}"))
    h1 = ParagraphStyle("H1Rabbit", parent=styles["Heading1"], fontName="Arial-Bold", fontSize=16, leading=20, textColor=colors.HexColor(f"#{VIOLET}"), spaceBefore=6, spaceAfter=9)
    h2 = ParagraphStyle("H2Rabbit", parent=styles["Heading2"], fontName="Arial-Bold", fontSize=12, leading=15, textColor=colors.HexColor(f"#{INK}"), spaceBefore=8, spaceAfter=5)
    caption = ParagraphStyle("CaptionRabbit", parent=small, alignment=TA_CENTER, textColor=colors.HexColor(f"#{MUTED}"), spaceBefore=4)
    center = ParagraphStyle("CenterRabbit", parent=body, alignment=TA_CENTER)

    doc = SimpleDocTemplate(str(path), pagesize=letter, rightMargin=0.72*inch, leftMargin=0.72*inch, topMargin=0.68*inch, bottomMargin=0.62*inch, title="Đặc tả Use Case RabbitCV", author="RabbitCV")

    def header_footer(canvas, doc_obj):
        canvas.saveState()
        w,h=letter
        canvas.setFont("Arial-Bold",7.5); canvas.setFillColor(colors.HexColor(f"#{MUTED}"))
        canvas.drawRightString(w-0.72*inch,h-0.35*inch,"RABBITCV | ĐẶC TẢ USE CASE")
        canvas.setFont("Arial",8); canvas.drawCentredString(w/2,0.3*inch,f"Trang {doc_obj.page}")
        canvas.restoreState()

    story=[]
    story += [Spacer(1,1.3*inch), Paragraph("ĐẶC TẢ USE CASE", ParagraphStyle("Cover1",parent=h1,fontSize=28,leading=34,alignment=TA_CENTER,spaceAfter=12)), Paragraph("HỆ THỐNG RABBITCV", ParagraphStyle("Cover2",parent=h1,fontSize=22,leading=28,alignment=TA_CENTER,textColor=colors.HexColor(f"#{INK}"),spaceAfter=20)), Paragraph("Tài liệu phân tích phục vụ luận văn đồ án tốt nghiệp", ParagraphStyle("Cover3",parent=body,fontSize=12,leading=16,alignment=TA_CENTER,textColor=colors.HexColor(f"#{MUTED}"))), Spacer(1,1.4*inch), Paragraph("Phạm vi: mã nguồn hiện có tại ngày 17/08/2026", ParagraphStyle("Cover4",parent=body,fontName="Arial-Bold",alignment=TA_CENTER,textColor=colors.HexColor(f"#{BLUE}"))), Paragraph("Không bao gồm thông tin cá nhân của sinh viên", center), PageBreak()]

    story += [Paragraph("1. Mục đích và phạm vi",h1), Paragraph(pdf_safe("Tài liệu mô tả các tương tác có bằng chứng trong mã nguồn RabbitCV. Nội dung được hình thành từ việc đọc route phía máy chủ, model MongoDB, màn hình React, context trạng thái và kiểm thử; đây không phải kết quả khảo sát người dùng thực địa."),body)]
    rows=[
        ("Tác nhân nghiệp vụ","Khách, Ứng viên, Doanh nghiệp, Quản trị viên"),("Tác nhân hỗ trợ","Dịch vụ AI, Bộ lập lịch, MongoDB, Socket.IO"),("Số Use Case đặc tả",str(len(USE_CASES))),("Số sơ đồ","6 sơ đồ: tổng quan, CV-AI, việc làm, giao tiếp, doanh nghiệp, quản trị"),("Quy ước","include = bắt buộc/tái sử dụng; extend = tùy chọn hoặc theo điều kiện")]
    data=[[Paragraph(pdf_safe(a),label),Paragraph(pdf_safe(b),small)] for a,b in rows]
    t=Table(data,colWidths=[1.75*inch,4.8*inch],hAlign="LEFT")
    t.setStyle(TableStyle([("GRID",(0,0),(-1,-1),0.45,colors.HexColor("#D8DDE6")),("BACKGROUND",(0,0),(0,-1),colors.HexColor(f"#{VIOLET_LIGHT}")),("VALIGN",(0,0),(-1,-1),"MIDDLE"),("LEFTPADDING",(0,0),(-1,-1),7),("RIGHTPADDING",(0,0),(-1,-1),7),("TOPPADDING",(0,0),(-1,-1),6),("BOTTOMPADDING",(0,0),(-1,-1),6)])); story += [t,Paragraph("1.1. Giới hạn được ghi nhận trung thực",h2)]
    limits=["CV PDF tải lên được lưu dạng base64 trong MongoDB qua Resume ảo. Cách này phù hợp quy mô đồ án nhưng nên chuyển sang object storage khi triển khai production.","Điểm phù hợp hiển thị cố định trong một phần giao diện doanh nghiệp không phải kết quả AI được lưu ở backend; tài liệu không xem đó là chức năng chấm ứng viên chính thức.","Backend cập nhật trạng thái hồ sơ theo enum nhưng chưa ép buộc thứ tự chuyển trạng thái như một state machine.","Không có API riêng cho kiểm duyệt CV, xử lý báo cáo hay nhật ký hệ thống; vì vậy các mục này không được đưa vào Use Case hiện hành.","Các chức năng AI phụ thuộc khóa/cấu hình, hạn mức và tính sẵn sàng của dịch vụ AI."]
    story.append(ListFlowable([ListItem(Paragraph(pdf_safe(x),body),leftIndent=12) for x in limits],bulletType="bullet",start="circle",leftIndent=18,bulletFontName="Arial",bulletFontSize=7))

    story += [PageBreak(),Paragraph("2. Danh mục Use Case",h1)]
    data=[[Paragraph("Mã",ParagraphStyle("TH",parent=small,fontName="Arial-Bold",textColor=colors.white,alignment=TA_CENTER)),Paragraph("Tên Use Case",ParagraphStyle("TH2",parent=small,fontName="Arial-Bold",textColor=colors.white,alignment=TA_CENTER)),Paragraph("Tác nhân chính",ParagraphStyle("TH3",parent=small,fontName="Arial-Bold",textColor=colors.white,alignment=TA_CENTER)),Paragraph("Mức độ",ParagraphStyle("TH4",parent=small,fontName="Arial-Bold",textColor=colors.white,alignment=TA_CENTER))]]
    for uc in USE_CASES:
        status="Đã triển khai" if "phụ thuộc" not in uc.evidence and "giới hạn" not in uc.evidence else "Có điều kiện/giới hạn"
        data.append([Paragraph(uc.id,label),Paragraph(pdf_safe(uc.name),small),Paragraph(pdf_safe(uc.actor),small),Paragraph(pdf_safe(status),small)])
    t=LongTable(data,colWidths=[0.65*inch,2.6*inch,1.75*inch,1.55*inch],repeatRows=1,hAlign="LEFT")
    t.setStyle(TableStyle([("BACKGROUND",(0,0),(-1,0),colors.HexColor(f"#{VIOLET}")),("GRID",(0,0),(-1,-1),0.35,colors.HexColor("#D8DDE6")),("VALIGN",(0,0),(-1,-1),"MIDDLE"),("LEFTPADDING",(0,0),(-1,-1),5),("RIGHTPADDING",(0,0),(-1,-1),5),("TOPPADDING",(0,0),(-1,-1),4),("BOTTOMPADDING",(0,0),(-1,-1),4)])); story.append(t)

    story += [PageBreak(),Paragraph("3. Bộ sơ đồ Use Case",h1)]
    for idx,spec in enumerate(DIAGRAMS,1):
        if idx>1: story.append(PageBreak())
        story += [Paragraph(f"3.{idx}. {pdf_safe(spec['title'])}",h2),RLImage(str(DIAGRAM_DIR/f"{spec['key']}.png"),width=6.55*inch,height=3.82*inch),Paragraph(f"Hình 3.{idx}. {pdf_safe(spec['title'])}",caption)]

    story += [PageBreak(),Paragraph("4. Đặc tả chi tiết",h1),Paragraph("Mỗi Use Case dưới đây nêu tác nhân, mục tiêu, tiền/hậu điều kiện, luồng chính, nhánh thay thế, ngoại lệ, quan hệ UML và bằng chứng triển khai tương ứng.",body)]
    for uc in USE_CASES:
        story += [PageBreak(),Paragraph(f"{uc.id} - {pdf_safe(uc.name)}",h1)]
        meta=[("Tác nhân chính",uc.actor),("Tác nhân hỗ trợ",uc.supporting),("Mục tiêu",uc.goal),("Kích hoạt",uc.trigger),("Quan hệ",uc.relations),("Bằng chứng / mức độ",uc.evidence)]
        data=[[Paragraph(pdf_safe(a),label),Paragraph(pdf_safe(b),small)] for a,b in meta]
        t=Table(data,colWidths=[1.55*inch,5.0*inch],hAlign="LEFT",splitByRow=1)
        t.setStyle(TableStyle([("GRID",(0,0),(-1,-1),0.35,colors.HexColor("#D8DDE6")),("BACKGROUND",(0,0),(0,-1),colors.HexColor(f"#{VIOLET_LIGHT}")),("VALIGN",(0,0),(-1,-1),"TOP"),("LEFTPADDING",(0,0),(-1,-1),6),("RIGHTPADDING",(0,0),(-1,-1),6),("TOPPADDING",(0,0),(-1,-1),5),("BOTTOMPADDING",(0,0),(-1,-1),5)])); story.append(t)
        for heading,items in (("Tiền điều kiện",uc.pre),("Hậu điều kiện",uc.post),("Luồng chính",uc.main),("Luồng thay thế",uc.alt),("Ngoại lệ",uc.errors)):
            story.append(Paragraph(heading,h2))
            bullet_type="1" if heading=="Luồng chính" else "bullet"
            story.append(ListFlowable([ListItem(Paragraph(pdf_safe(x),body),leftIndent=12) for x in items],bulletType=bullet_type,start="1" if bullet_type=="1" else "circle",leftIndent=18,bulletFontName="Arial",bulletFontSize=7))

    story += [PageBreak(),Paragraph("5. Ma trận truy vết Use Case - thành phần",h1)]
    trace=[("UC-01..03","User, AuthContext, RoleAccessGuard","/api/register, /api/login, /api/me, /api/user/*"),("UC-04..06","Resume, ResumeForm, ResumeTemplate, aiRoutes","/api/resume*, /api/ai/resume/*"),("UC-07..13","Job, Application, AllJobs, JobDetail, AiInterview","/api/jobs*, /api/ai/resume/score, /api/ai/interview/turn"),("UC-14..16","Message, HiddenChat, ChatReadState, Notification","/api/messages, /api/chat/*, /api/notifications/*"),("UC-17..20","CompanyDashboard, Job, Application, Resume","/api/jobs/my, /api/jobs/applications*, /api/resumes/view/*"),("UC-21..24","AdminDashboard, AdminUsers, AdminCompanies, AdminJobs","/api/admin/*"),("UC-25","jobExpiryCron, Notification","/api/cron/job-expiry")]
    data=[[Paragraph("Use Case",ParagraphStyle("T1",parent=small,fontName="Arial-Bold",textColor=colors.white,alignment=TA_CENTER)),Paragraph("Thành phần chính",ParagraphStyle("T2",parent=small,fontName="Arial-Bold",textColor=colors.white,alignment=TA_CENTER)),Paragraph("API/Bằng chứng",ParagraphStyle("T3",parent=small,fontName="Arial-Bold",textColor=colors.white,alignment=TA_CENTER))]]
    data += [[Paragraph(pdf_safe(a),label),Paragraph(pdf_safe(b),small),Paragraph(pdf_safe(c),small)] for a,b,c in trace]
    t=LongTable(data,colWidths=[0.95*inch,2.7*inch,2.9*inch],repeatRows=1,hAlign="LEFT")
    t.setStyle(TableStyle([("BACKGROUND",(0,0),(-1,0),colors.HexColor(f"#{VIOLET}")),("GRID",(0,0),(-1,-1),0.4,colors.HexColor("#D8DDE6")),("VALIGN",(0,0),(-1,-1),"TOP"),("LEFTPADDING",(0,0),(-1,-1),6),("RIGHTPADDING",(0,0),(-1,-1),6),("TOPPADDING",(0,0),(-1,-1),6),("BOTTOMPADDING",(0,0),(-1,-1),6)])); story += [t,Paragraph("5.1. Kết luận sử dụng trong luận văn",h2),Paragraph("Bộ Use Case phản ánh một hệ thống end-to-end gồm ba vai trò nghiệp vụ, luồng CV - việc làm - ứng tuyển - xử lý hồ sơ, giao tiếp thời gian thực, thông báo, AI hỗ trợ và quản trị. Khi đưa vào luận văn, nên đặt các sơ đồ tổng quan trong chương Phân tích yêu cầu và chuyển các bảng chi tiết dài sang phụ lục để giữ mạch đọc.",body)]
    doc.build(story,onFirstPage=header_footer,onLaterPages=header_footer)


def main():
    OUT.mkdir(parents=True,exist_ok=True); DIAGRAM_DIR.mkdir(parents=True,exist_ok=True); QA_DIR.mkdir(parents=True,exist_ok=True)
    for spec in DIAGRAMS: draw_diagram_png(spec,DIAGRAM_DIR/f"{spec['key']}.png")
    build_drawio(OUT/"RabbitCV-Use-Case-Chi-Tiet.drawio")
    build_docx(OUT/"Dac_ta_Use_Case_RabbitCV.docx")
    build_pdf(OUT/"Dac_ta_Use_Case_RabbitCV.pdf")
    build_readme(OUT/"README.md")
    print(f"Built {len(DIAGRAMS)} diagrams and {len(USE_CASES)} use-case specifications in {OUT}")


if __name__=="__main__":
    main()
