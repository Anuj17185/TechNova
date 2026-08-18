"""Train the three-class SwachhLens YOLO detector."""

from __future__ import annotations

import argparse
from pathlib import Path

from ultralytics import YOLO

try:
    from .utils import ROOT_DIR, get_device
except ImportError:
    from utils import ROOT_DIR, get_device


MODEL = "yolo26n.pt"
DATASET_PATH = ROOT_DIR / "dataset.yaml"
EPOCHS = 50
IMAGE_SIZE = 640
BATCH_SIZE = 8
WORKERS = 0  # More reliable on Windows; increase only if loading is a bottleneck.
OUTPUT_PROJECT = ROOT_DIR / "models"
RUN_NAME = "three_class"


def train(
    model_name: str = MODEL,
    dataset_path: str | Path = DATASET_PATH,
    epochs: int = EPOCHS,
    image_size: int = IMAGE_SIZE,
    batch_size: int = BATCH_SIZE,
    device: int | str | None = None,
):
    dataset_path = Path(dataset_path).expanduser()
    if not dataset_path.is_file():
        raise FileNotFoundError(f"Dataset configuration does not exist: {dataset_path}")

    selected_device = get_device() if device is None else device
    print(f"Training on: {'CUDA device 0' if selected_device == 0 else selected_device}")
    model = YOLO(model_name)
    return model.train(
        data=str(dataset_path),
        epochs=epochs,
        imgsz=image_size,
        batch=batch_size,
        device=selected_device,
        workers=WORKERS,
        project=str(OUTPUT_PROJECT),
        name=RUN_NAME,
        exist_ok=True,
        pretrained=True,
    )


def _parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--model", default=MODEL)
    parser.add_argument("--data", default=str(DATASET_PATH))
    parser.add_argument("--epochs", type=int, default=EPOCHS)
    parser.add_argument("--imgsz", type=int, default=IMAGE_SIZE)
    parser.add_argument("--batch", type=int, default=BATCH_SIZE)
    parser.add_argument("--device", default=None, help="Use cpu, 0, or leave unset for automatic selection")
    return parser


if __name__ == "__main__":
    args = _parser().parse_args()
    train(args.model, args.data, args.epochs, args.imgsz, args.batch, args.device)

