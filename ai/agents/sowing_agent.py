import datetime as dt
from typing import Optional, List, Dict, Any

import numpy as np
import pandas as pd
import requests
from db import get_user_and_shc
from config import OPENAI_API_KEY, OPENWEATHER_API_KEY, FORECAST_HOURS, TOP_K
from .model import crops_df

# ---- LangChain
from langchain_openai import ChatOpenAI
from langchain.agents import initialize_agent, AgentType, Tool
from rapidfuzz import process, fuzz
from langchain.memory import ConversationBufferMemory

refiner_llm = ChatOpenAI(model="gpt-4o-mini", temperature=0.4, openai_api_key=OPENAI_API_KEY)

def refine_response(raw_msg: str) -> str:
    prompt = f"""
    You are an agricultural advisor. Refine the following technical/raw sowing recommendation
    into a clear, friendly, farmer-understandable message without losing details:

    RAW RESPONSE:
    {raw_msg}

    Refined Farmer-Friendly Response:
    """
    try:
        refined = refiner_llm.predict(prompt)
        return refined.strip()
    except Exception as e:
        return raw_msg + f"\n\n(Note: Refinement failed: {e})"

# ==============================
# Core Helpers
# ==============================
def detect_season(date: Optional[dt.date] = None) -> str:
    m = (date or dt.datetime.now().date()).month
    if m in [6,7,8,9,10]: return "kharif"
    if m in [11,12,1,2,3]: return "rabi"
    if m in [4,5]: return "zaid"
    return "kharif"

