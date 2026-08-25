from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path

import build_uml_complete_v2 as base


ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "bao-cao" / "uml-v3"
OUT_COMBINED = OUT_DIR / "RabbitCV-UML-Toan-Bo-V3.drawio"


# Primitive tokens
WHITE = "#FFFFFF"
SLATE_950 = "#0F172A"
SLATE_800 = "#1E293B"
SLATE_700 = "#334155"
SLATE_500 = "#64748B"
SLATE_300 = "#CBD5E1"
SLATE_200 = "#E2E8F0"
SLATE_100 = "#F1F5F9"
SLATE_50 = "#F8FAFC"
NAVY_900 = "#0B2D4B"
NAVY_700 = "#184E77"
BLUE_600 = "#2563EB"
CYAN_600 = "#0891B2"
TEAL_700 = "#0F766E"
VIOLET_600 = "#6D28D9"
GREEN_700 = "#15803D"
AMBER_700 = "#B45309"
RED_700 = "#B91C1C"

# Semantic tokens
CANVAS = "#EEF3F8"
SURFACE = WHITE
TEXT = SLATE_950
TEXT_MUTED = SLATE_500
BORDER = SLATE_300
PRIMARY = NAVY_700
PRIMARY_DARK = NAVY_900
ACCENT = CYAN_600
SUCCESS = GREEN_700
WARNING = AMBER_700
DANGER = RED_700

# Component fills
BLUE_BG = "#EAF2FF"
CYAN_BG = "#E6F8FB"
TEAL_BG = "#E8F7F4"
VIOLET_BG = "#F1ECFE"
GREEN_BG = "#EAF7EE"
AMBER_BG = "#FFF5E6"
RED_BG = "#FDECEC"
NOTE_BG = "#FFF9DB"


def install_base_tokens() -> None:
    """Map V2 semantic roles to the V3 academic UI palette."""
    base.INK = TEXT
    base.MUTED = TEXT_MUTED
    base.LINE = SLATE_500
    base.BLUE, base.BLUE_BG = BLUE_600, BLUE_BG
    base.VIOLET, base.VIOLET_BG = VIOLET_600, VIOLET_BG
    base.GREEN, base.GREEN_BG = GREEN_700, GREEN_BG
    base.ORANGE, base.ORANGE_BG = AMBER_700, AMBER_BG
    base.RED, base.RED_BG = RED_700, RED_BG
    base.YELLOW_BG = NOTE_BG


def page_v3(pid: str, name: str, cells: list[str]) -> str:
    board = base.vertex(
        f"{pid}-board",
        "",
        f"rounded=1;arcSize=10;fillColor={SURFACE};strokeColor={BORDER};"
        "strokeWidth=1;shadow=1;html=1;",
        20,
        10,
        1880,
        1050,
    )
    roots = "\n".join(['<mxCell id="0"/>', '<mxCell id="1" parent="0"/>', board, *cells])
    return (
        f'<diagram id="{base.q(pid)}" name="{base.q(name)}"><mxGraphModel dx="{base.W}" dy="{base.H}" '
        f'grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" '
        f'pageScale="1" pageWidth="{base.W}" pageHeight="{base.H}" math="0" shadow="0" background="{CANVAS}">'
        f'<root>{roots}</root></mxGraphModel></diagram>'
    )


def header_v3(cells: list[str], pid: str, title: str, subtitle: str, accent: str) -> None:
    category = "UML DIAGRAM"
    lowered = title.lower()
    if lowered.startswith("class"):
        category = "CLASS DIAGRAM"
    elif lowered.startswith("sequence"):
        category = "SEQUENCE DIAGRAM"
    elif lowered.startswith("activity"):
        category = "ACTIVITY DIAGRAM"

    cells.append(base.vertex(
        f"{pid}-header-bg",
        "",
        f"rounded=1;arcSize=10;fillColor={PRIMARY_DARK};strokeColor={PRIMARY_DARK};shadow=0;",
        28,
        18,
        1864,
        96,
    ))
    cells.append(base.vertex(
        f"{pid}-header-accent",
        "",
        f"rounded=1;arcSize=10;fillColor={accent};strokeColor={accent};",
        28,
        18,
        10,
        96,
    ))
    cells.append(base.vertex(
        f"{pid}-title",
        title,
        f"text;html=1;align=left;verticalAlign=middle;fontFamily=Arial;fontSize=28;"
        f"fontStyle=1;fontColor={WHITE};strokeColor=none;fillColor=none;",
        58,
        27,
        1450,
        42,
    ))
    cells.append(base.vertex(
        f"{pid}-subtitle",
        subtitle,
        "text;html=1;align=left;verticalAlign=middle;fontFamily=Arial;fontSize=13;"
        "fontColor=#D7E5F0;strokeColor=none;fillColor=none;",
        60,
        68,
        1490,
        28,
    ))
    cells.append(base.vertex(
        f"{pid}-category",
        category,
        f"rounded=1;arcSize=50;html=1;align=center;verticalAlign=middle;fillColor={accent};"
        f"strokeColor={accent};fontFamily=Arial;fontSize=12;fontStyle=1;fontColor={WHITE};",
        1615,
        45,
        225,
        38,
    ))


