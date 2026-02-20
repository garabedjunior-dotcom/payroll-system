#!/bin/bash
set -e

echo "🔄 Iniciando refatoração do payroll-system..."
echo ""

# Verificar se estamos na raiz do repositório
if [ ! -d ".git" ]; then
    echo "❌ Erro: Execute este script na raiz do repositório"
    exit 1
fi

# Verificar se a pasta payroll-system/payroll-system existe
if [ ! -d "payroll-system/payroll-system" ]; then
    echo "❌ Erro: pasta payroll-system/payroll-system não encontrada"
    exit 1
fi

INNER_DIR="payroll-system/payroll-system"
ROOT_DIR="."

echo "📁 Movendo arquivos de $INNER_DIR para $ROOT_DIR"
echo ""

# Mover todos os arquivos e diretórios
for item in "$INNER_DIR"/*; do
    if [ -e "$item" ]; then
        name=$(basename "$item")
        # Verificar se existe na raiz
        if [ -e "$name" ]; then
            echo "⚠️  $name já existe na raiz, removendo duplicata"
            rm -rf "$name"
        fi
        echo "✅ Movendo: $name"
        mv "$item" "$ROOT_DIR/"
    fi
done

# Remover a pasta vazia payroll-system
echo ""
echo "🗑️  Removendo pasta vazia payroll-system"
rm -rf payroll-system

echo ""
echo "✨ Refatoração concluída com sucesso!"
echo ""
echo "📝 Próximas etapas:"
echo "1. git add -A"
echo "2. git commit -m 'Refactor: Move project to root directory for Vercel deployment'"
echo "3. git push origin main"
