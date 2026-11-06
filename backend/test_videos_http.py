import urllib.request
import urllib.parse
import sys

sys.stdout.reconfigure(encoding="utf-8")

urls = [
    "http://localhost:5173/assets/take%201.mp4",
    "http://localhost:5173/assets/take%202.mp4",
    "http://localhost:5173/assets/take%203.mp4",
    "http://localhost:5173/assets/flow.mp4",
    "http://localhost:5173/assets/take1.mp4",
    "http://localhost:5173/assets/take2.mp4",
    "http://localhost:5173/assets/take3.mp4"
]

all_passed = True
print("=" * 70)
print("TESTING HTTP VIDEO SERVING & RANGE REQUESTS (BROWSER EMULATION)")
print("=" * 70)

for url in urls:
    try:
        # 1. Standard GET request
        req = urllib.request.Request(url, method="HEAD")
        with urllib.request.urlopen(req) as resp:
            status = resp.status
            content_type = resp.headers.get("Content-Type", "")
            content_length = resp.headers.get("Content-Length", "0")
            print(f"[PASS] HEAD {url}")
            print(f"       Status: {status} | Type: {content_type} | Size: {int(content_length):,} bytes")
            
        # 2. Browser Range request (bytes=0-1024)
        range_req = urllib.request.Request(url)
        range_req.add_header("Range", "bytes=0-1024")
        with urllib.request.urlopen(range_req) as rresp:
            rstatus = rresp.status
            rlength = rresp.headers.get("Content-Length", "")
            print(f"       Range 0-1024 -> Status: {rstatus} | Chunk Size: {rlength} bytes")
    except Exception as e:
        print(f"[FAIL] {url}")
        print(f"       ERROR: {e}")
        all_passed = False

print("=" * 70)
if all_passed:
    print("ALL 7 VIDEO ASSET URLS VERIFIED AND ACCESSIBLE (200 / 206 OK)")
else:
    print("SOME VIDEO REQUESTS FAILED")
    sys.exit(1)

