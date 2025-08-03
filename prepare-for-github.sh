#!/bin/bash
# Script para preparar o projeto Scribo para publicação no GitHub

echo "🧹 Preparando projeto Scribo para GitHub..."

# Remover arquivos de desenvolvimento e análise
echo "📁 Removendo arquivos desnecessários..."

# Arquivos de análise e documentação temporária
rm -f ANALISE_*.md
rm -f CORRECAO_*.md
rm -f RESUMO_*.md
rm -f SOLUCAO_*.md
rm -f PARSER_*.md
rm -f *_SUMMARY.md
rm -f *_ANALYSIS.md
rm -f *_IMPLEMENTATION_*.md
rm -f modelos.txt
rm -f system*.txt
rm -f logs.txt
rm -f erro.txt

# Arquivos de credenciais e configuração local
rm -f CREDENCIAIS_*.md
rm -f GUIA_*.md

# Scripts de desenvolvimento
rm -rf inicializacao/
rm -f start_*.bat
rm -f start_*.ps1
rm -f *.bat
rm -f *.ps1

# Banco de dados local
rm -f database.db
rm -f backend/database.db

# Logs e arquivos temporários
rm -f backend/logs.txt
rm -f frontend/logs.txt

# Diretórios de análise específica
rm -rf "Análise/"

# Arquivos de temas duplicados (manter apenas os do frontend/public)
rm -rf redacoes_e_temas/

# Base de dados de desenvolvimento
rm -rf base_tep2/

echo "✅ Arquivos removidos!"

# Verificar se git está inicializado
if [ ! -d ".git" ]; then
    echo "🔧 Inicializando repositório Git..."
    git init
    git branch -M main
fi

# Adicionar arquivos essenciais
echo "📦 Adicionando arquivos ao Git..."
git add .
git add .gitignore

echo "✅ Projeto preparado para GitHub!"
echo ""
echo "📋 Próximos passos:"
echo "1. git commit -m 'Initial commit - Scribo Beta'"
echo "2. git remote add origin https://github.com/SUPERNVX/scribo.git"
echo "3. git push -u origin main"
echo ""
echo "📁 Arquivos mantidos:"
echo "- README.md"
echo "- CONTEXTO_PROJETO_SCRIBO.md"
echo "- ARQUITETURA.md"
echo "- DEPLOY_GUIDE.md"
echo "- frontend/ (código do frontend)"
echo "- backend/ (código do backend)"
echo "- k8s/ (configurações Kubernetes)"
echo ""
echo "🚀 Pronto para publicação!"