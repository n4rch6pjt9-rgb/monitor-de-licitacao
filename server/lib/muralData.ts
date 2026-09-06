/**
 * Mural Data Store and Golden Process 000010901-2/2026 Support
 * Task: Golden process support (Processo 000010901-2/2026 / codigo 76)
 */

import { CANONICAL_SISTEMA_S_URLS } from './sistemaSUrls.js';
import {
  CanonicalMuralProcess,
  MuralCardMVP,
  mapRawDumpToCanonical,
  toCardMVP,
} from './muralMapping.js';
import { statusCatalogRepository } from './statusCatalog.js';
import { db, isDatabaseConfigured } from '../db/index.js';
import * as schema from '../db/schema.js';
import { eq, sql } from 'drizzle-orm';

export interface MuralProcessItem {
  numero_item: number;
  descricao: string;
  marca?: string;
  quantidade: number;
  unidade: string;
  valor_unitario?: number | null;
  valor_total?: number | null;
  situacao: string;
  ranking?: {
    posicao: number;
    empresa: string;
    cnpj: string;
    valor: number;
    data_proposta?: string;
  }[];
}

export interface MuralProcessAnexo {
  id: string;
  nome: string;
  tipo: string;
  grupo: 'Processo' | 'Proposta' | 'Habilitação';
  data_publicacao: string;
  tamanho?: string;
  url_download?: string;
}

export interface MuralProcessHistorico {
  data_hora: string;
  evento: string;
  descricao?: string;
  responsavel?: string;
}

export interface MuralProcessDetail {
  resumo: {
    codigo: string;
    numero_processo: string;
    edital: string;
    modalidade: string;
    fase: string;
    situacao: string;
    unidade: string;
    unidade_compradora: string;
    email_contato?: string | null;
    inicio_propostas: string | null;
    termino_propostas: string | null;
    data_homologacao?: string | null;
    objeto: string;
    objeto_curto: string;
    valor_estimado?: number | null;
    total_homologado?: number | null;
    link_canonico: string;
    fonte: string;
    status_normalizado: {
      code: string;
      label: string;
      family: string;
      is_valid: boolean;
    };
  };
  itens: MuralProcessItem[];
  anexos: MuralProcessAnexo[];
  historico: MuralProcessHistorico[];
}

/**
 * GOLDEN PROCESS: Processo 000010901-2/2026 / Mural Código 76
 * SEST SENAT Unidade B 077 - Marabá/PA
 * Real extracted data from SEI edital, technical review despacho, and Sport Mania realigned proposal
 */
