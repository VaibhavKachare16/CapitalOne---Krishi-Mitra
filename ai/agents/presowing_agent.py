# pip install langchain langchain-openai rapidfuzz faiss-cpu joblib pandas numpy requests pymongo
import os, json, math, datetime as dt
from typing import Optional, List, Dict, Any

import numpy as np
import pandas as pd
import requests
from db import get_user_and_shc
from config import OPENAI_API_KEY, OPENWEATHER_API_KEY, FORECAST_HOURS, TOP_K
from .model import index, pre, crops_df

# ---- LangChain
from langchain_openai import ChatOpenAI
from langchain.prompts import ChatPromptTemplate
from langchain.schema import StrOutputParser
from langchain.agents import initialize_agent, AgentType, tool


def detect_season(date: Optional[dt.date] = None) -> str:
    m = (date or dt.datetime.now().date()).month
    if m in [6,7,8,9,10]:
        return "kharif"
    if m in [11,12,1,2,3]:
        return "rabi"
    if m in [4,5]:
        return "zaid"
    return "kharif"

def geocode_location(district: str, state: str) -> Optional[Dict[str,float]]:
    if not district and not state:
        return None
    try:
        from urllib.parse import urlencode
        query = ", ".join([x for x in [district, state, "India"] if x])
        url = "https://nominatim.openstreetmap.org/search?" + urlencode({"q": query, "format": "json", "limit": 1})
        resp = requests.get(url, headers={"User-Agent":"crop-agent/1.0"}, timeout=10)
        data = resp.json()
        if data:
            return {"lat": float(data[0]["lat"]), "lon": float(data[0]["lon"])}
    except Exception as e:
        print("Geocoding failed:", e)
    return None

def get_farmer_profile(aadhaar_no: str) -> Dict[str, Any]:
    res = get_user_and_shc(aadhaar_no)
    if "error" in res:
        return {"error": res["error"]}
    user = res["user"]
    lat_val, lon_val = None, None
    if user.get("LAT") and user.get("LON"):
        lat_val, lon_val = float(user["LAT"]), float(user["LON"])
    elif user.get("DISTRICT") or user.get("STATE"):
        coords = geocode_location(user.get("DISTRICT"), user.get("STATE"))
        if coords:
            lat_val, lon_val = coords["lat"], coords["lon"]
    return {
        "aadhaar_no": user["AADHAAR_NO"],
        "name": user.get("NAME"),
        "district": user.get("DISTRICT"),
        "state": user.get("STATE"),
        "lat": lat_val,
        "lon": lon_val,
        "raw": user
    }

def get_shc_records(aadhaar_no: str) -> Dict[str, Any]:
    res = get_user_and_shc(aadhaar_no)
    if "error" in res:
        return {"records": []}
    shcs = res["shc_details"]
    if not shcs or shcs == "No SHC records found":
        return {"records": []}
    return {"records": shcs}

