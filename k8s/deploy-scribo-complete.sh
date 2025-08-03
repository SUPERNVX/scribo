#!/bin/bash
# Script completo para deploy do Scribo + Dashboard Admin no Kubernetes

set -e

echo "=== SCRIBO COMPLETE KUBERNETES DEPLOYMENT ==="
echo "=============================================="

# Configurações
NAMESPACE=${NAMESPACE:-scribo}
KUBECTL=${KUBECTL:-kubectl}
ADMIN_DOMAIN=${ADMIN_DOMAIN:-admin.scribo.com}
APP_DOMAIN=${APP_DOMAIN:-app.scribo.com}

echo "Namespace: $NAMESPACE"
echo "Admin Domain: $ADMIN_DOMAIN"
echo "App Domain: $APP_DOMAIN"
echo "=============================================="

# Verificar pré-requisitos
if ! command -v $KUBECTL &> /dev/null; then
    echo "ERROR: kubectl não encontrado"
    exit 1
fi

# Criar namespace
if ! $KUBECTL get namespace $NAMESPACE &> /dev/null; then
    echo "Creating namespace $NAMESPACE..."
    $KUBECTL create namespace $NAMESPACE
    
    # Labels para organização
    $KUBECTL label namespace $NAMESPACE app=scribo
else
    echo "✅ Namespace $NAMESPACE already exists"
fi

echo ""
echo "=== STEP 1: SECRETS E CONFIGURAÇÕES ==="

# Gerar credenciais seguras
ADMIN_TOKEN="scribo_k8s_$(date +%Y%m%d)_$(openssl rand -hex 12)"
ADMIN_PASSWORD="AdminScribo$(date +%Y)!$(openssl rand -hex 6)"
JWT_SECRET=$(openssl rand -hex 32)
DATABASE_PASSWORD="DbScribo$(date +%Y)!$(openssl rand -hex 8)"

# Criar secrets principais
if ! $KUBECTL get secret scribo-secrets -n $NAMESPACE &> /dev/null; then
    echo "🔐 Criando secrets principais..."
    
    $KUBECTL create secret generic scribo-secrets \
        --from-literal=jwt-secret="$JWT_SECRET" \
        --from-literal=database-password="$DATABASE_PASSWORD" \
        --from-literal=google-client-id="3208095428-1um39vq2u873ick597j0j686h0j8ic7n.apps.googleusercontent.com" \
        --from-literal=google-client-secret="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" \
        -n $NAMESPACE
else
    echo "✅ Secret scribo-secrets já existe"
fi

# Criar secret do admin dashboard
if ! $KUBECTL get secret scribo-admin-secret -n $NAMESPACE &> /dev/null; then
    echo "🔐 Criando secret do admin dashboard..."
    
    $KUBECTL create secret generic scribo-admin-secret \
        --from-literal=admin-token="$ADMIN_TOKEN" \
        --from-literal=admin-password="$ADMIN_PASSWORD" \
        -n $NAMESPACE
    
    echo "✅ Credenciais do Admin Dashboard:"
    echo "   Token: $ADMIN_TOKEN"
    echo "   Password: $ADMIN_PASSWORD"
    echo ""
    echo "⚠️  SALVE ESSAS CREDENCIAIS EM LOCAL SEGURO!"
else
    echo "✅ Secret scribo-admin-secret já existe"
    ADMIN_TOKEN=$($KUBECTL get secret scribo-admin-secret -n $NAMESPACE -o jsonpath='{.data.admin-token}' | base64 -d)
    ADMIN_PASSWORD=$($KUBECTL get secret scribo-admin-secret -n $NAMESPACE -o jsonpath='{.data.admin-password}' | base64 -d)
fi

echo ""
echo "=== STEP 2: STORAGE ==="

# Aplicar PVCs
echo "📦 Configurando storage..."
$KUBECTL apply -f - <<EOF
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: scribo-database-pvc
  namespace: $NAMESPACE
  labels:
    app: scribo
    component: database
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 20Gi
  storageClassName: standard
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: scribo-logs-pvc
  namespace: $NAMESPACE
  labels:
    app: scribo
    component: logs
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 5Gi
  storageClassName: standard
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: scribo-admin-logs-pvc
  namespace: $NAMESPACE
  labels:
    app: scribo
    component: admin-dashboard
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 2Gi
  storageClassName: standard
EOF

echo ""
echo "=== STEP 3: CONFIGURAÇÕES ==="

# ConfigMaps
echo "⚙️ Aplicando configurações..."
$KUBECTL apply -f cleanup-configmap.yaml
$KUBECTL apply -f - <<EOF
apiVersion: v1
kind: ConfigMap
metadata:
  name: scribo-app-config
  namespace: $NAMESPACE
  labels:
    app: scribo
    component: backend
data:
  USE_POSTGRES: "false"
  ENVIRONMENT: "kubernetes"
  LOG_LEVEL: "INFO"
  CORS_ORIGINS: "https://$APP_DOMAIN,https://$ADMIN_DOMAIN"
EOF

echo ""
echo "=== STEP 4: BACKEND DEPLOYMENT ==="

echo "🚀 Deploying backend..."
$KUBECTL apply -f - <<EOF
apiVersion: apps/v1
kind: Deployment
metadata:
  name: scribo-backend
  namespace: $NAMESPACE
  labels:
    app: scribo
    component: backend
