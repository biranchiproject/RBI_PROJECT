import os
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get credentials
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

# Validation
if not SUPABASE_URL:
    raise ValueError("Missing SUPABASE_URL in environment variables.")

if not SUPABASE_SERVICE_ROLE_KEY:
    raise ValueError("Missing SUPABASE_SERVICE_ROLE_KEY in environment variables. Please add it to your .env file.")

# Initialize Client with Service Role Key (Bypasses RLS)
# Initialize Client with Service Role Key (Bypasses RLS)
try:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    print("✅ Supabase Client initialized successfully with Service Role Key.")
except Exception as e:
    print(f"❌ Failed to initialize Supabase Client: {e}")
    raise e

def get_supabase() -> Client:
    return supabase
