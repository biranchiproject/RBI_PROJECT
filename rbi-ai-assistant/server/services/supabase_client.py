import os
from pathlib import Path
from supabase import create_client, Client, ClientOptions
from dotenv import load_dotenv

# Load environment variables
# Load environment variables
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "../../.env"))
if not os.getenv("SUPABASE_URL"):
    load_dotenv()

# Get credentials
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

# Validation
if not SUPABASE_URL:
    raise ValueError("Missing SUPABASE_URL in environment variables.")

if not SUPABASE_SERVICE_ROLE_KEY:
    raise ValueError("Missing SUPABASE_SERVICE_ROLE_KEY in environment variables.")

# Initialize Client with Service Role Key and increased timeout (60s)
try:
    options = ClientOptions(postgrest_client_timeout=60, storage_client_timeout=60)
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, options=options)
    print("SUCCESS: Supabase Client initialized with extended timeout (60s).")
except Exception as e:
    print(f"ERROR: Failed to initialize Supabase Client: {e}")
    raise e

def get_supabase() -> Client:
    return supabase