def class_node_v3(
    cells: list[str],
    pid: str,
    key: str,
    name: str,
    fields: list[str],
    x: int,
    y: int,
    w: int,
    h: int,
    color: str,
    bg: str,
    stereotype: str = "model",
) -> str:
    cid = f"{pid}-{key}"
    rows = "<br>".join(base.q(field) for field in fields)
    body = (
        f'<div style="text-align:left;line-height:1.58;color:{TEXT};font-family:Arial">{rows}</div>'
    )
    cells.append(base.html_vertex(
        cid,
        body,
        f"rounded=0;whiteSpace=wrap;html=1;align=left;verticalAlign=top;spacing=11;"
        f"spacingTop=64;fillColor={SURFACE};strokeColor={color};strokeWidth=1.5;"
        f"fontFamily=Arial;fontSize=12;fontColor={TEXT};shadow=1;",
        x,
        y,
        w,
        h,
    ))
    header_label = (
        f'<div style="font-size:10px;letter-spacing:.4px">&lt;&lt;{base.q(stereotype)}&gt;&gt;</div>'
        f'<div style="font-size:17px;margin-top:2px"><b>{base.q(name)}</b></div>'
    )
    cells.append(base.html_vertex(
        f"{cid}-header",
        header_label,
        f"rounded=0;whiteSpace=wrap;html=1;align=center;verticalAlign=middle;fillColor={color};"
        f"strokeColor={color};strokeWidth=1.5;fontFamily=Arial;fontColor={WHITE};",
        x,
        y,
        w,
        56,
    ))
    return cid


def participant_style(label: str, index: int) -> tuple[str, str, str]:
    text = label.lower()
    if any(word in text for word in ("người dùng", "ứng viên", "người gửi", "quản trị viên", "doanh nghiệp")):
        return VIOLET_600, VIOLET_BG, "ACTOR"
    if any(word in text for word in ("react", "ui", "authcontext", "query", "client", "dashboard", "settings")):
        return CYAN_600, CYAN_BG, "UI"
    if any(word in text for word in ("mongodb", "database", "message", "state", "resume", "job", "usage")):
        return SLATE_700, SLATE_100, "DATA"
    if any(word in text for word in ("service", "socket", "groq", "browser", "print", "cron")):
        return TEAL_700, TEAL_BG, "SERVICE"
    if any(word in text for word in ("api", "controller", "endpoint", "express")):
        return BLUE_600, BLUE_BG, "BACKEND"
    return (VIOLET_600, VIOLET_BG, "ACTOR") if index == 0 else (BLUE_600, BLUE_BG, "SYSTEM")


