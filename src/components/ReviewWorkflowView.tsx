import React, { useState } from 'react';
import { 
  UserCheck, 
  ShieldCheck, 
  CheckCircle2, 
  XCircle, 
  HelpCircle, 
  Save, 
  Download, 
  AlertTriangle, 
  FileText, 
  MessageSquare,
  Sparkles,
  Lock,
  Unlock,
  Check
} from 'lucide-react';
import { Edital, Finding, HumanDecision, ReviewStatus } from '../types';
import { generateEditalPDFReport } from '../utils/pdfGenerator';

interface ReviewWorkflowViewProps {
  editais: Edital[];
  selectedEditalForReview: Edital | null;
  onSelectEditalForReview: (edital: Edital | null) => void;
  onSubmitReview: (
    editalId: string,
    payload: {
      humanReviewStatus: ReviewStatus;
      reviewedBy: string;
      reviewNotes: string;
      findingsDecisions: { findingId: string; decision: HumanDecision; comment?: string }[];
      publishedInternally: boolean;
    }
  ) => Promise<void>;
  onSendWhatsApp: (editalId: string) => Promise<any>;
}

export const ReviewWorkflowView: React.FC<ReviewWorkflowViewProps> = ({
  editais,
  selectedEditalForReview,
  onSelectEditalForReview,
  onSubmitReview,
  onSendWhatsApp
}) => {
  const pendingEditais = editais.filter(e => e.humanReviewStatus === 'PENDING');
  const reviewedEditais = editais.filter(e => e.humanReviewStatus !== 'PENDING');

  const currentEdital = selectedEditalForReview || pendingEditais[0] || editais[0];

  // Reviewer Form State
  const [reviewerName, setReviewerName] = useState('Dra. Camila Vargas (OAB/RS 88.412)');
  const [overallStatus, setOverallStatus] = useState<ReviewStatus>('APPROVED');
  const [overallNotes, setOverallNotes] = useState('Edital analisado e aprovado em conformidade com as regras de contratação de artigos de cultura física.');
  const [confirmedGoldenRule, setConfirmedGoldenRule] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [findingsDecisions, setFindingsDecisions] = useState<{ [findingId: string]: { decision: HumanDecision; comment: string } }>({});

  // Initialize decisions when currentEdital changes
  React.useEffect(() => {
    if (currentEdital) {
      const initialMap: { [findingId: string]: { decision: HumanDecision; comment: string } } = {};
      currentEdital.findings.forEach(f => {
        initialMap[f.id] = {
          decision: f.humanDecision !== 'PENDING' ? f.humanDecision : 'APROVADO',
          comment: f.reviewerComment || ''
        };
      });
      setFindingsDecisions(initialMap);
      setOverallStatus(currentEdital.humanReviewStatus !== 'PENDING' ? currentEdital.humanReviewStatus : 'APPROVED');
      setOverallNotes(currentEdital.reviewNotes || 'Revisão humana concluída.');
      setConfirmedGoldenRule(currentEdital.humanReviewStatus !== 'PENDING');
      if (currentEdital.reviewedBy) {
        setReviewerName(currentEdital.reviewedBy);
      }
    }
  }, [currentEdital?.id]);

  const handleDecisionChange = (findingId: string, decision: HumanDecision) => {
    setFindingsDecisions(prev => ({
      ...prev,
      [findingId]: {
        ...prev[findingId],
        decision
      }
    }));
  };

  const handleCommentChange = (findingId: string, comment: string) => {
    setFindingsDecisions(prev => ({
      ...prev,
      [findingId]: {
        ...prev[findingId],
        comment
      }
    }));
  };

  const handleSaveReview = async () => {
    if (!currentEdital || !confirmedGoldenRule) return;
    setIsSubmitting(true);
    try {
      const decisionsArray = Object.entries(findingsDecisions).map(([findingId, val]: [string, { decision: HumanDecision; comment: string }]) => ({
        findingId,
        decision: val.decision,
        comment: val.comment
      }));

      await onSubmitReview(currentEdital.id, {
        humanReviewStatus: overallStatus,
        reviewedBy: reviewerName,
        reviewNotes: overallNotes,
        findingsDecisions: decisionsArray,
        publishedInternally: true
      });
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Golden Rule Notice */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3.5 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded bg-amber-100 text-amber-800 shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <span>Workflow de Revisão Humana Obrigatória (Regra de Ouro)</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-200 text-amber-900 font-bold border border-amber-300">
                CRÍTICO
              </span>
            </h2>
            <p className="text-xs text-slate-600 mt-0.5 leading-relaxed max-w-3xl">
              Nenhum achado gerado pelo motor de OCR e NLP é considerado válido externamente sem homologação por analista humano.
              Apenas após a conclusão da revisão humana o relatório oficial e os alertas de WhatsApp são desbloqueados.
            </p>
          </div>
        </div>
      </div>

      {/* Main Dual Columns Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Col (4/12): List of Editais to Review */}
        <div className="lg:col-span-4 space-y-2.5">
          <div className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between px-1">
            <span>Fila de Editais ({editais.length})</span>
            <span className="text-[11px] text-amber-700 font-bold">
              {pendingEditais.length} Pendentes
            </span>
          </div>

          <div className="space-y-2 max-h-[75vh] overflow-y-auto pr-1">
            {editais.map(edital => {
              const isSelected = currentEdital?.id === edital.id;
              const isPending = edital.humanReviewStatus === 'PENDING';

              return (
                <div
                  key={edital.id}
                  onClick={() => onSelectEditalForReview(edital)}
                  className={`p-3 rounded-lg border transition-all cursor-pointer shadow-xs ${
                    isSelected
                      ? 'bg-blue-50/60 border-blue-500 shadow-xs ring-1 ring-blue-500/20'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 border border-slate-200">
                      {edital.sourceCategory} • {edital.uf}
                    </span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                      isPending
                        ? 'bg-amber-100 text-amber-800 border border-amber-200'
                        : 'bg-green-100 text-green-800 border border-green-200'
                    }`}>
                      {isPending ? '⏳ Pendente' : '✓ Revisado'}
                    </span>
                  </div>

                  <h4 className="text-xs font-bold text-slate-800 line-clamp-2 leading-snug">
                    {edital.title}
                  </h4>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 pt-1.5 border-t border-slate-100 font-medium">
                    <span>Processo: <strong className="text-slate-700 font-mono">{edital.processNumber}</strong></span>
                    <span>Achados: <strong className="text-slate-700">{edital.findings.length}</strong></span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Col (8/12): Active Review Workbench */}
        {currentEdital ? (
          <div className="lg:col-span-8 bg-white border border-slate-200 rounded-lg p-4 space-y-4 shadow-xs text-slate-800">
            {/* Edital Summary Banner */}
            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-blue-100 text-blue-700 border border-blue-200">
                    NCM {currentEdital.ncmCode}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-white text-slate-700 border border-slate-200 font-mono font-semibold">
                    {currentEdital.processNumber}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-white text-slate-700 border border-slate-200">
                    {currentEdital.sourceName}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => generateEditalPDFReport(currentEdital)}
                    className="px-2.5 py-1 text-xs font-semibold rounded bg-white hover:bg-slate-100 text-slate-700 flex items-center gap-1 cursor-pointer border border-slate-200"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Ver Relatório Atual</span>
                  </button>
                </div>
              </div>

              <h3 className="text-xs font-bold text-slate-800">
                {currentEdital.title}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {currentEdital.objectDescription}
              </p>

              {/* URL Validation & Collection Method Alert in Review Workbench */}
              {(() => {
                const method = currentEdital.collectionMethod || currentEdital.urlValidation?.collectionMethod || 'DIRECT_HTTPX';
                const isDnsFail = currentEdital.urlValidation?.validationStatus === 'REDIRECT_DESTINATION_DNS_FAILURE';
                const isS3 = method === 'S3_CACHE_FALLBACK';

                if (isDnsFail) {
                  return (
                    <div className="mt-2 p-2.5 rounded bg-rose-50 border border-rose-200 text-rose-950 text-xs space-y-1">
                      <div className="flex items-center justify-between font-bold text-[11px] text-rose-700">
                        <span>🚨 ALERTA FORENSE: Falha DNS no Destino do Redirecionamento (NXDOMAIN)</span>
                        <span className="bg-rose-600 text-white px-1.5 py-0.2 rounded text-[10px]">Ação Obrigatória</span>
                      </div>
                      <p className="text-[11px] font-mono text-rose-900">
                        Host de destino ({currentEdital.urlValidation?.attemptedDestinationUrl}) não resolve via DNS público.
                      </p>
                      <p className="text-[11px] text-slate-700 font-sans">
                        💡 <strong>Orientação:</strong> {currentEdital.urlValidation?.recommendedAction}
                      </p>
                    </div>
                  );
                }

                if (isS3) {
                  return (
                    <div className="mt-2 p-2.5 rounded bg-amber-50 border border-amber-300 text-amber-950 text-xs space-y-1">
                      <div className="flex items-center justify-between font-bold text-[11px] text-amber-800">
                        <span>⚠️ DOCUMENTO CARREGADO DO VAULT S3 (FALLBACK FORENSE)</span>
                        <span className="bg-amber-600 text-white px-1.5 py-0.2 rounded text-[10px]">Cache S3</span>
                      </div>
                      <p className="text-[11px] text-amber-900">
                        Link público estava indisponível no momento da coleta. Análise realizada sobre a versão preservada em storage imutável.
                      </p>
                    </div>
                  );
                }

                return (
                  <div className="mt-2 flex items-center justify-between text-[11px] p-2 bg-slate-50 border border-slate-200 rounded text-slate-700">
                    <div className="flex items-center gap-1.5 font-medium">
                      <span className="font-bold">Método de Coleta:</span>
                      {method === 'DIRECT_HTTPX' && <span className="text-emerald-700">✅ Acesso Direto Validado (DIRECT_HTTPX)</span>}
                      {method === 'URL_REWRITE' && <span className="text-blue-700">🔄 Link Normalizado via Reescrita (S0-09)</span>}
                      {method === 'PLAYWRIGHT_INTERCEPT' && <span className="text-purple-700">🤖 Extração via Browser Real (Playwright)</span>}
                    </div>
                    <span className="font-mono text-[10.5px] text-slate-500">Hash: {currentEdital.sha256Hash.substring(0, 12)}...</span>
                  </div>
                );
              })()}
            </div>

            {/* Findings Review Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-800 uppercase tracking-wider">
                <span>Validação Individual dos Achados ({currentEdital.findings.length})</span>
                <span className="text-[11px] text-slate-500 font-normal">
                  Classificação obrigatória por item
                </span>
              </div>

              {currentEdital.findings.length === 0 ? (
                <div className="p-3.5 rounded-lg bg-green-50 border border-green-200 text-center text-xs text-green-800 flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span>Nenhuma irregularidade automática detectada no texto deste edital.</span>
                </div>
              ) : (
                <div className="space-y-3">
                  {currentEdital.findings.map(finding => {
                    const currentDecision = findingsDecisions[finding.id]?.decision || 'APROVADO';
                    const currentComment = findingsDecisions[finding.id]?.comment || '';

                    return (
                      <div
                        key={finding.id}
                        className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-2.5"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-white text-slate-700 border border-slate-200">
                              Página {finding.page}
                            </span>
                            <span className="text-xs font-bold text-blue-700">
                              {finding.findingType.replace(/_/g, ' ')}
                            </span>
                          </div>

                          <div className="text-[11px] text-slate-500">
                            Base: <strong>{finding.legalBasis}</strong>
                          </div>
                        </div>

                        {/* Evidence Snippet */}
                        <div className="p-2.5 rounded bg-amber-50/80 font-mono text-[11.5px] text-amber-900 border border-amber-200">
                          "{finding.snippet}"
                        </div>

                        <p className="text-xs text-slate-700">
                          {finding.explanation}
                        </p>

                        {/* Decision Buttons for this Finding */}
                        <div className="pt-2 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
                          <div className="flex items-center gap-2">
                            <span className="text-slate-500 font-medium">Decisão:</span>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleDecisionChange(finding.id, 'APROVADO')}
                                className={`px-2.5 py-1 rounded text-xs font-bold transition-colors cursor-pointer ${
                                  currentDecision === 'APROVADO'
                                    ? 'bg-green-600 text-white shadow-xs'
                                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                                }`}
                              >
                                ✓ Procedente
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDecisionChange(finding.id, 'REJEITADO')}
                                className={`px-2.5 py-1 rounded text-xs font-bold transition-colors cursor-pointer ${
                                  currentDecision === 'REJEITADO'
                                    ? 'bg-rose-600 text-white shadow-xs'
                                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                                }`}
                              >
                                ✕ Improcedente
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDecisionChange(finding.id, 'INCONCLUSIVO')}
                                className={`px-2.5 py-1 rounded text-xs font-bold transition-colors cursor-pointer ${
                                  currentDecision === 'INCONCLUSIVO'
                                    ? 'bg-amber-600 text-white shadow-xs'
                                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                                }`}
                              >
                                ? Inconclusivo
                              </button>
                            </div>
                          </div>

                          {/* Reviewer Comment on Finding */}
                          <input
                            type="text"
                            placeholder="Adicionar justificativa jurídica..."
                            value={currentComment}
                            onChange={e => handleCommentChange(finding.id, e.target.value)}
                            className="bg-white border border-slate-200 rounded px-2.5 py-1 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 flex-1 max-w-sm"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Final Sign-off Form */}
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-3 text-xs">
              <div className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-blue-600" />
                <span>Homologação e Parecer Final da Revisão</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Nome / Registro do Revisor Responsável *
                  </label>
                  <input
                    type="text"
                    required
                    value={reviewerName}
                    onChange={e => setReviewerName(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Status Geral do Edital
                  </label>
                  <select
                    value={overallStatus}
                    onChange={e => setOverallStatus(e.target.value as ReviewStatus)}
                    className="w-full bg-white border border-slate-200 rounded px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                  >
                    <option value="APPROVED">✓ Aprovado / Homologado para Publicação Interna</option>
                    <option value="REJECTED">✕ Rejeitado (Inconformidades Graves)</option>
                    <option value="INCONCLUSIVE">? Inconclusivo (Requer Análise Complementar)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Parecer Sintético e Recomendações
                </label>
                <textarea
                  rows={3}
                  value={overallNotes}
                  onChange={e => setOverallNotes(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded p-2.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 leading-relaxed"
                />
              </div>

              {/* Mandatory Golden Rule Checkbox */}
              <div className="p-3 rounded bg-amber-50 border border-amber-200 flex items-start gap-2.5">
                <input
                  type="checkbox"
                  id="goldenRuleCheck"
                  checked={confirmedGoldenRule}
                  onChange={e => setConfirmedGoldenRule(e.target.checked)}
                  className="mt-0.5 w-3.5 h-3.5 rounded text-blue-600 focus:ring-blue-500 bg-white border-slate-300 cursor-pointer"
                />
                <label htmlFor="goldenRuleCheck" className="text-xs text-slate-700 cursor-pointer leading-relaxed">
                  <strong>Declaração de Conformidade com o PRD v1.1:</strong> Confirmo que realizei a revisão humana minuciosa dos achados e evidências textuais deste edital, atestando a fundamentação jurídica antes da publicação interna e liberação de notificações externas.
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2.5 border-t border-slate-200">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => generateEditalPDFReport(currentEdital)}
                    className="px-3 py-1.5 text-xs font-semibold rounded bg-white hover:bg-slate-100 text-slate-700 flex items-center gap-1.5 cursor-pointer border border-slate-200"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Baixar Relatório em PDF</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleSaveReview}
                  disabled={!confirmedGoldenRule || isSubmitting}
                  className="px-4 py-1.5 text-xs font-bold rounded bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50 transition-colors"
                >
                  <Save className={`w-3.5 h-3.5 ${isSubmitting ? 'animate-spin' : ''}`} />
                  <span>{isSubmitting ? 'Salvando...' : 'Concluir & Homologar Revisão'}</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="lg:col-span-8 p-12 text-center text-slate-400 text-xs bg-white rounded-lg border border-slate-200">
            Selecione um edital na coluna lateral para iniciar a revisão.
          </div>
        )}
      </div>
    </div>
  );
};
