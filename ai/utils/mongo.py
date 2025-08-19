from pymongo import MongoClient
from config import MONGO_URI, DB_NAME

client = MongoClient(MONGO_URI)
db = client[DB_NAME]

def get_user_and_shc(aadhaar_no: str, shc_chosen: str = None):
    user = db["aadhar"].find_one({"AADHAAR_NO": aadhaar_no}, {"_id": 0})
    if not user:
        return {"error": f"No user found with Aadhaar: {aadhaar_no}"}

    shc_query = {"AADHAAR_NO": int(aadhaar_no)}
    if shc_chosen:
        shc_query["SURVEY_NO"] = shc_chosen
    shcs = list(db["shc_norm"].find(shc_query, {"_id": 0}))

    return {"user": user, "shc_details": shcs if shcs else []}