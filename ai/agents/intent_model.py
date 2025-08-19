from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from pydantic import BaseModel, Field
from typing import Optional, Literal

# schema
class IntentClass(BaseModel):
    intent: Literal["pre-sowing", "sowing", "scheme", "general"] = Field(
        description="Return intent of the query which tells which chatbot is the query suitable for"
    )
    query: str = Field(description="The actual query asked")
    crop_name: Optional[str] = Field(default=None, description="Name of the crop if mentioned explicitly, else null")

from config import OPENAI_API_KEY

model = ChatOpenAI(model="gpt-4", api_key=OPENAI_API_KEY, temperature=0)

from langchain_core.prompts import ChatPromptTemplate

classification_prompt = ChatPromptTemplate.from_messages([
    ("system", """You are an intent classifier for a farmer assistance chatbot.
Classify the user query into one of these intents:

- "pre-sowing": Queries about activities BEFORE planting (soil testing, seed choice, fertilizer advice, land preparation).
- "sowing": Queries about the sowing phase (how/when to plant, irrigation at planting, spacing, germination issues).
- "scheme": Queries about GOVERNMENT schemes (insurance, subsidies, compensation, flood/drought relief, loan waivers).
- "general": If the query does not fit into any of the above categories.

Rules:
- ALWAYS use "general" as fallback when unsure.
- Extract crop_name ONLY if explicitly mentioned. Otherwise keep it null.
Return response in structured format.
"""),
    ("user", "{query}")
])

structured_model = model.with_structured_output(IntentClass)
chain = classification_prompt | structured_model

def classify_intent(query: str) -> IntentClass:
    result = chain.invoke({"query": query})
    if result.intent not in ["pre-sowing", "sowing", "scheme", "general"]:
        result.intent = "general"
    return result