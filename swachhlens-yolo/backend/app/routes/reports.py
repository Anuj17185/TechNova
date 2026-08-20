from fastapi import APIRouter,UploadFile,File,Form
from app.database import reports_collection
from datetime import datetime
from uuid import uuid4
from pydantic import BaseModel

import os
import uuid

from app.services.yolo_service import analyze_image

router = APIRouter()


@router.post("/reports")
def create_report(data: dict):

    report = {
        "report_id": str(uuid4()),
        "citizen_id": data.get("citizen_id"),
        "latitude": data.get("latitude"),
        "longitude": data.get("longitude"),
        "captured_at": data.get("captured_at"),
        "comment": data.get("comment"),
        "status": "submitted",
        "created_at": datetime.utcnow()
    }

    reports_collection.insert_one(report)

    return {
        "message": "Report created successfully",
        "report_id": report["report_id"],
        "status": "submitted"
    }
@router.get("/reports")
def get_reports(citizen_id: str):

    reports = list(
        reports_collection.find(
            {"citizen_id": citizen_id},
            {"_id": 0}
        )
    )

    return reports

@router.post("/reports/analyze")
async def analyze_report(
    image: UploadFile = File(...),
    citizen_id: str = Form(...),
    latitude: float = Form(...),
    longitude: float = Form(...),
    captured_at: str = Form(...),
    comment: str = Form(None)
):

    report_id = str(uuid4())

    os.makedirs("storage/originals", exist_ok=True)
    os.makedirs("storage/annotated", exist_ok=True)

    original_path = f"storage/originals/{report_id}.jpg"
    annotated_path = f"storage/annotated/{report_id}.jpg"

    image_data = await image.read()

    with open(original_path, "wb") as file:
        file.write(image_data)

    detections = analyze_image(
        image_path=original_path,
        output_path=annotated_path
    )

    ai_category = None
    ai_confidence = None

    if detections:
        best_detection = max(
            detections,
            key=lambda x: x["confidence"]
        )

        ai_category = best_detection["class_name"]
        ai_confidence = best_detection["confidence"]

    report = {
        "report_id": report_id,
        "citizen_id": citizen_id,
        "latitude": latitude,
        "longitude": longitude,
        "captured_at": captured_at,
        "comment": comment,
        "status": "draft",
        "ai_category": ai_category,
        "ai_confidence": ai_confidence,
        "detections": detections,
        "original_image_path": original_path,
        "annotated_image_path": annotated_path,
        "created_at": datetime.utcnow()
    }

    reports_collection.insert_one(report)

    return {
        "report_id": report_id,
        "status": "draft",
        "ai_category": ai_category,
        "ai_confidence": ai_confidence,
        "detections": detections,
        "original_image_url": f"/media/originals/{report_id}.jpg",
        "annotated_image_url": f"/media/annotated/{report_id}.jpg"
    }
class SubmitReport(BaseModel):
    confirmed_category: str
    size_category: str
    comment: str | None = None


@router.patch("/reports/{report_id}/submit")
def submit_report(report_id: str, data: SubmitReport):

    result = reports_collection.update_one(
        {"report_id": report_id},
        {
            "$set": {
                "confirmed_category": data.confirmed_category,
                "size_category": data.size_category,
                "comment": data.comment,
                "status": "submitted"
            }
        }
    )

    if result.matched_count == 0:
        return {
            "message": "Report not found"
        }

    return {
        "report_id": report_id,
        "status": "submitted"
    }