spec:
  replicas: 2
  selector:
    matchLabels:
      app: scribo
      component: backend
  template:
    metadata:
      labels:
        app: scribo
        component: backend
    spec:
      containers:
      - name: backend
        image: scribo-backend:latest
        imagePullPolicy: Always
        ports:
        - containerPort: 8000
        env:
        - name: JWT_SECRET_KEY
          valueFrom:
            secretKeyRef:
              name: scribo-secrets
              key: jwt-secret
        - name: GOOGLE_CLIENT_ID
          valueFrom:
            secretKeyRef:
              name: scribo-secrets
              key: google-client-id
        - name: GOOGLE_CLIENT_SECRET
          valueFrom:
            secretKeyRef:
              name: scribo-secrets
              key: google-client-secret
        - name: USE_POSTGRES
          valueFrom:
            configMapKeyRef:
              name: scribo-app-config
              key: USE_POSTGRES
        - name: ENVIRONMENT
          valueFrom:
            configMapKeyRef:
              name: scribo-app-config
              key: ENVIRONMENT
        resources:
          requests:
            memory: "1Gi"
            cpu: "500m"
          limits:
            memory: "2Gi"
            cpu: "1000m"
        volumeMounts:
        - name: database-storage
          mountPath: /app/data
        - name: logs-storage
          mountPath: /app/logs
        livenessProbe:
          httpGet:
            path: /api/health
            port: 8000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /api/health
            port: 8000
          initialDelaySeconds: 10
          periodSeconds: 5
      volumes:
      - name: database-storage
        persistentVolumeClaim:
          claimName: scribo-database-pvc
      - name: logs-storage
        persistentVolumeClaim:
          claimName: scribo-logs-pvc
---
apiVersion: v1
kind: Service
metadata:
  name: scribo-backend-service
  namespace: $NAMESPACE
  labels:
    app: scribo
    component: backend
spec:
  type: ClusterIP
  ports:
  - port: 8000
    targetPort: 8000
    protocol: TCP
  selector:
    app: scribo
    component: backend
EOF

echo ""
echo "=== STEP 5: ADMIN DASHBOARD ==="

echo "📊 Deploying admin dashboard..."
$KUBECTL apply -f admin-dashboard-k8s.yaml

echo ""
echo "=== STEP 6: AUTOMAÇÃO DE LIMPEZA ==="

echo "🧹 Configurando limpeza automática..."
$KUBECTL apply -f cleanup-cronjob.yaml

echo ""
echo "=== STEP 7: INGRESS E ACESSO EXTERNO ==="

echo "🌐 Configurando acesso externo..."
$KUBECTL apply -f - <<EOF
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: scribo-app-ingress
  namespace: $NAMESPACE
  labels:
    app: scribo
    component: frontend
  annotations:
    kubernetes.io/ingress.class: "nginx"
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
spec:
  tls:
  - hosts:
    - $APP_DOMAIN
    secretName: scribo-app-tls
  rules:
  - host: $APP_DOMAIN
    http:
      paths:
      - path: /api
        pathType: Prefix
        backend:
          service:
            name: scribo-backend-service
            port:
              number: 8000
      - path: /
        pathType: Prefix
        backend:
          service:
            name: scribo-frontend-service
            port:
              number: 80
EOF

echo ""
echo "=== STEP 8: VERIFICAÇÃO ==="

echo "⏳ Aguardando deployments ficarem prontos..."
$KUBECTL wait --for=condition=available --timeout=300s deployment/scribo-backend -n $NAMESPACE
$KUBECTL wait --for=condition=available --timeout=300s deployment/scribo-admin-dashboard -n $NAMESPACE

echo ""
echo "=== STATUS FINAL ==="

echo "📊 Pods:"
$KUBECTL get pods -n $NAMESPACE

echo ""
echo "🌐 Services:"
$KUBECTL get services -n $NAMESPACE

echo ""
echo "🔗 Ingress:"
$KUBECTL get ingress -n $NAMESPACE

echo ""
echo "📅 CronJobs:"
$KUBECTL get cronjobs -n $NAMESPACE

echo ""
echo "=== CREDENCIAIS DE ACESSO ==="

echo "🌐 URLs:"
echo "   App Principal: https://$APP_DOMAIN"
echo "   Admin Dashboard: https://$ADMIN_DOMAIN"

echo ""
echo "🔐 Admin Dashboard:"
echo "   Token: $ADMIN_TOKEN"
echo "   Basic Auth User: admin"
echo "   Basic Auth Pass: $ADMIN_PASSWORD"

echo ""
echo "🔧 Comandos Úteis:"
echo "   Logs Backend: kubectl logs -n $NAMESPACE -l component=backend -f"
echo "   Logs Dashboard: kubectl logs -n $NAMESPACE -l component=admin-dashboard -f"
echo "   Logs Limpeza: kubectl logs -n $NAMESPACE -l component=cleanup -f"
echo "   Port Forward Dashboard: kubectl port-forward -n $NAMESPACE service/scribo-admin-dashboard-service 8001:8001"

echo ""
echo "=== DEPLOY COMPLETO FINALIZADO ==="
echo "✅ Backend: Rodando com $($KUBECTL get deployment scribo-backend -n $NAMESPACE -o jsonpath='{.status.readyReplicas}') réplicas"
echo "✅ Admin Dashboard: Disponível com autenticação dupla"
echo "✅ Limpeza Automática: CronJob configurado para 2:00 AM UTC"
echo "✅ Storage: PVCs criados para dados e logs"
echo "✅ Secrets: Credenciais seguras geradas"

echo ""
echo "🎯 Próximos Passos:"
echo "1. Configure DNS: $ADMIN_DOMAIN -> IP do LoadBalancer"
echo "2. Acesse: https://$ADMIN_DOMAIN"
echo "3. Use as credenciais mostradas acima"
echo "4. Monitore logs e métricas"

echo ""
echo "⚠️  IMPORTANTE: Salve as credenciais em local seguro!"
echo "Token: $ADMIN_TOKEN"
echo "Password: $ADMIN_PASSWORD"