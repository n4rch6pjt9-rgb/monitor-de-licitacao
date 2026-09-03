import React, { useState } from 'react';
import { 
  Scale, 
  Search, 
  Filter, 
  AlertTriangle, 
  CheckCircle2, 
  HelpCircle, 
  ExternalLink, 
  Sparkles, 
  FileText, 
  ShieldAlert,
  ChevronRight,
  BookOpen,
  ArrowUpRight
} from 'lucide-react';
import { Edital, Finding, FindingType, ConfidenceFlag } from '../types';

interface FindingsViewProps {
  editais: Edital[];
  onSelectEdital: (edital: Edital) => void;
  onNavigateToReview: (edital: Edital) => void;
  onNavigateToTechSpecAI?: (clauseText: string, edital?: Edital) => void;
}

export const FindingsView: React.FC<FindingsViewProps> = ({
  editais,
  onSelectEdital,
  onNavigateToReview,
  onNavigateToTechSpecAI
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedConfidence, setSelectedConfidence] = useState<string>('ALL');

  // Flatten all findings across editais with parent edital info
  const allFindings = editais.flatMap(edital =>
    edital.findings.map(finding => ({
      ...finding,
      editalTitle: edital.title,
      editalProcess: edital.processNumber,
      sourceName: edital.sourceName,
      sourceCategory: edital.sourceCategory,
      uf: edital.uf,
      parentEdital: edital
    }))
  );

  const filteredFindings = allFindings.filter(f => {
    const matchesSearch =
      f.snippet.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.legalBasis.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.explanation.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.editalTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.editalProcess.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = selectedType === 'ALL' || f.findingType === selectedType;
    const matchesConf = selectedConfidence === 'ALL' || f.confidence === selectedConfidence;

    return matchesSearch && matchesType && matchesConf;
  });

  const getConfidenceBadge = (confidence: ConfidenceFlag) => {
    switch (confidence) {
      case 'ALTA':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'MEDIA':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'INCONCLUSIVA':
        return 'bg-rose-100 text-rose-800 border-rose-200';
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Scale className="w-4 h-4 text-blue-600" />
            <span>Achados Jurídicos & Evidências Vinculadas</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Mapeamento de exigências restritivas, prazos, marcas e conformidade com a Lei 14.133/21 e Regulamento do Sistema S
          </p>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-white border border-slate-200 rounded-lg p-3 flex flex-col md:flex-row gap-2.5 items-stretch md:items-center justify-between shadow-xs">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Pesquisar por trecho editalício, norma jurídica, edital..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded px-3 pl-8 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedType}
            onChange={e => setSelectedType(e.target.value)}
            className="bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">Todos os Tipos de Achados</option>
            <option value="EXIGENCIA_RESTRITIVA">Exigência Restritiva</option>
            <option value="MARCA_ESPECIFICA">Marca Específica / Direcionamento</option>
            <option value="PRAZO_EXIGUO">Prazo Exíguo</option>
            <option value="GARANTIA_EXCESSIVA">Garantia Excessiva</option>
            <option value="QUALIFICACAO_TECNICA">Qualificação Técnica</option>
            <option value="CERTIFICACAO_INMETRO">Certificação / Laudo</option>
          </select>

          <select
            value={selectedConfidence}
            onChange={e => setSelectedConfidence(e.target.value)}
            className="bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">Todas as Confianças</option>
            <option value="ALTA">Alta Confiança</option>
            <option value="MEDIA">Média Confiança</option>
            <option value="INCONCLUSIVA">Inconclusiva (Revisão Obrigatória)</option>
          </select>
        </div>
      </div>

      {/* Findings Cards List */}
      <div className="space-y-3">
        {filteredFindings.map(finding => {
          return (
            <div
              key={finding.id}
              className="bg-white border border-slate-200 hover:border-slate-300 rounded-lg p-3.5 transition-all shadow-xs space-y-2.5"
            >
              {/* Top Meta */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 border border-slate-200">
                    Página {finding.page}
                  </span>
                  <span className="text-[10.5px] font-bold px-1.5 py-0.2 rounded bg-blue-100 text-blue-700 border border-blue-200">
                    {finding.findingType.replace(/_/g, ' ')}
                  </span>
                  {finding.impactRisk && (
                    <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold border ${
                      finding.impactRisk === 'ALTO'
                        ? 'bg-rose-100 text-rose-800 border-rose-300'
                        : finding.impactRisk === 'MEDIO'
                        ? 'bg-amber-100 text-amber-800 border-amber-300'
                        : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                    }`}>
                      Risco: {finding.impactRisk}
                    </span>
                  )}
                  <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold border ${getConfidenceBadge(finding.confidence)}`}>
                    Confiança: {finding.confidence}
                  </span>
                  {finding.status === 'CORRIGIDO' && (
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-green-100 text-green-800 border border-green-200">
                      ✓ Corrigido em Retificação
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-500">
                    Edital: <strong className="text-slate-800">{finding.editalProcess}</strong> ({finding.sourceName})
                  </span>
                </div>
              </div>

              {/* Exact Evidence Snippet */}
              <div>
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Trecho Exato do Documento (Evidência Vinculada):
                </div>
                <div className="p-2.5 rounded bg-amber-50/80 border border-amber-200 font-mono text-xs text-amber-900 leading-relaxed">
                  "{finding.snippet}"
                </div>
              </div>

              {/* Legal Basis & Explanation */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs pt-0.5">
                <div className="p-2.5 rounded bg-slate-50 border border-slate-200">
                  <div className="text-slate-500 text-[10px] font-bold uppercase flex items-center gap-1 mb-1">
                    <BookOpen className="w-3 h-3 text-blue-600" />
                    <span>Fundamentação Jurídica:</span>
                  </div>
                  <div className="text-slate-800 font-medium">
                    {finding.legalBasis}
                  </div>
                </div>

                <div className="p-2.5 rounded bg-slate-50 border border-slate-200">
                  <div className="text-slate-500 text-[10px] font-bold uppercase flex items-center gap-1 mb-1">
                    <AlertTriangle className="w-3 h-3 text-amber-600" />
                    <span>Explicação do Achado:</span>
                  </div>
                  <div className="text-slate-700 leading-relaxed">
                    {finding.explanation}
                  </div>
                </div>
              </div>

              {/* Human Decision Footer */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
                <div className="flex items-center gap-2 text-slate-500">
                  <span className="text-[11px]">Decisão Humana:</span>
                  <span className={`font-bold px-1.5 py-0.2 rounded text-[10.5px] ${
                    finding.humanDecision === 'APROVADO'
                      ? 'bg-green-100 text-green-800 border border-green-200'
                      : finding.humanDecision === 'REJEITADO'
                      ? 'bg-rose-100 text-rose-800 border border-rose-200'
                      : 'bg-amber-100 text-amber-800 border border-amber-200'
                  }`}>
                    {finding.humanDecision === 'PENDING' ? '⏳ Aguardando Revisão' : finding.humanDecision}
                  </span>
                  {finding.reviewerComment && (
                    <span className="text-[11px] text-slate-500 italic">
                      — "{finding.reviewerComment}"
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  {onNavigateToTechSpecAI && (
                    <button
                      onClick={() => onNavigateToTechSpecAI(finding.snippet, finding.parentEdital)}
                      className="px-2.5 py-1 text-xs font-semibold rounded bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 flex items-center gap-1 cursor-pointer transition-colors"
                      title="Pesquisar fornecedores e produtos equivalentes no mercado via IA"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                      <span>Pesquisar Produtos (IA)</span>
                    </button>
                  )}

                  <button
                    onClick={() => onSelectEdital(finding.parentEdital)}
                    className="px-2.5 py-1 text-xs font-semibold rounded bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1 cursor-pointer"
                  >
                    <span>Ver Edital Completo</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => onNavigateToReview(finding.parentEdital)}
                    className="px-2.5 py-1 text-xs font-bold rounded bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-1 cursor-pointer shadow-xs"
                  >
                    <span>Revisar Achado</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {filteredFindings.length === 0 && (
          <div className="p-8 text-center text-slate-400 text-xs bg-white rounded-lg border border-slate-200">
            Nenhum achado encontrado para os filtros selecionados.
          </div>
        )}
      </div>
    </div>
  );
};