export const GOLDEN_PROCESS_76: MuralProcessDetail = {
  resumo: {
    codigo: '76',
    numero_processo: '000010901-2/2026',
    edital: 'PG 002/2026',
    modalidade: 'Pregão Eletrônico',
    fase: 'Homologação',
    situacao: 'Homologado',
    unidade: 'B 077 - SEST - MARABA/PA',
    unidade_compradora: 'B 077 - SEST - MARABA/PA',
    email_contato: 'licitacao.b077@sestsenat.org.br',
    inicio_propostas: '07/08/2026 09:30',
    termino_propostas: '14/08/2026 09:45',
    data_homologacao: '19/08/2026 08:18',
    objeto:
      'Contratação de empresa especializada no fornecimento de ACESSÓRIOS PARA EQUIPAMENTOS DE MUSCULAÇÃO destinados à estruturação do espaço físico para a prática de atividades físicas da Unidade Operacional do SEST SENAT B 077 em Marabá/PA, de acordo com as especificações deste Edital e seus Anexos.',
    objeto_curto:
      'Fornecimento de acessórios para equipamentos de musculação para o SEST SENAT Marabá/PA',
    valor_estimado: 6605.39,
    // Do not invent fake sums: reflect actual proposal payload if present
    total_homologado: null,
    link_canonico: CANONICAL_SISTEMA_S_URLS.SEST_SENAT,
    fonte: 'SEST SENAT — Portal de Compras Eletrônicas (Mural)',
    status_normalizado: {
      code: 'HOMOLOGADO',
      label: 'Homologado',
      family: 'PregaoEletronico',
      is_valid: true,
    },
  },
  itens: [
    {
      numero_item: 1,
      descricao:
        'KIT DE PUXADORES ANATÔMICOS COM 5 PEÇAS + SUPORTE. Produzido em aço carbono com revestimento emborrachado texturizado na cor preto.',
      marca: 'ANILHAS DE FERRO',
      quantidade: 1,
      unidade: 'KIT',
      valor_unitario: 1651.0,
      valor_total: 1651.0,
      situacao: 'Homologado',
      ranking: [
        {
          posicao: 1,
          empresa: 'SPORT MANIA COMÉRCIO, LOCAÇÕES E SERVIÇOS LTDA',
          cnpj: '13.721.423/0001-42',
          valor: 1651.0,
          data_proposta: '17/08/2026',
        },
      ],
    },
    {
      numero_item: 2,
      descricao:
        'TORNOZELEIRAS PARA EXERCÍCIOS DE POLIA “COM ALÇA” NA SOLA. Fabricado em nylon e/ou Polipropileno com acolchoamento e ferragens metálicas.',
      marca: 'ANILHAS DE FERRO',
      quantidade: 8,
      unidade: 'UNID.',
      valor_unitario: 83.0,
      valor_total: 664.0,
      situacao: 'Homologado',
      ranking: [
        {
          posicao: 1,
          empresa: 'SPORT MANIA COMÉRCIO, LOCAÇÕES E SERVIÇOS LTDA',
          cnpj: '13.721.423/0001-42',
          valor: 664.0,
          data_proposta: '17/08/2026',
        },
      ],
    },
    {
      numero_item: 3,
      descricao:
        'TORNOZELEIRAS PARA EXERCÍCIOS DE POLIA “SEM ALÇA”. Fabricado em nylon e/ou Polipropileno com acolchoamento e ferragens metálicas.',
      marca: 'XDFITNES',
      quantidade: 8,
      unidade: 'UNID.',
      valor_unitario: 64.0,
      valor_total: 212.0,
      situacao: 'Homologado',
      ranking: [
        {
          posicao: 1,
          empresa: 'SPORT MANIA COMÉRCIO, LOCAÇÕES E SERVIÇOS LTDA',
          cnpj: '13.721.423/0001-42',
          valor: 212.0,
          data_proposta: '17/08/2026',
        },
      ],
    },
    {
      numero_item: 4,
      descricao:
        'PUXADOR CORDA PARA TRÍCEPS. Confeccionada em polietileno ou nylon premium trançada com anel de metal para engate.',
      marca: 'SCALIBU',
      quantidade: 2,
      unidade: 'UNID.',
      valor_unitario: 112.0,
      valor_total: 224.0,
      situacao: 'Homologado',
      ranking: [
        {
          posicao: 1,
          empresa: 'SPORT MANIA COMÉRCIO, LOCAÇÕES E SERVIÇOS LTDA',
          cnpj: '13.721.423/0001-42',
          valor: 224.0,
          data_proposta: '17/08/2026',
        },
      ],
    },
    {
      numero_item: 5,
      descricao:
        'PUXADOR TRIÂNGULO PARA REMADA COM PEGADA EMBORRACHADA. Fabricado em aço maciço cromado com solda MIG ultra resistente.',
      marca: 'ANILHAS DE FERRO',
      quantidade: 2,
      unidade: 'UNID.',
      valor_unitario: 190.0,
      valor_total: 380.0,
      situacao: 'Homologado',
      ranking: [
        {
          posicao: 1,
          empresa: 'SPORT MANIA COMÉRCIO, LOCAÇÕES E SERVIÇOS LTDA',
          cnpj: '13.721.423/0001-42',
          valor: 380.0,
          data_proposta: '17/08/2026',
        },
      ],
    },
    {
      numero_item: 6,
      descricao:
        'PUXADOR REMADA NEUTRA PULLEY TIPO D. Fabricado em aço cromado com solda MIG ultra resistente, manopla com giro total em PVC.',
      marca: 'ANILHAS DE FERRO',
      quantidade: 2,
      unidade: 'UNID.',
      valor_unitario: 271.0,
      valor_total: 542.0,
      situacao: 'Homologado',
      ranking: [
        {
          posicao: 1,
          empresa: 'SPORT MANIA COMÉRCIO, LOCAÇÕES E SERVIÇOS LTDA',
          cnpj: '13.721.423/0001-42',
          valor: 542.0,
          data_proposta: '17/08/2026',
        },
      ],
    },
    {
      numero_item: 7,
      descricao:
        'PUXADOR PULLEY TRICEPS PARA CROSSOVER COM GIRO - BARRA RETA CURTA. Tubo oco de aço 1020, manopla emborrachada.',
      marca: 'ANILHAS DE FERRO',
      quantidade: 2,
      unidade: 'UNID.',
      valor_unitario: 151.0,
      valor_total: 302.0,
      situacao: 'Homologado',
      ranking: [
        {
          posicao: 1,
          empresa: 'SPORT MANIA COMÉRCIO, LOCAÇÕES E SERVIÇOS LTDA',
          cnpj: '13.721.423/0001-42',
          valor: 302.0,
          data_proposta: '17/08/2026',
        },
      ],
    },
    {
      numero_item: 8,
      descricao:
        'PUXADOR PULLEY TRICEPS PARA CROSSOVER COM GIRO - BARRA RETA LONGA. Comprimento 1,0 metro, manopla emborrachada.',
      marca: 'ANILHAS DE FERRO',
      quantidade: 2,
      unidade: 'UNID.',
      valor_unitario: 211.0,
      valor_total: 422.0,
      situacao: 'Homologado',
      ranking: [
        {
          posicao: 1,
          empresa: 'SPORT MANIA COMÉRCIO, LOCAÇÕES E SERVIÇOS LTDA',
          cnpj: '13.721.423/0001-42',
          valor: 422.0,
          data_proposta: '17/08/2026',
        },
      ],
    },
    {
      numero_item: 9,
      descricao:
        'PUXADOR BARRA W COM GIRO. Tubo oco de aço 1020 com giro central e solda MIG reforçada.',
      marca: 'ANILHAS DE FERRO',
      quantidade: 2,
      unidade: 'UNID.',
      valor_unitario: 234.5,
      valor_total: 469.0,
      situacao: 'Homologado',
      ranking: [
        {
          posicao: 1,
          empresa: 'SPORT MANIA COMÉRCIO, LOCAÇÕES E SERVIÇOS LTDA',
          cnpj: '13.721.423/0001-42',
          valor: 469.0,
          data_proposta: '17/08/2026',
        },
      ],
    },
    {
      numero_item: 10,
      descricao:
        'PUXADOR BARRA PULLEY COSTAS CURVO. Tubo oco de aço 1020 com giro central, comprimento 120 cm.',
      marca: 'ANILHAS DE FERRO',
      quantidade: 2,
      unidade: 'UNID.',
      valor_unitario: 217.5,
      valor_total: 435.0,
      situacao: 'Homologado',
      ranking: [
        {
          posicao: 1,
          empresa: 'SPORT MANIA COMÉRCIO, LOCAÇÕES E SERVIÇOS LTDA',
          cnpj: '13.721.423/0001-42',
          valor: 435.0,
          data_proposta: '17/08/2026',
        },
      ],
    },
    {
      numero_item: 11,
      descricao:
        'PAR DE PUXADOR ESTRIBO FECHADO. Produzido em aço maciço, cromado, pegada recartilhada giratória de 360°.',
      marca: 'ANILHAS DE FERRO',
      quantidade: 3,
      unidade: 'PAR',
      valor_unitario: 182.0,
      valor_total: 546.0,
      situacao: 'Homologado',
      ranking: [
        {
          posicao: 1,
          empresa: 'SPORT MANIA COMÉRCIO, LOCAÇÕES E SERVIÇOS LTDA',
          cnpj: '13.721.423/0001-42',
          valor: 546.0,
          data_proposta: '17/08/2026',
        },
      ],
    },
    {
      numero_item: 12,
      descricao:
        'MOSQUETÃO 8 x 80mm. Fabricado em aço carbono galvanizado, suporta até 230 kg.',
      marca: 'GRS CABOS',
      quantidade: 20,
      unidade: 'UNID.',
      valor_unitario: 22.0,
      valor_total: 440.0,
      situacao: 'Homologado',
      ranking: [
        {
          posicao: 1,
          empresa: 'SPORT MANIA COMÉRCIO, LOCAÇÕES E SERVIÇOS LTDA',
          cnpj: '13.721.423/0001-42',
          valor: 440.0,
          data_proposta: '17/08/2026',
        },
      ],
    },
  ],
  anexos: [
    {
      id: 'anx-0739773',
      nome: 'Edital de Licitação PG 002/2026 - Acessórios para Equipamentos de Musculação',
      tipo: 'PDF',
      grupo: 'Processo',
      data_publicacao: '07/08/2026',
      tamanho: '1.24 MB',
      url_download: 'https://compras.sestsenat.org.br/portal/Mural.aspx',
    },
    {
      id: 'anx-0757338',
      nome: 'Despacho - Resposta da Análise Técnica I (0757338)',
      tipo: 'PDF',
      grupo: 'Processo',
      data_publicacao: '14/08/2026',
      tamanho: '48.1 KB',
      url_download: 'https://compras.sestsenat.org.br/portal/Mural.aspx',
    },
    {
      id: 'anx-prop-realinhada',
      nome: 'PROPOSTA_COMERCIAL_REALINHADA_2.pdf',
      tipo: 'PDF',
      grupo: 'Proposta',
      data_publicacao: '17/08/2026',
      tamanho: '614 KB',
      url_download: 'https://compras.sestsenat.org.br/portal/Mural.aspx',
    },
    {
      id: 'anx-hab-01',
      nome: 'HABILITAÇÃO.rar',
      tipo: 'RAR',
      grupo: 'Habilitação',
      data_publicacao: '14/08/2026',
      tamanho: '15.3 MB',
      url_download: 'https://compras.sestsenat.org.br/portal/Mural.aspx',
    },
    {
      id: 'anx-hab-02',
      nome: 'ANEXO A, FOLDERS E DECLARAÇÃO DE AUSENCIA DE IMPEDIMENTOS.rar',
      tipo: 'RAR',
      grupo: 'Habilitação',
      data_publicacao: '14/08/2026',
      tamanho: '1.46 MB',
      url_download: 'https://compras.sestsenat.org.br/portal/Mural.aspx',
    },
  ],
  historico: [
    {
      data_hora: '19/08/2026 08:18',
      evento: 'Homologação do Processo',
      descricao: 'Processo licitatório homologado pela autoridade competente.',
      responsavel: 'SEST SENAT - Unidade B 077',
    },
    {
      data_hora: '17/08/2026 14:00',
      evento: 'Recebimento de Proposta Realinhada',
      descricao: 'Sport Mania Comércio apresentou proposta comercial realinhada.',
      responsavel: 'Comissão de Licitação',
    },
    {
      data_hora: '14/08/2026 15:32',
      evento: 'Despacho de Análise Técnica I',
      descricao: 'Análise de documentos técnicos favorável para os 12 itens.',
      responsavel: 'Adriele de Castro Almeida (Fisioterapeuta / Coordenadora)',
    },
    {
      data_hora: '14/08/2026 10:00',
      evento: 'Abertura da Sessão Pública',
      descricao: 'Início da sessão pública e disputa aberta de lances.',
      responsavel: 'Pregoeiro(a) / Equipe de Apoio',
    },
    {
      data_hora: '14/08/2026 09:45',
      evento: 'Término do Envio de Propostas',
      descricao: 'Encerramento do prazo para recebimento de propostas iniciais.',
      responsavel: 'Sistema Eletrônico',
    },
    {
      data_hora: '07/08/2026 09:30',
      evento: 'Publicação do Edital e Início das Propostas',
      descricao: 'Edital PG 002/2026 publicado no portal Mural.aspx.',
      responsavel: 'SEST SENAT - CRN II',
    },
  ],
};

