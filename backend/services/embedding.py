import os
from dotenv import load_dotenv
from langchain_ollama import OllamaEmbeddings

load_dotenv()

class EmbeddingModel:

    def __init__(self):
        gemini_key = os.getenv("GEMINI_API_KEY")
        if gemini_key:
            from langchain_google_genai import GoogleGenerativeAIEmbeddings
            self.embeddings = GoogleGenerativeAIEmbeddings(
                model="models/text-embedding-004",
                google_api_key=gemini_key
            )
        else:
            self.embeddings = OllamaEmbeddings(
                model="nomic-embed-text"
            )

    def get_embedding_model(self):
        return self.embeddings