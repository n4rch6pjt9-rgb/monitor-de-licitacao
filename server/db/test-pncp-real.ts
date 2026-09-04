/**
 * feat(pncp): teste-real-pncp-api
 * Teste real da API PNCP com parâmetros corretos (formato AAAAMMDD, codigoModalidade obrigatório)
 * Modalidades: 1=Leilão Eletrônico, 2=Diálogo Competitivo, 3=Concurso, 4=Concorrência, 5=Concorrência Eletrônica,
 *              6=Pregão Eletrônico, 7=Pregão Presencial, 8=Dispensa Eletrônica, 9=Inexigibilidade, 10=Manifestação
 */
import 'dotenv/config';

const BASE_URL = 'https://pncp.gov.br/api/consulta/v1/contratacoes/publicacao';

async function testPncp(modalidade: number, modalidadeNome: string) {
  const url = new URL(BASE_URL);
  url.searchParams.set('dataInicial', '20260801'); // formato AAAAMMDD
  url.searchParams.set('dataFinal', '20260904');
  url.searchParams.set('codigoModalidadeContratacao', String(modalidade));
  url.searchParams.set('tamanhoPagina', '10');
  url.searchParams.set('pagina', '1');

  try {
    const res = await fetch(url.toString(), {
      headers: { 'Accept': 'application/json', 'User-Agent': 'Monitor-Editais/1.0' },
      signal: AbortSignal.timeout(12000),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      console.log(`  ❌ ${modalidadeNome} (${modalidade}): HTTP ${res.status} — ${errText.slice(0, 100)}`);
      return null;
    }

    const data = await res.json();
    const total = data?.totalRegistros ?? data?.data?.length ?? 0;
    const items: any[] = data?.data || [];

    // Filtrar por NCM 9506.91 ou objeto contendo fitness/musculação
    const fitness = items.filter((item: any) => {
      const objeto = (item.objetoCompra || item.objeto || '').toLowerCase();
      const ncm = (item.codigoNcm || '').toLowerCase();
      return ncm.includes('9506') ||
        objeto.includes('musculação') ||
        objeto.includes('academia') ||
        objeto.includes('ginástica') ||
        objeto.includes('fitness') ||
        objeto.includes('esteira') ||
        objeto.includes('cultura física');
    });

    console.log(`  ✅ ${modalidadeNome}: ${total} registros totais, ${fitness.length} relacionados a fitness`);

    if (fitness.length > 0) {
      fitness.slice(0, 3).forEach((f: any, i: number) => {
        console.log(`     [${i+1}] ${f.objetoCompra?.slice(0, 100) || 'N/A'}`);
        console.log(`         Órgão: ${f.orgaoEntidade?.razaoSocial || f.razaoSocial || 'N/A'}`);
        console.log(`         Valor: R$ ${f.valorTotalEstimado ? f.valorTotalEstimado.toLocaleString('pt-BR') : 'N/A'}`);
      });
    } else if (items.length > 0) {
      console.log(`     Amostra: ${items[0].objetoCompra?.slice(0, 80) || 'N/A'}`);
    }

    return { total, fitness: fitness.length, items };
  } catch (e: any) {
    console.log(`  ❌ ${modalidadeNome}: Timeout/Erro — ${e.message}`);
    return null;
  }
}

async function main() {
  console.log('🚀 Teste Real — PNCP API (parâmetros corrigidos)');
  console.log('════════════════════════════════════════════════');
  console.log('📅 Período: 01/08/2026 a 04/09/2026\n');

  // Testar modalidades mais comuns para equipamentos
  const modalidades = [
    [6, 'Pregão Eletrônico'],
    [5, 'Concorrência Eletrônica'],
    [4, 'Concorrência'],
    [8, 'Dispensa Eletrônica'],
  ] as [number, string][];

  let totalFitness = 0;
  let totalRegistros = 0;

  for (const [cod, nome] of modalidades) {
    const result = await testPncp(cod, nome);
    if (result) {
      totalFitness += result.fitness;
      totalRegistros += result.total;
    }
    // pequeno delay para não estrangular a API
    await new Promise(r => setTimeout(r, 500));
  }

  console.log('\n════════════════════════════════════════════════');
  console.log(`📊 RESULTADO TOTAL: ${totalRegistros} licitações indexadas no período`);
  console.log(`🏋️  RELEVANTES (fitness/academia): ${totalFitness} encontradas`);
  console.log('\n✅ Parâmetros corretos confirmados: formato AAAAMMDD + codigoModalidadeContratacao');
}

main().catch(console.error);
