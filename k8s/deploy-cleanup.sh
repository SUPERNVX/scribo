#!/bin/bash
# Script para deploy da automação de limpeza no Kubernetes

set -e

# Configurações
NAMESPACE=${NAMESPACE:-scribo}
KUBECTL=${KUBECTL:-kubectl}

echo "=== SCRIBO CLEANUP DEPLOYMENT ==="
echo "Namespace: $NAMESPACE"
echo "Kubectl: $KUBECTL"
echo "=================================="

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

# Aplicar ConfigMap
echo "Applying ConfigMap..."
$KUBECTL apply -f cleanup-configmap.yaml

# Aplicar CronJob e PVC
echo "Applying CronJob and PVC..."
$KUBECTL apply -f cleanup-cronjob.yaml

# Verificar status
echo ""
echo "=== DEPLOYMENT STATUS ==="
echo "ConfigMap:"
$KUBECTL get configmap scribo-cleanup-config -n $NAMESPACE

echo ""
echo "PVC:"
$KUBECTL get pvc scribo-logs-pvc -n $NAMESPACE

echo ""
echo "CronJob:"
$KUBECTL get cronjob scribo-cleanup-free-essays -n $NAMESPACE

echo ""
echo "=== NEXT STEPS ==="
echo "1. Verify the cleanup schedule:"
echo "   kubectl describe cronjob scribo-cleanup-free-essays -n $NAMESPACE"
echo ""
echo "2. Monitor cleanup jobs:"
echo "   kubectl get jobs -n $NAMESPACE -l app=scribo,component=cleanup"
echo ""
echo "3. View cleanup logs:"
echo "   kubectl logs -n $NAMESPACE -l app=scribo,component=cleanup --tail=100"
echo ""
echo "4. Test cleanup manually:"
echo "   kubectl create job --from=cronjob/scribo-cleanup-free-essays scribo-cleanup-test -n $NAMESPACE"
echo ""
echo "5. Monitor with the provided script:"
echo "   kubectl exec -it deployment/scribo-backend -n $NAMESPACE -- bash /app/config/monitor-cleanup.sh"

echo ""
echo "=== CLEANUP AUTOMATION DEPLOYED SUCCESSFULLY ==="