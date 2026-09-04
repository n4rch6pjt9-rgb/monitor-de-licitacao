import { generateText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { calculateWinRate, calculateConversionRate, analyzePipelineHygiene } from '../tools/revops_tools';

const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export class RevOpsAgent {
  /**
   * Executa a análise de RevOps gerando um relatório executivo para o Gestor Comercial.
   */
  async generateStrategicBriefing(tenantId: string) {
    const tid = parseInt(tenantId, 10);
    const now = new Date();
    
    // Mês atual
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    // Coorte de 3 meses atrás (para licitações, ciclo longo)
    const cohortStart = new Date(now.getFullYear(), now.getMonth() - 3, 1);
    const cohortEnd = new Date(now.getFullYear(), now.getMonth() - 2, 0);

    // 1. Puxar as métricas brutas através das ferramentas
    const winRateData = await calculateWinRate(tid, startOfMonth, now);
    const cohortData = await calculateConversionRate(tid, cohortStart, cohortEnd);
    const hygieneData = await analyzePipelineHygiene(tid, 30); // 30 dias de SLA por padrão
    
    // 2. Acionar a IA (Strategist) para interpretar
    const prompt = `
Você é o Agente de RevOps (Revenue Operations) de uma empresa que trabalha com Licitações Públicas.
Seu trabalho não é fazer contas (o Data Analyst já fez isso), mas sim EXPLICAR "O PORQUÊ" dos números.
Foque em conectar os pontos entre Leading Indicators e Lagging Indicators e alerte sobre os riscos.

DADOS FORNECIDOS PELO DATA ANALYST ESTE MÊS:
- Win Rate (Lagging Indicator): ${winRateData.winRate} (Fechados no mês: ${winRateData.totalClosed} | Ganhos: ${winRateData.won})
- Taxa de Conversão da Coorte de 3 meses atrás (Pipeline Health): ${cohortData.conversionRate} (Vendas da Coorte: ${cohortData.wonFromCohort} / Tamanho Coorte: ${cohortData.cohortSize})
- Higiene de Pipeline (Operational Risk): Existem ${hygieneData.staleCount} negócios estagnados (sem atualização há mais de ${hygieneData.slaDays} dias). Estas são as "ervas daninhas" do CRM.

DIRETRIZES:
1. Comece resumindo o cenário com base nesses 3 indicadores.
2. Seja provocativo: Mostre as mensagens conflitantes, ex: "Win Rate está alto, mas a Conversão de Coorte diz que estamos criando pouco pipeline." ou "CRM está virando um saco de oportunidades perdidas".
3. Aja como consultor: Sugira uma ação imediata (ex: forçar a equipe a classificar os ${hygieneData.staleCount} deals antigos como LOST).

RETORNO:
Devolva apenas o briefing em formato Markdown (sem blocos de código extra).
    `.trim();

    try {
      const { text } = await generateText({
        model: google('gemini-2.5-flash'),
        system: "Você é um Agente RevOps altamente analítico. Conheça seus números, compreenda seus números.",
        prompt: prompt,
        maxTokens: 800,
        temperature: 0.4
      });

      return {
        metrics: {
          winRateData,
          cohortData,
          hygieneData
        },
        aiBriefing: text
      };
    } catch (error) {
      console.error('[RevOpsAgent Error]:', error);
      throw error;
    }
  }
}
