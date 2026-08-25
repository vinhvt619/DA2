from __future__ import annotations

import copy
from pathlib import Path
import xml.etree.ElementTree as ET


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "bao-cao" / "uml-v2" / "RabbitCV-UML-Toan-Bo-V2.drawio"
OUTPUT_DIR = SOURCE.parent

GROUPS = {
    "Class ": ("RabbitCV-Class-Diagram-V2.drawio", 4),
    "Sequence ": ("RabbitCV-Sequence-Diagram-V2.drawio", 14),
    "Activity ": ("RabbitCV-Activity-Diagram-V2.drawio", 10),
}


def split_drawio() -> list[tuple[Path, int]]:
    source_root = ET.parse(SOURCE).getroot()
    diagrams = list(source_root.findall("diagram"))
    outputs: list[tuple[Path, int]] = []

    for prefix, (filename, expected_count) in GROUPS.items():
        selected = [diagram for diagram in diagrams if diagram.get("name", "").startswith(prefix)]
        if len(selected) != expected_count:
            raise ValueError(
                f"Nhom {prefix!r} co {len(selected)} trang, mong doi {expected_count}."
            )

        target_root = ET.Element(source_root.tag, source_root.attrib)
        for diagram in selected:
            target_root.append(copy.deepcopy(diagram))

        target = OUTPUT_DIR / filename
        ET.ElementTree(target_root).write(target, encoding="utf-8", xml_declaration=True)
        outputs.append((target, len(selected)))

    return outputs


if __name__ == "__main__":
    for path, count in split_drawio():
        print(f"{path}\t{count}")
