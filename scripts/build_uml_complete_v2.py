from __future__ import annotations

import html
from datetime import datetime, timezone
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "bao-cao" / "uml-v2"
OUT_FILE = OUT_DIR / "RabbitCV-UML-Toan-Bo-V2.drawio"

W, H = 1920, 1080
INK = "#172033"
MUTED = "#60708A"
LINE = "#718096"
BLUE, BLUE_BG = "#2563EB", "#EAF2FF"
VIOLET, VIOLET_BG = "#6C4CF1", "#EEEAFE"
GREEN, GREEN_BG = "#159447", "#E9F8EF"
ORANGE, ORANGE_BG = "#E26018", "#FFF1E8"
RED, RED_BG = "#D13C3C", "#FDECEC"
YELLOW_BG = "#FFFBE8"


def q(value: object) -> str:
    return html.escape(str(value), quote=True)


def vertex(cid: str, value: str, style: str, x: float, y: float, w: float, h: float) -> str:
    return (
        f'<mxCell id="{q(cid)}" value="{q(value)}" style="{style}" vertex="1" parent="1">'
        f'<mxGeometry x="{x}" y="{y}" width="{w}" height="{h}" as="geometry"/></mxCell>'
    )


def html_vertex(cid: str, value: str, style: str, x: float, y: float, w: float, h: float) -> str:
    return vertex(cid, value, style, x, y, w, h)


def edge(cid: str, source: str, target: str, label: str = "", style: str | None = None) -> str:
    style = style or (
        f"edgeStyle=orthogonalEdgeStyle;rounded=1;html=1;strokeColor={LINE};strokeWidth=1.6;"
        "endArrow=open;endFill=0;fontSize=12;labelBackgroundColor=#FFFFFF;"
    )
    return (
        f'<mxCell id="{q(cid)}" value="{q(label)}" style="{style}" edge="1" parent="1" '
        f'source="{q(source)}" target="{q(target)}"><mxGeometry relative="1" as="geometry"/></mxCell>'
    )


def page(pid: str, name: str, cells: list[str]) -> str:
    roots = "\n".join(['<mxCell id="0"/>', '<mxCell id="1" parent="0"/>', *cells])
    return (
        f'<diagram id="{q(pid)}" name="{q(name)}"><mxGraphModel dx="{W}" dy="{H}" grid="1" '
        f'gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" '
        f'pageScale="1" pageWidth="{W}" pageHeight="{H}" math="0" shadow="0" background="#FFFFFF">'
        f'<root>{roots}</root></mxGraphModel></diagram>'
    )


def header(cells: list[str], pid: str, title: str, subtitle: str, accent: str) -> None:
    cells.append(vertex(
        f"{pid}-title", title,
        f"text;html=1;align=left;verticalAlign=middle;fontSize=30;fontStyle=1;fontColor={INK};"
        "strokeColor=none;fillColor=none;",
        60, 18, 1660, 46,
    ))
    cells.append(vertex(
        f"{pid}-subtitle", subtitle,
        f"text;html=1;align=left;verticalAlign=middle;fontSize=14;fontColor={MUTED};"
        "strokeColor=none;fillColor=none;",
        62, 64, 1740, 28,
    ))
    cells.append(vertex(
        f"{pid}-line", "", f"rounded=1;arcSize=50;fillColor={accent};strokeColor={accent};",
        60, 100, 1800, 6,
    ))


def class_node(
    cells: list[str], pid: str, key: str, name: str, fields: list[str],
    x: int, y: int, w: int, h: int, color: str, bg: str, stereotype: str = "model",
) -> str:
    cid = f"{pid}-{key}"
    rows = "<br>".join(q(field) for field in fields)
    label = (
        f'<div style="text-align:center;color:{MUTED};font-size:11px">&lt;&lt;{q(stereotype)}&gt;&gt;</div>'
        f'<div style="text-align:center;font-size:18px"><b>{q(name)}</b></div>'
        f'<hr style="border:0;border-top:1px solid {color};margin:7px 0">'
        f'<div style="text-align:left;line-height:1.5">{rows}</div>'
    )
    cells.append(html_vertex(
        cid, label,
        f"rounded=1;arcSize=8;whiteSpace=wrap;html=1;align=left;verticalAlign=top;spacing=11;"
        f"fillColor={bg};strokeColor={color};strokeWidth=2;fontSize=13;fontColor={INK};",
        x, y, w, h,
    ))
    return cid


def class_page(
    pid: str, name: str, subtitle: str,
    classes: list[tuple[str, str, list[str], int, int, int, int, str, str, str]],
    relations: list[tuple[str, str, str, str]],
    notes: list[tuple[str, int, int, int, int]] | None = None,
) -> str:
    cells: list[str] = []
    header(cells, pid, name, subtitle, VIOLET)
    ids: dict[str, str] = {}
    for key, title, fields, x, y, w, h, color, bg, stereo in classes:
        ids[key] = class_node(cells, pid, key, title, fields, x, y, w, h, color, bg, stereo)
    assoc = (
        f"edgeStyle=orthogonalEdgeStyle;rounded=1;html=1;strokeColor={LINE};strokeWidth=1.6;"
        "endArrow=open;endFill=0;fontSize=12;labelBackgroundColor=#FFFFFF;"
    )
    dep = (
        f"edgeStyle=orthogonalEdgeStyle;rounded=1;html=1;strokeColor={VIOLET};strokeWidth=1.6;"
        f"dashed=1;dashPattern=7 5;endArrow=open;endFill=0;fontSize=12;fontColor={VIOLET};"
        "labelBackgroundColor=#FFFFFF;"
    )
    comp = (
        f"edgeStyle=orthogonalEdgeStyle;rounded=1;html=1;strokeColor={BLUE};strokeWidth=1.7;"
        f"startArrow=diamond;startFill=1;endArrow=open;endFill=0;fontSize=12;fontColor={INK};"
        "labelBackgroundColor=#FFFFFF;"
    )
    for i, (src, dst, label, kind) in enumerate(relations):
        cells.append(edge(f"{pid}-rel-{i}", ids[src], ids[dst], label, comp if kind == "composition" else dep if kind == "dependency" else assoc))
    for i, (text, x, y, w, h) in enumerate(notes or []):
        cells.append(vertex(
            f"{pid}-note-{i}", text,
            f"shape=note;whiteSpace=wrap;html=1;fillColor={YELLOW_BG};strokeColor=#D4A72C;"
            f"fontSize=12;fontColor={INK};spacing=9;",
            x, y, w, h,
        ))
    return page(pid, name, cells)


