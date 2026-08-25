from __future__ import annotations

import html
from datetime import datetime, timezone
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "bao-cao" / "uml"
OUT_FILE = OUT_DIR / "RabbitCV-Class-Sequence-Activity.drawio"

PAGE_W = 1800
PAGE_H = 1050

INK = "#172033"
MUTED = "#60708A"
LINE = "#7A8AA3"
BLUE = "#2563EB"
BLUE_LIGHT = "#EAF2FF"
GREEN = "#16A34A"
GREEN_LIGHT = "#EAF8EF"
VIOLET = "#6C4CF1"
VIOLET_LIGHT = "#EEEAFE"
ORANGE = "#EA580C"
ORANGE_LIGHT = "#FFF1E8"
SLATE_LIGHT = "#F8FAFC"


def esc(value: object) -> str:
    return html.escape(str(value), quote=True)


def cell(
    cell_id: str,
    value: str,
    style: str,
    x: float,
    y: float,
    w: float,
    h: float,
    *,
    parent: str = "1",
) -> str:
    return (
        f'<mxCell id="{esc(cell_id)}" value="{esc(value)}" style="{style}" '
        f'vertex="1" parent="{esc(parent)}"><mxGeometry x="{x}" y="{y}" '
        f'width="{w}" height="{h}" as="geometry"/></mxCell>'
    )


def html_cell(
    cell_id: str,
    value: str,
    style: str,
    x: float,
    y: float,
    w: float,
    h: float,
) -> str:
    return (
        f'<mxCell id="{esc(cell_id)}" value="{esc(value)}" style="{style}" '
        f'vertex="1" parent="1"><mxGeometry x="{x}" y="{y}" '
        f'width="{w}" height="{h}" as="geometry"/></mxCell>'
    )


def edge(
    cell_id: str,
    source: str,
    target: str,
    value: str = "",
    *,
    style: str | None = None,
) -> str:
    style = style or (
        f"edgeStyle=orthogonalEdgeStyle;rounded=1;html=1;strokeColor={LINE};"
        "strokeWidth=1.5;endArrow=open;endFill=0;fontSize=13;labelBackgroundColor=#FFFFFF;"
    )
    return (
        f'<mxCell id="{esc(cell_id)}" value="{esc(value)}" style="{style}" '
        f'edge="1" parent="1" source="{esc(source)}" target="{esc(target)}">'
        '<mxGeometry relative="1" as="geometry"/></mxCell>'
    )


def page_xml(page_id: str, name: str, cells: list[str]) -> str:
    body = "\n".join(['<mxCell id="0"/>', '<mxCell id="1" parent="0"/>', *cells])
    return (
        f'<diagram id="{esc(page_id)}" name="{esc(name)}">'
        f'<mxGraphModel dx="{PAGE_W}" dy="{PAGE_H}" grid="1" gridSize="10" '
        'guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" '
        f'pageScale="1" pageWidth="{PAGE_W}" pageHeight="{PAGE_H}" math="0" '
        f'shadow="0" background="#FFFFFF"><root>{body}</root></mxGraphModel></diagram>'
    )


def page_header(cells: list[str], page_id: str, title: str, subtitle: str, color: str = VIOLET) -> None:
    cells.append(
        cell(
            f"{page_id}-title",
            title,
            f"text;html=1;align=left;verticalAlign=middle;fontSize=30;fontStyle=1;"
            f"fontColor={INK};strokeColor=none;fillColor=none;",
            55,
            20,
            1500,
            48,
        )
    )
    cells.append(
        cell(
            f"{page_id}-subtitle",
            subtitle,
            f"text;html=1;align=left;verticalAlign=middle;fontSize=14;fontColor={MUTED};"
            "strokeColor=none;fillColor=none;",
            58,
            67,
            1560,
            30,
        )
    )
    cells.append(
        cell(
            f"{page_id}-accent",
            "",
            f"rounded=1;arcSize=50;fillColor={color};strokeColor={color};",
            55,
            104,
            1690,
            6,
        )
    )


def class_box(
    cells: list[str],
    page_id: str,
    key: str,
    title: str,
    attributes: list[str],
    x: int,
    y: int,
    w: int,
    h: int,
    *,
    color: str = BLUE,
    fill: str = BLUE_LIGHT,
    stereotype: str = "model",
) -> str:
    item_id = f"{page_id}-{key}"
    attr_html = "<br>".join(esc(item) for item in attributes)
    label = (
        f'<div style="text-align:center"><span style="color:{MUTED};font-size:11px">'
        f'&lt;&lt;{esc(stereotype)}&gt;&gt;</span><br><b style="font-size:18px">{esc(title)}</b></div>'
        f'<hr style="border:0;border-top:1px solid {color};margin:7px 0">'
        f'<div style="text-align:left;line-height:1.55">{attr_html}</div>'
    )
    style = (
        f"rounded=1;arcSize=8;whiteSpace=wrap;html=1;align=left;verticalAlign=top;"
        f"spacing=12;fillColor={fill};strokeColor={color};strokeWidth=2;fontSize=13;"
        f"fontColor={INK};shadow=0;"
    )
    cells.append(html_cell(item_id, label, style, x, y, w, h))
    return item_id


