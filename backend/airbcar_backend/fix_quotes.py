
import pathlib
for p in pathlib.Path("tests/integration").rglob("test_*.py"):
    txt = p.read_text("utf8")
    txt = txt.replace("\\\"", "\"")
    p.write_text(txt, "utf8")