def sequence_page_v3(
    pid: str,
    name: str,
    subtitle: str,
    participants: list[tuple[str, str]],
    messages: list[tuple[str, str, str, str]],
    notes: list[tuple[str, int, int, int, int]] | None = None,
) -> str:
    cells: list[str] = []
    header_v3(cells, pid, name, subtitle, BLUE_600)
    left, right = 140, 1780
    gap = (right - left) / max(1, len(participants) - 1)
    centers: dict[str, float] = {}
    colors: dict[str, str] = {}
    roles: dict[str, str] = {}

    for index, (key, label) in enumerate(participants):
        cx = left + gap * index
        color, _bg, role = participant_style(label, index)
        centers[key] = cx
        colors[key] = color
        roles[key] = role
        participant_label = (
            f'<div style="font-size:9px;letter-spacing:.5px;opacity:.85">{role}</div>'
            f'<div style="font-size:14px;margin-top:3px"><b>{base.q(label)}</b></div>'
        )
        cells.append(base.html_vertex(
            f"{pid}-p-{key}",
            participant_label,
            f"rounded=1;arcSize=8;whiteSpace=wrap;html=1;fillColor={color};strokeColor={color};"
            f"strokeWidth=1.5;fontFamily=Arial;fontColor={WHITE};shadow=1;",
            cx - 94,
            135,
            188,
            58,
        ))
        cells.append(base.vertex(
            f"{pid}-life-{key}",
            "",
            f"shape=line;dashed=1;dashPattern=5 5;strokeColor={SLATE_300};"
            "strokeWidth=1.2;direction=south;",
            cx,
            193,
            1,
            770,
        ))

    max_height = 710
    step = max(40, min(55, max_height / max(1, len(messages))))
    y0 = 230
    activity_ranges: dict[str, list[int]] = {key: [] for key, _label in participants}
    for index, (source, target, _label, kind) in enumerate(messages):
        if kind != "internal":
            activity_ranges[source].append(index)
            activity_ranges[target].append(index)

    for key, indices in activity_ranges.items():
        if not indices or roles[key] == "ACTOR":
            continue
        start_y = y0 + min(indices) * step - 7
        end_y = y0 + max(indices) * step + 17
        cells.append(base.vertex(
            f"{pid}-activation-{key}",
            "",
            f"rounded=0;fillColor={SURFACE};strokeColor={colors[key]};strokeWidth=1.2;shadow=0;",
            centers[key] - 6,
            start_y,
            12,
            max(24, end_y - start_y),
        ))

    for index, (source, target, label, kind) in enumerate(messages):
        y = y0 + index * step
        if source == target or kind == "internal":
            cx = centers[source]
            cells.append(base.vertex(
                f"{pid}-self-{index}",
                label,
                f"rounded=1;arcSize=8;whiteSpace=wrap;html=1;fillColor={NOTE_BG};"
                f"strokeColor={WARNING};strokeWidth=1.3;fontFamily=Arial;fontSize=11;"
                f"fontColor={TEXT};spacing=5;shadow=1;",
                cx - 108,
                y - 16,
                216,
                34,
            ))
            continue

        source_anchor = f"{pid}-sa-{index}"
        target_anchor = f"{pid}-ta-{index}"
        invisible = "ellipse;fillColor=none;strokeColor=none;opacity=0;"
        cells.append(base.vertex(source_anchor, "", invisible, centers[source], y, 1, 1))
        cells.append(base.vertex(target_anchor, "", invisible, centers[target], y, 1, 1))
        is_return = kind == "return"
        color = SUCCESS if is_return else PRIMARY
        message_style = (
            f"edgeStyle=none;rounded=0;html=1;strokeColor={color};strokeWidth=1.6;"
            f"endArrow=block;endFill=1;dashed={1 if is_return else 0};fontFamily=Arial;fontSize=11;"
            f"fontColor={TEXT};labelBackgroundColor={SURFACE};"
        )
        cells.append(base.edge(
            f"{pid}-m-{index}", source_anchor, target_anchor, label, message_style
        ))

    for index, (text, x, y, w, h) in enumerate(notes or []):
        cells.append(base.vertex(
            f"{pid}-note-{index}",
            text,
            f"shape=note;whiteSpace=wrap;html=1;fillColor={NOTE_BG};strokeColor={WARNING};"
            f"strokeWidth=1.2;fontFamily=Arial;fontSize=11;fontColor={TEXT};spacing=7;shadow=1;",
            x,
            y,
            w,
            h,
        ))

    cells.append(base.vertex(
        f"{pid}-legend",
        "Yêu cầu/lệnh: nét liền navy   •   Phản hồi: nét đứt xanh lá   •   Xử lý nội bộ: thẻ vàng",
        f"rounded=1;arcSize=50;html=1;align=center;fontFamily=Arial;fontSize=11;"
        f"fontColor={TEXT_MUTED};strokeColor={SLATE_200};fillColor={SLATE_50};",
        505,
        1004,
        910,
        28,
    ))
    return page_v3(pid, name, cells)


def lane(cells: list[str], pid: str, index: int, label: str, x: int, width: int, fill: str) -> None:
    cells.append(base.vertex(
        f"{pid}-lane-{index}",
        "",
        f"rounded=0;fillColor={fill};strokeColor={SLATE_200};strokeWidth=1;",
        x,
        160,
        width,
        825,
    ))
    cells.append(base.vertex(
        f"{pid}-lane-title-{index}",
        label,
        f"rounded=0;html=1;align=center;verticalAlign=middle;fillColor={SLATE_100};"
        f"strokeColor={SLATE_200};strokeWidth=1;fontFamily=Arial;fontSize=11;"
        f"fontStyle=1;fontColor={SLATE_700};",
        x,
        126,
        width,
        34,
    ))


