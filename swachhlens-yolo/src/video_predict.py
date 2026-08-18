"""Run three-class waste detection frame-by-frame on a video."""

from __future__ import annotations

import argparse
from pathlib import Path

import cv2
from ultralytics import YOLO

try:
    from .utils import DEFAULT_CONFIDENCE_THRESHOLD, DEFAULT_MODEL_PATH, ROOT_DIR, get_device, require_file
except ImportError:
    from utils import DEFAULT_CONFIDENCE_THRESHOLD, DEFAULT_MODEL_PATH, ROOT_DIR, get_device, require_file


def detect_video(
    video_path: str | Path,
    model_path: str | Path = DEFAULT_MODEL_PATH,
    confidence: float = DEFAULT_CONFIDENCE_THRESHOLD,
    output_path: str | Path | None = None,
) -> Path:
    """Annotate a video while preserving its frame size and approximate FPS."""

    video_path = require_file(video_path, "Video")
    model_path = require_file(model_path, "Model")
    capture = cv2.VideoCapture(str(video_path))
    if not capture.isOpened():
        raise ValueError(f"Video cannot be opened: {video_path}")

    fps = capture.get(cv2.CAP_PROP_FPS) or 30.0
    width = int(capture.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(capture.get(cv2.CAP_PROP_FRAME_HEIGHT))
    total_frames = int(capture.get(cv2.CAP_PROP_FRAME_COUNT))
    if width <= 0 or height <= 0:
        capture.release()
        raise ValueError(f"Video has no readable resolution: {video_path}")

    if output_path is None:
        output_path = ROOT_DIR / "outputs" / "videos" / f"{video_path.stem}_annotated.mp4"
    output_path = Path(output_path).expanduser()
    output_path.parent.mkdir(parents=True, exist_ok=True)
    writer = cv2.VideoWriter(str(output_path), cv2.VideoWriter_fourcc(*"mp4v"), fps, (width, height))
    if not writer.isOpened():
        capture.release()
        raise OSError(f"Annotated video could not be created: {output_path}")

    model = YOLO(str(model_path))
    frame_number = 0
    try:
        while True:
            ok, frame = capture.read()
            if not ok:
                break
            result = model.predict(source=frame, conf=confidence, device=get_device(), verbose=False)[0]
            writer.write(result.plot())
            frame_number += 1
            if frame_number == 1 or frame_number % 30 == 0:
                progress = f"{frame_number}/{total_frames}" if total_frames else str(frame_number)
                print(f"Processed frames: {progress}")
    finally:
        capture.release()
        writer.release()

    print(f"Saved annotated video: {output_path}")
    return output_path


def _parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("video", help="Path to a video")
    parser.add_argument("--model", default=str(DEFAULT_MODEL_PATH))
    parser.add_argument("--conf", type=float, default=DEFAULT_CONFIDENCE_THRESHOLD)
    parser.add_argument("--output", default=None)
    return parser


if __name__ == "__main__":
    args = _parser().parse_args()
    try:
        detect_video(args.video, args.model, args.conf, args.output)
    except (FileNotFoundError, ValueError, OSError) as error:
        raise SystemExit(f"Error: {error}") from error