def get_weather(lat: float, lon: float, api_key: str = OPENWEATHER_API_KEY) -> Dict[str, Any]:
    try:
        cur = requests.get(
            "https://api.openweathermap.org/data/2.5/weather",
            params={"lat": lat, "lon": lon, "appid": api_key,"units":"metric"}, timeout=10
        ).json()
        f = requests.get(
            "https://api.openweathermap.org/data/2.5/forecast",
            params={"lat": lat,"lon": lon,"appid": api_key,"units":"metric"}, timeout=10
        ).json()
        out = {"current": cur,"forecast": f}
        if "list" in f:
            steps = f["list"][: max(1, FORECAST_HOURS//3)]
            out["avg_temp"] = float(np.mean([s["main"]["temp"] for s in steps])) if steps else None
            out["avg_rh"]   = float(np.mean([s["main"]["humidity"] for s in steps])) if steps else None
        return out
    except: return {"error": "Weather fetch failed"}

def check_soil_deficiency(shc: Dict[str, Any], weather: Optional[Dict[str, Any]] = None) -> List[str]:
    recommendations = []
    try:
        n_val  = float(shc.get("N", np.nan))
        p_val  = float(shc.get("P", np.nan))
        k_val  = float(shc.get("K", np.nan))
        ph_val = float(shc.get("PH", np.nan))

        if not np.isnan(n_val):
            if n_val < 280:
                msg = f"✅ Nitrogen low ({n_val} kg/ha). Apply Urea or Compost."
                if weather and weather.get("forecast"):
                    if any("rain" in s["weather"][0]["main"].lower() for s in weather["forecast"].get("list", [])[:5]):
                        msg += " 🌧️ Delay urea application if rain is expected soon."
                recommendations.append(msg)
            else:
                recommendations.append(f"👌 Nitrogen sufficient ({n_val} kg/ha).")

        if not np.isnan(p_val):
            if p_val < 10: recommendations.append(f"✅ Phosphorus low ({p_val} kg/ha). Apply DAP/SSP.")
            else: recommendations.append(f"👌 Phosphorus sufficient ({p_val} kg/ha).")

        if not np.isnan(k_val):
            if k_val < 110: recommendations.append(f"✅ Potassium low ({k_val} kg/ha). Apply MOP or crop residues.")
            else: recommendations.append(f"👌 Potassium sufficient ({k_val} kg/ha).")

        if not np.isnan(ph_val):
            if ph_val < 6: recommendations.append(f"⚠️ Acidic soil (pH {ph_val}). Apply lime.")
            elif ph_val > 8: recommendations.append(f"⚠️ Alkaline soil (pH {ph_val}). Apply gypsum or manure.")
            else: recommendations.append(f"👌 Soil pH balanced ({ph_val}).")
    except Exception as e:
        recommendations.append(f"❌ Error checking deficiencies: {e}")

    if not recommendations:
        recommendations.append("✅ Soil nutrients appear balanced.")
    return recommendations

# ==============================
# Retrieve sowing info from DB
# ==============================
def retrieve_sowing(aadhaar_no: str, crop_name: Optional[str] = None, chosen_shc_id: Optional[str] = None) -> Dict[str, Any]:
    if not crop_name: return {"ask_crop": "Please specify crop name."}

    data = get_user_and_shc(aadhaar_no, chosen_shc_id)
    if "error" in data: return {"error": data["error"]}

    farmer = data["user"]
    shcs = data.get("shc_details", [])
    if not shcs: return {"error": "No SHC found"}

    if chosen_shc_id is None and len(shcs) > 1:
        return {"ask_shc": f"Multiple SHC records found. Please choose one: {[s['SURVEY_NO'] for s in shcs]}"}

    selected_shc = shcs[0] if chosen_shc_id is None else next((s for s in shcs if s["SURVEY_NO"] == chosen_shc_id), None)
    if not selected_shc: return {"error": f"No SHC found with ID {chosen_shc_id}"}

    coords = get_weather(float(farmer.get("LAT", 0)), float(farmer.get("LON", 0))) if farmer.get("LAT") and farmer.get("LON") else None
    season = detect_season()

    matches = process.extract(crop_name, crops_df["CROPS"].tolist(), limit=1, scorer=fuzz.WRatio)
    if not matches: return {"error": f"No crop found matching '{crop_name}'."}
    best_crop = matches[0][0]

    crop_row = crops_df[crops_df["CROPS"] == best_crop]
    if not crop_row.empty:
        season_match = crop_row[crop_row["SEASON"].str.lower() == season.lower()]
        crop_row = season_match.iloc[0].to_dict() if not season_match.empty else crop_row.iloc[0].to_dict()

    deficiencies = check_soil_deficiency(selected_shc, coords)

    return {
        "farmer": farmer,
        "shc_used": selected_shc,
        "season": season,
        "weather": coords,
        "crop": crop_row,
        "deficiencies": deficiencies
    }

# ==============================
# Tool wrapper
# ==============================
def sowing_tool_single_input(query: str) -> str:
    """
    Process a single text input containing Aadhaar number, crop name, and optional SHC ID,
    fetch sowing recommendations, refine them, and return a farmer-friendly message.

    Input format (string):
        "Aadhaar:<aadhaar_no> | Crop:<crop_name> | SHC:<shc_id>"

    Args:
        query (str): Query string containing Aadhaar number, crop name, and optional SHC ID.

    Returns:
        str: Refined sowing advice for the farmer, including season, soil/fertilizer guidance,
             and weather forecast if available. Returns error messages if input is invalid
             or processing fails.
    """
    try:
        parts = {k.strip(): v.strip() for k,v in (p.split(":",1) for p in query.split("|") if ":" in p)}
        aadhaar_no = parts.get("Aadhaar")
        crop_name = parts.get("Crop")
        shc_id = parts.get("SHC")
        shc_id = None if not shc_id or shc_id.lower() == "none" else shc_id

        if not aadhaar_no: return "❌ Please provide Aadhaar number."
        if not crop_name: return "❌ Please specify crop name."

        out = retrieve_sowing(aadhaar_no, crop_name, shc_id)

        if out.get("ask_crop"): return f"🌱 {out['ask_crop']}"
        if out.get("ask_shc"): return f"⚠️ {out['ask_shc']}"
        if out.get("error"): return f"❌ {out['error']}"

        farmer, crop, shc, weather, deficiencies = out["farmer"], out["crop"], out["shc_used"], out["weather"], out["deficiencies"]
        msg = f"👋 Hi {farmer.get('NAME','Farmer')}!\nSowing advice for {crop['CROPS']}:\n- Season: {crop.get('SEASON','N/A')}\n- Type: {crop.get('TYPE_OF_CROP','N/A')}\n\nSoil & Fertilizer Guidance:\n" + "\n".join([f"- {d}" for d in deficiencies])
        if weather and weather.get("avg_temp"): msg += f"\n\nWeather Forecast: Temp ~{weather['avg_temp']:.1f}°C, RH ~{weather['avg_rh']:.1f}%"

        return refine_response(msg)
    except Exception as e:
        return f"❌ Error parsing input: {e}"

# ==============================
# Initialize LangChain agent
# ==============================
memory = ConversationBufferMemory(memory_key="chat_history", return_messages=True)

sowing_tool_structured = Tool(
    name="Sowing_Advisory",
    func=sowing_tool_single_input,
    description="Provide sowing advice. Input: 'Aadhaar:<aadhaar_no> | Crop:<crop_name> | SHC:<shc_id>'."
)

llm = ChatOpenAI(model="gpt-4o-mini", temperature=0.3, openai_api_key=OPENAI_API_KEY)

agent = initialize_agent(
    tools=[sowing_tool_structured],
    llm=llm,
    agent=AgentType.OPENAI_FUNCTIONS,
    memory=memory,
    verbose=True,
    return_direct=True
)

def run_sowing_agent(query: str, aadhaar_no: str, crop: Optional[str] = None, chosen_shc_id: Optional[str] = None) -> str:
    crop_val = crop if crop else "None"
    shc_val = chosen_shc_id if chosen_shc_id else "None"
    input_str = f"{query} | Aadhaar:{aadhaar_no} | Crop:{crop_val} | SHC:{shc_val}"
    return agent.run(input_str)