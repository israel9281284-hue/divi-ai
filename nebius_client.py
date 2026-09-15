import os
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

client = OpenAI(
    base_url=os.getenv("NEBIUS_BASE_URL", "https://openrouter.ai/api/v1"),
    api_key=os.getenv("NEBIUS_API_KEY")
)

def ask_divi_ai(user_command: str) -> str:
    system_prompt = (
        "You are DiviAI, an efficient, hands-free voice personal assistant. "
        "Keep your answers direct, concise, and helpful for voice output."
    )
    
    try:
        response = client.chat.completions.create(
            model=os.getenv("MODEL_NAME", "nvidia/nemotron-3.5-lightning:free"),
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_command}
            ],
            temperature=0.6,
            max_tokens=300
        )
        return response.choices[0].message.content
    except Exception as e:
        print(f"API Error: {e}")
        return "Sorry, I am having trouble connecting to AI services right now."

if __name__ == "__main__":
    res = ask_divi_ai("Divi, schedule a team sync for tomorrow at 3 PM.")
    print("\nDiviAI Response:\n", res)