def build_class_pages() -> list[str]:
    return [
        class_page(
            "c01-user-resume", "Class 1 — Người dùng, hồ sơ và CV",
            "Thể hiện User, Resume và các cấu trúc con được nhúng trực tiếp trong Resume.",
            [
                ("user", "User", ["+_id: ObjectId", "+username / email: String", "+password: String (select=false)", "+role: admin | employee | company", "+status / isBanned", "+companyVerificationStatus", "+savedJobs[]", "+educations[] / experiences[] / activities[]"], 70, 150, 360, 330, VIOLET, VIOLET_BG, "model"),
                ("resume", "Resume", ["+_id: ObjectId", "+userId: ObjectId", "+title / fileName: String", "+pdfData: Base64 String", "+isVirtual: Boolean", "+personalInfo / bio", "+selectedTemplate: Enum", "+createdAt / updatedAt"], 500, 150, 370, 330, BLUE, BLUE_BG, "model"),
                ("experience", "Experience", ["+title / company", "+location", "+startDate / endDate", "+description"], 980, 145, 270, 225, GREEN, GREEN_BG, "embedded"),
                ("education", "Education", ["+title / major", "+company / location", "+startDate / endDate", "+score / description"], 1320, 145, 280, 235, GREEN, GREEN_BG, "embedded"),
                ("skill", "Skill", ["+title", "+description", "+performance"], 1650, 145, 220, 180, ORANGE, ORANGE_BG, "embedded"),
                ("project", "Project", ["+title / company", "+date range", "+location / link", "+description"], 950, 580, 280, 220, BLUE, BLUE_BG, "embedded"),
                ("certificate", "Certificate", ["+title", "+date", "+publisher", "+description"], 1290, 580, 270, 220, BLUE, BLUE_BG, "embedded"),
                ("misc", "Các mục bổ sung", ["ProfileLink[]", "Language[]", "Award[]", "Hobby[]"], 1620, 580, 250, 190, VIOLET, VIOLET_BG, "embedded"),
            ],
            [
                ("user", "resume", "1 sở hữu 0..*", "association"),
                ("resume", "experience", "1 chứa 0..*", "composition"),
                ("resume", "education", "1 chứa 0..*", "composition"),
                ("resume", "skill", "1 chứa 0..*", "composition"),
                ("resume", "project", "1 chứa 0..*", "composition"),
                ("resume", "certificate", "1 chứa 0..*", "composition"),
                ("resume", "misc", "1 chứa 0..*", "composition"),
            ],
            [("isVirtual=true đại diện CV PDF tải lên khi ứng tuyển; CV ảo không xuất hiện trong thư viện CV thông thường.", 90, 720, 430, 135)],
        ),
        class_page(
            "c02-recruitment", "Class 2 — Tuyển dụng và ứng tuyển",
            "Miền nghiệp vụ kết nối doanh nghiệp, việc làm, CV, hồ sơ ứng tuyển và thông báo.",
            [
                ("candidate", "User (Candidate)", ["+_id: ObjectId", "+role = employee", "+fullName / email / phone", "+savedJobs[]"], 80, 160, 310, 230, VIOLET, VIOLET_BG, "role"),
                ("company", "User (Company)", ["+_id: ObjectId", "+role = company", "+company profile", "+companyVerificationStatus"], 80, 650, 310, 230, GREEN, GREEN_BG, "role"),
                ("resume", "Resume", ["+_id: ObjectId", "+userId: ObjectId", "+title", "+isVirtual", "+personalInfo"], 500, 160, 300, 240, BLUE, BLUE_BG, "model"),
                ("job", "Job", ["+_id / companyId", "+title / location / salary", "+requirements[] / benefits[]", "+status: Draft | Active | Expired | Deleted", "+expiryDate / deletedAt", "+isAdminHidden"], 950, 145, 390, 310, GREEN, GREEN_BG, "model"),
                ("application", "Application", ["+jobId / candidateId / resumeId", "+fullName / email / phone", "+coverLetter", "+status: Pending | Reviewing | Interview", "+status: Offered | Rejected | Accepted", "+jobSnapshot"], 950, 620, 420, 300, ORANGE, ORANGE_BG, "model"),
                ("notification", "Notification", ["+recipient", "+recipientRole", "+type / title / message", "+link / isRead", "+createdAt"], 1540, 400, 300, 255, BLUE, BLUE_BG, "model"),
            ],
            [
                ("company", "job", "1 đăng 0..*", "association"),
                ("candidate", "resume", "1 sở hữu 0..*", "association"),
                ("candidate", "application", "1 nộp 0..*", "association"),
                ("job", "application", "1 nhận 0..*", "association"),
                ("resume", "application", "1 được chọn bởi 0..*", "association"),
                ("candidate", "notification", "1 nhận 0..*", "association"),
                ("company", "notification", "1 nhận 0..*", "association"),
            ],
            [("Unique index (jobId, candidateId) ngăn một ứng viên nộp trùng cùng Job. jobSnapshot giữ lịch sử khi tin tuyển dụng thay đổi.", 450, 820, 390, 135)],
        ),
        class_page(
            "c03-communication", "Class 3 — Chat và thông báo",
            "Tin nhắn được lưu vĩnh viễn; trạng thái đọc và mốc ẩn là dữ liệu riêng theo từng người dùng.",
            [
                ("user", "User", ["+_id: ObjectId", "+username", "+role"], 80, 180, 270, 190, VIOLET, VIOLET_BG, "model"),
                ("message", "Message", ["+senderId: String", "+senderName: String", "+room: String", "+content: String", "+image: String", "+createdAt / updatedAt"], 470, 145, 340, 285, BLUE, BLUE_BG, "model"),
                ("hidden", "HiddenChat", ["+userId: ObjectId", "+room: String", "+hiddenAt: Date", "+unique(userId, room)"], 980, 145, 320, 235, VIOLET, VIOLET_BG, "model"),
                ("read", "ChatReadState", ["+userId: ObjectId", "+room: String", "+lastReadAt: Date", "+unique(userId, room)"], 1480, 145, 330, 235, GREEN, GREEN_BG, "model"),
                ("notification", "Notification", ["+recipient: ObjectId", "+recipientRole: String", "+type: Enum", "+title / message / link", "+isRead: Boolean", "+createdAt"], 680, 630, 360, 285, ORANGE, ORANGE_BG, "model"),
                ("socket", "SocketGateway", ["+joinUserRoom(userId)", "+emitNewMessage(receiverId, message)", "+disconnect()"], 1260, 650, 390, 235, BLUE, BLUE_BG, "service"),
            ],
            [
                ("user", "message", "1 gửi 0..*", "association"),
                ("user", "hidden", "1 có 0..*", "association"),
                ("user", "read", "1 có 0..*", "association"),
                ("user", "notification", "1 nhận 0..*", "association"),
                ("socket", "message", "phát bản tin đã lưu", "dependency"),
            ],
            [("Ẩn hội thoại không xóa Message. Khi tải lịch sử, API lọc createdAt > HiddenChat.hiddenAt.", 80, 760, 430, 130)],
        ),
        class_page(
            "c04-services", "Class 4 — AI, thông báo và tác vụ nền",
            "Các service không sở hữu dữ liệu; chúng phụ thuộc model và nhà cung cấp bên ngoài.",
            [
                ("user", "User", ["+_id", "+role"], 70, 165, 230, 155, VIOLET, VIOLET_BG, "model"),
                ("usage", "AiUsage", ["+userId", "+feature: Enum", "+provider / model", "+status", "+inputHash", "+inputTokens / outputTokens", "+latencyMs / errorCode"], 400, 135, 340, 300, ORANGE, ORANGE_BG, "model"),
                ("sanitizer", "AIDataSanitizer", ["+cleanAiText()", "+sanitizeResumeForAi()", "+sanitizeJobForAi()"], 870, 145, 340, 230, BLUE, BLUE_BG, "service"),
                ("ai", "AiService", ["+getAiStatus(userId)", "+runStructuredAiRequest()", "+checkQuota()", "+validateSchema()"], 1370, 135, 350, 250, VIOLET, VIOLET_BG, "service"),
                ("groq", "Groq API", ["+chat.completions", "+structured JSON output", "+token usage"], 1470, 550, 300, 220, GREEN, GREEN_BG, "external"),
                ("job", "Job", ["+status", "+expiryDate", "+expiryNotifiedAt", "+expiredNotifiedAt"], 100, 650, 300, 230, GREEN, GREEN_BG, "model"),
                ("expiry", "JobExpiryService", ["+runJobExpiryCheck()", "+findExpiringJobs()", "+expireJobs()"], 550, 650, 330, 220, ORANGE, ORANGE_BG, "service"),
                ("notifier", "NotificationService", ["+createNotification()", "+createNotificationsBulk()"], 1030, 650, 330, 200, BLUE, BLUE_BG, "service"),
            ],
            [
                ("user", "usage", "1 phát sinh 0..*", "association"),
                ("ai", "sanitizer", "làm sạch input/output", "dependency"),
                ("ai", "usage", "ghi quota và thống kê", "dependency"),
                ("ai", "groq", "gửi prompt + JSON Schema", "dependency"),
                ("expiry", "job", "đọc và cập nhật", "dependency"),
                ("expiry", "notifier", "tạo cảnh báo", "dependency"),
            ],
            [("AiUsage có TTL index 90 ngày và không lưu prompt/CV nguyên văn. Khóa Groq chỉ được đọc ở backend.", 1370, 840, 400, 120)],
        ),
    ]


