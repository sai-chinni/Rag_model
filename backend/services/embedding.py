from langchain_huggingface import HuggingFaceEmbeddings
class EmbeddingModel:

    def __init__(self):
        self.embeddings = HuggingFaceEmbeddings(
            model_name="sentence-transformers/all-MiniLM-L6-v2"
        )

    def get_embedding_model(self):
        return self.embeddings