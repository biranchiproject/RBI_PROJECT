import os
from dotenv import load_dotenv

dotenv_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env")
print(f"Checking .env at: {os.path.abspath(dotenv_path)}")
if os.path.exists(dotenv_path):
    print("Found .env file!")
    load_dotenv(dotenv_path)
    print(f"GROQ_API_KEY loaded: {'Yes' if os.getenv('GROQ_API_KEY') else 'No'}")
else:
    print("Could not find .env file.")
