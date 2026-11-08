#!/usr/bin/env python3
"""Verifica que los enlaces relativos de los archivos Markdown apunten a algo que existe.

Uso: python3 scripts/verificar-enlaces.py
Sale con código 1 si encuentra enlaces rotos. No revisa URLs externas
(http/https/mailto) para que funcione sin internet.
"""
from __future__ import annotations

import re
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[1]
IGNORAR = {"node_modules", ".git", ".expo", "dist", "coverage", "android", "ios"}
ENLACE = re.compile(r"(?<!!)\[[^\]]*\]\(([^)\s]+)(?:\s+\"[^\"]*\")?\)|!\[[^\]]*\]\(([^)\s]+)\)")


def archivos_markdown():
    for ruta in RAIZ.rglob("*.md"):
        if not IGNORAR.intersection(ruta.relative_to(RAIZ).parts):
            yield ruta


def main() -> int:
    rotos = []
    for md in archivos_markdown():
        texto = md.read_text(encoding="utf-8")
        # Ignora bloques de código, donde los corchetes no son enlaces.
        texto = re.sub(r"```.*?```", "", texto, flags=re.S)
        for m in ENLACE.finditer(texto):
            destino = (m.group(1) or m.group(2)).split("#", 1)[0]
            if not destino or re.match(r"^[a-z]+:", destino):
                continue
            if not (md.parent / destino).resolve().exists():
                rotos.append(f"{md.relative_to(RAIZ)} → {destino}")
    for r in rotos:
        print("Enlace roto:", r)
    print(f"{len(rotos)} enlaces rotos.")
    return 1 if rotos else 0


if __name__ == "__main__":
    sys.exit(main())
