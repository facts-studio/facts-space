#!/usr/bin/env zsh
# Carga las variables de .env.local en Vercel (Production) y redespliega.
# Uso:  zsh scripts/vercel-env-prod.sh
set -e
cd "${0:A:h}/.."          # raíz del repo
set -a && . ./.env.local && set +a

VARS=(
  CLICKUP_API_TOKEN
  CLICKUP_TEAM_ID
  CLICKUP_VIEW_ID
  NEXT_PUBLIC_ALLOWED_EMAIL_DOMAIN
  NEXT_PUBLIC_AUTH_DISABLED
  NEXT_PUBLIC_SUPABASE_ANON_KEY
  NEXT_PUBLIC_SUPABASE_URL
)

for V in $VARS; do
  echo "→ $V"
  printf '%s' "${(P)V}" | vercel env add "$V" production
done

# SITE_URL apunta al dominio de producción (no localhost)
echo "→ NEXT_PUBLIC_SITE_URL (dominio prod)"
printf '%s' "https://facts-space.vercel.app" | vercel env add NEXT_PUBLIC_SITE_URL production

echo "→ Redesplegando producción…"
vercel --prod