def sequence_page(
    pid: str, name: str, subtitle: str,
    participants: list[tuple[str, str]],
    messages: list[tuple[str, str, str, str]],
    notes: list[tuple[str, int, int, int, int]] | None = None,
) -> str:
    cells: list[str] = []
    header(cells, pid, name, subtitle, BLUE)
    left, right = 90, 1830
    gap = (right - left) / max(1, len(participants) - 1)
    centers: dict[str, float] = {}
    for i, (key, label) in enumerate(participants):
        cx = left + gap * i
        centers[key] = cx
        color, bg = (VIOLET, VIOLET_BG) if i == 0 else (BLUE, BLUE_BG)
        cells.append(vertex(
            f"{pid}-p-{key}", label,
            f"rounded=1;arcSize=10;whiteSpace=wrap;html=1;fillColor={bg};strokeColor={color};"
            f"strokeWidth=2;fontSize=14;fontStyle=1;fontColor={INK};",
            cx - 92, 130, 184, 58,
        ))
        cells.append(vertex(
            f"{pid}-life-{key}", "",
            "shape=line;dashed=1;dashPattern=6 6;strokeColor=#9AA8BC;strokeWidth=1.2;direction=south;",
            cx, 188, 1, 770,
        ))
    max_height = 720
    step = max(41, min(58, max_height / max(1, len(messages))))
    y0 = 225
    for i, (src, dst, label, kind) in enumerate(messages):
        y = y0 + i * step
        if src == dst or kind == "internal":
            cx = centers[src]
            cells.append(vertex(
                f"{pid}-self-{i}", label,
                f"rounded=1;arcSize=8;whiteSpace=wrap;html=1;fillColor={YELLOW_BG};"
                f"strokeColor=#D4A72C;fontSize=11;fontColor={INK};spacing=5;",
                cx - 103, y - 15, 206, 34,
            ))
            continue
        sa, ta = f"{pid}-sa-{i}", f"{pid}-ta-{i}"
        invisible = "ellipse;fillColor=none;strokeColor=none;opacity=0;"
        cells.append(vertex(sa, "", invisible, centers[src], y, 1, 1))
        cells.append(vertex(ta, "", invisible, centers[dst], y, 1, 1))
        is_return = kind == "return"
        color = GREEN if is_return else BLUE
        style = (
            f"edgeStyle=none;rounded=0;html=1;strokeColor={color};strokeWidth=1.7;"
            f"endArrow=block;endFill=1;dashed={1 if is_return else 0};fontSize=11;"
            f"fontColor={INK};labelBackgroundColor=#FFFFFF;"
        )
        cells.append(edge(f"{pid}-m-{i}", sa, ta, label, style))
    for i, (text, x, y, w, h) in enumerate(notes or []):
        cells.append(vertex(
            f"{pid}-note-{i}", text,
            f"shape=note;whiteSpace=wrap;html=1;fillColor={YELLOW_BG};strokeColor=#D4A72C;"
            f"fontSize=11;fontColor={INK};spacing=7;",
            x, y, w, h,
        ))
    cells.append(vertex(
        f"{pid}-legend", "Nét liền: yêu cầu/lệnh  •  Nét đứt xanh lá: phản hồi  •  Ô vàng: xử lý nội bộ",
        f"text;html=1;align=center;fontSize=12;fontColor={MUTED};strokeColor=none;fillColor=none;",
        470, 1005, 980, 25,
    ))
    return page(pid, name, cells)