def build_class_core() -> str:
    pid = "class-core"
    cells: list[str] = []
    page_header(
        cells,
        pid,
        "Class Diagram 1 — Miền CV, tuyển dụng và ứng tuyển",
        "Bám theo các Mongoose model User, Resume, Job và Application; MongoDB lưu quan hệ bằng ObjectId.",
        BLUE,
    )
    user = class_box(cells, pid, "user", "User", [
        "+_id: ObjectId", "+username: String", "+email: String", "+role: admin | employee | company",
        "+status: active | pending", "+companyVerificationStatus", "+isBanned: Boolean",
        "+savedJobs[]: {jobId, savedAt}", "+educations[] / experiences[] / activities[]",
    ], 70, 150, 360, 330, color=VIOLET, fill=VIOLET_LIGHT)
    resume = class_box(cells, pid, "resume", "Resume", [
        "+_id: ObjectId", "+userId: ObjectId", "+title: String", "+pdfData: Base64 String",
        "+fileName: String", "+isVirtual: Boolean", "+personalInfo: Object",
        "+experience[] / education[] / skill[]", "+project[] / certificate[] / award[]",
        "+selectedTemplate: Enum",
    ], 500, 150, 390, 360, color=BLUE, fill=BLUE_LIGHT)
    job = class_box(cells, pid, "job", "Job", [
        "+_id: ObjectId", "+companyId: ObjectId", "+title / company / location: String",
        "+type / salary / workModel: String", "+requirements[] / benefits[] / tags[]",
        "+status: Draft | Active | Expired | Deleted", "+expiryDate: Date",
        "+deletedAt / expiryNotifiedAt / expiredNotifiedAt", "+isAdminHidden: Boolean",
    ], 980, 150, 400, 360, color=GREEN, fill=GREEN_LIGHT)
    application = class_box(cells, pid, "application", "Application", [
        "+_id: ObjectId", "+jobId: ObjectId", "+candidateId: ObjectId", "+resumeId: ObjectId",
        "+fullName / email / phone: String", "+coverLetter: String",
        "+status: Pending | Reviewing | Interview", "+status: Offered | Rejected | Accepted",
        "+jobSnapshot: Object", "+createdAt / updatedAt: Date",
    ], 650, 620, 500, 330, color=ORANGE, fill=ORANGE_LIGHT)
    note = cell(
        f"{pid}-note",
        "Ràng buộc nghiệp vụ\nApplication có unique index (jobId, candidateId).\njobSnapshot giữ lịch sử khi Job thay đổi.\nisVirtual=true dùng cho CV PDF tải lên khi ứng tuyển.",
        f"shape=note;whiteSpace=wrap;html=1;fillColor=#FFFDEB;strokeColor=#D4A72C;"
        f"fontSize=13;fontColor={INK};spacing=10;",
        1390,
        615,
        330,
        220,
    )
    cells.append(note)
    assoc = "edgeStyle=orthogonalEdgeStyle;rounded=1;html=1;strokeColor=#60708A;strokeWidth=1.7;endArrow=open;endFill=0;fontSize=13;labelBackgroundColor=#FFFFFF;"
    cells.extend([
        edge(f"{pid}-u-r", user, resume, "1 sở hữu 0..*", style=assoc),
        edge(f"{pid}-u-j", user, job, "1 doanh nghiệp đăng 0..*", style=assoc),
        edge(f"{pid}-u-a", user, application, "1 ứng viên nộp 0..*", style=assoc),
        edge(f"{pid}-j-a", job, application, "1 nhận 0..*", style=assoc),
        edge(f"{pid}-r-a", resume, application, "1 được chọn bởi 0..*", style=assoc),
    ])
    return page_xml(pid, "Class 1 - Miền CV và tuyển dụng", cells)


