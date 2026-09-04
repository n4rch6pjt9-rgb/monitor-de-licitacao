import { Router, Request, Response } from 'express';
import { db } from '../db';
import { editais, tenantConfigs } from '../db/schema';
import { eq } from 'drizzle-orm';

export const crmRouter = Router();

crmRouter.post('/sync', async (req: Request, res: Response) => {
  try {
    const { editalId, tenantId } = req.body;

    if (!editalId || !tenantId) {
      return res.status(400).json({ error: 'editalId e tenantId são obrigatórios.' });
    }

    // 1. Busca Configuração do Ploomes do Tenant
    const configResult = await db.select().from(tenantConfigs).where(eq(tenantConfigs.tenantId, tenantId));
    if (!configResult.length) {
      return res.status(404).json({ error: 'Tenant não encontrado ou sem configurações.' });
    }

    const ploomesConfig = configResult[0].ploomesConfig;
    if (!ploomesConfig || !ploomesConfig.isActive) {
      return res.status(400).json({ error: 'Integração Ploomes inativa ou não configurada para este Tenant.' });
    }

    // 2. Busca o Edital
    const editalResult = await db.select().from(editais).where(eq(editais.id, editalId));
    if (!editalResult.length) {
      return res.status(404).json({ error: 'Edital não encontrado.' });
    }

    const edital = editalResult[0];

    // Regra de Ouro: Só envia se aprovado (humanReviewStatus !== PENDING)
    // Para fins deste script, se a rota for chamada, assumimos que já validou, mas faremos a verificação:
    if (edital.humanReviewStatus !== 'APPROVED') {
      return res.status(400).json({ error: 'Regra de Ouro: Edital precisa estar aprovado (humanReviewStatus = APPROVED) para ser enviado ao CRM.' });
    }

    // 3. Monta o Payload do Ploomes (API v2)
    const PLOOMES_API_KEY = process.env.PLOOMES_KEY;
    if (!PLOOMES_API_KEY) {
      return res.status(500).json({ error: 'PLOOMES_KEY não configurada no ambiente.' });
    }

    // Preparação do Resumo IA (Obrigatório conter o disclaimer)
    const resumoIa = `Objeto: ${edital.objectDescription || 'Não informado'}
Órgão: ${edital.agency || edital.sourceName}
Data Prevista: ${new Date(edital.biddingDate).toLocaleDateString('pt-BR')}

---
Aviso: Resumo extraído via IA - Conferir Edital Original.`;

    const payload = {
      Title: `[LICITAÇÃO] - ${edital.agency || edital.sourceName} - ${edital.processNumber}`,
      Amount: edital.estimatedValue || 0,
      PipelineId: ploomesConfig.pipelineId,
      StageId: ploomesConfig.stageId,
      OtherProperties: [
        { FieldId: ploomesConfig.fieldIdLinkEdital, StringValue: edital.url || edital.rawUrl },
        { FieldId: ploomesConfig.fieldIdResumoIa, StringValue: resumoIa }
      ]
    };

    // 4. Lógica de Upsert: Verifica duplicidade via OData ($filter)
    const checkResponse = await fetch(`https://api2.ploomes.com/Deals?$filter=contains(Title, '${edital.processNumber}')`, {
      method: 'GET',
      headers: {
        'User-Key': PLOOMES_API_KEY,
        'Content-Type': 'application/json'
      }
    });

    if (!checkResponse.ok) {
      throw new Error(`Erro na API do Ploomes (GET): ${checkResponse.statusText}`);
    }

    const checkData = await checkResponse.json();
    if (checkData.value && checkData.value.length > 0) {
      // Já existe, vamos apenas retornar o que existe (no futuro poderíamos dar PATCH)
      return res.json({ 
        success: true, 
        message: 'Negócio já existe no Ploomes. Sincronização ignorada.',
        dealId: checkData.value[0].Id
      });
    }

    // 5. Criação (POST /Deals)
    const createResponse = await fetch(`https://api2.ploomes.com/Deals`, {
      method: 'POST',
      headers: {
        'User-Key': PLOOMES_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!createResponse.ok) {
      const err = await createResponse.text();
      throw new Error(`Erro na API do Ploomes (POST): ${err}`);
    }

    const dealData = await createResponse.json();
    const ploomesDealId = dealData.value[0]?.Id;

    // 6. Atualiza o banco de dados (Auditabilidade - Regra 4)
    if (ploomesDealId) {
      await db.update(editais)
        .set({ ploomesDealId })
        .where(eq(editais.id, editalId));
    }

    return res.json({
      success: true,
      message: 'Negócio criado no Ploomes com sucesso.',
      dealId: ploomesDealId
    });

  } catch (error: any) {
    console.error('Erro na integração CRM:', error);
    return res.status(500).json({ error: error.message || 'Erro interno na sincronização CRM.' });
  }
});