def build_sequence_pages() -> list[str]:
    specs = [
        ("s01-auth", "Sequence 1 — Đăng ký, đăng nhập và khôi phục phiên", "JWT nằm trong cookie HTTP-only; AuthContext giữ một nguồn trạng thái xác thực thống nhất.",
         [("u", "Người dùng"), ("ui", "React Auth UI"), ("ctx", "AuthContext"), ("api", "Express API"), ("db", "MongoDB")],
         [("u","ui","Nhập thông tin đăng ký","call"),("ui","api","POST /api/register","call"),("api","api","Validate + bcrypt.hash()","internal"),("api","db","Tạo User","call"),("db","api","User đã tạo","return"),("api","ui","201 đăng ký thành công","return"),("u","ui","Nhập tài khoản và mật khẩu","call"),("ui","api","POST /api/login","call"),("api","db","User.findOne() + password hash","call"),("api","api","bcrypt.compare() + jwt.sign()","internal"),("api","ui","Set-Cookie HTTP-only + user","return"),("ui","ctx","login(user)","call"),("ctx","api","GET /api/me khi tải lại","call"),("api","ctx","Phiên hợp lệ","return")],
         [("Cookie được gửi tự động khi fetch dùng credentials: include.", 80, 860, 350, 90)]),
        ("s02-profile", "Sequence 2 — Cập nhật hồ sơ và bảo mật", "API chỉ cho người dùng cập nhật hồ sơ của chính mình; mật khẩu được băm lại tại backend.",
         [("u", "Người dùng"), ("ui", "Profile / Settings"), ("api", "User API"), ("db", "MongoDB")],
         [("u","ui","Sửa thông tin cá nhân/công ty","call"),("ui","api","PUT /api/user/profile","call"),("api","api","authMiddleware + whitelist fields","internal"),("api","db","User.findByIdAndUpdate()","call"),("db","api","User đã cập nhật","return"),("api","ui","Payload an toàn","return"),("u","ui","Đổi mật khẩu","call"),("ui","api","PUT /api/user/password","call"),("api","db","Đọc password hash hiện tại","call"),("api","api","So sánh cũ + băm mật khẩu mới","internal"),("api","db","Lưu password hash mới","call"),("api","ui","Đổi mật khẩu thành công","return")],
         []),
        ("s03-cv", "Sequence 3 — Tạo, lưu, mở và tải CV", "Danh sách CV loại bỏ pdfData; tải PDF dùng vùng CV đã dựng và hộp thoại in của trình duyệt.",
         [("u", "Ứng viên"), ("ui", "CV Editor"), ("api", "Resume API"), ("db", "MongoDB"), ("print", "Browser Print")],
         [("u","ui","Tạo mới hoặc mở CV","call"),("ui","api","GET /api/resume/:id (nếu chỉnh sửa)","call"),("api","db","Tìm Resume theo _id + userId","call"),("db","api","Resume","return"),("api","ui","Dữ liệu CV đã sanitize","return"),("u","ui","Nhập nội dung và chọn template","call"),("ui","ui","Dựng preview","internal"),("ui","api","POST /api/resume","call"),("api","db","Tạo/cập nhật Resume","call"),("api","ui","Resume đã lưu","return"),("u","ui","Nhấn Tải CV","call"),("ui","print","In vùng CV","call"),("print","u","Lưu PDF","return")],
         [("CV PDF tải lên được lưu Base64; hướng production là object storage.", 1430, 845, 380, 100)]),
        ("s04-ai", "Sequence 4 — CV và phỏng vấn với AI", "Mọi yêu cầu AI đi qua sanitize, quota, rate limit và JSON Schema trước khi trả kết quả.",
         [("u", "Ứng viên"), ("ui", "React AI UI"), ("router", "AI Router"), ("db", "MongoDB"), ("groq", "Groq API")],
         [("u","ui","Review/cải thiện CV hoặc trả lời phỏng vấn","call"),("ui","router","POST /api/ai/...","call"),("router","router","Auth + rate limit + sanitize input","internal"),("router","db","Kiểm tra quota + tạo AiUsage pending","call"),("db","router","Còn lượt","return"),("router","groq","Prompt rút gọn + JSON Schema","call"),("groq","router","JSON + token usage","return"),("router","router","Validate schema + sanitize output","internal"),("router","db","Cập nhật success/failed, token, latency","call"),("router","ui","Kết quả + model + lượt còn lại","return"),("ui","u","Hiển thị đánh giá/tổng kết","return")],
         [("Khóa Groq chỉ tồn tại tại backend; AiUsage không lưu prompt hoặc CV nguyên văn.", 70, 840, 410, 105)]),
        ("s05-save-job", "Sequence 5 — Lưu và bỏ lưu việc làm", "Mutation cập nhật User.savedJobs rồi đồng bộ cache TanStack Query trên các màn hình.",
         [("u", "Ứng viên"), ("ui", "Job Card / Detail"), ("query", "TanStack Query"), ("api", "Saved Jobs API"), ("db", "MongoDB")],
         [("u","ui","Nhấn Lưu/Bỏ lưu","call"),("ui","query","mutation(jobId)","call"),("query","api","POST hoặc DELETE /api/saved-jobs/:jobId","call"),("api","api","Xác thực role employee","internal"),("api","db","Cập nhật User.savedJobs","call"),("db","api","Danh sách mới","return"),("api","query","200 + saved state","return"),("query","query","Cập nhật/invalidate cache","internal"),("query","ui","Render trạng thái mới ở mọi màn hình","return"),("ui","u","Biểu tượng lưu đồng nhất","return")],
         []),
        ("s06-apply-saved", "Sequence 6 — Ứng tuyển bằng CV đã tạo", "API xác thực JWT, kiểm tra tình trạng Job, quyền sở hữu CV và hồ sơ trùng trước khi tạo Application.",
         [("u", "Ứng viên"), ("ui", "Job Detail"), ("api", "Ứng tuyển API"), ("db", "MongoDB"), ("noti", "Notification Service")],
         [("u","ui","Chọn CV đã tạo và nhấn ứng tuyển","call"),("ui","api","POST /api/jobs/apply {jobId, resumeId}","call"),("api","api","Xác thực JWT từ cookie","internal"),("api","db","Tìm Job và kiểm tra còn nhận hồ sơ","call"),("api","db","Kiểm tra CV thuộc ứng viên","call"),("api","db","Kiểm tra hồ sơ ứng tuyển trùng","call"),("api","db","Lưu Application Pending + jobSnapshot","call"),("api","noti","Tạo thông báo cho doanh nghiệp và ứng viên","call"),("noti","db","insertMany(2 Notification)","call"),("noti","api","Hoàn tất tạo thông báo","return"),("api","ui","201 + Application trạng thái Pending","return"),("ui","u","Thông báo thành công và chuyển trang","return")],
         [("Nếu đã ứng tuyển, API trả 400; unique index (jobId, candidateId) là lớp bảo vệ cuối.", 80, 870, 460, 90)]),
        ("s07-apply-file", "Sequence 7 — Ứng tuyển bằng CV PDF tải lên", "Tệp PDF hợp lệ tạo Resume isVirtual=true rồi được tham chiếu bởi Application.",
         [("u", "Ứng viên"), ("ui", "Job Detail"), ("api", "Upload/Application API"), ("db", "MongoDB"), ("noti", "Notification Service")],
         [("u","ui","Chọn tệp PDF","call"),("ui","ui","Kiểm tra MIME, đuôi và kích thước","internal"),("ui","api","POST /api/jobs/apply-file","call"),("api","api","Auth + kiểm tra Job + trùng hồ sơ","internal"),("api","db","Tạo Resume {pdfData,isVirtual=true}","call"),("db","api","virtualResume._id","return"),("api","db","Tạo Application","call"),("api","noti","Tạo thông báo ứng tuyển","call"),("noti","db","Lưu Notification","call"),("api","ui","201 thành công","return"),("ui","u","Hiển thị Pending","return")],
         []),
        ("s08-job-crud", "Sequence 8 — Doanh nghiệp quản lý tin tuyển dụng", "Company chỉ thao tác Job do mình sở hữu; xóa dùng trạng thái Deleted và deletedAt.",
         [("c", "Doanh nghiệp"), ("ui", "Company Dashboard"), ("api", "Jobs API"), ("db", "MongoDB")],
         [("c","ui","Tạo hoặc chỉnh sửa Job","call"),("ui","api","POST /api/jobs hoặc PUT /api/jobs/:id","call"),("api","api","Auth role company + validate fields","internal"),("api","db","Tạo/cập nhật Job theo companyId","call"),("db","api","Job đã lưu","return"),("api","ui","Job payload","return"),("c","ui","Đóng/gia hạn/xóa Job","call"),("ui","api","PUT hoặc DELETE /api/jobs/:id","call"),("api","db","Kiểm tra quyền sở hữu","call"),("api","db","Cập nhật status/expiryDate/deletedAt","call"),("api","ui","Trạng thái mới","return"),("ui","c","Cập nhật dashboard","return")],
         []),
        ("s09-app-status", "Sequence 9 — Doanh nghiệp cập nhật trạng thái hồ sơ", "Application chỉ được cập nhật khi Job thuộc doanh nghiệp; ứng viên nhận thông báo qua polling.",
         [("c", "Doanh nghiệp"), ("ui", "Company Dashboard"), ("api", "Jobs API"), ("db", "MongoDB"), ("u", "Ứng viên")],
         [("c","ui","Chọn trạng thái mới","call"),("ui","api","PUT /api/jobs/applications/:id","call"),("api","db","Tìm Application + Job","call"),("db","api","companyId + Application","return"),("api","api","Kiểm tra quyền company/admin","internal"),("api","db","Cập nhật Application.status","call"),("api","db","Tạo Notification cho candidate","call"),("api","ui","Application mới","return"),("ui","c","Cập nhật bảng ứng viên","return"),("u","api","GET /api/notifications","call"),("api","u","Thông báo trạng thái","return")],
         [("Backend hiện chưa ép buộc thứ tự chuyển trạng thái bằng state machine.", 1420, 840, 380, 100)]),
        ("s10-chat", "Sequence 10 — Chat thời gian thực", "REST lưu Message trước; Socket.IO chỉ phát bản tin đã lưu tới phòng người nhận.",
         [("a", "Người gửi"), ("ca", "React Client A"), ("api", "Express API"), ("db", "MongoDB"), ("io", "Socket.IO"), ("cb", "React Client B")],
         [("a","ca","Gửi nội dung/hình ảnh","call"),("ca","api","POST /api/messages","call"),("api","api","Xác thực sender + room","internal"),("api","db","Lưu Message","call"),("db","api","Message có _id","return"),("api","io","emit newMessage tới user_receiver","call"),("io","cb","newMessage","return"),("api","ca","HTTP 201 + Message","return"),("ca","ca","Cập nhật cục bộ","internal"),("cb","cb","Cập nhật hội thoại/unread","internal")],
         []),
        ("s11-chat-state", "Sequence 11 — Đánh dấu đã đọc và ẩn hội thoại", "ChatReadState lưu lastReadAt; HiddenChat lưu hiddenAt mà không xóa Message.",
         [("u", "Người dùng"), ("ui", "Chat UI"), ("api", "Chat API"), ("state", "Read/Hidden State"), ("msg", "Message")],
         [("u","ui","Mở hội thoại","call"),("ui","api","PATCH /api/chat/threads/:room/read","call"),("api","state","Upsert lastReadAt=now","call"),("api","ui","Đã đọc","return"),("u","ui","Chọn Ẩn hội thoại","call"),("ui","api","PATCH /api/chat/threads/:room/hide","call"),("api","state","Upsert hiddenAt=now","call"),("api","ui","Đã ẩn","return"),("u","ui","Mở lại khi có tin mới","call"),("ui","api","GET /api/messages?room=...","call"),("api","state","Đọc hiddenAt","call"),("api","msg","Query createdAt > hiddenAt","call"),("msg","api","Tin sau mốc ẩn","return"),("api","ui","Lịch sử đã lọc","return")],
         []),
        ("s12-notification", "Sequence 12 — Thông báo và số lượng chưa đọc", "Frontend polling dữ liệu nhỏ; thao tác đọc/xóa được bảo vệ theo recipient.",
         [("u", "Người dùng"), ("query", "TanStack Query"), ("api", "Notification API"), ("db", "MongoDB")],
         [("query","api","GET /api/notifications/unread-count mỗi 30s","call"),("api","db","countDocuments(recipient,isRead=false)","call"),("db","api","Số chưa đọc","return"),("api","query","unreadCount","return"),("u","query","Mở danh sách thông báo","call"),("query","api","GET /api/notifications","call"),("api","db","Tìm theo recipient, sort createdAt","call"),("db","api","Danh sách","return"),("api","query","Notifications","return"),("u","api","Đánh dấu đọc / tất cả / xóa","call"),("api","db","Update/Delete với recipient hiện tại","call"),("api","u","Kết quả + cache refetch","return")],
         []),
        ("s13-admin", "Sequence 13 — Quản trị người dùng, doanh nghiệp và Job", "Mọi endpoint admin kiểm tra role=admin trước khi đọc hoặc thay đổi dữ liệu.",
         [("a", "Quản trị viên"), ("ui", "Admin UI"), ("api", "Admin API"), ("db", "MongoDB"), ("noti", "Notification Service")],
         [("a","ui","Mở dashboard quản trị","call"),("ui","api","GET /api/admin/stats","call"),("api","api","Auth + require admin","internal"),("api","db","Aggregate users/jobs/applications","call"),("db","api","Thống kê","return"),("api","ui","Dashboard data","return"),("a","ui","Ban/xóa user, xác minh company, ẩn/xóa Job","call"),("ui","api","PUT/DELETE /api/admin/...","call"),("api","db","Cập nhật đúng tài nguyên","call"),("api","noti","Tạo thông báo nếu nghiệp vụ yêu cầu","call"),("api","ui","Kết quả thao tác","return"),("ui","a","Refetch danh sách","return")],
         []),
        ("s14-cron", "Sequence 14 — Cron xử lý Job sắp/đã hết hạn", "Endpoint cron được bảo vệ bằng token; service tạo cảnh báo trước khi cập nhật các cờ xử lý.",
         [("cron", "Vercel Cron"), ("api", "Cron Endpoint"), ("svc", "JobExpiryService"), ("db", "MongoDB"), ("noti", "Notification Service")],
         [("cron","api","GET /api/cron/job-expiry + token","call"),("api","api","Xác minh CRON_SECRET","internal"),("api","svc","runJobExpiryCheck()","call"),("svc","db","Tìm Job còn ≤3 ngày chưa cảnh báo","call"),("db","svc","expiringJobs","return"),("svc","db","Tìm user đã lưu các Job","call"),("svc","noti","Bulk cảnh báo company + candidate","call"),("svc","db","Set expiryNotifiedAt","call"),("svc","db","Tìm Job expiryDate < now","call"),("db","svc","expiredJobs","return"),("svc","noti","Bulk thông báo company","call"),("svc","db","Set status=Expired + expiredNotifiedAt","call"),("svc","api","Summary counts","return"),("api","cron","200 summary","return")],
         []),
    ]
    return [sequence_page(pid, name, subtitle, parts, msgs, notes) for pid, name, subtitle, parts, msgs, notes in specs]