/**
 * Collection of active Mural processes seeded with canonical mapping
 */
const MURAL_PROCESSES_STORE: Map<string, MuralProcessDetail> = new Map();
MURAL_PROCESSES_STORE.set('76', GOLDEN_PROCESS_76);
MURAL_PROCESSES_STORE.set('000010901-2/2026', GOLDEN_PROCESS_76);

// Additional sample processes with canonical URLs for SESC DN and SEST/SENAT
const SESC_DN_PROCESS_188: MuralProcessDetail = {
  resumo: {
    codigo: '188',
    numero_processo: 'PE 2026012000042',
    edital: 'PE 042/2026',
    modalidade: 'Pregão Eletrônico',
    fase: 'Em proposta',
    situacao: 'Em proposta',
    unidade: 'SESC - Departamento Nacional',
    unidade_compradora: 'SESC - Departamento Nacional',
    email_contato: 'licitacoes@sesc.com.br',
    inicio_propostas: '20/08/2026 10:00',
    termino_propostas: '10/09/2026 14:00',
    data_homologacao: null,
    objeto:
      'Aquisição de esteiras ergométricas profissionais e estações multifuncionais para modernização dos centros de cultura física do SESC.',
    objeto_curto:
      'Esteiras ergométricas e estações multifuncionais para o SESC Departamento Nacional',
    valor_estimado: 1850000.0,
    total_homologado: null,
    link_canonico: CANONICAL_SISTEMA_S_URLS.SESC_DN,
    fonte: 'SESC Departamento Nacional — Portal de Compras (Mural)',
    status_normalizado: {
      code: 'EM_PROPOSTA',
      label: 'Em proposta',
      family: 'PregaoEletronico',
      is_valid: true,
    },
  },
  itens: [], // Honest empty: no fake OCR or fake NCM items invented
  anexos: [
    {
      id: 'anx-sesc-042',
      nome: 'Edital de Pregão Eletrônico PE 042/2026 - Cultura Física',
      tipo: 'PDF',
      grupo: 'Processo',
      data_publicacao: '20/08/2026',
      tamanho: '2.4 MB',
      url_download: CANONICAL_SISTEMA_S_URLS.SESC_DN,
    },
  ],
  historico: [
    {
      data_hora: '20/08/2026 10:00',
      evento: 'Publicação do Edital',
      descricao: 'Edital publicado no portal Mural.aspx do SESC DN.',
      responsavel: 'SESC DN',
    },
  ],
};
// Scoped In-Memory Stores by Tenant
const MURAL_PROCESSES_STORE_BY_TENANT: Map<number, Map<string, MuralProcessDetail>> = new Map();