def activity_page_v3(
    pid: str,
    name: str,
    subtitle: str,
    nodes: list[tuple[str, str, str, int, int, int, int, str]],
    links: list[tuple[str, str, str]],
) -> str:
    cells: list[str] = []
    header_v3(cells, pid, name, subtitle, TEAL_700)
    lane(cells, pid, 1, "1  KHỞI TẠO & NHẬP LIỆU", 48, 580, "#FCFDFE")
    lane(cells, pid, 2, "2  KIỂM TRA & XỬ LÝ", 628, 670, "#F8FBFF")
    lane(cells, pid, 3, "3  LƯU DỮ LIỆU & PHẢN HỒI", 1298, 574, "#FBFEFD")

    fill_for_color = {
        BLUE_600: BLUE_BG,
        VIOLET_600: VIOLET_BG,
        GREEN_700: GREEN_BG,
        AMBER_700: AMBER_BG,
        RED_700: RED_BG,
        TEAL_700: TEAL_BG,
    }
    ids: dict[str, str] = {}
    for key, label, kind, x, y, w, h, color in nodes:
        cid = f"{pid}-{key}"
        ids[key] = cid
        if kind == "start":
            style = f"ellipse;aspect=fixed;html=1;fillColor={PRIMARY_DARK};strokeColor={PRIMARY_DARK};"
        elif kind == "end":
            style = (
                f"ellipse;aspect=fixed;html=1;fillColor={SURFACE};strokeColor={PRIMARY_DARK};"
                "strokeWidth=5;"
            )
        elif kind == "decision":
            style = (
                f"rhombus;whiteSpace=wrap;html=1;fillColor={SURFACE};strokeColor={color};"
                f"strokeWidth=1.8;fontFamily=Arial;fontSize=11;fontStyle=1;fontColor={TEXT};shadow=1;"
            )
        elif kind == "db":
            style = (
                f"shape=cylinder3;whiteSpace=wrap;html=1;boundedLbl=1;backgroundOutline=1;"
                f"fillColor={BLUE_BG};strokeColor={BLUE_600};strokeWidth=1.8;fontFamily=Arial;"
                f"fontSize=11;fontStyle=1;fontColor={TEXT};shadow=1;"
            )
        else:
            bg = fill_for_color.get(color, SLATE_100)
            style = (
                f"rounded=1;arcSize=10;whiteSpace=wrap;html=1;fillColor={bg};strokeColor={color};"
                f"strokeWidth=1.6;fontFamily=Arial;fontSize=11;fontStyle=1;fontColor={TEXT};shadow=1;"
            )
        cells.append(base.vertex(cid, label, style, x, y, w, h))

    for index, (source, target, label) in enumerate(links):
        label_lower = label.lower()
        color = SLATE_700
        if "không" in label_lower or "lỗi" in label_lower or "401" in label_lower:
            color = DANGER
        elif label in {"Có", "Rồi", "Đạt", "Chưa"} or label_lower.startswith("có"):
            color = SUCCESS
        style = (
            f"edgeStyle=orthogonalEdgeStyle;rounded=1;html=1;strokeColor={color};strokeWidth=1.6;"
            f"endArrow=block;endFill=1;fontFamily=Arial;fontSize=10;fontStyle=1;fontColor={color};"
            f"labelBackgroundColor={SURFACE};"
        )
        cells.append(base.edge(f"{pid}-e-{index}", ids[source], ids[target], label, style))
    return page_v3(pid, name, cells)


def mxfile(pages: list[str]) -> str:
    modified = datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")
    return (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        f'<mxfile host="app.diagrams.net" modified="{modified}" agent="Codex" '
        'version="26.0.16" type="device">\n'
        + "\n".join(pages)
        + "\n</mxfile>\n"
    )


def build() -> list[Path]:
    install_base_tokens()
    base.page = page_v3
    base.header = header_v3
    base.class_node = class_node_v3
    base.sequence_page = sequence_page_v3
    base.activity_page = activity_page_v3

    class_pages = base.build_class_pages()
    sequence_pages = base.build_sequence_pages()
    activity_pages = base.build_activity_pages()
    all_pages = [*class_pages, *sequence_pages, *activity_pages]

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    outputs = [
        (OUT_COMBINED, all_pages),
        (OUT_DIR / "RabbitCV-Class-Diagram-V3.drawio", class_pages),
        (OUT_DIR / "RabbitCV-Sequence-Diagram-V3.drawio", sequence_pages),
        (OUT_DIR / "RabbitCV-Activity-Diagram-V3.drawio", activity_pages),
    ]
    for path, pages in outputs:
        path.write_text(mxfile(pages), encoding="utf-8")

    (OUT_DIR / "DESIGN-SYSTEM.md").write_text(
        "# RabbitCV UML V3 - Design system\n\n"
        "Phong cách: UML học thuật hiện đại, tham chiếu main.pdf.\n\n"
        "- Primary navy: #184E77; header navy dark: #0B2D4B.\n"
        "- UI/cyan: #0891B2; service/teal: #0F766E; actor/violet: #6D28D9.\n"
        "- Success: #15803D; warning: #B45309; error: #B91C1C.\n"
        "- Class: header đặc + thân trắng, chia ngăn theo UML.\n"
        "- Sequence: participant theo vai trò, lifeline nét đứt, activation bar, phản hồi nét đứt.\n"
        "- Activity: ba activity partition, action card, decision diamond, database cylinder.\n",
        encoding="utf-8",
    )
    return [path for path, _pages in outputs]


if __name__ == "__main__":
    for output in build():
        print(output)