def activity_page(
    pid: str, name: str, subtitle: str,
    nodes: list[tuple[str, str, str, int, int, int, int, str]],
    links: list[tuple[str, str, str]],
) -> str:
    cells: list[str] = []
    header(cells, pid, name, subtitle, GREEN)
    ids: dict[str, str] = {}
    for key, label, kind, x, y, w, h, color in nodes:
        cid = f"{pid}-{key}"
        ids[key] = cid
        if kind == "start":
            style = f"ellipse;aspect=fixed;html=1;fillColor={INK};strokeColor={INK};"
        elif kind == "end":
            style = f"ellipse;aspect=fixed;html=1;fillColor=#FFFFFF;strokeColor={INK};strokeWidth=5;"
        elif kind == "decision":
            style = f"rhombus;whiteSpace=wrap;html=1;fillColor=#F8FAFC;strokeColor={color};strokeWidth=2;fontSize=12;fontColor={INK};"
        elif kind == "db":
            style = f"shape=cylinder3;whiteSpace=wrap;html=1;boundedLbl=1;backgroundOutline=1;fillColor={BLUE_BG};strokeColor={BLUE};strokeWidth=2;fontSize=12;fontColor={INK};"
        else:
            bg = BLUE_BG if color == BLUE else GREEN_BG if color == GREEN else ORANGE_BG if color == ORANGE else RED_BG if color == RED else VIOLET_BG
            style = f"rounded=1;arcSize=12;whiteSpace=wrap;html=1;fillColor={bg};strokeColor={color};strokeWidth=2;fontSize=12;fontColor={INK};"
        cells.append(vertex(cid, label, style, x, y, w, h))
    style = f"edgeStyle=orthogonalEdgeStyle;rounded=1;html=1;strokeColor={LINE};strokeWidth=1.8;endArrow=block;endFill=1;fontSize=11;fontColor={INK};labelBackgroundColor=#FFFFFF;"
    for i, (src, dst, label) in enumerate(links):
        cells.append(edge(f"{pid}-e-{i}", ids[src], ids[dst], label, style))
    return page(pid, name, cells)


