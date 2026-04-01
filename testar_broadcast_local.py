#!/usr/bin/env python3
"""Teste local do broadcast (mesmo POST do ReqBin). Sem dependencias externas."""
from __future__ import annotations

import argparse
import json
import sys
import urllib.error
import urllib.request

DEFAULT_URL = "https://ssrx-radar.netlify.app/.netlify/functions/push"


def main() -> int:
    p = argparse.ArgumentParser(description="POST broadcast para Netlify push")
    p.add_argument("--url", default=DEFAULT_URL, help="URL da funcao push")
    p.add_argument("--title", default="Saint Seiya EX", help="Titulo da notificacao")
    p.add_argument("--body", default="Novo banner disponivel!", help="Corpo da notificacao")
    args = p.parse_args()

    payload = {
        "type": "broadcast",
        "payload": {"title": args.title, "body": args.body},
    }
    data = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    req = urllib.request.Request(
        args.url,
        data=data,
        headers={"Content-Type": "application/json; charset=utf-8"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            body = resp.read().decode("utf-8", errors="replace")
            print(resp.status, body)
    except urllib.error.HTTPError as e:
        err = e.read().decode("utf-8", errors="replace")
        print(e.code, err, file=sys.stderr)
        return 1
    except urllib.error.URLError as e:
        print(e.reason, file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
