"""Run three-class waste detection on one image."""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any

import cv2
from ultralytics import YOLO

try:
    from .utils import DEFAULT_CONFIDENCE_THRESHOLD, DEFAULT_MODEL_PATH, ROOT_DIR, detections_from_result, get_device, require_file
except ImportError:
    from utils import DEFAULT_CONFIDENCE_THRESHOLD, DEFAULT_MODEL_PATH, ROOT_DIR, detections_from_result, get_device, require_file


def detect_waste(
    image_path: str | Path,
    model_path: str | Path = DEFAULT_MODEL_PATH,
    confidence: float = DEFAULT_CONFIDENCE_THRESHOLD,
    output_path: str | Path | None = None,
) -> list[dict[str, Any]]:
    """Detect waste and return JSON-friendly pixel-coordinate dictionaries."""

    image_path = require_file(image_path, "Image")
    model_path = require_file(model_path, "Model")
    image = cv2.imread(str(image_path))
    if image is None:
        raise ValueError(f"Image cannot be opened: {image_path}")

    model = YOLO(str(model_path))
    result = model.predict(source=image, conf=confidence, device=get_device(), verbose=False)[0]
    detections = detections_from_result(result)

    if output_path is None:
        output_path = ROOT_DIR / "outputs" / "images" / f"{image_path.stem}_annotated.jpg"
    output_path = Path(output_path).expanduser()
    output_path.parent.mkdir(parents=True, exist_ok=True)
    if not cv2.imwrite(str(output_path), result.plot()):
        raise OSError(f"Annotated image could not be saved: {output_path}")

    return detections


def _parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("image", help="Path to an image")
    parser.add_argument("--model", default=str(DEFAULT_MODEL_PATH))
    parser.add_argument("--conf", type=float, default=DEFAULT_CONFIDENCE_THRESHOLD)
    parser.add_argument("--output", default=None)
    return parser


if __name__ == "__main__":
    args = _parser().parse_args()
    try:
        detections = detect_waste(args.image, args.model, args.conf, args.output)
        print(json.dumps(detections, indent=2))
    except (FileNotFoundError, ValueError, OSError) as error:
        raise SystemExit(f"Error: {error}") from error

