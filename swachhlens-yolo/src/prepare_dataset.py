"""Convert the three downloaded YOLO archives into one training dataset.

Expected archives in data/raw:
  archive.zip                                    -> garbage_dump
  waste-bin-fill-level-detect2.v2-v2.yolo26.zip -> overflowing_bin
  drain-blockage.v1i.yolo26.zip                 -> drain_blockage
"""

from __future__ import annotations

from collections import Counter
from pathlib import Path, PurePosixPath
from typing import Iterable
from zipfile import ZipFile

try:
    from .utils import ROOT_DIR
except ImportError:
    from utils import ROOT_DIR


RAW_DIR = ROOT_DIR / "data" / "raw"
IMAGE_DIR = ROOT_DIR / "data" / "images"
LABEL_DIR = ROOT_DIR / "data" / "labels"
IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}
SPLITS = {"train": "train", "valid": "val", "val": "val", "test": "test"}

SOURCES = (
    ("generic", "archive.zip", 0),
    ("bin", "waste-bin-fill-level-detect2.v2-v2.yolo26.zip", 1),
    ("drain", "drain-blockage.v1i.yolo26.zip", 2),
)


def _split_and_kind(member_name: str) -> tuple[str, str] | None:
    parts = PurePosixPath(member_name).parts
    for index, part in enumerate(parts):
        if part.lower() in {"images", "labels"} and index > 0:
            split = SPLITS.get(parts[index - 1].lower())
            if split:
                return split, part.lower()
    return None


def _image_members(zip_file: ZipFile) -> Iterable[tuple[object, str, str]]:
    for info in zip_file.infolist():
        if info.is_dir() or Path(info.filename).suffix.lower() not in IMAGE_EXTENSIONS:
            continue
        parsed = _split_and_kind(info.filename)
        if parsed and parsed[1] == "images":
            yield info, parsed[0], info.filename


def _label_member_name(image_name: str) -> str | None:
    parts = list(PurePosixPath(image_name).parts)
    try:
        image_index = next(i for i, part in enumerate(parts) if part.lower() == "images")
    except StopIteration:
        return None
    parts[image_index] = "labels"
    return PurePosixPath(*parts).with_suffix(".txt").as_posix()


def _remap_labels(text: str, source: str, target_id: int) -> tuple[str, int]:
    output: list[str] = []
    boxes = 0
    for line in text.splitlines():
        fields = line.split()
        if len(fields) < 5 or not fields[0].isdigit():
            continue
        source_id = int(fields[0])
        # The bin dataset contains empty/full/half-full/overflowing. Keep only
        # overflowing (source ID 3); the other source images remain negatives.
        if source == "bin" and source_id != 3:
            continue
        # The drain export has five source IDs but unusable class names. It is
        # intentionally collapsed to one drain_blockage class for this MVP.
        fields[0] = str(target_id)
        output.append(" ".join(fields))
        boxes += 1
    return ("\n".join(output) + ("\n" if output else ""), boxes)


def _destination_stem(source: str, image_name: str) -> str:
    filename = Path(PurePosixPath(image_name).name)
    return f"{source}_{filename.stem}"


def _prepare_source(source: str, archive_name: str, target_id: int, stats: Counter) -> None:
    archive_path = RAW_DIR / archive_name
    if not archive_path.is_file():
        raise FileNotFoundError(f"Missing dataset archive: {archive_path}")

    with ZipFile(archive_path) as zip_file:
        members = {info.filename: info for info in zip_file.infolist()}
        for image_info, split, image_name in _image_members(zip_file):
            image_path = Path(image_name)
            destination_stem = _destination_stem(source, image_name)
            destination_image = IMAGE_DIR / split / f"{destination_stem}{image_path.suffix.lower()}"
            destination_label = LABEL_DIR / split / f"{destination_stem}.txt"
            destination_image.parent.mkdir(parents=True, exist_ok=True)
            destination_label.parent.mkdir(parents=True, exist_ok=True)

            label_name = _label_member_name(image_name)
            label_text = zip_file.read(members[label_name]).decode("utf-8") if label_name in members else ""
            remapped_text, box_count = _remap_labels(label_text, source, target_id)
            destination_image.write_bytes(zip_file.read(image_info))
            destination_label.write_text(remapped_text, encoding="utf-8")

            stats[f"{split}_images"] += 1
            stats[f"{split}_boxes_{target_id}"] += box_count


def main() -> None:
    stats: Counter = Counter()
    for source, archive_name, target_id in SOURCES:
        print(f"Preparing {archive_name} -> class {target_id}")
        _prepare_source(source, archive_name, target_id, stats)

    print("Dataset ready:")
    for split in ("train", "val", "test"):
        print(
            f"  {split}: {stats[f'{split}_images']} images; "
            f"garbage_dump={stats[f'{split}_boxes_0']}, "
            f"overflowing_bin={stats[f'{split}_boxes_1']}, "
            f"drain_blockage={stats[f'{split}_boxes_2']} boxes"
        )


if __name__ == "__main__":
    main()

