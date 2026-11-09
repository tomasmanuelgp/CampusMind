#!/usr/bin/env bash
# Configura la ficha pública del repositorio en GitHub: descripción,
# sitio web y temas. Ejecútalo UNA vez, con permisos de administrador:
#
#   gh auth login            # si aún no has iniciado sesión
#   bash scripts/configurar-repositorio.sh
#
# Requiere la CLI de GitHub (https://cli.github.com/).
set -euo pipefail

# El repositorio ya se renombró a Refluye el 2026-11-08; GitHub redirige los
# enlaces del nombre anterior. El script queda para volver a aplicar la ficha.
REPO="tomasmanuelgp/Refluye"

# 1. Descripción, sitio web y temas («About»).
gh repo edit "$REPO" \
  --description "💧 RE-FLUYE: equipo de bajo costo (ESP32) y app Android sin internet que orienta a familias rurales de Colombia sobre el agua que usan y qué hacer con ella. Código abierto." \
  --homepage "https://re-fluye.vercel.app/" \
  --enable-issues \
  --enable-discussions \
  --add-topic agua \
  --add-topic calidad-del-agua \
  --add-topic water-quality \
  --add-topic iot \
  --add-topic esp32 \
  --add-topic arduino \
  --add-topic bluetooth \
  --add-topic react-native \
  --add-topic expo \
  --add-topic offline-first \
  --add-topic colombia \
  --add-topic open-hardware \
  --add-topic citizen-science \
  --add-topic agpl

# 2. Reporte privado de vulnerabilidades (lo usa SECURITY.md).
gh api -X PUT "repos/$REPO/private-vulnerability-reporting" >/dev/null || \
  echo "Activa el reporte privado a mano: Settings → Code security → Private vulnerability reporting."

echo "Listo: https://github.com/$REPO"
