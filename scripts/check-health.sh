#!/bin/bash

echo "🔍 Iniciando Check-up de Regras de Ouro..."

# 1. Verificar se há arquivos não trackeados ou modificados (ignorando se SKIP_DIRTY_CHECK for true)
if [[ -z "$SKIP_DIRTY_CHECK" ]] && [[ -n "$(git status -s)" ]]; then
  echo "❌ ERRO: Você tem modificações não commitadas (Worktree Suja)."
  git status -s
  exit 1
fi

# 2. Verificar se existem 'console.log' esquecidos
if grep -r "console.log" ./src --exclude-dir=node_modules; then
  echo "⚠️ AVISO: Existem console.log no código. Remova-os antes do PR."
  # Não sai com erro, mas avisa.
fi

# 3. Verificar chaves de API expostas (Regra 3)
if grep -rE "(GEMINI_API_KEY|MONITOR_API_KEY|CERT_ENCRYPTION_KEY)\s*=\s*['\"][A-Za-z0-9_-]{8,}['\"]" ./src ./server; then
  echo "❌ CRÍTICO: Chave/segredo hardcoded detectado no código fonte!"
  exit 1
fi

# 4. Build real (o commit anterior deste projeto já foi quebrado por um
# build que ninguém rodou antes de comitar - Regra de Ouro: nunca de novo).
echo "🔨 [4/4] Rodando build de produção (vite + esbuild)..."
if ! npm run build; then
  echo "❌ ERRO: Build falhou. Corrija antes de comitar/dar push."
  exit 1
fi

echo "✅ Tudo limpo! Pronto para o Push/PR."
exit 0