def build_class_support() -> str:
    pid = "class-support"
    cells: list[str] = []
    page_header(
        cells,
        pid,
        "Class Diagram 2 — Giao tiếp, AI và tác vụ nền",
        "Các model hỗ trợ chat/thông báo cùng service AI và kiểm tra tin hết hạn.",
        VIOLET,
    )
    user = class_box(cells, pid, "user", "User", [
        "+_id: ObjectId", "+username: String", "+role: String",
    ], 60, 155, 270, 175, color=VIOLET, fill=VIOLET_LIGHT)
    message = class_box(cells, pid, "message", "Message", [
        "+senderId: String", "+senderName: String", "+room: String",
        "+content: String", "+image: String", "+createdAt: Date",
    ], 390, 135, 300, 245, color=BLUE, fill=BLUE_LIGHT)
    notification = class_box(cells, pid, "notification", "Notification", [
        "+recipient: ObjectId", "+recipientRole: employee | company", "+type: Enum",
        "+title / message / link: String", "+isRead: Boolean", "+createdAt: Date",
    ], 760, 135, 350, 250, color=GREEN, fill=GREEN_LIGHT)
    usage = class_box(cells, pid, "usage", "AiUsage", [
        "+userId: ObjectId", "+feature: Enum", "+provider / model: String",
        "+status: pending | success | failed", "+inputHash: String",
        "+inputTokens / outputTokens / latencyMs", "+errorCode: String",
    ], 1190, 135, 360, 275, color=ORANGE, fill=ORANGE_LIGHT)
    hidden = class_box(cells, pid, "hidden", "HiddenChat", [
        "+userId: ObjectId", "+room: String", "+hiddenAt: Date",
        "+unique(userId, room)",
    ], 160, 560, 300, 205, color=VIOLET, fill=VIOLET_LIGHT)
    read_state = class_box(cells, pid, "read", "ChatReadState", [
        "+userId: ObjectId", "+room: String", "+lastReadAt: Date",
        "+unique(userId, room)",
    ], 520, 560, 320, 205, color=BLUE, fill=BLUE_LIGHT)
    ai_service = class_box(cells, pid, "ai-service", "AiService", [
        "+getAiStatus(userId)", "+runStructuredAiRequest(request)",
        "+sanitizeInput()", "+validateStructuredOutput()",
    ], 910, 545, 350, 225, color=ORANGE, fill=ORANGE_LIGHT, stereotype="service")
    expiry = class_box(cells, pid, "expiry", "JobExpiryService", [
        "+runJobExpiryCheck()", "+findExpiringJobs()", "+expireJobs()",
        "+createNotificationsBulk()",
    ], 1330, 545, 360, 225, color=GREEN, fill=GREEN_LIGHT, stereotype="service")
    assoc = "edgeStyle=orthogonalEdgeStyle;rounded=1;html=1;strokeColor=#60708A;strokeWidth=1.6;endArrow=open;endFill=0;fontSize=12;labelBackgroundColor=#FFFFFF;"
    dep = "edgeStyle=orthogonalEdgeStyle;rounded=1;html=1;dashed=1;strokeColor=#6C4CF1;strokeWidth=1.6;endArrow=open;endFill=0;fontSize=12;fontColor=#6C4CF1;labelBackgroundColor=#FFFFFF;"
    cells.extend([
        edge(f"{pid}-u-m", user, message, "1 gửi 0..*", style=assoc),
        edge(f"{pid}-u-n", user, notification, "1 nhận 0..*", style=assoc),
        edge(f"{pid}-u-h", user, hidden, "1 có 0..*", style=assoc),
        edge(f"{pid}-u-r", user, read_state, "1 có 0..*", style=assoc),
        edge(f"{pid}-u-ai", user, usage, "1 phát sinh 0..*", style=assoc),
        edge(f"{pid}-svc-ai", ai_service, usage, "ghi quota và thống kê", style=dep),
        edge(f"{pid}-exp-n", expiry, notification, "tạo cảnh báo", style=dep),
    ])
    cells.append(cell(
        f"{pid}-note", "HiddenChat không xóa Message. API chỉ truy vấn các tin có createdAt > hiddenAt.\nAiUsage tự hết hạn sau 90 ngày bằng TTL index.",
        f"shape=note;whiteSpace=wrap;html=1;fillColor=#FFFDEB;strokeColor=#D4A72C;fontSize=13;fontColor={INK};spacing=10;",
        640, 835, 560, 130,
    ))
    return page_xml(pid, "Class 2 - Giao tiếp AI và tác vụ nền", cells)


def build_sequence(
    page_id: str,
    name: str,
    subtitle: str,
    participants: list[tuple[str, str]],
    messages: list[tuple[str, str, str, str]],
    *,
    frames: list[tuple[int, int, int, int, str, str]] | None = None,
    notes: list[tuple[int, int, int, int, str, str]] | None = None,
) -> str:
    cells: list[str] = []
    page_header(cells, page_id, name, subtitle, BLUE)
    count = len(participants)
    left = 90
    right = 1710
    span = (right - left) / max(1, count - 1)
    centers: dict[str, float] = {}
    for idx, (key, label) in enumerate(participants):
        cx = left + idx * span
        centers[key] = cx
        fill = VIOLET_LIGHT if idx == 0 else BLUE_LIGHT
        stroke = VIOLET if idx == 0 else BLUE
        cells.append(cell(
            f"{page_id}-p-{key}", label,
            f"rounded=1;arcSize=10;whiteSpace=wrap;html=1;fillColor={fill};strokeColor={stroke};"
            f"strokeWidth=2;fontSize=15;fontStyle=1;fontColor={INK};",
            cx - 95, 130, 190, 58,
        ))
        cells.append(cell(
            f"{page_id}-life-{key}", "",
            f"shape=line;dashed=1;dashPattern=6 6;strokeColor=#94A3B8;strokeWidth=1.3;direction=south;",
            cx, 188, 1, 770,
        ))
    if frames:
        for index, (x, y, w, h, label, color) in enumerate(frames):
            cells.append(cell(
                f"{page_id}-frame-{index}", label,
                f"rounded=0;whiteSpace=wrap;html=1;verticalAlign=top;align=left;spacing=6;"
                f"fillColor=none;strokeColor={color};dashed=1;dashPattern=8 5;strokeWidth=1.5;"
                f"fontColor={color};fontStyle=1;fontSize=13;",
                x, y, w, h,
            ))
    start_y = 225
    step = 61 if len(messages) <= 12 else 51
    for idx, (src, dst, label, kind) in enumerate(messages):
        y = start_y + idx * step
        if src == dst or kind == "internal":
            cx = centers[src]
            cells.append(cell(
                f"{page_id}-internal-{idx}", label,
                f"rounded=1;arcSize=8;whiteSpace=wrap;html=1;fillColor=#FFFDEB;"
                f"strokeColor=#D4A72C;fontSize=12;fontColor={INK};spacing=5;",
                cx - 105, y - 17, 210, 38,
            ))
            continue
        sx, tx = centers[src], centers[dst]
        s_anchor = f"{page_id}-sa-{idx}"
        t_anchor = f"{page_id}-ta-{idx}"
        invisible = "ellipse;fillColor=none;strokeColor=none;opacity=0;"
        cells.append(cell(s_anchor, "", invisible, sx, y, 1, 1))
        cells.append(cell(t_anchor, "", invisible, tx, y, 1, 1))
        is_return = kind == "return"
        color = GREEN if is_return else BLUE
        style = (
            f"edgeStyle=none;rounded=0;html=1;strokeColor={color};strokeWidth=1.7;"
            f"endArrow=block;endFill=1;dashed={1 if is_return else 0};"
            f"fontSize=12;fontColor={INK};labelBackgroundColor=#FFFFFF;"
        )
        cells.append(edge(f"{page_id}-msg-{idx}", s_anchor, t_anchor, label, style=style))
    if notes:
        for idx, (x, y, w, h, text, color) in enumerate(notes):
            cells.append(cell(
                f"{page_id}-note-{idx}", text,
                f"shape=note;whiteSpace=wrap;html=1;fillColor=#FFFDEB;strokeColor={color};"
                f"fontSize=12;fontColor={INK};spacing=7;",
                x, y, w, h,
            ))
    cells.append(cell(
        f"{page_id}-legend", "Mũi tên liền: yêu cầu / lệnh     •     Mũi tên nét đứt màu xanh lá: phản hồi",
        f"text;html=1;align=center;verticalAlign=middle;fontSize=12;fontColor={MUTED};strokeColor=none;fillColor=none;",
        420, 990, 960, 28,
    ))
    return page_xml(page_id, name, cells)


