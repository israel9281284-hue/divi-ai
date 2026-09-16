import os
from openai import OpenAI

client = OpenAI(
    api_key=os.environ.get("NEBIUS_API_KEY"),
    base_url="https://api.studio.nebius.ai/v1"
)

def query_nebius(command):
    response = client.chat.completions.create(
        model="nvidia/Meta-Llama-3.1-8B-Instruct",
        messages=[
            {
                "role": "user",
                "content": command
            }
        ]
    )

    return response.choices[0].message.content
