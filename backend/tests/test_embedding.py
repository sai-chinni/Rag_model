import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.embedding import EmbeddingModel

embedding_model = EmbeddingModel().get_embedding_model()

vector = embedding_model.embed_query(
    "Python is a programming language"
)

print(type(vector))
print(len(vector))
print(vector[:10])