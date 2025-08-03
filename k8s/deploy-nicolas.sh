#!/bin/bash
# Script de deploy para o namespace nicolas

set -e

echo "=== SCRIBO DEPLOYMENT - NAMESPACE NICOLAS ==="
echo "============================================="

# Configurações
NAMESPACE="nicolas"
GITHUB_REPO="https://github.com/SUPERNVX/scribo.git"
BACKEND_DOMAIN="api.scribo.nicolas.dev"
ADMIN_DOMAIN="admin.scribo.nicolas.dev"

echo "Namespace: $NAMESPACE"
echo "Backend Domain: $BACKEND_DOMAIN"
echo "Admin Domain: $ADMIN_DOMAIN"
echo "============================================="

# Verificar se kubectl está disponível
if ! command -v kubectl &> /dev/null; then
    echo "ERROR: kubectl não encontrado"
    exit 1
fi

# Aplicar configurações
echo "📦 Aplicando configurações Kubernetes..."
kubectl apply -f scribo-production-nicolas.yaml

# Verificar status do deployment
echo "🔍 Verificando status dos deployments..."
kubectl get pods -n $NAMESPACE
kubectl get services -n $NAMESPACE
kubectl get ingress -n $NAMESPACE

echo "✅ Deploy concluído!"
echo ""
echo "🌐 URLs de acesso:"
echo "Backend API: https://$BACKEND_DOMAIN"
echo "Admin Dashboard: https://$ADMIN_DOMAIN"
echo ""
echo "📝 Próximos passos:"
echo "1. Configure os DNS para apontar para o IP do seu cluster"
echo "2. Aguarde os certificados SSL serem gerados"
echo "3. Teste as URLs acima"
echo "4. Configure o frontend para usar a URL do backend"