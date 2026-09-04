#!/bin/bash
# Auto-Ship: Automação do Protocolo de Encerramento
echo "🚀 [Auto-Ship] Iniciando pipeline de encerramento seguro..."

# 1. Validação de Saúde e Segredos
echo "🔍 [1/4] Executando check-health (Secrets, Build)..."
export SKIP_DIRTY_CHECK=true
bash ./scripts/check-health.sh
if [ $? -ne 0 ]; then
  echo "❌ [ERRO] O código falhou nas validações de saúde. Corrija antes de comitar."
  exit 1
fi

# 2. Stage dos arquivos
echo "📦 [2/4] Adicionando arquivos na worktree (git add .)..."
git add .

# 3. Commit Semântico Seguro
echo "✍️  [3/4] Iniciando assistente de commit..."
npx git-cz
if [ $? -ne 0 ]; then
  echo "❌ [ERRO] Falha ao criar o commit ou commit abortado."
  exit 1
fi

# 4. Push e Automação de CI
CURRENT_BRANCH=$(git branch --show-current)
echo "☁️  [4/4] Subindo código para a branch origin/$CURRENT_BRANCH..."
git push origin $CURRENT_BRANCH
if [ $? -ne 0 ]; then
  echo "❌ [ERRO] Falha ao realizar o push."
  exit 1
fi

echo "✅ [SUCESSO] Código empurrado para o repositório remoto!"
echo "➡️  O processo de Merge e Deploy deve ser tratado pelas actions do seu CI/CD na nuvem (ex: GitHub Actions / Vercel)."