def build_sequence_pages() -> list[str]:
    return [
        build_sequence(
            "seq-auth", "Sequence 1 — Đăng nhập và khôi phục phiên",
            "JWT được lưu trong cookie HTTP-only; AuthContext là nguồn trạng thái xác thực thống nhất.",
            [("user", "Người dùng"), ("react", "React Login"), ("auth", "AuthContext"), ("api", "Express API"), ("db", "MongoDB")],
            [
                ("user", "react", "Nhập tài khoản và mật khẩu", "call"),
                ("react", "api", "POST /api/login (credentials: include)", "call"),
                ("api", "db", "User.findOne() + lấy password hash", "call"),
                ("db", "api", "Trả tài khoản", "return"),
                ("api", "api", "bcrypt.compare() và jwt.sign()", "internal"),
                ("api", "react", "Set-Cookie HTTP-only + user payload", "return"),
                ("react", "auth", "login(user)", "call"),
                ("auth", "react", "Cập nhật UI / điều hướng theo role", "return"),
                ("auth", "api", "GET /api/me kèm cookie khi tải lại", "call"),
                ("api", "api", "authMiddleware xác minh JWT", "internal"),
                ("api", "auth", "Phiên hợp lệ + user an toàn", "return"),
                ("auth", "user", "Không nhấp nháy trạng thái đăng nhập", "return"),
            ],
        ),
        build_sequence(
            "seq-cv", "Sequence 2 — Lưu, xem trước và tải CV",
            "Danh sách CV không trả pdfData; việc tải CV dùng bản dựng giao diện và hộp thoại in của trình duyệt.",
            [("candidate", "Ứng viên"), ("ui", "CV Editor"), ("api", "Resume API"), ("db", "MongoDB"), ("print", "Browser Print")],
            [
                ("candidate", "ui", "Nhập nội dung và chọn mẫu CV", "call"),
                ("ui", "ui", "Kiểm tra dữ liệu và dựng preview", "internal"),
                ("candidate", "ui", "Nhấn Lưu", "call"),
                ("ui", "api", "POST /api/resume", "call"),
                ("api", "api", "Xác thực chủ sở hữu, chuẩn hóa payload", "internal"),
                ("api", "db", "Tạo mới hoặc cập nhật Resume", "call"),
                ("db", "api", "Resume đã lưu", "return"),
                ("api", "ui", "Resume đã sanitize", "return"),
                ("candidate", "ui", "Nhấn Tải CV", "call"),
                ("ui", "print", "Gửi vùng CV đã dựng tới print", "call"),
                ("print", "candidate", "Lưu dưới dạng PDF", "return"),
            ],
            notes=[(1260, 800, 390, 120, "Trade-off hiện tại: CV PDF tải lên được lưu dạng Base64 trong MongoDB; production nên chuyển sang object storage.", ORANGE)],
        ),
        build_sequence(
            "seq-save-job", "Sequence 3 — Lưu việc và đồng bộ giao diện",
            "TanStack Query mutation cập nhật User.savedJobs và làm mới cache cho mọi màn hình sử dụng cùng truy vấn.",
            [("candidate", "Ứng viên"), ("card", "Job Card / Detail"), ("query", "TanStack Query"), ("api", "Saved Jobs API"), ("db", "MongoDB")],
            [
                ("candidate", "card", "Nhấn Lưu hoặc Bỏ lưu", "call"),
                ("card", "query", "Gọi mutation(jobId)", "call"),
                ("query", "api", "POST hoặc DELETE /api/saved-jobs/:jobId", "call"),
                ("api", "api", "Xác thực ứng viên", "internal"),
                ("api", "db", "Cập nhật User.savedJobs", "call"),
                ("db", "api", "Danh sách đã cập nhật", "return"),
                ("api", "query", "200 + trạng thái saved", "return"),
                ("query", "query", "Cập nhật/invalidate cache", "internal"),
                ("query", "card", "Render lại mọi nơi dùng savedJobs", "return"),
                ("card", "candidate", "Biểu tượng lưu đồng nhất tức thời", "return"),
            ],
        ),
        build_sequence(
            "seq-apply-saved", "Sequence 4 — Ứng tuyển bằng CV đã lưu",
            "API kiểm tra quyền sở hữu CV, tình trạng Job và unique index trước khi tạo Application.",
            [("candidate", "Ứng viên"), ("ui", "Job Detail"), ("api", "Jobs API"), ("db", "MongoDB"), ("noti", "Notification")],
            [
                ("candidate", "ui", "Chọn Job, CV và thư giới thiệu", "call"),
                ("ui", "api", "POST /api/jobs/apply", "call"),
                ("api", "api", "Xác thực role employee", "internal"),
                ("api", "db", "Kiểm tra Job Active và chưa hết hạn", "call"),
                ("api", "db", "Kiểm tra Resume thuộc ứng viên", "call"),
                ("api", "db", "Kiểm tra (jobId, candidateId)", "call"),
                ("api", "db", "Tạo Application + jobSnapshot", "call"),
                ("api", "noti", "Tạo thông báo cho company và candidate", "call"),
                ("noti", "db", "Lưu Notification", "call"),
                ("api", "ui", "201 Ứng tuyển thành công", "return"),
                ("ui", "candidate", "Toast + cập nhật trạng thái theo dõi", "return"),
            ],
            notes=[(90, 835, 430, 105, "Nếu đã tồn tại Application, API trả lỗi trùng hồ sơ; unique index là lớp bảo vệ bổ sung.", ORANGE)],
        ),
        build_sequence(
            "seq-apply-file", "Sequence 5 — Ứng tuyển bằng CV PDF tải lên",
            "File PDF được kiểm tra rồi tạo Resume isVirtual=true để dùng chung quan hệ Application.resumeId.",
            [("candidate", "Ứng viên"), ("ui", "Job Detail"), ("api", "Upload/Application API"), ("db", "MongoDB"), ("noti", "Notification")],
            [
                ("candidate", "ui", "Chọn tệp PDF và nhập thông tin", "call"),
                ("ui", "ui", "Kiểm tra đuôi, MIME và kích thước", "internal"),
                ("ui", "api", "POST /api/jobs/apply-file", "call"),
                ("api", "api", "Xác thực ứng viên và Job", "internal"),
                ("api", "db", "Kiểm tra Application trùng", "call"),
                ("api", "db", "Tạo Resume {pdfData, isVirtual=true}", "call"),
                ("db", "api", "virtualResume._id", "return"),
                ("api", "db", "Tạo Application với resumeId ảo", "call"),
                ("api", "noti", "Tạo thông báo ứng tuyển", "call"),
                ("noti", "db", "Lưu Notification", "call"),
                ("api", "ui", "201 Ứng tuyển thành công", "return"),
                ("ui", "candidate", "Hiển thị trạng thái Pending", "return"),
            ],
        ),
        build_sequence(
            "seq-status", "Sequence 6 — Doanh nghiệp cập nhật trạng thái hồ sơ",
            "Company chỉ được cập nhật Application thuộc Job do chính mình đăng; ứng viên nhận Notification.",
            [("company", "Doanh nghiệp"), ("ui", "Company Dashboard"), ("api", "Jobs API"), ("db", "MongoDB"), ("candidate", "Ứng viên")],
            [
                ("company", "ui", "Chọn trạng thái mới", "call"),
                ("ui", "api", "PUT /api/jobs/applications/:id", "call"),
                ("api", "db", "Tìm Application và Job", "call"),
                ("db", "api", "Application + companyId", "return"),
                ("api", "api", "Kiểm tra quyền company/admin", "internal"),
                ("api", "db", "Cập nhật Application.status", "call"),
                ("api", "db", "Tạo Notification cho candidate", "call"),
                ("api", "ui", "Application đã cập nhật", "return"),
                ("ui", "company", "Cập nhật bảng ứng viên", "return"),
                ("candidate", "api", "GET /api/notifications (polling)", "call"),
                ("api", "candidate", "Thông báo trạng thái mới", "return"),
            ],
            notes=[(1280, 785, 390, 120, "Backend hiện cho phép chuyển trực tiếp giữa các trạng thái; chưa ép buộc state machine tuần tự.", ORANGE)],
        ),
        build_sequence(
            "seq-chat", "Sequence 7 — Gửi tin nhắn thời gian thực",
            "Tin nhắn được lưu bằng REST trước, sau đó Socket.IO phát bản tin đã lưu tới phòng người nhận.",
            [("sender", "Người gửi"), ("clientA", "React Client A"), ("api", "Express API"), ("db", "MongoDB"), ("socket", "Socket.IO"), ("clientB", "React Client B")],
            [
                ("sender", "clientA", "Nhập và gửi nội dung", "call"),
                ("clientA", "api", "POST /api/messages", "call"),
                ("api", "api", "Xác thực sender và room", "internal"),
                ("api", "db", "Lưu Message", "call"),
                ("db", "api", "Tin nhắn đã có _id", "return"),
                ("api", "socket", "io.to(user_receiver).emit(newMessage)", "call"),
                ("socket", "clientB", "Sự kiện newMessage", "return"),
                ("api", "clientA", "HTTP 201 + Message", "return"),
                ("clientA", "clientA", "Cập nhật danh sách cục bộ", "internal"),
                ("clientB", "clientB", "Cập nhật hội thoại và unread", "internal"),
            ],
        ),
        build_sequence(
            "seq-hide-chat", "Sequence 8 — Ẩn hội thoại bằng mốc hiddenAt",
            "Soft-delete theo người dùng: Message cũ vẫn tồn tại; API chỉ trả tin mới hơn mốc ẩn.",
            [("user", "Người dùng"), ("ui", "Chat UI"), ("api", "Chat API"), ("hidden", "HiddenChat"), ("message", "Message")],
            [
                ("user", "ui", "Chọn Ẩn cuộc trò chuyện", "call"),
                ("ui", "api", "PATCH /api/chat/threads/:room/hide", "call"),
                ("api", "hidden", "Upsert {userId, room, hiddenAt=now}", "call"),
                ("hidden", "api", "Mốc ẩn đã lưu", "return"),
                ("api", "ui", "200 Hội thoại đã ẩn", "return"),
                ("user", "ui", "Mở lại / nhận tin mới", "call"),
                ("ui", "api", "GET /api/messages?room=...", "call"),
                ("api", "hidden", "Đọc hiddenAt của riêng user", "call"),
                ("hidden", "api", "hiddenAt", "return"),
                ("api", "message", "Query room và createdAt > hiddenAt", "call"),
                ("message", "api", "Chỉ các tin sau mốc ẩn", "return"),
                ("api", "ui", "Lịch sử đã lọc", "return"),
            ],
        ),
        build_sequence(
            "seq-ai", "Sequence 9 — Yêu cầu AI có cấu trúc",
            "Backend làm sạch dữ liệu, kiểm tra quota/rate limit và xác thực JSON Schema trước khi trả kết quả.",
            [("candidate", "Ứng viên"), ("ui", "React UI"), ("router", "AI Router"), ("db", "MongoDB"), ("groq", "Groq API")],
            [
                ("candidate", "ui", "Review CV / chấm phù hợp / trả lời phỏng vấn", "call"),
                ("ui", "router", "POST /api/ai/...", "call"),
                ("router", "router", "Xác thực, rate limit, sanitize input", "internal"),
                ("router", "db", "Kiểm tra quota + tạo AiUsage pending", "call"),
                ("db", "router", "Còn lượt sử dụng", "return"),
                ("router", "groq", "Prompt rút gọn + JSON Schema", "call"),
                ("groq", "router", "JSON + token usage", "return"),
                ("router", "router", "Validate schema và sanitize output", "internal"),
                ("router", "db", "Cập nhật success/failed, token, latency", "call"),
                ("router", "ui", "result + model + lượt còn lại", "return"),
                ("ui", "candidate", "Hiển thị đánh giá, không làm mất dữ liệu nhập", "return"),
            ],
            notes=[(80, 830, 400, 110, "Khóa Groq chỉ tồn tại ở backend; prompt không gửi thông tin liên hệ nguyên văn sau bước sanitize.", ORANGE)],
        ),
    ]


