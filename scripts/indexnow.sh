#!/bin/sh
set -eu
key=e507ad1b6cd46fe99f28def97a8b7772
host=portage.rikard.dev
cd "$(dirname "$0")/.."
if [ $# -gt 0 ]; then
  urls=$(for u in "$@"; do case "$u" in (/*) echo "https://$host$u" ;; (*) echo "$u" ;; esac; done)
else
  urls=$(sed -n 's:.*<loc>\(.*\)</loc>.*:\1:p' sitemap.xml)
fi
list=$(printf '"%s",' $urls)
curl -sS -w 'HTTP %{http_code}\n' -H 'Content-Type: application/json; charset=utf-8' \
  -d "{\"host\":\"$host\",\"key\":\"$key\",\"keyLocation\":\"https://$host/$key.txt\",\"urlList\":[${list%,}]}" \
  https://api.indexnow.org/indexnow
