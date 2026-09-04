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
if grep -r "GEMINI_API_KEY=" ./src; then
  echo "❌ CRÍTICO: Chave de API detectada no código fonte!"
  exit 1
fi

echo "✅ Tudo limpo! Pronto para o Push/PR."
exit 0