def build_activity(
    page_id: str,
    name: str,
    subtitle: str,
    nodes: list[tuple[str, str, str, int, int, int, int, str]],
    links: list[tuple[str, str, str]],
) -> str:
    cells: list[str] = []
    page_header(cells, page_id, name, subtitle, GREEN)
    ids: dict[str, str] = {}
    for key, label, kind, x, y, w, h, color in nodes:
        item_id = f"{page_id}-{key}"
        ids[key] = item_id
        if kind == "start":
            style = "ellipse;aspect=fixed;html=1;fillColor=#172033;strokeColor=#172033;"
        elif kind == "end":
            style = "ellipse;aspect=fixed;html=1;fillColor=#FFFFFF;strokeColor=#172033;strokeWidth=5;"
        elif kind == "decision":
            style = f"rhombus;whiteSpace=wrap;html=1;fillColor={SLATE_LIGHT};strokeColor={color};strokeWidth=2;fontSize=13;fontColor={INK};"
        elif kind == "database":
            style = f"shape=cylinder3;whiteSpace=wrap;html=1;boundedLbl=1;backgroundOutline=1;fillColor={BLUE_LIGHT};strokeColor={BLUE};strokeWidth=2;fontSize=13;fontColor={INK};"
        else:
            fill = GREEN_LIGHT if color == GREEN else BLUE_LIGHT if color == BLUE else ORANGE_LIGHT if color == ORANGE else VIOLET_LIGHT
            style = f"rounded=1;arcSize=12;whiteSpace=wrap;html=1;fillColor={fill};strokeColor={color};strokeWidth=2;fontSize=13;fontColor={INK};"
        cells.append(cell(item_id, label, style, x, y, w, h))
    link_style = f"edgeStyle=orthogonalEdgeStyle;rounded=1;html=1;strokeColor={LINE};strokeWidth=1.8;endArrow=block;endFill=1;fontSize=12;fontColor={INK};labelBackgroundColor=#FFFFFF;"
    for idx, (src, dst, label) in enumerate(links):
        cells.append(edge(f"{page_id}-link-{idx}", ids[src], ids[dst], label, style=link_style))
    return page_xml(page_id, name, cells)


