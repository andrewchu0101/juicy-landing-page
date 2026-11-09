"""Cross-check diagram sources against docs/03-srs.md and docs/02-prd.md.

Ad-hoc script (not a project command). Run from the repository root:
    python -I diagrams/evidence/check-diagram-ids.py
"""
import glob
import json
import re
import sys

srs = open("docs/03-srs.md", encoding="utf-8").read()
prd = open("docs/02-prd.md", encoding="utf-8").read()

srs_fr = set(re.findall(r"^\| (FR-\d\d) \|", srs, re.M))
srs_or = set(re.findall(r"^\| (OR-\d\d) \|", srs, re.M))
prd_ac = set(re.findall(r"^- \*\*(AC-\d\d\.\d)（", prd, re.M))

fails = []


def check(name, ok, detail=""):
    print(("PASS " if ok else "FAIL ") + name + (f" -- {detail}" if detail else ""))
    if not ok:
        fails.append(name)


files = sorted(glob.glob("diagrams/src/*.workflow.json"))
check("found 8 diagram sources", len(files) == 8, str(len(files)))

covered_fr = set()
for path in files:
    doc = json.load(open(path, encoding="utf-8"))
    texts = [doc["meta"]["title"]]
    for n in doc["nodes"]:
        texts += [n.get("label", ""), n.get("sublabel", ""), n.get("tag", "")]
    for c in doc.get("cards", []):
        texts += c["items"]
    blob = " ".join(texts)
    frs = set(re.findall(r"FR-\d\d", blob))
    ors = set(re.findall(r"OR-\d\d", blob))
    acs = set(re.findall(r"AC-\d\d\.\d", blob))
    name = path.split("/")[-1].split("\\")[-1]
    check(f"{name}: every FR id exists in SRS", frs <= srs_fr, str(sorted(frs - srs_fr)))
    check(f"{name}: every OR id exists in SRS", ors <= srs_or, str(sorted(ors - srs_or)))
    check(f"{name}: every AC id exists in PRD", acs <= prd_ac, str(sorted(acs - prd_ac)))
    covered_fr |= frs
    # pending (cloud) nodes must carry an OR id; decided nodes must not claim pending
    for n in doc["nodes"]:
        if n["type"] == "cloud":
            check(f"{name}: pending node {n['id']} cites an OR id", bool(re.search(r"OR-\d\d", n["label"])))
    # output path matches the source name
    stem = name.replace(".workflow.json", "")
    check(f"{name}: meta.output matches file name", doc["meta"]["output"] == f"diagrams/{stem}.html", doc["meta"]["output"])

check("all 10 FRs appear in at least one diagram", covered_fr == srs_fr, f"missing: {sorted(srs_fr - covered_fr)}")

print("\nRESULT:", "ALL PASS" if not fails else f"{len(fails)} FAILED: {fails}")
sys.exit(1 if fails else 0)
