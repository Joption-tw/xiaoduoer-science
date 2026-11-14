"""產生分享縮圖（FB / LINE 預覽卡片，1200×630）。
用法（Windows，要有 Edge 或 Chrome）：python og/render.py
會把首頁 index.html 裡的大鳳蝶 SVG 放進 og/*.html，用無頭瀏覽器截成 og/*.png。
改了縮圖之後，網頁 <meta property="og:image"> 網址後面的 ?v= 要加 1，FB 才會換新圖。"""
import pathlib, re, subprocess, sys, tempfile

ROOT = pathlib.Path(__file__).resolve().parent.parent
OG = ROOT / "og"
BROWSERS = [   # 這台的 Edge 無頭模式不會截圖，所以 Chrome 優先
    r"C:\Program Files\Google\Chrome\Application\chrome.exe",
    r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
]

index = (ROOT / "index.html").read_text(encoding="utf-8")
m = re.search(r'<svg width="0" height="0".*?</svg>', index, re.S)
if not m:
    sys.exit("index.html 裡找不到大鳳蝶 SVG")
defs = m.group(0)
browser = next((b for b in BROWSERS if pathlib.Path(b).exists()), None)
if not browser:
    sys.exit("找不到 Edge 或 Chrome")

with tempfile.TemporaryDirectory() as tmp:
    for name in ("home", "optics"):
        src = (OG / f"{name}.html").read_text(encoding="utf-8").replace("<!--BF_DEFS-->", defs)
        page = pathlib.Path(tmp) / f"{name}.html"
        page.write_text(src, encoding="utf-8")
        out = OG / f"{name}.png"
        shot = pathlib.Path(tmp) / f"{name}.png"   # 無頭瀏覽器寫中文路徑會失敗，先寫到暫存再搬
        r = subprocess.run([
            browser, "--headless=new", "--disable-gpu", "--hide-scrollbars",
            "--force-device-scale-factor=1", "--window-size=1200,630",
            "--virtual-time-budget=8000", f"--user-data-dir={tmp}\\profile",
            f"--screenshot={shot}", page.as_uri(),
        ], capture_output=True, timeout=120)
        if not shot.exists():
            sys.exit(f"{name} 截圖失敗：{r.stderr.decode(errors='ignore')[-800:]}")
        out.write_bytes(shot.read_bytes())
        print(out.name, out.stat().st_size, "bytes")
