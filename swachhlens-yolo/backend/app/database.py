import os
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
DATABASE_NAME = os.getenv("DATABASE_NAME", "swachhlens")

client = MongoClient(MONGO_URL, serverSelectionTimeoutMS=5000)

db = client[DATABASE_NAME]
reports_collection = db["reports"]