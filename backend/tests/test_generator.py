import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.vector_store import VectorStore
from services.retriever import Retriever
from services.generator import Generator

vector_store = VectorStore()
db = vector_store.load_vector_store()

retriever = Retriever(db)

question = "What are the ingredients of machine learning?"

docs = retriever.retrieve(question)

print("\n========== RETRIEVED CHUNKS ==========\n")

for i, doc in enumerate(docs, 1):
    print(f"Chunk {i}")
    print(doc.page_content)
    print("-" * 50)

generator = Generator()

answer = generator.generate_answer(question, docs)

print("\n========== ANSWER ==========\n")
print(answer)