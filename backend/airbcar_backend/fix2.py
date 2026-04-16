
import pathlib, re
for p in pathlib.Path("tests/integration").rglob("test_*.py"):
    txt = p.read_text("utf8")
    txt = re.sub(r"data\.get\(\"(.*?)\"\) or data\.get\(\".*?\", \{\}\)\.get\(\".*?\"\)", r"data.get(\"\1\") or data.get(\"data\", {}).get(\"\1\") or data.get(\"user\", {}).get(\"\1\")", txt)
    txt = re.sub(r"response\.data\.get\(\"(.*?)\"\) or response\.data\.get\(\".*?\", \{\}\)\.get\(\".*?\"\)", r"response.data.get(\"\1\") or response.data.get(\"data\", {}).get(\"\1\")", txt)
    txt = re.sub(r"response\.data\.get\(\x27(.*?)\x27\) or response\.data\.get\(\x27.*?\x27, \{\}\)\.get\(\x27.*?\x27\)", r"response.data.get(\"\1\") or response.data.get(\"data\", {}).get(\"\1\")", txt)
    p.write_text(txt, "utf8")

