import sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(ROOT_DIR))

from src.predict import detect_waste


def analyze_image(image_path: str, output_path: str):
    return detect_waste(
        image_path=image_path,
        confidence=0.4,
        output_path=output_path,
    )