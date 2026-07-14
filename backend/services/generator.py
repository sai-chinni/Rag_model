import os
from dotenv import load_dotenv
from langchain_ollama import ChatOllama

load_dotenv()

class Generator:

    def __init__(self):
        gemini_key = os.getenv("GEMINI_API_KEY")
        if gemini_key:
            from langchain_google_genai import ChatGoogleGenerativeAI
            self.llm = ChatGoogleGenerativeAI(
                model="gemini-1.5-flash",
                temperature=0,
                google_api_key=gemini_key
            )
        else:
            self.llm = ChatOllama(
                model="llama3.2",
                temperature=0
            )

    def generate_answer(self, question, docs):

        context = "\n\n".join(
            [doc.page_content for doc in docs]
        )

        prompt = f"""You are a helpful AI assistant.

        Answer the user's question ONLY using the context below.
        If the answer is not present in the context, reply:
        "I couldn't find the answer in the uploaded document."

        Context:{context}

        Question:{question}

        Answer:
        """
        response = self.llm.invoke(prompt)
        return response.content