# PRD: Deploy na Infraestrutura Hetzner (VPS)

Este documento define os requisitos, a arquitetura e o fluxo de implantação (Deploy) do sistema **Monitor de Licitações** em uma VPS (Virtual Private Server) provida pela Hetzner.

---

## 1. Visão Geral da Arquitetura

O sistema é um monorepo construído com **React (Vite) + Express (Node.js) + Drizzle ORM**, conectando-se externamente ao **Neon DB (PostgreSQL Serverless)** e APIs da Google (Gemini). Além do servidor Web, a infraestrutura deve suportar a execução assíncrona de **Workers (Scrapers)**.

### Componentes Lógicos:
1. **Frontend Server:** Servidor de arquivos estáticos (build do Vite).
2. **Backend API:** Servidor Express rodando na porta 3001, gerenciando rotas da API e integrações.
3. **Workers/Cron Jobs:** Processos independentes para raspagem de editais (PNCP, SESC, SEST SENAT).
4. **Database:** Hospedado no Neon DB (Não consome recursos de computação/armazenamento da VPS).

---

## 2. Requisitos de Infraestrutura (Hetzner)

**Pergunta de Consolidação (CX33 Gymsite):** Como já existe uma VPS CX33 (4 vCPU/8 GB) subutilizada rodando o `gymsite-api`, **vamos consolidar o Monitor de Licitações nesta mesma máquina**. Isso economiza custos e a máquina tem memória de sobra. Caso haja necessidade futura de isolamento de IP (por bloqueios governamentais), migramos para uma máquina dedicada.

Se fosse uma máquina dedicada, a configuração seria:
* **Instância:** `CPX31` (4 vCPU, 8 GB RAM). O Puppeteer gera picos altos de RAM.
* **Segurança OS:** Configurar Swapfile de 4GB para evitar Out-Of-Memory (OOM) fatal.

---

## 3. Modelo de Implantação (Deployment Strategy)

Utilizaremos **Docker e Docker Compose**.

### Imagem Base
Usaremos `node:20-bookworm-slim` (Debian). Isso é vital porque o Puppeteer/Chromium precisa da `glibc` padrão (Alpine usa `musl` e quebra o Chromium headless frequentemente).

### Containerização (Serviços no `docker-compose.production.yml`)
1. **`app`**: O servidor principal Web.
2. **`worker-pncp` e `worker-sescsp`**: Imagens isoladas. A orquestração será feita via **node-cron** dentro de um processo Node contínuo ou agendador interno (ex: `node-cron`), mantendo o container em execução (idle) até a hora da raspagem, evitando o overhead de subida e descida constante de containers pesados.
3. **`caddy`**: Reverse Proxy escolhido (bater o martelo no Caddy pela simplicidade absurda de SSL automático via Let's Encrypt sem sidecars do Certbot).

---

## 4. Fluxo de CI/CD (Integração e Entrega Contínua)

O fluxo será automatizado via **GitHub Actions**:
1. **Push na `main`:** O desenvolvedor executa `npm run auto-ship` localmente.
2. **Build (GitHub Actions):** O pipeline faz o build e dispara o SSH via Action.
3. **Deploy (Hetzner):** O script executa `docker compose up -d --build`. 
   > *Nota de Downtime:* Aceitaremos o micro-downtime de alguns segundos durante a recriação do container `app`. Como é uma ferramenta interna B2B (não é B2C), isso é perfeitamente aceitável e evita a complexidade de um Traefik/Blue-Green deployment agora.

---

## 5. Segurança, Backup e Monitoramento

As Regras de Ouro aplicadas ao ambiente:

| Área | Aplicação na VPS |
| :--- | :--- |
| **Segurança SSH** | Desabilitar login de `root`, forçar autenticação via Chave Pública (SSH Keys) e instalar `fail2ban` para bloquear ataques de força bruta no SSH. |
| **Isolamento** | Chaves **Gemini**, **Linear** e **DATABASE_URL** injetadas apenas via GitHub Secrets / `.env` protegido. Nunca na imagem. |
| **Monitoramento** | Além do `restart: always`, integrar alertas simples (via Telegram/Discord/Slack) no bloco `catch` dos scrapers para avisar se estiverem falhando em loop. |
| **Proteção de IPs** | Portais GOV.BR frequentemente bloqueiam IPs de Datacenters (Hetzner). Se os blocos da Hetzner forem banidos, usaremos um proxy residencial (BrightData/Oxylabs) apenas para as requisições HTTP do Scraper. |
| **Backup** | O Neon DB já gerencia os dados. O servidor rodará "Stateless". Não guardaremos anexos PDFs localmente a longo prazo (apenas cache temporário em `/tmp`). |

---

## 6. Próximos Passos (Action Items)

- [x] **Dockerfile:** `node:20-bookworm-slim` multi-stage com libs do Chromium.
- [x] **Docker Compose:** Orquestração com limites (1GB para o puppeteer) e Caddy.
- [x] **Workflow:** `.github/workflows/deploy.yml` para SSH na máquina atual (Gymsite).
- [ ] **Ajuste de Workers:** Implementar `node-cron` nos arquivos TS para mantê-los rodando nos horários agendados.