export function getTenantMuralStore(tenantId: number = 1): Map<string, MuralProcessDetail> {
  let store = MURAL_PROCESSES_STORE_BY_TENANT.get(tenantId);
  if (!store) {
    store = new Map<string, MuralProcessDetail>();
    // Default tenant 1 is pre-seeded with golden process 76 and SESC DN 188
    if (tenantId === 1) {
      store.set('76', GOLDEN_PROCESS_76);
      store.set('000010901-2/2026', GOLDEN_PROCESS_76);
      store.set('188', SESC_DN_PROCESS_188);
      store.set('PE 2026012000042', SESC_DN_PROCESS_188);
    }
    MURAL_PROCESSES_STORE_BY_TENANT.set(tenantId, store);
  }
  return store;
}

export async function getMuralProcessDetail(
  identifier: string,
  tenantId: number = 1
): Promise<MuralProcessDetail | null> {
  if (!identifier) return null;
  const clean = identifier.trim();

  // If DB is configured, query muralProcesses for this tenant
  if (isDatabaseConfigured) {
    try {
      const [row] = await db
        .select()
        .from(schema.muralProcesses)
        .where(
          sql`${schema.muralProcesses.tenantId} = ${tenantId} AND (${schema.muralProcesses.codigo} = ${clean} OR ${schema.muralProcesses.numeroProcesso} = ${clean})`
        );
      if (row) {
        return {
          resumo: row.resumo,
          itens: (row.itens as any[]) || [],
          anexos: (row.anexos as any[]) || [],
          historico: (row.historico as any[]) || [],
        };
      }
    } catch {
      // Fallback
    }
  }

  const store = getTenantMuralStore(tenantId);
  const direct = store.get(clean);
  if (direct) {
    return direct;
  }

  // Lookup by codigo or numero_processo within this tenant's store
  for (const item of store.values()) {
    if (
      item.resumo.codigo === clean ||
      item.resumo.numero_processo.toLowerCase() === clean.toLowerCase()
    ) {
      return item;
    }
  }

  return null;
}

