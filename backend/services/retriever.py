class Retriever:

    def __init__(self, vector_store):
        self.vector_store = vector_store

    def retrieve(self, query: str, k: int = 3):
        docs = self.vector_store.similarity_search(query, k=k)
        return docs