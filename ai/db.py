# utils/mongo_utils.py

from pymongo import MongoClient
from typing import Optional, Dict, Any
from config import MONGO_URI, DB_NAME

# MongoDB connection setup
client = MongoClient(MONGO_URI)
db = client[DB_NAME]

def get_user_and_shc(aadhaar_no: str, shc_chosen: Optional[str] = None) -> Dict[str, Any]:
    """
    Fetch user details and SHC details for a given Aadhaar number.
    
    :param aadhaar_no: Aadhaar number of the farmer (string).
    :param shc_chosen: Optional. Specific SURVEY_NO of SHC to fetch. If None, fetch all SHCs.
    :return: Dictionary with user details and SHC details.
    """

    # Fetch user details
    user = db["aadhar"].find_one({"AADHAAR_NO": aadhaar_no}, {"_id": 0})
    if not user:
        return {"error": f"No user found with Aadhaar: {aadhaar_no}"}

    # Fetch SHC details
    shc_query = {"AADHAAR_NO": int(aadhaar_no)}
    if shc_chosen:
        shc_query["SURVEY_NO"] = shc_chosen

    shcs = list(db["shc_norm"].find(shc_query, {"_id": 0}))

    return {
        "user": user,
        "shc_details": shcs if shcs else "No SHC records found"
    }