def build_activity_pages() -> list[str]:
    base = {
        "start": (60, 485, 32, 32), "end": (1820, 485, 38, 38),
    }
    return [
        activity_page("a01-auth", "Activity 1 — Đăng ký, đăng nhập và khôi phục phiên", "Phân nhánh đăng ký/đăng nhập và phục hồi phiên bằng cookie JWT.",
            [("start","","start",*base["start"],INK),("choose","Đã có tài khoản?","decision",150,445,170,110,VIOLET),("register","Nhập thông tin đăng ký","action",410,245,220,75,BLUE),("validateReg","Dữ liệu hợp lệ?","decision",710,235,170,110,ORANGE),("create","Băm mật khẩu và tạo User","action",970,245,230,75,GREEN),("login","Nhập tài khoản/mật khẩu","action",410,665,220,75,BLUE),("validLogin","Thông tin đúng?","decision",710,655,170,110,ORANGE),("cookie","Ký JWT và Set-Cookie HTTP-only","action",970,655,250,75,VIOLET),("me","AuthContext gọi /api/me","action",1320,455,220,75,BLUE),("session","Phiên hợp lệ?","decision",1600,445,170,110,GREEN),("end","","end",*base["end"],INK)],
            [("start","choose",""),("choose","register","Chưa"),("choose","login","Có"),("register","validateReg",""),("validateReg","register","Không"),("validateReg","create","Có"),("create","login","Đăng ký xong"),("login","validLogin",""),("validLogin","login","Không"),("validLogin","cookie","Có"),("cookie","me",""),("me","session",""),("session","login","Không"),("session","end","Có")]),
        activity_page("a02-cv", "Activity 2 — Quản lý CV", "Tạo/chỉnh sửa, kiểm tra, lưu MongoDB và xuất PDF.",
            [("start","","start",*base["start"],INK),("library","Mở thư viện CV","action",140,465,190,70,BLUE),("choose","Tạo mới hay chỉnh sửa?","decision",410,445,180,110,VIOLET),("new","Khởi tạo CV và chọn mẫu","action",690,245,220,75,VIOLET),("load","Tải Resume thuộc người dùng","db",690,665,220,90,BLUE),("edit","Nhập nội dung và xem trước","action",1010,455,230,75,BLUE),("valid","Dữ liệu hợp lệ?","decision",1320,445,170,110,ORANGE),("save","POST /api/resume","action",1570,245,190,70,GREEN),("download","In / lưu PDF","action",1570,675,190,70,VIOLET),("end","","end",*base["end"],INK)],
            [("start","library",""),("library","choose",""),("choose","new","Tạo mới"),("choose","load","Chỉnh sửa"),("new","edit",""),("load","edit",""),("edit","valid",""),("valid","edit","Không"),("valid","save","Lưu"),("valid","download","Tải PDF"),("save","end",""),("download","end","")]),
        activity_page("a03-ai-resume", "Activity 3 — Hỗ trợ CV bằng AI", "Review, cải thiện nội dung và chấm độ phù hợp CV–Job theo quota.",
            [("start","","start",*base["start"],INK),("select","Chọn CV và tính năng AI","action",140,465,220,70,VIOLET),("quota","Còn quota?","decision",450,445,160,110,ORANGE),("sanitize","Làm sạch và rút gọn dữ liệu","action",710,465,220,70,BLUE),("request","Gửi Groq + JSON Schema","action",1010,465,220,70,VIOLET),("ok","Kết quả hợp lệ?","decision",1320,445,170,110,ORANGE),("show","Hiển thị review/điểm/gợi ý","action",1580,245,220,75,GREEN),("error","Chuẩn hóa lỗi, giữ dữ liệu đang nhập","action",1550,680,260,75,RED),("end","","end",*base["end"],INK)],
            [("start","select",""),("select","quota",""),("quota","end","Không / báo hết lượt"),("quota","sanitize","Có"),("sanitize","request",""),("request","ok",""),("ok","show","Có"),("ok","error","Không"),("show","end",""),("error","end","")]),
        activity_page("a04-apply", "Activity 4 — Tìm, lưu việc và ứng tuyển", "Luồng ứng viên từ tìm việc đến Application Pending với hai cách nộp CV.",
            [("start","","start",*base["start"],INK),("browse","Tìm/lọc/xem Job","action",130,465,190,70,BLUE),("fit","Phù hợp?","decision",390,445,150,110,VIOLET),("save","Lưu Job (tùy chọn)","action",650,245,190,70,GREEN),("detail","Xem chi tiết","action",650,665,190,70,BLUE),("method","Chọn cách nộp CV","decision",930,445,170,110,ORANGE),("stored","Chọn CV đã lưu","action",1190,245,190,70,BLUE),("upload","Tải PDF → CV ảo","action",1190,665,210,70,VIOLET),("duplicate","Đã ứng tuyển?","decision",1480,445,170,110,ORANGE),("create","Tạo Application + Notification","action",1690,455,190,90,GREEN),("end","","end",*base["end"],INK)],
            [("start","browse",""),("browse","fit",""),("fit","browse","Không"),("fit","save","Có, muốn lưu"),("fit","detail","Có"),("save","detail",""),("detail","method",""),("method","stored","CV đã lưu"),("method","upload","PDF"),("stored","duplicate",""),("upload","duplicate",""),("duplicate","detail","Có / báo lỗi"),("duplicate","create","Chưa"),("create","end","")]),
        activity_page("a05-job", "Activity 5 — Doanh nghiệp quản lý Job", "Tạo bản nháp, mở nhận hồ sơ, chỉnh sửa, gia hạn, đóng hoặc xóa mềm.",
            [("start","","start",*base["start"],INK),("login","Company đăng nhập","action",130,465,190,70,GREEN),("dashboard","Mở Company Dashboard","action",390,465,210,70,GREEN),("choose","Chọn thao tác","decision",690,445,170,110,VIOLET),("create","Tạo Job Draft/Active","action",960,195,210,70,BLUE),("edit","Chỉnh sửa nội dung","action",960,405,210,70,BLUE),("renew","Gia hạn / mở lại","action",960,615,210,70,GREEN),("delete","Xóa mềm: Deleted + deletedAt","action",960,825,230,70,RED),("valid","Dữ liệu/quyền hợp lệ?","decision",1310,445,180,110,ORANGE),("save","Lưu Job","db",1580,455,170,90,BLUE),("end","","end",*base["end"],INK)],
            [("start","login",""),("login","dashboard",""),("dashboard","choose",""),("choose","create","Tạo"),("choose","edit","Sửa"),("choose","renew","Gia hạn"),("choose","delete","Xóa"),("create","valid",""),("edit","valid",""),("renew","valid",""),("delete","valid",""),("valid","dashboard","Không"),("valid","save","Có"),("save","end","")]),
        activity_page("a06-company-app", "Activity 6 — Doanh nghiệp xử lý hồ sơ", "Xem ứng viên, đọc CV, đổi trạng thái và thông báo ứng viên.",
            [("start","","start",*base["start"],INK),("list","Tìm/lọc danh sách hồ sơ","action",140,465,220,70,BLUE),("view","Xem CV và hồ sơ ứng viên","action",440,465,230,70,BLUE),("decide","Quyết định trạng thái","decision",760,445,180,110,ORANGE),("review","Reviewing","action",1050,175,170,65,BLUE),("interview","Interview","action",1050,365,170,65,VIOLET),("offer","Offered / Accepted","action",1050,605,190,65,GREEN),("reject","Rejected","action",1050,805,170,65,RED),("auth","Job thuộc company?","decision",1370,445,170,110,ORANGE),("notify","Lưu trạng thái + Notification","action",1600,455,210,85,GREEN),("end","","end",*base["end"],INK)],
            [("start","list",""),("list","view",""),("view","decide",""),("decide","review","Cần xem thêm"),("decide","interview","Phỏng vấn"),("decide","offer","Đạt"),("decide","reject","Không phù hợp"),("review","auth",""),("interview","auth",""),("offer","auth",""),("reject","auth",""),("auth","list","Không"),("auth","notify","Có"),("notify","end","")]),
        activity_page("a07-chat", "Activity 7 — Chat, đánh dấu đọc và ẩn hội thoại", "REST bảo đảm lưu dữ liệu; Socket.IO giao bản tin; hiddenAt tạo điểm cắt lịch sử.",
            [("start","","start",*base["start"],INK),("open","Mở hội thoại","action",140,465,180,70,VIOLET),("read","Upsert lastReadAt","action",400,245,190,70,BLUE),("history","Tải Message sau hiddenAt","db",400,665,210,90,BLUE),("action","Chọn thao tác","decision",700,445,160,110,ORANGE),("send","Lưu Message rồi emit Socket.IO","action",970,245,240,75,GREEN),("hide","Upsert hiddenAt=now","action",970,665,210,70,VIOLET),("incoming","Có tin mới?","decision",1310,445,160,110,ORANGE),("refresh","Cập nhật hội thoại/unread","action",1570,455,210,70,BLUE),("end","","end",*base["end"],INK)],
            [("start","open",""),("open","read",""),("open","history",""),("read","action",""),("history","action",""),("action","send","Gửi"),("action","hide","Ẩn"),("send","incoming",""),("hide","incoming",""),("incoming","refresh","Có"),("incoming","end","Không"),("refresh","end","")]),
        activity_page("a08-interview", "Activity 8 — Luyện phỏng vấn AI", "Mỗi câu trả lời được chấm có cấu trúc; cuối buổi AI tạo bản tổng kết.",
            [("start","","start",*base["start"],INK),("config","Nhập vị trí/cấp độ/số câu","action",140,455,230,80,VIOLET),("valid","Thiết lập hợp lệ?","decision",450,445,170,110,ORANGE),("ask","AI tạo câu hỏi","action",720,455,190,70,BLUE),("answer","Ứng viên trả lời","action",990,455,190,70,VIOLET),("evaluate","AI chấm điểm và phản hồi","action",1260,455,220,70,ORANGE),("more","Đủ số câu/kết thúc?","decision",1540,445,180,110,GREEN),("summary","AI tổng kết buổi luyện","action",1540,690,210,70,GREEN),("end","","end",*base["end"],INK)],
            [("start","config",""),("config","valid",""),("valid","config","Không"),("valid","ask","Có"),("ask","answer",""),("answer","evaluate",""),("evaluate","more","Lưu review theo câu"),("more","ask","Chưa"),("more","summary","Rồi"),("summary","end","")]),
        activity_page("a09-admin", "Activity 9 — Quản trị hệ thống", "Admin xem thống kê và quản lý user, company, Job theo các endpoint đã triển khai.",
            [("start","","start",*base["start"],INK),("login","Admin đăng nhập","action",140,465,180,70,ORANGE),("stats","Xem stats/health","action",400,465,190,70,BLUE),("choose","Chọn tài nguyên","decision",680,445,170,110,VIOLET),("user","Ban hoặc xóa User","action",970,185,190,70,RED),("company","Xác minh/reject Company","action",970,455,220,70,GREEN),("job","Ẩn/hiện/xóa Job","action",970,735,190,70,ORANGE),("confirm","Quyền và dữ liệu hợp lệ?","decision",1320,445,180,110,ORANGE),("update","Cập nhật MongoDB","db",1600,455,170,90,BLUE),("end","","end",*base["end"],INK)],
            [("start","login",""),("login","stats",""),("stats","choose",""),("choose","user","User"),("choose","company","Company"),("choose","job","Job"),("user","confirm",""),("company","confirm",""),("job","confirm",""),("confirm","stats","Không"),("confirm","update","Có"),("update","end","")]),
        activity_page("a10-cron", "Activity 10 — Cron kiểm tra Job hết hạn", "Hai nhánh sắp hết hạn và đã hết hạn tạo thông báo rồi mới cập nhật cờ xử lý.",
            [("start","","start",*base["start"],INK),("trigger","Cron gọi endpoint + token","action",130,465,210,70,GREEN),("auth","Token hợp lệ?","decision",410,445,160,110,ORANGE),("soonQuery","Tìm Job còn ≤3 ngày","db",670,245,190,90,BLUE),("soon","Có Job sắp hết hạn?","decision",940,235,170,110,VIOLET),("soonNoti","Thông báo company + người đã lưu","action",1190,245,230,75,GREEN),("expiredQuery","Tìm Job expiryDate < now","db",670,675,200,90,BLUE),("expired","Có Job hết hạn?","decision",940,665,170,110,ORANGE),("expire","Set Expired + thông báo company","action",1190,675,230,75,ORANGE),("summary","Trả summary","action",1560,455,170,70,GREEN),("end","","end",*base["end"],INK)],
            [("start","trigger",""),("trigger","auth",""),("auth","end","Không / 401"),("auth","soonQuery","Có"),("soonQuery","soon",""),("soon","soonNoti","Có"),("soon","expiredQuery","Không"),("soonNoti","expiredQuery","Set expiryNotifiedAt"),("expiredQuery","expired",""),("expired","expire","Có"),("expired","summary","Không"),("expire","summary","Set expiredNotifiedAt"),("summary","end","")]),
    ]


def build() -> Path:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    pages = [*build_class_pages(), *build_sequence_pages(), *build_activity_pages()]
    modified = datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")
    xml = (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        f'<mxfile host="app.diagrams.net" modified="{modified}" agent="Codex" version="26.0.16" type="device">\n'
        + "\n".join(pages)
        + "\n</mxfile>\n"
    )
    OUT_FILE.write_text(xml, encoding="utf-8")
    (OUT_DIR / "README.md").write_text(
        "# RabbitCV — Bộ UML toàn bộ V2\n\n"
        "Tệp gồm 28 trang: 4 Class Diagram, 14 Sequence Diagram và 10 Activity Diagram.\n"
        "Nội dung được đối chiếu với model, API, AI service, Socket.IO, notification và cron trong mã nguồn.\n",
        encoding="utf-8",
    )
    return OUT_FILE


if __name__ == "__main__":
    print(build())
