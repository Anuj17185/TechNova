# SwachhLens YOLO Waste Detection Module

This folder contains the computer-vision module for the SwachhLens hackathon project.

It accepts an image or video, runs an Ultralytics YOLO model, and produces:

- waste class labels;
- confidence scores;
- pixel bounding boxes;
- JSON-friendly Python results;
- annotated images or videos.

The current MVP model supports:

```text
0 garbage_dump
1 overflowing_bin
2 drain_blockage
```

`garbage_dump` and `drain_blockage` are the strongest demo classes. `overflowing_bin` is experimental because the available dataset contains very few positive examples.

## What to share with frontend/backend teammates

For inference and app integration, upload only these items to Drive:

```text
swachhlens/
├── models/
│   └── three_class/
│       └── weights/
│           └── best.pt
├── src/
│   ├── predict.py
│   ├── video_predict.py
│   ├── train.py
│   ├── prepare_dataset.py
│   └── utils.py
├── dataset.yaml
├── requirements.txt
└── README.md
```

Do not upload these unless somebody needs to retrain the model:

```text
.venv/
data/raw/
data/images/
data/labels/
models/three_class/plots and training logs
outputs/
__pycache__/
yolo26n.pt
```

The virtual environment is specific to one computer and should always be recreated locally. The prepared dataset and raw ZIP files are large and are not needed by the frontend or backend.

## Requirements

- Windows 10 or Windows 11
- Python 3.11 recommended
- approximately 3 GB of free space for Python packages
- no GPU required for normal image inference
- NVIDIA GPU recommended only for retraining

## Setup from zero on Windows PowerShell

Open PowerShell inside the shared `swachhlens` folder.

### 1. Create a virtual environment

```powershell
py -3.11 -m venv .venv
```

If `py` is unavailable, use:

```powershell
python -m venv .venv
```

### 2. Activate it

```powershell
.\.venv\Scripts\Activate.ps1
```

If PowerShell blocks activation:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\.venv\Scripts\Activate.ps1
```

The prompt should now begin with `(.venv)`.

### 3. Install dependencies

```powershell
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
```

Ultralytics installs PyTorch automatically. A CPU build is sufficient for backend inference.

### 4. Verify the installation and model file

```powershell
python -c "from ultralytics import YOLO; import cv2; print('Ultralytics and OpenCV ready')"
Test-Path models\three_class\weights\best.pt
```

The second command must print `True`.

## Run image detection

Replace the example path with a real image on the computer:

```powershell
python src\predict.py "C:\path\to\waste-photo.jpg" --conf 0.4
```

Do not type `path\to\your\image.jpg` literally; it is only a placeholder.

The command prints results such as:

```json
[
  {
    "class_id": 2,
    "class_name": "drain_blockage",
    "confidence": 0.7083,
    "bbox": {
      "x1": 135,
      "y1": 431,
      "x2": 615,
      "y2": 639
    }
  }
]
```

The annotated image is saved automatically to:

```text
outputs/images/<original-name>_annotated.jpg
```

An empty result (`[]`) means that the model found nothing above the selected confidence threshold. It does not mean the script failed.

## Backend integration contract

The backend should save an uploaded image to a temporary/local file and call:

```python
from src.predict import detect_waste

detections = detect_waste(
    image_path="uploads/report-123.jpg",
    confidence=0.4,
    output_path="outputs/images/report-123-annotated.jpg",
)
```

`detections` is a normal Python list and can be returned directly as JSON by FastAPI or another backend framework:

```python
[
    {
        "class_id": 0,
        "class_name": "garbage_dump",
        "confidence": 0.83,
        "bbox": {
            "x1": 174,
            "y1": 252,
            "x2": 190,
            "y2": 291,
        },
    }
]
```

Use a unique input filename and `output_path` for each report to avoid overwriting another user's annotated image. The function is synchronous, which is acceptable for the hackathon MVP.

The frontend does not need Ultralytics or Python. It should upload the image to the backend and render the backend's returned detections and annotated-image URL.

## Run video detection

```powershell
python src\video_predict.py "C:\path\to\waste-video.mp4" --conf 0.4
```

The annotated video is saved under:

```text
outputs/videos/
```

Video processing is optional and slower than image inference.

## Optional: retrain the model

Frontend/backend teammates do not need to perform this section. Use the included `best.pt` for inference.

Retraining requires these exact source archives under `data/raw`:

```text
data/raw/archive.zip
data/raw/waste-bin-fill-level-detect2.v2-v2.yolo26.zip
data/raw/drain-blockage.v1i.yolo26.zip
```

Prepare the combined YOLO dataset:

```powershell
python src\prepare_dataset.py
```

This creates:

```text
data/images/{train,val,test}/
data/labels/{train,val,test}/
```

For an NVIDIA GPU, install the CUDA-enabled PyTorch build recommended by the official selector at <https://pytorch.org/get-started/locally/>. Verify it before training:

```powershell
python -c "import torch; print(torch.cuda.is_available()); print(torch.cuda.get_device_name(0) if torch.cuda.is_available() else 'CPU only')"
```

Train the lightweight model:

```powershell
python src\train.py --epochs 8 --batch 8 --imgsz 512 --device 0
```

If 6 GB of GPU memory is insufficient, reduce the batch:

```powershell
python src\train.py --epochs 8 --batch 4 --imgsz 512 --device 0
```

Do not run long training jobs on CPU. The resulting model is saved to:

```text
models/three_class/weights/best.pt
```

## Project structure

```text
swachhlens/
├── data/
│   ├── raw/                 # Optional training archives
│   ├── images/              # Generated training images
│   └── labels/              # Generated YOLO labels
├── models/
│   └── three_class/
│       └── weights/
│           └── best.pt      # Required for inference
├── outputs/
│   ├── images/
│   └── videos/
├── src/
│   ├── prepare_dataset.py
│   ├── train.py
│   ├── predict.py
│   ├── video_predict.py
│   └── utils.py
├── dataset.yaml
├── requirements.txt
└── README.md
```

## Troubleshooting

### `Image does not exist`

Use the complete path to a real `.jpg`, `.jpeg`, or `.png` file and keep paths containing spaces inside quotes.

### `Model does not exist`

Confirm that this file was included in the Drive upload:

```text
models/three_class/weights/best.pt
```

### Prediction returns `[]`

The image may not contain a supported class, or detections may be below the threshold. For diagnosis only, try `--conf 0.15`; use `0.4` for the normal demo.

### `CUDA available: False`

This is fine for inference. It matters only when retraining. Install the correct CUDA-enabled PyTorch build if retraining is required.

## Known MVP limitations

- Only three of the eight proposed SwachhLens categories are present.
- `overflowing_bin` has very limited positive training data.
- The garbage dataset is mostly aerial imagery, so random street-level photos may not generalize well.
- The module does not estimate waste volume or severity.
- It does not implement APIs, authentication, GPS, databases, duplicate detection, dashboards, or frontend components.

These limitations should be stated in the documentation and pitch as future work rather than hidden.

