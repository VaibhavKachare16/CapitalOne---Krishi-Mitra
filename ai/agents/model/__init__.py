import joblib
import faiss
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

FAISS_PATH = os.path.join(BASE_DIR, "crop_index.faiss")
CROPS_PATH = os.path.join(BASE_DIR, "crops_df.pkl")
PREPROC_PATH = os.path.join(BASE_DIR, "preprocessor.pkl")

index = faiss.read_index(FAISS_PATH)
crops_df = joblib.load(CROPS_PATH)
pre = joblib.load(PREPROC_PATH)