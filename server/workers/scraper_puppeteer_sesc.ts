/**
 * feat(worker): sesc-sp-puppeteer-dynamic
 * Scraper avançado usando Puppeteer para o portal do SESC SP (Mural).
 * Agora é MULTI-TENANT e busca regras (Keywords/NCMs) dinâmicas do banco.
 */
import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../db/schema';
import puppeteer from 'puppeteer';
import { eq } from 'drizzle-orm';

const URL_SESC_SP_MURAL = 'https://scr360.paradigmabs.com.br/sescsp/portal/Mural.aspx';

function parseDateStr(dateStr: string): Date {
  const parts = dateStr.trim().split(' ');
  const [dia, mes, ano] = (parts[0] || '').split('/');
  const [hora, min] = (parts[1] || '00:00').split(':');
  
  if (!dia || !mes || !ano) return new Date();
  return new Date(`${ano}-${mes}-${dia}T${hora}:${min}:00-03:00`);
}

interface TenantRule {
  tenantId: number;
  keywords: string[];
  ncms: string[];
}

async function runSescPuppeteerScraper() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('❌ ERRO: DATABASE_URL não configurada.');
    process.exit(1);
  }

  const client = postgres(connectionString);
  const db = drizzle(client, { schema });

  // 1. Carrega todos os tenants e suas respectivas regras
  const tenants = await db.select().from(schema.tenants);
  if (tenants.length === 0) {
    console.error('❌ Nenhum tenant encontrado no banco.');
    process.exit(1);
  }

  const tenantRules: TenantRule[] = [];
  
  for (const tenant of tenants) {
    const ncms = await db.select().from(schema.tenantNcms)
      .where(eq(schema.tenantNcms.tenantId, tenant.id));
    const activeNcms = ncms.filter(n => n.active).map(n => n.code.trim().toLowerCase());

    const configs = await db.select().from(schema.tenantConfigs)
      .where(eq(schema.tenantConfigs.tenantId, tenant.id));
    let keywords: string[] = [];
    if (configs.length > 0 && configs[0].searchKeywords) {
      keywords = configs[0].searchKeywords.map((k: string) => k.toLowerCase().trim());
    }

    tenantRules.push({
      tenantId: tenant.id,
      keywords,
      ncms: activeNcms
    });
  }

  const sourceId = 'src-sesc-sp-01';

  console.log(`🚀 Iniciando Puppeteer Scraper SESC SP Dinâmico...`);
  console.log(`🏢 Carregadas regras para ${tenantRules.length} tenants ativos.`);
  let newInsertions = 0;

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36');
    
    console.log(`  Navegando para ${URL_SESC_SP_MURAL}...`);
    await page.goto(URL_SESC_SP_MURAL, { waitUntil: 'networkidle2', timeout: 60000 });

    console.log(`  Aguardando carregamento da tabela de dados...`);
    await page.waitForSelector('tbody tr', { timeout: 30000 });

    const rowsData = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('tbody tr'));
      return rows.map(tr => {
        const tds = tr.querySelectorAll('td');
        if (tds.length < 6) return null;
        return {
          processNumber: tds[1]?.textContent?.trim() || '',
          agency: tds[2]?.textContent?.trim() || '',
          objectDesc: tds[3]?.textContent?.trim() || '',
          modalidade: tds[4]?.textContent?.trim() || '',
          dateStr: tds[5]?.textContent?.trim() || '',
        };
      }).filter(r => r !== null);
    });

    console.log(`  Encontrados ${rowsData.length} registros na página usando Puppeteer!`);

    for (const data of rowsData) {
      if (!data) continue;

      const itemDesc = data.objectDesc.toLowerCase();
      
      for (const rule of tenantRules) {
        // SESC não mostra o NCM na listagem, portanto a verificação é essencialmente por Keyword do objeto
        const hasKeywordMatch = rule.keywords.length > 0 && rule.keywords.some(kw => itemDesc.includes(kw));
        
        // Se bater, salvar!
        if (hasKeywordMatch) {
          const uniqueId = `edital-sescsp-${data.processNumber}-${rule.tenantId}`.toLowerCase().replace(/[^a-z0-9-]/g, '-');
          const bidDate = parseDateStr(data.dateStr);

          try {
            await db.insert(schema.editais).values({
              id: uniqueId,
              tenantId: rule.tenantId, // vincula ao tenant
              sourceId,
              processNumber: data.processNumber,
              title: data.objectDesc.slice(0, 100),
              sourceName: 'SESC SP (Mural)',
              sourceCategory: 'SESC',
              ncmCode: rule.ncms[0] || 'N/A', // Assumir NCM principal do tenant ou N/A
              objectDescription: data.objectDesc,
              url: URL_SESC_SP_MURAL, 
              rawUrl: URL_SESC_SP_MURAL,
              status: 'OPEN',
              agency: `SESC SP - ${data.agency}`,
              publishedAt: new Date(), 
              biddingDate: bidDate,
              humanReviewStatus: 'PENDING',
            }).onConflictDoNothing();

            console.log(`    ✅ [TENANT ${rule.tenantId}] Match KEYWORD: Salvo ${uniqueId}`);
            newInsertions++;
          } catch (dbErr: any) {
            console.log(`    ⚠️ Erro DB: ${dbErr.message}`);
          }
        }
      }
    }
  } catch (error: any) {
    console.error(`❌ Erro no Scraper Puppeteer: ${error.message}`);
  } finally {
    await browser.close();
  }

  try {
    await db.update(schema.sources)
      .set({ 
        lastCheckedAt: new Date(), 
        totalCollected: newInsertions,
        status: 'ACTIVE'
      })
      .where(eq(schema.sources.id, sourceId));
  } catch (e) {
    // ignorar
  }

  console.log('\n════════════════════════════════════════════════');
  console.log(`🎉 Scraper Puppeteer Dinâmico finalizado! ${newInsertions} novos editais validados.`);
}

import cron from 'node-cron';

const isCron = process.env.WORKER_CRON === 'true';

if (isCron) {
  console.log('⏳ Iniciando orquestração Cron para SESC SP (Executando diariamente às 08:00)...');
  cron.schedule('0 8 * * *', async () => {
    try {
      await runSescPuppeteerScraper();
    } catch (e) {
      console.error('❌ Erro no job cron SESC SP:', e);
    }
  });
  
  runSescPuppeteerScraper().catch(console.error);
} else {
  runSescPuppeteerScraper().then(() => {
    process.exit(0);
  }).catch(e => {
    console.error(e);
    process.exit(1);
  });
}
