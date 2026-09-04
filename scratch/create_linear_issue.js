const fetch = require('node-fetch');

const LINEAR_API_KEY = "lin_api_Xzr25X4w7Vq0nxFubzRNyvqg34dbeCYaoWF38F2A";

async function createLinearIssue() {
  const query = `
    query {
      teams {
        nodes {
          id
          name
        }
      }
    }
  `;

  try {
    console.log("Fetching teams...");
    const res = await fetch('https://api.linear.app/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': LINEAR_API_KEY
      },
      body: JSON.stringify({ query })
    });

    const data = await res.json();
    
    if (data.errors) {
      console.error(data.errors);
      return;
    }

    const team = data.data.teams.nodes[0];
    if (!team) {
      console.log("No teams found.");
      return;
    }

    console.log("Using team:", team.name, "ID:", team.id);

    const description = `
**Contexto**
O motor de CRM autônomo (SDR Agent) e o squad de RevOps já estão implementados no backend (server/crm_agentic), operando em "fire-and-forget" e populando o banco de dados Neon com as análises de Leading/Lagging indicators e movimentações de Deals. Atualmente, o tenant não possui uma interface visual para interagir com esses dados e aprovar as decisões de higiene.

**Problema**
Sem uma interface no front-end, o gestor comercial fica cego quanto ao pipeline de licitações. Ele não consegue visualizar os indicadores calculados de RevOps (Win Rate, Conversão de Coorte) nem tomar ações sobre as "ervas daninhas" (negócios estagnados que ferem o SLA e que precisam de aprovação manual para irem para LOST).

**Objetivo**
Construir a primeira versão da interface visual do CRM Interno em React/Vite, contendo um Dashboard de indicadores macro e uma listagem clara de ações pendentes (aprovação de perda de oportunidades velhas).

**Escopo**
- Shell/Base: Criar a rota /crm no frontend.
- Integração Real: Consumir os endpoints GET /api/crm/revops/insights e GET /api/editais (filtrados pelo CRM).
- Observabilidade: Renderizar os cards de métricas (Win Rate, Taxa de Conversão).
- UX Refinada: Exibir a análise em texto da IA (Briefing) de forma destacada e profissional.
- Governança/Operação: Criar a seção de "Deals Estagnados (Ervas Daninhas)" com os botões explícitos para aprovar ou rejeitar o descarte (Ação Humana).

**Fora de escopo**
- Drag-and-drop avançado estilo Kanban (nesta primeira issue, o foco é o Dashboard gerencial de RevOps e aprovação de higiene; o Kanban completo será um lote posterior).
- Criação de novos agentes de IA (já criados no backend).

**Critérios de aceite**
- A tela /crm deve carregar sem erros consumindo os dados reais do Neon DB.
- Os indicadores (Win Rate, Conversão e Contagem de Estagnados) devem estar visíveis.
- O texto do briefing do RevOpsAgent deve ser renderizado em um card legível.
- Deve existir feedback claro de Loading, Sucesso e Erro (fallback/timeout) ao requisitar a API de insights.
- Ao clicar para descartar uma "erva daninha", a UI deve chamar o backend e fornecer feedback visual claro da ação (sucesso ou erro).

**Dependências**
- Backend implementado nas tasks S0-09 e motor CRM (Concluído).

**Riscos/observações**
- A geração do insight pelo Gemini pode levar alguns segundos. É mandatório o uso de Skeleton Loaders ou Spinners enquanto o endpoint /api/crm/revops/insights estiver resolvendo a promessa, prevenindo que o usuário ache que o sistema travou.
- Prioridade prática: Garantir que os botões de ação funcionem (Governança) antes de enfeitar gráficos (Cosmética).
    `.trim();

    const mutation = `
      mutation CreateIssue($title: String!, $teamId: String!, $description: String!) {
        issueCreate(input: {
          title: $title,
          teamId: $teamId,
          description: $description
        }) {
          success
          issue {
            id
            title
            url
          }
        }
      }
    `;

    const variables = {
      title: "feat(crm): Construir Dashboard de Gestão (RevOps) e Pipeline de Oportunidades",
      teamId: team.id,
      description: description
    };

    console.log("Creating issue...");
    const createRes = await fetch('https://api.linear.app/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': LINEAR_API_KEY
      },
      body: JSON.stringify({ query: mutation, variables })
    });

    const createData = await createRes.json();
    console.log(JSON.stringify(createData, null, 2));

  } catch (err) {
    console.error("Script failed:", err);
  }
}

createLinearIssue();
