import os
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

_supabase_url = os.getenv("SUPABASE_URL")
_supabase_key = os.getenv("SUPABASE_ANON_KEY")

if not _supabase_url or not _supabase_key:
    raise ValueError("SUPABASE_URL or SUPABASE_ANON_KEY is missing in .env")

_supabase: Client = create_client(_supabase_url, _supabase_key)

def get_client() -> Client:
    return _supabase
