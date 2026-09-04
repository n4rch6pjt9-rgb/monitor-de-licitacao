import { GoogleGenerativeAI } from '@google/generative-ai';
import { crmTools } from '../tools/tool_registry';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ 
  model: 'gemini-2.5-flash',
  tools: [{ functionDeclarations: crmTools as any }]
});

export class SDRAgent {
  private chatSession: any;

  constructor() {
    this.chatSession = model.startChat({
      systemInstruction: `Você é um Agente SDR (Sales Development Representative) especialista em licitações públicas operando dentro de um CRM B2B Autônomo.
Seu objetivo: Analisar o resumo do edital recém aprovado e decidir o próximo passo no funil de vendas.

Instruções:
1. Sempre use as ferramentas fornecidas para agir (move_stage, set_status, add_note, draft_email). NUNCA responda apenas com texto, execute uma ação no CRM.
2. Se o edital não tiver informações suficientes para qualificação, rascunhe um e-mail para o pregoeiro (draft_email) solicitando o edital completo ou esclarecimentos, e mova para "qualification" anotando o motivo (move_stage).
3. Se o objeto do edital não parecer viável (ex: valores incompatíveis, atestados que o tenant não tem), marque como LOST usando set_status e deixe o motivo explícito na nota.
4. Se for promissor, mova para "proposal" (move_stage) e deixe uma nota de recomendação estratégica para os humanos prepararem a documentação.

Respire fundo, analise os dados fornecidos pelo ambiente e invoque a ferramenta correta.`
    });
  }

  async processObservation(observation: string) {
    console.log('[SDR Agent] Thinking...');
    const result = await this.chatSession.sendMessage(observation);
    const functionCalls = result.response.functionCalls();
    
    if (functionCalls && functionCalls.length > 0) {
      return functionCalls;
    }
    
    // Fallback se não usar ferramenta
    return null;
  }
}
