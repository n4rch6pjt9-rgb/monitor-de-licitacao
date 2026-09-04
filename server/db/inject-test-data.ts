import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../db/schema';
import crypto from 'crypto';

async function injectRealisticTest() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('❌ ERRO: DATABASE_URL não configurada.');
    process.exit(1);
  }

  const client = postgres(connectionString);
  const db = drizzle(client, { schema });

  const tenants = await db.select().from(schema.tenants);
  const tenantId = tenants[0].id;

  const editaisTest = [
    {
      id: `edital-test-pncp-${crypto.randomBytes(4).toString('hex')}`,
      tenantId,
      sourceId: 'src-pncp-api-01',
      processNumber: 'PE 1234/2026',
      title: 'Aquisição de Aparelhos de Musculação',
      sourceName: 'PNCP (Portal Nacional)',
      sourceCategory: 'Federal',
      ncmCode: '9506.91',
      objectDescription: 'Pregão Eletrônico para aquisição de equipamentos de academia (esteiras, bicicletas ergométricas e estações de musculação) para atendimento aos projetos sociais do município.',
      url: 'https://pncp.gov.br/app/editais/1234',
      rawUrl: 'https://pncp.gov.br/app/editais/1234',
      status: 'OPEN',
      agency: 'Prefeitura Municipal de Teste',
      estimatedValue: '350000.00',
      publishedAt: new Date(new Date().setDate(new Date().getDate() - 1)), // 1 dia atrás
      biddingDate: new Date(new Date().setDate(new Date().getDate() + 10)), // Daqui a 10 dias
      humanReviewStatus: 'PENDING',
    },
    {
      id: `edital-test-sescsp-${crypto.randomBytes(4).toString('hex')}`,
      tenantId,
      sourceId: 'src-sesc-sp-01',
      processNumber: 'PE 2026012000450',
      title: 'Renovação do Parque de Ginástica - Unidade Pinheiros',
      sourceName: 'SESC SP (Mural)',
      sourceCategory: 'SESC',
      ncmCode: '9506.91',
      objectDescription: 'Fornecimento e instalação de halteres, anilhas e acessórios esportivos para a unidade SESC Pinheiros.',
      url: 'https://scr360.paradigmabs.com.br/sescsp/portal/Mural.aspx',
      rawUrl: 'https://scr360.paradigmabs.com.br/sescsp/portal/Mural.aspx',
      status: 'OPEN',
      agency: 'SESC SP - ADMINISTRAÇÃO CENTRAL',
      estimatedValue: '120500.00',
      publishedAt: new Date(new Date().setDate(new Date().getDate() - 2)),
      biddingDate: new Date(new Date().setDate(new Date().getDate() + 8)),
      humanReviewStatus: 'PENDING',
    },
    {
      id: `edital-test-sest-${crypto.randomBytes(4).toString('hex')}`,
      tenantId,
      sourceId: 'src-sest-senat-compras-01',
      processNumber: 'Dispensa 045/2026',
      title: 'Equipamentos de Fisioterapia e Cultura Física',
      sourceName: 'SEST SENAT - Compras',
      sourceCategory: 'Sistema S',
      ncmCode: '9506.91',
      objectDescription: 'Aquisição de aparelhos de ginástica e equipamentos de fisioterapia para recuperação motora de trabalhadores do transporte.',
      url: 'https://compras.sestsenat.org.br/licitacao/123',
      rawUrl: 'https://compras.sestsenat.org.br',
      status: 'OPEN',
      agency: 'SEST SENAT - Conselho Regional',
      estimatedValue: '85000.00',
      publishedAt: new Date(),
      biddingDate: new Date(new Date().setDate(new Date().getDate() + 15)),
      humanReviewStatus: 'PENDING',
    }
  ];

  console.log('💉 Injetando registros realistas no banco...');
  for (const edital of editaisTest) {
    await db.insert(schema.editais).values(edital).onConflictDoNothing();
    console.log(` ✅ Inserido: ${edital.title}`);
  }

  await client.end();
  console.log('✅ Finalizado. Verifique a UI.');
}

injectRealisticTest().catch(console.error);
