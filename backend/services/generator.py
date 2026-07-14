from langchain_ollama import ChatOllama


class Generator:

    def __init__(self):
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