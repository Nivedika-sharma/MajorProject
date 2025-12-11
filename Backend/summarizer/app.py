# app.py

import io
from fastapi import FastAPI, UploadFile
from summarizer.summarizer import extract_text_from_file, generate_summary

app = FastAPI()

@app.get("/")
def home():
    return {"status": "running", "message": "Document summarizer active"}

@app.post("/summarize")
async def summarize(file: UploadFile):
    try:
        raw = await file.read()
        # Wrap raw bytes in BytesIO so extract_text_from_file can read it
        text = extract_text_from_file(raw, file.filename) 

        if text.startswith("Error") or text == "Unsupported file type.":
            return {"error": text}

        summary = generate_summary(text)
        return {"file_name": file.filename, "summary": summary}

    except Exception as e:
        return {"error": f"Error reading file: {e}"}