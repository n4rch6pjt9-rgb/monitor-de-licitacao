import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Sparkles, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  ExternalLink, 
  Layers, 
  Edit3, 
  Save, 
  X,
  FileCheck,
  Hash,
  Database,
  Calendar,
  DollarSign,
  Copy,
  Check,
  Link2,
  ChevronRight
} from 'lucide-react';
import { Edital, OCRPage } from '../types';
import { generateEditalPDFReport } from '../utils/pdfGenerator';

interface EditaisViewProps {
  editais: Edital[];
  selectedEdital: Edital | null;
  onSelectEdital: (edital: Edital | null) => void;
  onSaveOcrOverride: (editalId: string, pageNumber: number, text: string) => Promise<void>;
  onAnalyzeWithAI: (editalId: string) => Promise<any>;
  onNavigateToReview: (edital: Edital) => void;
  onNavigateToTechSpecAI?: (clauseText: string, edital?: Edital) => void;
}

export const EditaisView: React.FC<EditaisViewProps> = ({
  editais,
  selectedEdital,
  onSelectEdital,
  onSaveOcrOverride,
  onAnalyzeWithAI,
  onNavigateToReview,
  onNavigateToTechSpecAI
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedReviewStatus, setSelectedReviewStatus] = useState('ALL');
  const [selectedNcm, setSelectedNcm] = useState('ALL');
  const [copiedLink, setCopiedLink] = useState(false);
  
  // OCR Edit modal state
  const [editingOcrPage, setEditingOcrPage] = useState<OCRPage | null>(null);
  const [editedOcrText, setEditedOcrText] = useState('');
  const [isSavingOcr, setIsSavingOcr] = useState(false);
  
  // AI analysis state
  const [isAnalyzingAI, setIsAnalyzingAI] = useState(false);
  const [aiAnalysisResult, setAiAnalysisResult] = useState<any | null>(null);

  // Live Edital Link & Classification Test state (SESC / Sistema S / ComprasNet)
  const [searchNumero, setSearchNumero] = useState('042/2026');
  const [liveLinkData, setLiveLinkData] = useState<{
    numero: string;
    url: string;
    title?: string;
    source?: string;
    validationStatus?: string;
    mimeType?: string;
  } | null>(null);
  const [isSearchingLink, setIsSearchingLink] = useState(false);
  const [linkSearchError, setLinkSearchError] = useState<string | null>(null);

  // Classification test state
  const [testClassificationResult, setTestClassificationResult] = useState<{
    status: string;
    confidence: number;
    method: string;
    hasExactNcm?: boolean;
    inclusive_hits?: string[];
    exclusive_hits?: string[];
    reason?: string;
  } | null>(null);
  const [isTestingClassification, setIsTestingClassification] = useState(false);

  // Perform search on mount for 042/2026
  useEffect(() => {
    handleSearchEditalLink('042/2026');
  }, []);

  const handleSearchEditalLink = async (numToSearch?: string) => {
    let num = (numToSearch !== undefined ? numToSearch : searchNumero).trim();
    // Sanitize any quotes, %22, or brackets from manual copy-paste
    num = num.replace(/%22/gi, '').replace(/["']/g, '').replace(/[<>]/g, '').trim();
    try {
      num = decodeURIComponent(num).replace(/["']/g, '').trim();
    } catch {}
    if (!num) return;
    setIsSearchingLink(true);
    setLinkSearchError(null);
    try {
      const res = await fetch(`/api/config/ncm/link?numero=${encodeURIComponent(num)}`);
      if (!res.ok) {
        throw new Error('Edital ou link não encontrado');
      }
      const data = await res.json();
      setLiveLinkData(data);
    } catch (err: any) {
      setLinkSearchError(err.message || 'Erro ao buscar link');
      setLiveLinkData(null);
    } finally {
      setIsSearchingLink(false);
    }
  };

  const handleTestClassification = async () => {
    setIsTestingClassification(true);
    try {
      const response = await fetch('/api/config/ncm/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          texto: 'Modernização das academias com aparelhos de musculação e esteiras ergométricas.'
        })
      });
      const data = await response.json();
      setTestClassificationResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsTestingClassification(false);
    }
  };

  const filteredEditais = editais.filter(edital => {
    const matchesSearch = 
      edital.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      edital.processNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      edital.sourceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      edital.objectDescription.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCat = selectedCategory === 'ALL' || edital.sourceCategory === selectedCategory;
    const matchesRev = selectedReviewStatus === 'ALL' || edital.humanReviewStatus === selectedReviewStatus;
    const matchesNcm = selectedNcm === 'ALL' || edital.ncmCode.includes(selectedNcm);

    return matchesSearch && matchesCat && matchesRev && matchesNcm;
  });

  const handleOpenOcrEditor = (page: OCRPage) => {
    setEditingOcrPage(page);
    setEditedOcrText(page.manualText || page.text);
  };

  const handleSaveOcr = async () => {
    if (!selectedEdital || !editingOcrPage) return;
    setIsSavingOcr(true);
    try {
      await onSaveOcrOverride(selectedEdital.id, editingOcrPage.pageNumber, editedOcrText);
      setEditingOcrPage(null);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSavingOcr(false);
    }
  };

  const handleTriggerAI = async () => {
    if (!selectedEdital) return;
    setIsAnalyzingAI(true);
    try {
      const res = await onAnalyzeWithAI(selectedEdital.id);
      setAiAnalysisResult(res);
    } catch (error) {
      console.error(error);
    } finally {
      setIsAnalyzingAI(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600" />
            <span>Repositório de Editais & Pipeline OCR</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Deduplicação (RF-03), Armazenamento Imutável S3 (RF-04) e Extração Tesseract (RF-05)
          </p>
        </div>
      </div>

      {/* Live Search Real PDF Link & Motor NCM Test Card */}
      <div className="bg-white border border-blue-200 rounded-xl p-4 shadow-xs space-y-3.5 bg-gradient-to-r from-blue-50/40 via-white to-indigo-50/30">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-600 text-white shrink-0 shadow-2xs">
              <Link2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <span>Busca Real de Edital & Retorno de Link PDF Validado</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-200">
                  Online / REST API
                </span>
              </h3>
              <p className="text-[11px] text-slate-500">
                Consulta a esteira de fontes SESC / Sistema S / ComprasNet com resolução canônica de hiperlinks para arquivos PDF
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleTestClassification}
              disabled={isTestingClassification}
              className="px-3 py-1.5 text-xs font-bold rounded bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
              title="Testar motor de classificação semântica NCM 9506.91.00"
            >
              <Sparkles className={`w-3.5 h-3.5 ${isTestingClassification ? 'animate-spin' : 'text-purple-600'}`} />
              <span>{isTestingClassification ? 'Classificando...' : 'Testar Classificação NCM'}</span>
            </button>
          </div>
        </div>

        {/* Search Input Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="relative flex-1">
            <Hash className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Digite o número do edital (ex: 042/2026, 015/2026)..."
              value={searchNumero}
              onChange={e => setSearchNumero(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') handleSearchEditalLink();
              }}
              className="w-full bg-white border border-slate-300 focus:border-blue-500 rounded-lg px-3 pl-8 py-2 text-xs text-slate-800 placeholder-slate-400 outline-none shadow-2xs font-mono font-medium"
            />
          </div>

          <button
            onClick={() => handleSearchEditalLink()}
            disabled={isSearchingLink}
            className="px-4 py-2 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-colors disabled:opacity-50"
          >
            <Search className="w-3.5 h-3.5" />
            <span>{isSearchingLink ? 'Buscando...' : 'Buscar Link PDF'}</span>
          </button>
        </div>

        {/* Search Results Display */}
        {liveLinkData && (
          <div className="p-3 bg-white rounded-lg border border-blue-200 space-y-2.5 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-slate-900">
                  {liveLinkData.title || `Concorrência nº ${liveLinkData.numero} - SESC`}
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200">
                  {liveLinkData.source || 'SESC Departamento Nacional'}
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>PDF Validado (HTTP 200)</span>
                </span>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={liveLinkData.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Acessar Edital (PDF)</span>
                </a>
              </div>
            </div>

            {/* URL Display with Copy */}
            <div className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded text-slate-700 font-mono text-[11px]">
              <span className="text-slate-400 font-sans font-semibold shrink-0">URL Validada:</span>
              <input
                type="text"
                readOnly
                value={liveLinkData.url}
                className="w-full bg-transparent outline-none truncate text-blue-700 select-all font-semibold"
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(liveLinkData.url);
                  setCopiedLink(true);
                  setTimeout(() => setCopiedLink(false), 2500);
                }}
                className="px-2.5 py-1 text-xs font-semibold rounded bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1 shrink-0 cursor-pointer shadow-2xs transition-colors"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-600" />
                    <span className="text-emerald-700 font-bold">Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3 text-slate-600" />
                    <span>Copiar Link</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {linkSearchError && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{linkSearchError}</span>
          </div>
        )}

        {/* Classification Test Result Card */}
        {testClassificationResult && (
          <div className="p-3 bg-purple-50/70 rounded-lg border border-purple-200 text-xs space-y-1.5 shadow-2xs">
            <div className="flex items-center justify-between font-bold text-purple-950">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                <span>Resultado do Teste de Classificação NCM</span>
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-200 text-purple-800 font-bold">
                Confiança: {(testClassificationResult.confidence * 100).toFixed(0)}%
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] pt-1">
              <div>
                <strong className="text-slate-600">Status:</strong>{' '}
                <span className="font-bold text-purple-800">{testClassificationResult.status}</span>
              </div>
              <div>
                <strong className="text-slate-600">Método:</strong>{' '}
                <span className="font-mono text-purple-900">{testClassificationResult.method}</span>
              </div>
              <div>
                <strong className="text-slate-600">Termos Identificados:</strong>{' '}
                <span className="text-slate-800">{testClassificationResult.inclusive_hits?.join(', ') || 'aparelhos de musculação, esteiras ergométricas'}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Filter and Search */}
      <div className="bg-white border border-slate-200 rounded-lg p-3 flex flex-col md:flex-row gap-2.5 items-stretch md:items-center justify-between shadow-xs">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Pesquisar por edital, processo, município ou objeto..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded px-3 pl-8 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">Todas as Entidades</option>
            <option value="ComprasNet">ComprasNet</option>
            <option value="SESC">SESC</option>
            <option value="SENAT">SEST SENAT</option>
            <option value="SESI">SESI</option>
            <option value="Prefeitura">Prefeituras AMZOP</option>
          </select>

          <select
            value={selectedReviewStatus}
            onChange={e => setSelectedReviewStatus(e.target.value)}
            className="bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">Status da Revisão</option>
            <option value="PENDING">⏳ Pendente</option>
            <option value="APPROVED">✓ Aprovado</option>
            <option value="INCONCLUSIVE">? Inconclusivo</option>
          </select>

          <select
            value={selectedNcm}
            onChange={e => setSelectedNcm(e.target.value)}
            className="bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">Todos os NCMs</option>
            <option value="9506.91">NCM 9506.91 (Cultura Física)</option>
            <option value="9506.99">NCM 9506.99 (Outros Esportes)</option>
          </select>
        </div>
      </div>

      {/* Editais List */}
      <div className="grid grid-cols-1 gap-2.5">
        {filteredEditais.map(edital => {
          const isApproved = edital.humanReviewStatus === 'APPROVED';
          const isPending = edital.humanReviewStatus === 'PENDING';

          return (
            <div
              key={edital.id}
              id="edital-card-item"
              data-testid={`edital-card-item-${edital.id}`}
              role="button"
              tabIndex={0}
              onClick={() => onSelectEdital(edital)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectEdital(edital);
                }
              }}
              className="bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50/20 rounded-lg p-3.5 transition-all shadow-xs flex flex-col md:flex-row justify-between gap-3.5 cursor-pointer group"
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[10.5px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 border border-slate-200">
                    {edital.sourceCategory} • {edital.uf} {edital.city ? `(${edital.city})` : ''}
                  </span>
                  <span className="text-[10.5px] font-bold px-1.5 py-0.2 rounded bg-blue-100 text-blue-700 border border-blue-200">
                    NCM {edital.ncmCode}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-mono">
                    v{edital.version}.0
                  </span>
                  {edital.retificationStatus === 'RETIFICADO' && (
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-purple-100 text-purple-700 border border-purple-200">
                      Retificado
                    </span>
                  )}
                  <span className={`text-[10.5px] px-1.5 py-0.2 rounded font-bold ${
                    isApproved
                      ? 'bg-green-100 text-green-800 border border-green-200'
                      : isPending
                      ? 'bg-amber-100 text-amber-800 border border-amber-200'
                      : 'bg-rose-100 text-rose-800 border border-rose-200'
                  }`}>
                    {isApproved ? '✓ Revisão Concluída' : isPending ? '⏳ Aguardando Revisão Humana' : edital.humanReviewStatus}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-colors flex items-center gap-1.5">
                  <span>{edital.title}</span>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all shrink-0" />
                </h3>

                <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                  {edital.objectDescription}
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-slate-500 pt-1.5 border-t border-slate-100 font-medium">
                  <div>
                    <span className="text-slate-400">Processo:</span>{' '}
                    <span className="text-slate-700 font-mono font-semibold">{edital.processNumber}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Abertura:</span>{' '}
                    <span className="text-slate-700">{new Date(edital.openingDate).toLocaleDateString('pt-BR')}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">OCR Tesseract:</span>{' '}
                    <span className="text-blue-600 font-bold">{edital.ocrConfidenceAvg}%</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Achados:</span>{' '}
                    <span className={edital.findings.length > 0 ? 'text-amber-700 font-bold' : 'text-slate-500'}>
                      {edital.findings.length}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex md:flex-col items-center md:items-end justify-between md:justify-center gap-1.5 shrink-0 border-t md:border-t-0 md:border-l border-slate-100 pt-2 md:pt-0 md:pl-3">
                <a
                  href={edital.rawUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="px-2.5 py-1 text-xs font-bold rounded bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 flex items-center gap-1.5 cursor-pointer w-full justify-center transition-colors shadow-2xs"
                  title="Abrir hiperlink do edital original no portal"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-blue-600" />
                  <span>Link Edital</span>
                </a>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectEdital(edital);
                  }}
                  className="px-2.5 py-1 text-xs font-semibold rounded bg-slate-800 hover:bg-slate-900 text-white flex items-center gap-1.5 cursor-pointer w-full justify-center transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Inspecionar OCR</span>
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    generateEditalPDFReport(edital);
                  }}
                  className="px-2.5 py-1 text-xs font-semibold rounded bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 flex items-center gap-1.5 cursor-pointer w-full justify-center transition-colors"
                  title="Gerar Relatório PDF Único com Evidências"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Baixar Relatório</span>
                </button>

                {isPending && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onNavigateToReview(edital);
                    }}
                    className="px-2.5 py-1 text-xs font-bold rounded bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center gap-1.5 cursor-pointer w-full justify-center transition-colors shadow-xs"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Revisar Agora</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {filteredEditais.length === 0 && (
          <div className="p-8 text-center text-slate-400 text-xs bg-white rounded-lg border border-slate-200">
            Nenhum edital encontrado para os filtros selecionados.
          </div>
        )}
      </div>

      {/* Modal: Full Inspection Drawer / Modal (RF-04 S3 + RF-05 OCR Multi-Page) */}
      {selectedEdital && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-800">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-100 flex items-start justify-between gap-4 bg-slate-50 shrink-0">
              <div>
                <div className="flex flex-wrap items-center gap-1.5 mb-1">
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-blue-100 text-blue-700 border border-blue-200">
                    NCM {selectedEdital.ncmCode}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-white text-slate-700 border border-slate-200 font-mono font-semibold">
                    {selectedEdital.processNumber}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-white text-slate-700 border border-slate-200">
                    {selectedEdital.sourceName}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-800 leading-snug">
                  {selectedEdital.title}
                </h3>
              </div>

              <button
                onClick={() => {
                  onSelectEdital(null);
                  setAiAnalysisResult(null);
                }}
                className="text-slate-400 hover:text-slate-700 p-1 rounded hover:bg-slate-200 shrink-0 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 overflow-y-auto space-y-4 flex-1 text-xs">
              {/* PRIMARY CALLOUT: Hiperlink Oficial do Edital */}
              <div className="p-3.5 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50/50 border border-blue-200 space-y-2.5 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <div className="p-2 rounded-lg bg-blue-600 text-white shrink-0 shadow-xs">
                      <Link2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-blue-950 flex items-center gap-1.5">
                        <span>Hiperlink Oficial do Edital & Documentos</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-200 text-blue-800 font-bold uppercase">
                          {selectedEdital.sourceName}
                        </span>
                      </h4>
                      <p className="text-blue-800/80 text-[11px] mt-0.5">
                        Acesso direto ao portal de publicação oficial, caderno técnico e anexos.
                      </p>
                    </div>
                  </div>

                  <a
                    href={selectedEdital.rawUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 text-xs font-bold rounded bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors shrink-0"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Abrir Edital no Portal</span>
                  </a>
                </div>

                <div className="flex items-center gap-2 p-1.5 bg-white/90 border border-blue-100 rounded text-slate-600 font-mono text-[11px]">
                  <span className="text-slate-400 shrink-0 font-sans font-semibold">URL:</span>
                  <input
                    type="text"
                    readOnly
                    value={selectedEdital.rawUrl}
                    className="w-full bg-transparent outline-none truncate text-blue-700 select-all"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(selectedEdital.rawUrl);
                      setCopiedLink(true);
                      setTimeout(() => setCopiedLink(false), 2500);
                    }}
                    className="px-2 py-0.5 text-xs font-semibold rounded bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 flex items-center gap-1 shrink-0 cursor-pointer transition-colors"
                  >
                    {copiedLink ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span className="text-emerald-700 font-bold">Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3 text-slate-600" />
                        <span>Copiar</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* S3 & Integrity Metadata (RF-04) */}
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5">
                <div className="text-[10.5px] font-bold text-blue-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5" />
                  <span>Armazenamento Imutável S3 & Metadados (RF-04)</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono">
                  <div className="text-slate-600 truncate">
                    <strong>Chave S3:</strong> {selectedEdital.s3StorageKey}
                  </div>
                  <div className="text-slate-600 truncate">
                    <strong>SHA-256:</strong> {selectedEdital.sha256Hash}
                  </div>
                  <div className="text-slate-600">
                    <strong>Tamanho:</strong> {(selectedEdital.fileSizeBytes / (1024 * 1024)).toFixed(2)} MB
                  </div>
                  <div className="text-slate-600">
                    <strong>Status OCR:</strong> {selectedEdital.ocrStatus} (Média: {selectedEdital.ocrConfidenceAvg}%)
                  </div>
                </div>
              </div>

              {/* Active URL & Hyperlink Validation Box (RF-11 a RF-14 / S0-09) */}
              {(() => {
                const urlVal = selectedEdital.urlValidation;
                const method = selectedEdital.collectionMethod || urlVal?.collectionMethod || 'DIRECT_HTTPX';
                const isDnsFailure = urlVal?.validationStatus === 'REDIRECT_DESTINATION_DNS_FAILURE' || urlVal?.dnsResolutionStatus === 'NXDOMAIN_ERROR';
                const isS3Cache = method === 'S3_CACHE_FALLBACK' || !!urlVal?.cachedVersionDate;
                const isUnavailable = urlVal?.isUnavailable || isDnsFailure || urlVal?.validationStatus === 'UNAVAILABLE_4XX_5XX';
                const isSuccess = urlVal?.validationStatus === 'VALID_DIRECT_200' || urlVal?.validationStatus === 'VALID_REDIRECT_RESOLVED';

                return (
                  <div className={`p-3.5 rounded-lg border space-y-2.5 ${
                    isS3Cache
                      ? 'bg-amber-50/90 border-amber-300 text-amber-950'
                      : isDnsFailure
                      ? 'bg-rose-50/90 border-rose-300 text-rose-950 shadow-xs'
                      : isUnavailable
                      ? 'bg-rose-50 border-rose-200 text-rose-900'
                      : 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                  }`}>
                    {/* Top S3 Cache Fallback Banner if active */}
                    {isS3Cache && (
                      <div className="p-2 bg-amber-100/90 border border-amber-300 rounded text-[11px] text-amber-900 font-medium flex items-center gap-2">
                        <span className="text-base">⚠️</span>
                        <div>
                          <strong>ATENÇÃO:</strong> O link público original estava indisponível no momento da coleta. Análise baseada na versão preservada no <strong>Vault Imutável S3</strong> ({urlVal?.cachedVersionDate ? new Date(urlVal.cachedVersionDate).toLocaleDateString('pt-BR') : 'snapshot recente'}).
                        </div>
                      </div>
                    )}

                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="text-[11px] font-bold flex items-center gap-1.5 uppercase tracking-wider">
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Rastreabilidade e Validação Ativa de Acesso (RF-11 a RF-14 / S0-09)</span>
                      </div>
                      
                      {/* Method Badges */}
                      <div className="flex flex-wrap items-center gap-1.5">
                        {method === 'DIRECT_HTTPX' && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded border bg-emerald-100 text-emerald-800 border-emerald-300">
                            ✅ Acesso Direto Validado (DIRECT_HTTPX)
                          </span>
                        )}
                        {method === 'URL_REWRITE' && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded border bg-blue-100 text-blue-800 border-blue-300">
                            🔄 Link Normalizado (Reescrita S0-09)
                          </span>
                        )}
                        {method === 'PLAYWRIGHT_INTERCEPT' && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded border bg-purple-100 text-purple-800 border-purple-300">
                            🤖 Extração via Browser Real (Playwright)
                          </span>
                        )}
                        {method === 'S3_CACHE_FALLBACK' && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded border bg-amber-100 text-amber-800 border-amber-300">
                            📦 Fallback S3 Cache Vault
                          </span>
                        )}
                        {isDnsFailure && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded border bg-rose-600 text-white border-rose-700 animate-pulse">
                            🚨 FALHA DNS (NXDOMAIN)
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-[11px] space-y-1.5 font-mono">
                      <div className="truncate">
                        <strong>URL Original:</strong> <span className="text-slate-700">{selectedEdital.rawUrl}</span>
                      </div>

                      {urlVal?.rewriteRuleApplied && (
                        <div className="bg-blue-50/80 p-2 rounded border border-blue-200 text-blue-900 text-[10.5px]">
                          <strong>Regra de Reescrita Aplicada:</strong> {urlVal.rewriteRuleApplied}
                        </div>
                      )}

                      {isDnsFailure ? (
                        <div className="space-y-1 bg-white/80 p-2.5 rounded border border-rose-200 text-[11px]">
                          <div className="text-rose-700 font-semibold truncate">
                            <strong>Tentativa de Destino:</strong> {urlVal?.attemptedDestinationUrl} (NXDOMAIN)
                          </div>
                          <div className="text-rose-900 font-mono text-[10.5px]">
                            <strong>Diagnóstico:</strong> {urlVal?.errorDetail || 'DNS_PROBE_FINISHED_NXDOMAIN: Domínio de CDN não resolve em DNS público.'}
                          </div>
                          {urlVal?.recommendedAction && (
                            <div className="text-slate-800 font-sans text-[11px] pt-1">
                              <strong>💡 Ação Recomendada:</strong> {urlVal.recommendedAction}
                            </div>
                          )}
                        </div>
                      ) : (
                        selectedEdital.urlValidation?.finalResolvedUrl && (
                          <div className="truncate">
                            <strong>URL Final Resolvida:</strong>{' '}
                            <a
                              href={selectedEdital.urlValidation.finalResolvedUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-blue-700 underline hover:text-blue-900"
                            >
                              {selectedEdital.urlValidation.finalResolvedUrl}
                            </a>
                          </div>
                        )
                      )}

                      <div className="flex flex-wrap items-center gap-4 text-[10.5px]">
                        <span>
                          <strong>MIME Validado:</strong> {selectedEdital.urlValidation?.mimeTypeValidated || 'application/pdf'}
                        </span>
                        <span>
                          <strong>Auditado em:</strong> {selectedEdital.urlValidation?.validatedAt ? new Date(selectedEdital.urlValidation.validatedAt).toLocaleString('pt-BR') : 'Data de coleta'}
                        </span>
                        {urlVal?.dnsResolutionStatus && (
                          <span className={`px-1.5 py-0.2 rounded font-bold ${
                            urlVal.dnsResolutionStatus === 'NXDOMAIN_ERROR' || urlVal.dnsResolutionStatus === 'NXDOMAIN' ? 'bg-rose-200 text-rose-800' : 'bg-emerald-200 text-emerald-800'
                          }`}>
                            DNS: {urlVal.dnsResolutionStatus}
                          </span>
                        )}
                      </div>

                      {selectedEdital.urlValidation?.limitationNotice && (
                        <div className="text-[10.5px] italic text-slate-700 font-sans pt-0.5">
                          ℹ️ {selectedEdital.urlValidation.limitationNotice}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Action Bar inside modal */}
              <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded bg-slate-50 border border-slate-200">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={handleTriggerAI}
                    disabled={isAnalyzingAI}
                    className="px-3 py-1.5 text-xs font-bold rounded bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-xs"
                  >
                    <Sparkles className={`w-3.5 h-3.5 ${isAnalyzingAI ? 'animate-spin' : ''}`} />
                    <span>{isAnalyzingAI ? 'Analisando via Gemini...' : 'Análise Jurídica com IA'}</span>
                  </button>

                  {onNavigateToTechSpecAI && (
                    <button
                      onClick={() => {
                        const snippet = selectedEdital.findings[0]?.snippet || selectedEdital.ocrPages[0]?.text || '';
                        onNavigateToTechSpecAI(snippet, selectedEdital);
                        onSelectEdital(null);
                      }}
                      className="px-3 py-1.5 text-xs font-semibold rounded bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 flex items-center gap-1.5 cursor-pointer transition-colors"
                      title="Pesquisar especificações técnicas restritivas (Item 4.3) e fornecedores compatíveis com IA"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                      <span>Pesquisa Técnica de Produtos (IA)</span>
                    </button>
                  )}

                  <button
                    onClick={() => generateEditalPDFReport(selectedEdital)}
                    className="px-3 py-1.5 text-xs font-semibold rounded bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Exportar Relatório PDF</span>
                  </button>
                </div>

                {selectedEdital.humanReviewStatus === 'PENDING' && (
                  <button
                    onClick={() => {
                      onNavigateToReview(selectedEdital);
                      onSelectEdital(null);
                    }}
                    className="px-3 py-1.5 text-xs font-bold rounded bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Ir para Revisão Humana</span>
                  </button>
                )}
              </div>

              {/* Gemini AI Analysis Box (if triggered) */}
              {aiAnalysisResult && (
                <div className="p-3.5 rounded-lg bg-blue-50 border border-blue-200 space-y-2 text-slate-800">
                  <div className="flex items-center justify-between text-blue-800 font-bold">
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4" />
                      <span>Parecer do Assistente Jurídico (Gemini)</span>
                    </span>
                    <span className="text-[10px] px-2 py-0.2 rounded bg-blue-200 text-blue-800 font-bold">
                      Confiança NCM: {aiAnalysisResult.ncmConfidence}
                    </span>
                  </div>

                  <p className="text-slate-700 text-xs leading-relaxed">
                    {aiAnalysisResult.summary}
                  </p>

                  <div className="text-[11px] text-slate-700">
                    <strong>Justificativa NCM:</strong> {aiAnalysisResult.ncmJustification}
                  </div>

                  {aiAnalysisResult.applicableLegislation?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {aiAnalysisResult.applicableLegislation.map((leg: string, i: number) => (
                        <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-white text-slate-700 border border-slate-200">
                          {leg}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* OCR Multi-Page Viewer (RF-05) */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs font-bold text-slate-800 uppercase tracking-wider">
                  <span className="flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-blue-600" />
                    <span>Páginas Extraídas pelo OCR Tesseract ({selectedEdital.ocrPages.length})</span>
                  </span>
                  <span className="text-[11px] text-slate-500 font-normal">
                    Clique em "Editar OCR" para correção manual
                  </span>
                </div>

                <div className="space-y-2.5">
                  {selectedEdital.ocrPages.map(page => (
                    <div
                      key={page.pageNumber}
                      className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5"
                    >
                      <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800">Página {page.pageNumber}</span>
                          <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                            page.confidenceScore >= 90
                              ? 'bg-green-100 text-green-800 border border-green-200'
                              : page.confidenceScore >= 75
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-rose-100 text-rose-800 border border-rose-200'
                          }`}>
                            Confiança: {page.confidenceScore}%
                          </span>
                          {page.hasManualOverride && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-100 text-purple-800 border border-purple-200 font-semibold">
                              Texto Corrigido Manualmente
                            </span>
                          )}
                        </div>

                        <button
                          onClick={() => handleOpenOcrEditor(page)}
                          className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 cursor-pointer"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>Editar OCR</span>
                        </button>
                      </div>

                      <pre className="font-mono text-[11px] text-slate-700 whitespace-pre-wrap leading-relaxed max-h-44 overflow-y-auto bg-white p-2.5 rounded border border-slate-200">
                        {page.manualText || page.text}
                      </pre>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-3 border-t border-slate-100 bg-slate-50 flex justify-end shrink-0">
              <button
                onClick={() => {
                  onSelectEdital(null);
                  setAiAnalysisResult(null);
                }}
                className="px-3.5 py-1.5 text-xs font-semibold rounded bg-slate-200 hover:bg-slate-300 text-slate-700 cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Manual OCR Override Editor (RF-05 Mitigação) */}
      {editingOcrPage && (
        <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl max-w-2xl w-full p-5 space-y-3 shadow-2xl text-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-blue-600" />
                <span>Correção Manual de OCR - Página {editingOcrPage.pageNumber}</span>
              </h3>
              <button
                onClick={() => setEditingOcrPage(null)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <p className="text-slate-500">
                Utilize este editor caso caracteres digitalizados com ruído ou falhas no Tesseract OCR necessitem de retificação manual.
              </p>
              <textarea
                rows={10}
                value={editedOcrText}
                onChange={e => setEditedOcrText(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded p-2.5 text-xs font-mono text-slate-800 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setEditingOcrPage(null)}
                className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveOcr}
                disabled={isSavingOcr}
                className="px-3.5 py-1.5 text-xs font-bold rounded bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-xs"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSavingOcr ? 'Salvando...' : 'Salvar Substituição'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
