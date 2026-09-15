#!/bin/bash
# El portal como servicio del Mac, no como una terminal abierta.
#
# Por qué: el servidor se arrancaba a mano (o desde una sesión de Claude) y
# moría con ella — al cerrar VS Code, localhost:3007 se caía. Con un LaunchAgent
# macOS lo arranca al iniciar sesión y lo vuelve a levantar si se cae.
#
#   ./scripts/servicio-local.sh instalar    copia el agente y lo arranca
#   ./scripts/servicio-local.sh estado      ¿está vivo? ¿responde?
#   ./scripts/servicio-local.sh reiniciar   tras tocar .env.local
#   ./scripts/servicio-local.sh logs        sigue el log en vivo
#   ./scripts/servicio-local.sh quitar      lo desinstala
set -euo pipefail

ETIQUETA="studio.fcts.space"
PLIST="$HOME/Library/LaunchAgents/$ETIQUETA.plist"
DESTINO="gui/$(id -u)/$ETIQUETA"
LOG="/tmp/fcts-space-dev.log"
PUERTO=3007

case "${1:-estado}" in
  instalar)
    launchctl bootout "$DESTINO" 2>/dev/null || true
    launchctl bootstrap "gui/$(id -u)" "$PLIST"
    echo "Instalado. Arranca solo al iniciar sesión."
    ;;
  quitar)
    launchctl bootout "$DESTINO" 2>/dev/null || true
    rm -f "$PLIST"
    echo "Quitado."
    ;;
  reiniciar)
    launchctl kickstart -k "$DESTINO"
    echo "Reiniciado."
    ;;
  logs)
    tail -f "$LOG"
    ;;
  estado)
    launchctl print "$DESTINO" 2>/dev/null | grep -E "^\s+(state|pid) " || echo "No está cargado."
    printf 'http://localhost:%s → %s\n' "$PUERTO" "$(curl -s -o /dev/null -w '%{http_code}' --max-time 5 "http://localhost:$PUERTO/" || echo 'sin respuesta')"
    ;;
  *)
    echo "Uso: $0 [instalar|estado|reiniciar|logs|quitar]" >&2
    exit 1
    ;;
esac
