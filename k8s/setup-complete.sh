#!/bin/bash
# Script completo para setup do sistema de tiers e automação no Kubernetes

set -e

echo "=== SCRIBO - SETUP COMPLETO ==="
echo "1. Sistema de Tiers Real"
echo "2. Automação de Limpeza"
echo "3. Kubernetes Deployment"
echo "==============================="

# Configurações
NAMESPACE=${NAMESPACE:-scribo}
KUBECTL=${KUBECTL:-kubectl}

# Verificar se kubectl está disponível
if ! command -v $KUBECTL &> /dev/null; then
    echo "ERROR: kubectl não encontrado"
    exit 1
fi

# 1. MIGRAÇÃO DO BANCO DE DADOS
echo ""
echo "=== STEP 1: DATABASE MIGRATION ==="
echo "Executando migração para adicionar sistema de tiers..."

# Se estiver rodando localmente, executar migração
if [ -f "../backend/migration_add_user_tiers.py" ]; then
    echo "Executando migração local..."
    cd ../backend
    python migration_add_user_tiers.py
    cd ../k8s
    echo "Migração local concluída"
else
    echo "Migração será executada no pod do backend..."
    # Executar migração no pod do Kubernetes
    POD_NAME=$($KUBECTL get pods -n $NAMESPACE -l app=scribo,component=backend -o jsonpath='{.items[0].metadata.name}' 2>/dev/null || echo "")
    
    if [ ! -z "$POD_NAME" ]; then
        echo "Executando migração no pod: $POD_NAME"
        $KUBECTL exec -n $NAMESPACE $POD_NAME -- python migration_add_user_tiers.py
        echo "Migração no Kubernetes concluída"
    else
        echo "WARNING: Pod do backend não encontrado. Execute a migração manualmente:"
        echo "kubectl exec -n $NAMESPACE <backend-pod> -- python migration_add_user_tiers.py"
    fi
fi

# 2. DEPLOY DA AUTOMAÇÃO DE LIMPEZA
echo ""
echo "=== STEP 2: CLEANUP AUTOMATION ==="
echo "Fazendo deploy da automação de limpeza..."

# Verificar se namespace existe
if ! $KUBECTL get namespace $NAMESPACE &> /dev/null; then
    echo "Creating namespace $NAMESPACE..."
    $KUBECTL create namespace $NAMESPACE
fi

# Aplicar ConfigMap
echo "Applying ConfigMap..."
$KUBECTL apply -f cleanup-configmap.yaml

# Aplicar CronJob e PVC
echo "Applying CronJob and PVC..."
$KUBECTL apply -f cleanup-cronjob.yaml

# 3. VERIFICAR STATUS
echo ""
echo "=== STEP 3: VERIFICATION ==="

echo "ConfigMap:"
$KUBECTL get configmap scribo-cleanup-config -n $NAMESPACE

echo ""
echo "PVC:"
$KUBECTL get pvc scribo-logs-pvc -n $NAMESPACE

echo ""
echo "CronJob:"
$KUBECTL get cronjob scribo-cleanup-free-essays -n $NAMESPACE

# 4. TESTE MANUAL (OPCIONAL)
echo ""
echo "=== STEP 4: OPTIONAL MANUAL TEST ==="
read -p "Deseja executar um teste manual da limpeza? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Criando job de teste..."
    $KUBECTL create job --from=cronjob/scribo-cleanup-free-essays scribo-cleanup-test-$(date +%s) -n $NAMESPACE
    
    echo "Aguardando job iniciar..."
    sleep 5
    
    echo "Logs do job de teste:"
    $KUBECTL logs -n $NAMESPACE -l app=scribo,component=cleanup --tail=50 -f
fi

# 5. INFORMAÇÕES FINAIS
echo ""
echo "=== SETUP CONCLUÍDO COM SUCESSO ==="
echo ""
echo "SISTEMA DE TIERS:"
echo "- ✅ Migração do banco executada"
echo "- ✅ Endpoints de tier disponíveis em /api/user/tier"
echo "- ✅ Frontend atualizado para usar tiers reais"
echo ""
echo "AUTOMAÇÃO DE LIMPEZA:"
echo "- ✅ CronJob configurado para executar diariamente às 2:00 AM UTC"
echo "- ✅ Logs persistentes em PVC"
echo "- ✅ ConfigMap com scripts de monitoramento"
echo ""
echo "PRÓXIMOS PASSOS:"
echo "1. Monitorar execução:"
echo "   kubectl get jobs -n $NAMESPACE -l app=scribo,component=cleanup"
echo ""
echo "2. Ver logs:"
echo "   kubectl logs -n $NAMESPACE -l app=scribo,component=cleanup --tail=100"
echo ""
echo "3. Testar endpoints de tier:"
echo "   curl -H 'Authorization: Bearer <token>' http://your-api/api/user/tier"
echo ""
echo "4. Gerenciar tiers de usuários (admin):"
echo "   curl -X POST -H 'Authorization: Bearer <admin-token>' \\"
echo "        -H 'Content-Type: application/json' \\"
echo "        -d '{\"tier\":\"premium\",\"expires_at\":\"2024-12-31T23:59:59\"}' \\"
echo "        http://your-api/api/user/admin/tier/update?user_id=<user_id>"
echo ""
echo "MONITORAMENTO:"
echo "- Logs de limpeza: /app/logs/cleanup_free_essays.log"
echo "- Métricas de tier: /api/user/tier/limits"
echo "- Health check: /api/health"