export async function listMuralCards(
  tenantIdOrFilters?: number | { family?: string; status?: string; search?: string },
  maybeFilters?: { family?: string; status?: string; search?: string }
): Promise<MuralCardMVP[]> {
  let tenantId = 1;
  let filters: { family?: string; status?: string; search?: string } | undefined;
  if (typeof tenantIdOrFilters === 'number') {
    tenantId = tenantIdOrFilters;
    filters = maybeFilters;
  } else if (tenantIdOrFilters && typeof tenantIdOrFilters === 'object') {
    filters = tenantIdOrFilters;
    tenantId = 1;
  }
  const cards: MuralCardMVP[] = [];
  const seenCodes = new Set<string>();

  // If DB is configured, query muralProcesses for this tenant
  if (isDatabaseConfigured) {
    try {
      const rows = await db
        .select()
        .from(schema.muralProcesses)
        .where(eq(schema.muralProcesses.tenantId, tenantId));
      if (rows && rows.length > 0) {
        for (const row of rows) {
          if (seenCodes.has(row.codigo)) continue;
          seenCodes.add(row.codigo);

          const canonical: CanonicalMuralProcess = {
            codigo: row.codigo,
            numero_processo: row.numeroProcesso,
            unidade_compradora: row.unidadeCompradora || '—',
            objeto: row.objeto || '—',
            modalidade: row.modalidade || '—',
            inicio_propostas: row.resumo?.inicio_propostas || null,
            termino_propostas: row.resumo?.termino_propostas || null,
            inicio_inscricoes: null,
            status_bruto: row.resumo?.situacao || null,
            status_normalizado: row.statusNormalizado,
            link_canonico: row.linkCanonico || '',
            fonte: row.fonte || '',
          };

          cards.push(toCardMVP(canonical, row.statusNormalizado));
        }
        return cards;
      }
    } catch {
      // Fallback to memory
    }
  }

  const store = getTenantMuralStore(tenantId);
  for (const item of store.values()) {
    if (seenCodes.has(item.resumo.codigo)) {
      continue;
    }
    seenCodes.add(item.resumo.codigo);

    // Apply filters
    if (filters?.family && item.resumo.status_normalizado.family !== filters.family) {
      continue;
    }
    if (
      filters?.status &&
      item.resumo.status_normalizado.code.toLowerCase() !== filters.status.toLowerCase() &&
      item.resumo.status_normalizado.label.toLowerCase() !== filters.status.toLowerCase()
    ) {
      continue;
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      const matched =
        item.resumo.codigo.toLowerCase().includes(q) ||
        item.resumo.numero_processo.toLowerCase().includes(q) ||
        item.resumo.unidade.toLowerCase().includes(q) ||
        item.resumo.objeto.toLowerCase().includes(q);
      if (!matched) {
        continue;
      }
    }

    const canonical: CanonicalMuralProcess = {
      codigo: item.resumo.codigo,
      numero_processo: item.resumo.numero_processo,
      unidade_compradora: item.resumo.unidade_compradora,
      objeto: item.resumo.objeto,
      modalidade: item.resumo.modalidade,
      inicio_propostas: item.resumo.inicio_propostas,
      termino_propostas: item.resumo.termino_propostas,
      inicio_inscricoes: null,
      status_bruto: item.resumo.situacao,
      status_normalizado: item.resumo.status_normalizado,
      link_canonico: item.resumo.link_canonico,
      fonte: item.resumo.fonte,
    };

    cards.push(toCardMVP(canonical, item.resumo.status_normalizado));
  }

  return cards;
}

