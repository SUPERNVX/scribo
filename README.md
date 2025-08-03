# 🎯 SCRIBO - Plataforma Inteligente de Escrita

> "Scribo" - Do latim "eu escrevo". Uma plataforma completa para aperfeiçoar sua escrita com a ajuda de inteligência artificial.

## 📖 Sobre o Projeto

O **Scribo** é uma plataforma de escrita que utiliza múltiplos modelos de IA para fornecer correção automática e feedback personalizado. O projeto foi desenvolvido para ajudar estudantes a aprimorar suas habilidades de redação, especialmente para vestibulares como o ENEM, com uma interface moderna e funcionalidades avançadas.

**Status do Projeto:** 🚀 100% Concluído e Funcional. Pronto para produção.

---

## ✨ Funcionalidades Principais

#### 🤖 Sistema de IA Avançado
- **Análise Multi-Modelo:** Utiliza DeepSeek R1, Llama 3.1 405B e GPT-4o Mini para análise consensual, aumentando a precisão da correção.
- **Feedback Personalizado:** Fornece feedback detalhado por competências (ENEM, FUVEST, ITA, etc.) com prompts adaptados por faculdade.
- **Análise Profunda:** Capacidade de realizar análises mais detalhadas com múltiplos modelos simultaneamente, incluindo detecção de outliers e relatório de confiabilidade.
- **Otimização de Prompts:** Prompts otimizados para redução de tokens e melhor desempenho.

#### 🔄 Sistema de Tarefas Assíncronas
- **Processamento em Background:** Tarefas pesadas (geração de PDF, análises profundas) são executadas em uma fila assíncrona baseada em Redis (com fallback em memória).
- **Workers e Retries:** Possui workers dedicados para processamento em background e mecanismo de retry com backoff exponencial para tarefas falhas.
- **Dashboard de Monitoramento:** Interface web para acompanhar o status das tarefas em tempo real e notificações de conclusão.

#### 📊 Dashboards e Analytics
- **Dashboard de Analytics:** Gráficos interativos e estatísticas detalhadas sobre a evolução do usuário, com comparações reais contra a média de outros usuários.
- **Dashboard de Geolocalização:** Mapa interativo e dados sobre a localização e dispositivos dos usuários que acessam a plataforma.
- **Dashboard Administrativo:** Interface web para gerenciamento de usuários e tiers.

#### 📄 Exportação e Tiers
- **Exportação para PDF:** Geração de PDFs profissionais com ReportLab, incluindo o texto da redação, metadados e a análise da IA.
- **Sistema de Tiers:** Planos de usuário (Gratuito, Premium, Vitalício) com diferentes limites de uso e funcionalidades, incluindo limpeza automática de redações para usuários gratuitos.

#### 🎨 Interface e UX
- **Design Refinado:** Paleta de cores pastel, fontes personalizadas e animações fluidas.
- **Otimização Mobile:** Experiência de usuário aprimorada para dispositivos móveis com gestos de toque avançados, otimização de teclado virtual e adaptação de layout.
- **Gamificação:** Sistema de níveis, medalhas e conquistas para engajamento do usuário.

---

## 🛠️ Tecnologias Utilizadas

- **Backend:** Python (FastAPI), SQLite (com otimizações para PostgreSQL), Redis, Nvidia NIM, OpenAI.
- **Frontend:** React 18/19, Tailwind CSS, Chart.js, Context API, Custom Hooks.
- **DevOps:** Kubernetes, Vercel, Docker.

---

## 🚀 Deploy em Produção

O Scribo é projetado para ser implantado em ambientes de produção.

### Backend (Kubernetes)
O backend é orquestrado via Kubernetes. Para detalhes sobre o deploy, consulte o `DEPLOY_GUIDE.md` e os scripts em `k8s/`.

### Frontend (Vercel)
O frontend é otimizado para deploy contínuo via Vercel. Para detalhes sobre a configuração e variáveis de ambiente, consulte o `DEPLOY_GUIDE.md`.

---

## 📚 Documentação Adicional

- **[ARQUITETURA.md](ARQUITETURA.md):** Detalhes sobre a arquitetura do sistema, incluindo o sistema de tarefas, IA e tiers.
- **[DEPLOY_GUIDE.md](DEPLOY_GUIDE.md):** Instruções completas para o deploy em produção.
- **[CHANGELOG.md](CHANGELOG.md):** Histórico completo de versões e alterações.
- **[README_PRODUCTION.md](README_PRODUCTION.md):** Um README focado no ambiente de produção.

---

## 🤝 Contribuição

Contribuições são bem-vindas! Se você deseja contribuir com o projeto, siga estas diretrizes:

1.  Faça um fork do repositório.
2.  Crie uma nova branch para sua feature (`git checkout -b feature/minha-nova-feature`).
3.  Faça suas alterações e commit-as (`git commit -m 'feat: adiciona nova feature X'`).
4.  Envie para o seu fork (`git push origin feature/minha-nova-feature`).
5.  Abra um Pull Request para a branch `main` deste repositório.

## 📄 Licença

Este projeto está licenciado sob a Licença MIT. Consulte o arquivo `LICENSE` para mais detalhes.

## 👨‍💻 Autor

**Nicolas** - Desenvolvedor Principal
- GitHub: [@SUPERNVX](https://github.com/SUPERNVX)

## 🙏 Agradecimentos

- Comunidade open source
- Contribuidores do projeto
- Beta testers

---

⭐ **Se este projeto te ajudou, considere dar uma estrela!**

📧 **Feedback**: Abra uma issue para reportar bugs ou sugerir melhorias.
