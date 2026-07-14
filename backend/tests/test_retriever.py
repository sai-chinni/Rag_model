import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.vector_store import VectorStore
from services.retriever import Retriever

# Load the saved FAISS database
vector_store = VectorStore()
db = vector_store.load_vector_store()

# Create retriever
retriever = Retriever(db)

# Ask a question
docs = retriever.retrieve("What is Python?")

print("Retrieved Chunks:\n")

for i, doc in enumerate(docs, start=1):
    print(f"Chunk {i}")
    print(doc.page_content)
    print("-" * 50)