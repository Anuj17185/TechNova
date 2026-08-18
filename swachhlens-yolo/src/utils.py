"""Small shared helpers for the three-class waste detector."""

from __future__ import annotations

from pathlib import Path
from typing import Any


ROOT_DIR = Path(__file__).resolve().parents[1]
CLASS_NAMES = ("garbage_dump", "overflowing_bin", "drain_blockage")
DEFAULT_CONFIDENCE_THRESHOLD = 0.4
DEFAULT_MODEL_PATH = ROOT_DIR / "models" / "three_class" / "weights" / "best.pt"


def get_device() -> int | str:
    """Use the first CUDA device when available, otherwise use the CPU."""

    try:
        import torch

        return 0 if torch.cuda.is_available() else "cpu"
    except ImportError:
        return "cpu"


def require_file(path: str | Path, label: str) -> Path:
    """Return an existing file path or raise a readable error."""

    resolved = Path(path).expanduser()
    if not resolved.is_file():
        raise FileNotFoundError(f"{label} does not exist: {resolved}")
    return resolved


def detections_from_result(result: Any) -> list[dict[str, Any]]:
    """Convert one Ultralytics result into the public Python structure."""

    if result.boxes is None:
        return []

    names = result.names or {}
    detections: list[dict[str, Any]] = []
    classes = result.boxes.cls.cpu().tolist()
    confidences = result.boxes.conf.cpu().tolist()
    boxes = result.boxes.xyxy.cpu().tolist()

    for class_id, confidence, coordinates in zip(classes, confidences, boxes):
        class_id = int(class_id)
        class_name = names.get(class_id, str(class_id))
        x1, y1, x2, y2 = (int(round(value)) for value in coordinates)
        detections.append(
            {
                "class_id": class_id,
                "class_name": class_name,
                "confidence": round(float(confidence), 4),
                "bbox": {"x1": x1, "y1": y1, "x2": x2, "y2": y2},
            }
        )

    return detections