def get_weather(lat: float, lon: float, api_key: str = OPENWEATHER_API_KEY) -> Dict[str, Any]:
    if not api_key:
        return {"error": "No API key"}
    try:
        cur = requests.get("https://api.openweathermap.org/data/2.5/weather",
            params={"lat": lat, "lon": lon, "appid": api_key, "units": "metric"}, timeout=10).json()
        f = requests.get("https://api.openweathermap.org/data/2.5/forecast",
            params={"lat": lat, "lon": lon, "appid": api_key, "units": "metric"}, timeout=10).json()
        out = {"current": cur, "forecast": f}
        if "list" in f:
            steps = f["list"][: max(1, FORECAST_HOURS//3)]
            temps = [s["main"]["temp"] for s in steps if "main" in s]
            rhs = [s["main"]["humidity"] for s in steps if "main" in s]
            out["avg_temp"] = float(np.mean(temps)) if temps else None
            out["avg_rh"] = float(np.mean(rhs)) if rhs else None
        return out
    except Exception as e:
        return {"error": str(e)}

# ==============================
# Recommendations
# ==============================
def retrieve_recommendations(aadhaar_no: str, chosen_shc_id: Optional[str] = None,
                             irrigation_hint: Optional[str] = None, topk: int = TOP_K):
    farmer = get_farmer_profile(aadhaar_no)
    if "error" in farmer:
        return farmer
    shcs = get_shc_records(aadhaar_no)
    if not shcs["records"]:
        return {"error": "No SHC found"}
    selected_shc = shcs["records"][0] if chosen_shc_id is None else \
        [r for r in shcs["records"] if r.get("SURVEY_NO") == chosen_shc_id][0]
    weather_info = None
    if farmer["lat"] and farmer["lon"]:
        weather_info = get_weather(farmer["lat"], farmer["lon"])
    season = detect_season()

    row = {
        "SOIL_PH": float(selected_shc.get("PH", np.nan)),
        "N": float(selected_shc.get("N_(KG/HA)", np.nan)),
        "P": float(selected_shc.get("P_(KG/HA)", np.nan)),
        "K": float(selected_shc.get("K_(KG/HA)", np.nan)),
        "SOIL": selected_shc.get("SOIL_TYPE"),
        "SEASON": season,
        "TYPE_OF_CROP": None,
        "WATER_SOURCE": irrigation_hint
    }
    df_row = pd.DataFrame([row])
    Xq = pre.transform(df_row)
    if hasattr(Xq, "toarray"):
        Xq = Xq.toarray().astype(np.float32)

    D, I = index.search(Xq, topk)
    results = []
    for d, i in zip(D[0], I[0]):
        rec = crops_df.iloc[i].to_dict()
        rec["_score"] = float(d)
        results.append(rec)

    return {
        "farmer": farmer,
        "shc_used": selected_shc,
        "season": season,
        "weather": weather_info,
        "recommendations": results
    }

# ==============================
# LLM Setup
# ==============================
llm = ChatOpenAI(model="gpt-4o-mini", temperature=0.3, openai_api_key=OPENAI_API_KEY)

response_prompt = ChatPromptTemplate.from_messages([
    ("system", "You are a friendly agricultural advisor. Write concise, farmer-friendly advice based on JSON."),
    ("human", "Here is the JSON: {json_str}")
])
response_chain = response_prompt | llm | StrOutputParser()

def format_recommendation_text(structured: Dict[str, Any]) -> str:
    json_str = json.dumps(structured, ensure_ascii=False)
    return response_chain.invoke({"json_str": json_str})

# ==============================
# Refiner
# ==============================
refiner = ChatOpenAI(model="gpt-4o-mini", temperature=0.5, openai_api_key=OPENAI_API_KEY)
refine_prompt = ChatPromptTemplate.from_messages([
    ("system", """You are KrishiMitra, a farmer-friendly assistant.
Keep language simple, use short sentences or bullets."""),
    ("user", "User Query: {query}\n\nDraft Message: {draft}\n\nRefined Farmer Response:")
])
refine_chain = refine_prompt | refiner | StrOutputParser()

def refine_farmer_text(query: str, draft: str) -> str:
    return refine_chain.invoke({"query": query, "draft": draft})

# ==============================
# Tools
# ==============================
@tool("recommend_crops")
def tool_recommend_crops(inp: str) -> str:
    """
    Recommend crops based on Aadhaar number and SHC (Soil Health Card) ID.

    Args:
        inp (str): JSON string containing:
            - "aadhaar" (str): Aadhaar number of the farmer.
            - "shc_id" (str, optional): SHC ID to select a specific soil record.

    Returns:
        str: JSON string with either:
            - "text": Short summary message.
            - "recommendations": List of recommended crops with scores.
            - "error": Error message if something goes wrong.
    """
    try:
        data = json.loads(inp)
        aadhaar = data.get("aadhaar")
        shc_id = data.get("shc_id")
        recs = retrieve_recommendations(aadhaar, shc_id)
        if "error" in recs:
            return json.dumps({"error": recs["error"]})
        return json.dumps({
            "text": f"✅ Recommendations for SHC {recs['shc_used']['SURVEY_NO']}",
            "recommendations": recs["recommendations"]
        })
    except Exception as e:
        return json.dumps({"error": str(e)})

@tool("general_agronomy_tip", return_direct=True)
def tool_general_agronomy_tip(question: str) -> str:
    """
    Provide general agronomy tips or practical farming advice.

    Args:
        question (str): Farmer's question or query related to agronomy.

    Returns:
        str: Concise, practical advice in plain text.
    """
    tip_prompt = ChatPromptTemplate.from_messages([
        ("system", "You are an agronomy expert. Provide concise, practical advice."),
        ("human", "{q}")
    ])
    chain = tip_prompt | llm | StrOutputParser()
    return chain.invoke({"q": question})

# ==============================
# Agent Setup
# ==============================
TOOLS = [tool_recommend_crops, tool_general_agronomy_tip]
AGENT_SYSTEM_PROMPT = (
    "You are a crop advisory assistant for Indian farmers.\n"
    "- Never ask for Aadhaar, SHC IDs, or personal identifiers.\n"
    "- Backend provides context if needed.\n"
    "- For crop recommendations, CALL recommend_crops.\n"
    "- For general farming tips, CALL general_agronomy_tip.\n"
    "- Keep answers simple, friendly, and actionable."
)

def build_agent(verbose: bool = False):
    agent_llm = ChatOpenAI(model="gpt-4o-mini", temperature=0.2, openai_api_key=OPENAI_API_KEY)
    agent = initialize_agent(
        tools=TOOLS,
        llm=agent_llm,
        agent=AgentType.OPENAI_FUNCTIONS,
        verbose=verbose,
        agent_kwargs={"system_message": AGENT_SYSTEM_PROMPT}
    )
    return agent

# ==============================
# Run Agent
# ==============================
def run_crop_agent(user_query: str, aadhaar_no: str, chosen_shc_id: Optional[str] = None):
    recs_out = retrieve_recommendations(aadhaar_no, chosen_shc_id)
    if "error" in recs_out:
        return {"status": "error", "message": recs_out["error"]}
    draft_text = format_recommendation_text(recs_out)
    final_text = refine_farmer_text(user_query, draft_text)
    farmer = recs_out["farmer"]
    season = recs_out["season"]
    return {
        "status": "ok",
        "text": final_text,
        "draft": draft_text,
        "json": recs_out,
        "meta": {
            "farmer_name": farmer.get("name"),
            "district": farmer.get("district"),
            "state": farmer.get("state"),
            "season": season
        }
    }
