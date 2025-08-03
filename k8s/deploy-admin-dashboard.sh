#!/bin/bash
# Script para deploy do Dashboard Administrativo no Kubernetes

set -e

echo "=== SCRIBO ADMIN DASHBOARD - KUBERNETES DEPLOY ==="
echo "=================================================="

# Configurações
NAMESPACE=${NAMESPACE:-scribo}
KUBECTL=${KUBECTL:-kubectl}
DOMAIN=${DOMAIN:-admin.scribo.com}

echo "Namespace: $NAMESPACE"
echo "Domain: $DOMAIN"
echo "=================================================="

# Verificar se kubectl está disponível
if ! command -v $KUBECTL &> /dev/null; then
    echo "ERROR: kubectl não encontrado"
    exit 1
fi

# Verificar se namespace existe
if ! $KUBECTL get namespace $NAMESPACE &> /dev/null; then
    echo "Creating namespace $NAMESPACE..."
    $KUBECTL create namespace $NAMESPACE
else
    echo "Namespace $NAMESPACE already exists"
fi

# Gerar senhas seguras se não existirem
echo ""
echo "=== CONFIGURAÇÃO DE SEGURANÇA ==="

# Verificar se secrets já existem
if $KUBECTL get secret scribo-admin-secret -n $NAMESPACE &> /dev/null; then
    echo "✅ Secret scribo-admin-secret já existe"
else
    echo "🔐 Criando secret com senhas seguras..."
    
    # Gerar token seguro
    ADMIN_TOKEN="scribo_k8s_$(date +%Y%m%d)_$(openssl rand -hex 8)"
    ADMIN_PASSWORD="AdminScribo$(date +%Y)!$(openssl rand -hex 4)"
    
    # Criar secret
    $KUBECTL create secret generic scribo-admin-secret \
        --from-literal=admin-token="$ADMIN_TOKEN" \
        --from-literal=admin-password="$ADMIN_PASSWORD" \
        -n $NAMESPACE
    
    echo "✅ Credenciais criadas:"
    echo "   Token: $ADMIN_TOKEN"
    echo "   Password: $ADMIN_PASSWORD"
    echo ""
    echo "⚠️  IMPORTANTE: Salve essas credenciais em local seguro!"
fi

# Aplicar configurações
echo ""
echo "=== APLICANDO CONFIGURAÇÕES ==="

echo "Applying ConfigMap..."
$KUBECTL apply -f admin-dashboard-k8s.yaml

echo "Waiting for deployment to be ready..."
$KUBECTL wait --for=condition=available --timeout=300s deployment/scribo-admin-dashboard -n $NAMESPACE

# Verificar status
echo ""
echo "=== STATUS DO DEPLOYMENT ==="

echo "Pods:"
$KUBECTL get pods -n $NAMESPACE -l component=admin-dashboard

echo ""
echo "Services:"
$KUBECTL get services -n $NAMESPACE -l component=admin-dashboard

echo ""
echo "Ingress:"
$KUBECTL get ingress -n $NAMESPACE -l component=admin-dashboard

# Obter credenciais
echo ""
echo "=== CREDENCIAIS DE ACESSO ==="

ADMIN_TOKEN=$($KUBECTL get secret scribo-admin-secret -n $NAMESPACE -o jsonpath='{.data.admin-token}' | base64 -d)
ADMIN_PASSWORD=$($KUBECTL get secret scribo-admin-secret -n $NAMESPACE -o jsonpath='{.data.admin-password}' | base64 -d)

echo "🌐 URLs de Acesso:"
echo "   Externo: https://$DOMAIN"
echo "   Interno: http://scribo-admin-dashboard-service.$NAMESPACE.svc.cluster.local:8001"

echo ""
echo "🔐 Credenciais:"
echo "   Dashboard Token: $ADMIN_TOKEN"
echo "   Basic Auth User: admin"
echo "   Basic Auth Pass: $ADMIN_PASSWORD"

# Port forward para teste local
echo ""
echo "=== TESTE LOCAL ==="
echo "Para testar localmente:"
echo "kubectl port-forward -n $NAMESPACE service/scribo-admin-dashboard-service 8001:8001"
echo "Depois acesse: http://localhost:8001"

# Logs
echo ""
echo "=== MONITORAMENTO ==="
echo "Ver logs:"
echo "kubectl logs -n $NAMESPACE -l component=admin-dashboard -f"

echo ""
echo "Ver métricas:"
echo "kubectl top pods -n $NAMESPACE -l component=admin-dashboard"

# Configuração de DNS (se necessário)
echo ""
echo "=== CONFIGURAÇÃO DE DNS ==="
echo "Para acesso externo, configure seu DNS:"
echo "   $DOMAIN -> IP do LoadBalancer/Ingress"

# Obter IP do LoadBalancer se existir
LB_IP=$($KUBECTL get ingress scribo-admin-dashboard-ingress -n $NAMESPACE -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null || echo "Pendente")
if [ "$LB_IP" != "Pendente" ] && [ ! -z "$LB_IP" ]; then
    echo "   IP do LoadBalancer: $LB_IP"
fi

echo ""
echo "=== DEPLOY CONCLUÍDO COM SUCESSO ==="
echo "Dashboard administrativo disponível em: https://$DOMAIN"
echo "Use as credenciais mostradas acima para acessar."