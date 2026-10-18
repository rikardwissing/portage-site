#!/usr/bin/env python3
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "src"
SITE = "https://portage.rikard.dev"
APP_ID = "6816252844"
PROVIDER_TOKEN = ""
REDIRECTS = {"/tesla/": "/cast-to-car/#tesla"}
JSONLD = re.compile(r'<script type="application/ld\+json">\n.*?\n</script>\n', re.S)

OG = """<meta name="apple-itunes-app" content="app-id={app_id}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Portage">
<meta property="og:title" content="{og_title}">
<meta property="og:description" content="{og_description}">
<meta property="og:image" content="{site}/img/og.png">
<meta property="og:url" content="{site}{path}">
<meta name="twitter:card" content="summary_large_image">
"""

REDIRECT = """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Portage</title>
<link rel="canonical" href="{site}{page}">
<meta http-equiv="refresh" content="0; url={target}">
</head>
<body>
<p><a href="{target}">This page has moved.</a></p>
</body>
</html>
"""


def fill(template, values):
    return re.sub(r"\{\{(\w+)\}\}", lambda m: values[m.group(1)], template)


def app_link(path):
    campaign = "site-" + (path.strip("/").replace("/", "-") or "home")
    token = f"pt={PROVIDER_TOKEN}&" if PROVIDER_TOKEN else ""
    return f"https://apps.apple.com/app/apple-store/id{APP_ID}?{token}ct={campaign}&mt=8"


def read_page(file):
    head, _, html = file.read_text().partition("\n\n")
    fields = dict(line.split(": ", 1) for line in head.splitlines())
    return fields, html


def out_file(path):
    return ROOT / path.strip("/") / "index.html"


def build():
    layout = (SRC / "layout.html").read_text()
    get_block = (SRC / "get.html").read_text().rstrip("\n")
    badge = (SRC / "badge.html").read_text().strip()
    sitemap = []
    pages = SRC / "pages"
    for file in sorted(pages.rglob("*.html"), key=lambda f: (f.stem != "index", str(f))):
        fields, html = read_page(file)
        name = file.relative_to(pages).with_suffix("").as_posix()
        path = "/" if name == "index" else f"/{name}/"
        head = "".join(JSONLD.findall(html))
        content = JSONLD.sub("", html).replace("{{get}}", get_block)
        og = ""
        if "og_title" in fields:
            og = OG.format(app_id=APP_ID, site=SITE, path=path, **fields)
        page = fill(layout.replace(f'<a href="{path}">', f'<a href="{path}" aria-current="page">'), {
            "title": fields["title"],
            "description": fields["description"],
            "canonical": SITE + path,
            "og": og,
            "head": head,
            "body": f' class="{fields["body"]}"' if "body" in fields else "",
            "get_href": "#get" if "{{get}}" in html else "/#get",
            "content": content.rstrip("\n"),
        })
        page = page.replace("{{badge}}", badge.replace("{{app_link}}", app_link(path)))
        out_file(path).parent.mkdir(parents=True, exist_ok=True)
        out_file(path).write_text(page)
        sitemap.append(f"  <url><loc>{SITE}{path}</loc><lastmod>{fields['lastmod']}</lastmod></url>\n")
    for page, target in REDIRECTS.items():
        out_file(page).parent.mkdir(exist_ok=True)
        out_file(page).write_text(REDIRECT.format(site=SITE, page=target.split("#")[0], target=target))
    (ROOT / "sitemap.xml").write_text(
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        + "".join(sitemap) + "</urlset>\n")


if __name__ == "__main__":
    build()
