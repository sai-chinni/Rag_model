from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import os
import shutil
from dotenv import load_dotenv

# Load local environment variables from .env
load_dotenv()

from services.loader import PDFLoader
from services.splitter import TextSplitter
from services.vector_store import VectorStore
from app.schema import QuestionRequest
from services.retriever import Retriever
from services.generator import Generator

generator = Generator()
app = FastAPI()

# Enable CORS for decoupled frontends
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://rag-model-bice.vercel.app",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

load = PDFLoader()
splitter = TextSplitter()
vector_store = VectorStore()

UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)


@app.get("/")
def home():
    return {"message": "RAG Chatbot Backend Running", "status": "online"}




@app.post("/upload")
async def upload_pdf(file: UploadFile = File(...)):

    file_path = os.path.join(UPLOAD_FOLDER, file.filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Read PDF
    text = load.load_pdf(file_path)

    # Split into chunks
    chunks = splitter.split_text(text)

    # Create FAISS vector database
    db = vector_store.create_vector_store(chunks)

    # Save FAISS locally
    vector_store.save_vector_store(db)

    return {
        "filename": file.filename,
        "total_chunks": len(chunks),
        "message": "Vector database created successfully!"
    }

@app.post("/ask")
async def ask_question(request: QuestionRequest):

    # Load the saved FAISS database
    db = vector_store.load_vector_store()

    # Retrieve relevant chunks
    retriever = Retriever(db)
    docs = retriever.retrieve(request.question)

    # Generate answer
    answer = generator.generate_answer(request.question, docs)

    return {
        "question": request.question,
        "answer": answer
    }