def build_activity_pages() -> list[str]:
    return [
        build_activity(
            "act-cv", "Activity 1 — Tạo, chỉnh sửa và tải CV",
            "Luồng từ chọn CV tới lưu MongoDB hoặc xuất PDF bằng trình duyệt.",
            [
                ("start", "", "start", 100, 470, 34, 34, INK),
                ("open", "Mở thư viện CV", "action", 190, 450, 190, 72, BLUE),
                ("choose", "Tạo mới hay chỉnh sửa?", "decision", 450, 430, 180, 110, VIOLET),
                ("new", "Khởi tạo CV và chọn mẫu", "action", 730, 260, 230, 78, VIOLET),
                ("load", "Tải CV thuộc người dùng", "action", 730, 610, 230, 78, BLUE),
                ("edit", "Nhập nội dung và xem trước", "action", 1040, 435, 250, 82, BLUE),
                ("valid", "Dữ liệu hợp lệ?", "decision", 1370, 425, 170, 110, ORANGE),
                ("save", "POST /api/resume", "action", 1370, 230, 190, 72, GREEN),
                ("db", "MongoDB Resume", "database", 1370, 90, 190, 92, BLUE),
                ("download", "In / lưu thành PDF", "action", 1370, 650, 200, 72, VIOLET),
                ("end", "", "end", 1660, 470, 38, 38, INK),
            ],
            [
                ("start", "open", ""), ("open", "choose", ""), ("choose", "new", "Tạo mới"),
                ("choose", "load", "Chỉnh sửa"), ("new", "edit", ""), ("load", "edit", ""),
                ("edit", "valid", ""), ("valid", "edit", "Không"), ("valid", "save", "Lưu"),
                ("save", "db", ""), ("db", "end", "Hoàn tất"), ("valid", "download", "Tải PDF"),
                ("download", "end", ""),
            ],
        ),
        build_activity(
            "act-apply", "Activity 2 — Tìm việc và ứng tuyển",
            "Hai nhánh CV đã lưu và PDF tải lên hội tụ tại bước tạo Application.",
            [
                ("start", "", "start", 70, 475, 34, 34, INK),
                ("login", "Ứng viên đăng nhập", "action", 150, 455, 190, 72, BLUE),
                ("browse", "Tìm, lọc và xem Job", "action", 400, 455, 210, 72, BLUE),
                ("fit", "Job phù hợp?", "decision", 680, 435, 160, 110, VIOLET),
                ("detail", "Xem chi tiết Job", "action", 920, 455, 190, 72, BLUE),
                ("cv", "Chọn cách nộp CV", "decision", 1180, 435, 170, 110, ORANGE),
                ("saved", "Chọn CV đã lưu", "action", 1420, 260, 190, 72, GREEN),
                ("upload", "Tải PDF → Resume ảo", "action", 1420, 650, 210, 72, VIOLET),
                ("duplicate", "Đã ứng tuyển?", "decision", 1420, 435, 170, 110, ORANGE),
                ("create", "Tạo Application Pending\n+ jobSnapshot + Notification", "action", 1580, 435, 190, 95, GREEN),
                ("end", "", "end", 1740, 470, 38, 38, INK),
            ],
            [
                ("start", "login", ""), ("login", "browse", ""), ("browse", "fit", ""),
                ("fit", "browse", "Không"), ("fit", "detail", "Có"), ("detail", "cv", ""),
                ("cv", "saved", "CV đã lưu"), ("cv", "upload", "PDF"), ("saved", "duplicate", ""),
                ("upload", "duplicate", ""), ("duplicate", "detail", "Có / báo lỗi"),
                ("duplicate", "create", "Chưa"), ("create", "end", ""),
            ],
        ),
        build_activity(
            "act-company", "Activity 3 — Doanh nghiệp xử lý hồ sơ",
            "Luồng xem CV, cập nhật trạng thái và thông báo cho ứng viên.",
            [
                ("start", "", "start", 80, 475, 34, 34, INK),
                ("login", "Doanh nghiệp đăng nhập", "action", 150, 455, 210, 72, GREEN),
                ("dashboard", "Mở Company Dashboard", "action", 430, 455, 220, 72, GREEN),
                ("list", "Xem / tìm / lọc hồ sơ", "action", 720, 455, 220, 72, BLUE),
                ("view", "Xem CV và hồ sơ ứng viên", "action", 1010, 455, 230, 72, BLUE),
                ("decide", "Quyết định trạng thái", "decision", 1320, 435, 180, 110, ORANGE),
                ("review", "Reviewing", "action", 1320, 190, 170, 65, BLUE),
                ("interview", "Interview", "action", 1530, 270, 170, 65, VIOLET),
                ("offer", "Offered / Accepted", "action", 1530, 610, 180, 65, GREEN),
                ("reject", "Rejected", "action", 1320, 720, 170, 65, ORANGE),
                ("notify", "Lưu trạng thái và tạo Notification", "action", 1510, 455, 220, 82, GREEN),
                ("end", "", "end", 1745, 475, 38, 38, INK),
            ],
            [
                ("start", "login", ""), ("login", "dashboard", ""), ("dashboard", "list", ""),
                ("list", "view", ""), ("view", "decide", ""), ("decide", "review", "Cần xem thêm"),
                ("decide", "interview", "Phỏng vấn"), ("decide", "offer", "Đạt"),
                ("decide", "reject", "Không phù hợp"), ("review", "notify", ""),
                ("interview", "notify", ""), ("offer", "notify", ""), ("reject", "notify", ""),
                ("notify", "end", ""),
            ],
        ),
        build_activity(
            "act-interview", "Activity 4 — Luyện phỏng vấn với AI",
            "Mỗi lượt được đánh giá có cấu trúc; cuối buổi AI tổng hợp điểm mạnh và nội dung cần cải thiện.",
            [
                ("start", "", "start", 80, 475, 34, 34, INK),
                ("config", "Nhập vị trí, cấp độ, hình thức\nvà số lượng câu", "action", 160, 440, 240, 100, VIOLET),
                ("valid", "Thiết lập hợp lệ?", "decision", 470, 435, 180, 110, ORANGE),
                ("ask", "AI tạo câu hỏi hiện tại", "action", 740, 455, 220, 72, BLUE),
                ("answer", "Ứng viên nhập câu trả lời", "action", 1030, 455, 230, 72, VIOLET),
                ("evaluate", "AI chấm điểm và phản hồi", "action", 1330, 455, 220, 72, ORANGE),
                ("more", "Đủ số câu hoặc kết thúc?", "decision", 1330, 680, 190, 120, GREEN),
                ("summary", "AI tổng kết buổi phỏng vấn", "action", 1040, 735, 230, 72, GREEN),
                ("retry", "Luyện lại", "action", 740, 735, 180, 72, VIOLET),
                ("end", "", "end", 1660, 730, 38, 38, INK),
            ],
            [
                ("start", "config", ""), ("config", "valid", ""), ("valid", "config", "Không"),
                ("valid", "ask", "Có"), ("ask", "answer", ""), ("answer", "evaluate", ""),
                ("evaluate", "more", "Lưu review theo câu"), ("more", "ask", "Chưa"),
                ("more", "summary", "Rồi"), ("summary", "retry", "Muốn luyện lại"),
                ("summary", "end", "Kết thúc"), ("retry", "config", ""),
            ],
        ),
        build_activity(
            "act-cron", "Activity 5 — Cron kiểm tra tin tuyển dụng hết hạn",
            "Vercel Cron gọi endpoint bảo vệ bằng token; service xử lý tin sắp hết hạn và đã hết hạn.",
            [
                ("start", "", "start", 70, 475, 34, 34, INK),
                ("trigger", "Cron gọi /api/cron/job-expiry", "action", 150, 455, 240, 72, GREEN),
                ("auth", "Cron token hợp lệ?", "decision", 470, 435, 170, 110, ORANGE),
                ("querySoon", "Tìm Job còn ≤ 3 ngày\nvà chưa gửi cảnh báo", "database", 730, 240, 230, 110, BLUE),
                ("soon", "Có Job sắp hết hạn?", "decision", 1030, 240, 180, 110, VIOLET),
                ("notifySoon", "Thông báo company và\nứng viên đã lưu Job", "action", 1290, 240, 230, 90, GREEN),
                ("queryExpired", "Tìm Job expiryDate < now\nvà chưa xử lý", "database", 730, 650, 230, 110, BLUE),
                ("expired", "Có Job đã hết hạn?", "decision", 1030, 650, 180, 110, ORANGE),
                ("update", "Đổi status=Expired và\nthông báo company", "action", 1290, 650, 230, 90, ORANGE),
                ("summary", "Trả summary số Job đã xử lý", "action", 1560, 455, 190, 82, GREEN),
                ("end", "", "end", 1740, 480, 38, 38, INK),
            ],
            [
                ("start", "trigger", ""), ("trigger", "auth", ""), ("auth", "end", "Không / 401"),
                ("auth", "querySoon", "Có"), ("querySoon", "soon", ""),
                ("soon", "notifySoon", "Có"), ("soon", "queryExpired", "Không"),
                ("notifySoon", "queryExpired", "Đánh dấu expiryNotifiedAt"),
                ("queryExpired", "expired", ""), ("expired", "update", "Có"),
                ("expired", "summary", "Không"), ("update", "summary", "Đánh dấu expiredNotifiedAt"),
                ("summary", "end", ""),
            ],
        ),
    ]


def build() -> Path:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    pages = [build_class_core(), build_class_support(), *build_sequence_pages(), *build_activity_pages()]
    modified = datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")
    xml = (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        f'<mxfile host="app.diagrams.net" modified="{modified}" agent="Codex" '
        'version="26.0.16" type="device">\n'
        + "\n".join(pages)
        + "\n</mxfile>\n"
    )
    OUT_FILE.write_text(xml, encoding="utf-8")
    (OUT_DIR / "README.md").write_text(
        "# RabbitCV — UML diagrams\n\n"
        "Tệp `RabbitCV-Class-Sequence-Activity.drawio` gồm 16 trang:\n\n"
        "- 2 Class Diagram\n"
        "- 9 Sequence Diagram\n"
        "- 5 Activity Diagram\n\n"
        "Các sơ đồ được đối chiếu với model, API, Socket.IO, AI service và cron hiện có trong mã nguồn.\n",
        encoding="utf-8",
    )
    return OUT_FILE


if __name__ == "__main__":
    print(build())