/**
 * Register a new process into the mural store after mapping and status validation for this tenant
 */
export async function registerMuralProcess(
  rawRow: Record<string, any>,
  family: string = 'PregaoEletronico',
  tenantId: number = 1
): Promise<{ card: MuralCardMVP; detail: MuralProcessDetail }> {
  const canonical = mapRawDumpToCanonical(rawRow);

  // Validate status fail-closed for this tenant
  const statusToValidate = canonical.status_bruto || 'AGENDADO_PUBLICADO';
  const validation = await statusCatalogRepository.validateStatusOnWrite(
    family,
    statusToValidate,
    tenantId
  );
  if (!validation.valid) {
    throw new Error(
      `Falha de validação de status: ${validation.error || 'Status não catalogado'}`
    );
  }

  const status_normalizado = {
    code: validation.status!.code,
    label: validation.status!.label,
    family: validation.status!.family,
    is_valid: true,
  };

  const detail: MuralProcessDetail = {
    resumo: {
      codigo: canonical.codigo,
      numero_processo: canonical.numero_processo,
      edital: canonical.modalidade,
      modalidade: canonical.modalidade,
      fase: validation.status!.label,
      situacao: validation.status!.label,
      unidade: canonical.unidade_compradora,
      unidade_compradora: canonical.unidade_compradora,
      email_contato: null,
      inicio_propostas: canonical.inicio_propostas,
      termino_propostas: canonical.termino_propostas,
      data_homologacao: null,
      objeto: canonical.objeto,
      objeto_curto: toCardMVP(canonical, status_normalizado).objeto_curto,
      valor_estimado: null,
      total_homologado: null,
      link_canonico: canonical.link_canonico,
      fonte: canonical.fonte || 'Paradigma Mural',
      status_normalizado,
    },
    itens: [],
    anexos: [],
    historico: [],
  };

  // DB insert if configured
  if (isDatabaseConfigured) {
    try {
      await db
        .insert(schema.muralProcesses)
        .values({
          id: `mural-${tenantId}-${canonical.codigo}`,
          tenantId,
          codigo: canonical.codigo,
          numeroProcesso: canonical.numero_processo,
          unidadeCompradora: canonical.unidade_compradora,
          objeto: canonical.objeto,
          modalidade: canonical.modalidade,
          statusNormalizado: status_normalizado,
          linkCanonico: canonical.link_canonico,
          fonte: canonical.fonte || 'Paradigma Mural',
          resumo: detail.resumo,
          itens: detail.itens,
          anexos: detail.anexos,
          historico: detail.historico,
        });
    } catch {
      // Fallback
    }
  }

  const store = getTenantMuralStore(tenantId);
  store.set(canonical.codigo, detail);
  if (canonical.numero_processo && canonical.numero_processo !== '—') {
    store.set(canonical.numero_processo, detail);
  }

  const card = toCardMVP(canonical, status_normalizado);
  return { card, detail };
}
