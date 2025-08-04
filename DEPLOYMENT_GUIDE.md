# Guia de Deployment do Sistema Scribo

Este guia documenta o processo de deployment do sistema Scribo, incluindo o frontend hospedado no Vercel e o backend hospedado no Kubernetes.

## Informações do Sistema

- **Site Oficial**: [https://scribo-iota.vercel.app/](https://scribo-iota.vercel.app/)
- **API Backend**: [https://api.scribo.saymonaraujo.dev](https://api.scribo.saymonaraujo.dev)
- **Admin Dashboard**: [https://admin.scribo.saymonaraujo.dev](https://admin.scribo.saymonaraujo.dev)

## Estrutura do Sistema

1. **Frontend**: Hospedado no Vercel
2. **Backend**: Hospedado no Kubernetes
3. **Admin Dashboard**: Hospedado no Kubernetes
4. **Banco de Dados**: SQLite (embutido no backend)

## Deploy no GitHub

### 1. Fazendo alterações no código

```bash
# 1. Certifique-se de estar na branch principal
git checkout main

# 2. Faça as alterações necessárias no código

# 3. Adicione os arquivos modificados
git add .

# 4. Faça o commit das alterações
git commit -m "Descrição das alterações"

# 5. Envie as alterações para o repositório
git push origin main
```

### 2. Verificando o status do repositório

```bash
# Verificar o status dos arquivos
git status

# Ver histórico de commits
git log --oneline

# Ver diferenças não commitadas
git diff
```

## Deploy no Kubernetes

### 1. Aplicando alterações no backend

Quando você faz alterações no código do backend, é necessário reiniciar os pods no Kubernetes para que as alterações entrem em vigor:

```bash
# 1. Aplique as configurações atualizadas (se houver alterações no YAML)
kubectl apply -f k8s/scribo-production-nicolas.yaml

# 2. Reinicie os pods do backend para carregar o código atualizado
kubectl rollout restart deployment/scribo-backend -n nicolas

# 3. Aguarde os novos pods ficarem prontos
kubectl get pods -n nicolas -w

# 4. Verifique os logs dos novos pods
kubectl logs -n nicolas -l app=scribo,component=backend --tail=20
```

### 2. Verificando o status do sistema

```bash
# Verificar status dos pods
kubectl get pods -n nicolas

# Verificar status dos serviços
kubectl get services -n nicolas

# Verificar status dos ingress
kubectl get ingress -n nicolas

# Verificar logs detalhados
kubectl logs -n nicolas <nome-do-pod>
```

### 3. Reiniciando serviços específicos

```bash
# Reiniciar apenas o backend
kubectl delete pods -n nicolas -l app=scribo,component=backend

# Reiniciar apenas o admin dashboard
kubectl delete pods -n nicolas -l app=scribo,component=admin-dashboard
```

## Configurações importantes

### 1. Variáveis de ambiente

As variáveis de ambiente são configuradas em dois lugares:

1. **Frontend (Vercel)**: Configuradas no painel do Vercel em "Settings" > "Environment Variables"
2. **Backend (Kubernetes)**: Configuradas no arquivo `k8s/scribo-production-nicolas.yaml` como secrets e configmaps

### 2. CORS

Sempre que adicionar um novo domínio para o frontend, atualize a lista de origens permitidas no arquivo [backend/server.py](file:///c:/Users/Nicolas/ENEM/backend/server.py):

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://scribo-delta.vercel.app",
        "https://scribo-j03w.onrender.com",
        "https://scribo-bay.vercel.app",
        "https://api.scribo.saymonaraujo.dev",
        "https://scribo-iota.vercel.app",
        # Adicione novos domínios aqui
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### 3. Google OAuth

Ao adicionar novos domínios, atualize as configurações no Google Cloud Console:

- **Origens JavaScript autorizadas**: `https://<seu-dominio>.vercel.app`
- **URIs de redirecionamento autorizados**: `https://<seu-dominio>.vercel.app/login`

## Troubleshooting

### 1. Problemas de CORS

Se ocorrerem erros de CORS:

1. Verifique se o domínio está adicionado na lista de origens permitidas no [backend/server.py](file:///c:/Users/Nicolas/ENEM/backend/server.py)
2. Reinicie os pods do backend:
   ```bash
   kubectl delete pods -n nicolas -l app=scribo,component=backend
   ```
3. Verifique se as alterações foram aplicadas:
   ```bash
   curl -H "Origin: https://<seu-dominio>.vercel.app" -H "Access-Control-Request-Method: POST" -H "Access-Control-Request-Headers: Content-Type" -X OPTIONS https://api.scribo.saymonaraujo.dev/api/auth/google -v
   ```

### 2. Problemas de deployment no Vercel

Se o frontend não estiver funcionando corretamente:

1. Verifique se as variáveis de ambiente estão configuradas no painel do Vercel
2. Faça um redeploy manual:
   - Vá para "Deployments" no painel do Vercel
   - Clique nos três pontos no último deployment
   - Selecione "Redeploy"

### 3. Problemas de conectividade com o backend

Se o frontend não conseguir se comunicar com o backend:

1. Verifique se o backend está respondendo:
   ```bash
   curl https://api.scribo.saymonaraujo.dev/api/health
   ```
2. Verifique os logs do backend:
   ```bash
   kubectl logs -n nicolas -l app=scribo,component=backend
   ```
3. Verifique o status dos pods:
   ```bash
   kubectl get pods -n nicolas
   ```

## Comandos úteis do Kubernetes

```bash
# Ver todos os recursos no namespace
kubectl get all -n nicolas

# Descrever um pod específico
kubectl describe pod -n nicolas <nome-do-pod>

# Executar comandos dentro de um pod
kubectl exec -it -n nicolas <nome-do-pod> -- /bin/bash

# Ver os logs em tempo real
kubectl logs -n nicolas -l app=scribo,component=backend -f

# Escalar o número de réplicas
kubectl scale deployment/scribo-backend --replicas=3 -n nicolas
```

## Comandos úteis do Git

```bash
# Ver diferenças entre commits
git diff HEAD~1 HEAD

# Reverter um commit específico
git revert <hash-do-commit>

# Criar uma nova branch
git checkout -b nova-feature

# Mesclar uma branch na main
git checkout main
git merge nova-feature

# Excluir uma branch
git branch -d nova-feature
```