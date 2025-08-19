from flask import Blueprint, request, jsonify
from typing import Optional
from agents.intent_model import classify_intent
from agents.presowing_agent import run_crop_agent
from agents.sowing_agent import run_sowing_agent
from agents.scheme_model import rag_agent

query_bp = Blueprint("query_bp", __name__)

@query_bp.route("/query", methods=["POST"])
def handle_query():
    """
    Handle incoming farmer queries via POST request.
    Routes query to the correct agent based on detected intent.
    
    Expected JSON input:
        {
            "aadhaar_no": "<AADHAAR_NUMBER>",
            "query": "<USER_QUERY>",
            "chosen_shc_id": "<OPTIONAL_SHC_ID>"
        }
    
    Returns:
        JSON response with intent, agent output, and metadata.
    """
    data = request.json
    aadhaar_no = data.get("aadhaar_no")
    query = data.get("query")
    chosen_shc_id = data.get("chosen_shc_id")  # Optional SHC selection

    if not aadhaar_no or not query:
        return jsonify({"error": "aadhaar_no and query required"}), 400

    # Step 1: Classify intent
    intent_result = classify_intent(query)
    intent = intent_result.intent
    crop_name = intent_result.crop_name  # Optional crop extracted by intent model

    # Step 2: Route to correct agent
    if intent == "pre-sowing":
        response = run_crop_agent(user_query=query, aadhaar_no=aadhaar_no, chosen_shc_id=chosen_shc_id)
    elif intent == "sowing":
        response = run_sowing_agent(query=query, aadhaar_no=aadhaar_no, crop=crop_name, chosen_shc_id=chosen_shc_id)
    elif intent == "scheme":
        response = rag_agent.run(query=query)
    else:
        response = {"status": "error", "message": f"Intent '{intent}' not handled yet."}

    return jsonify({
        "aadhaar_no": aadhaar_no,
        "query": query,
        "intent": intent,
        "chosen_shc_id": chosen_shc_id,
        "response": response
    })