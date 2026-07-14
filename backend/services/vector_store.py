from langchain_community.vectorstores import FAISS
from services.embedding import EmbeddingModel


class VectorStore:

    def __init__(self):
        self.embedding = EmbeddingModel().get_embedding_model()

    def create_vector_store(self, chunks):
        vector_db = FAISS.from_documents(
            documents=chunks,
            embedding=self.embedding
        )
        return vector_db

    def save_vector_store(self, vector_db, path="vector_db"):
        vector_db.save_local(path)

    def load_vector_store(self, path="vector_db"):
        return FAISS.load_local(
            path,
            self.embedding,
            allow_dangerous_deserialization=True
        )