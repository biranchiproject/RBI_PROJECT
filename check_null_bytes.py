import os

def check_for_null_bytes(directory):
    print(f"Scanning {directory} for null bytes...")
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith(".py"):
                path = os.path.join(root, file)
                try:
                    with open(path, 'rb') as f:
                        content = f.read()
                        if b'\x00' in content:
                            print(f"❌ FOUND NULL BYTES IN: {path}")
                except Exception as e:
                    print(f"⚠️ Error reading {path}: {e}")

if __name__ == "__main__":
    check_for_null_bytes("rbi-ai-assistant/server")
