import React, { useState } from 'react';
import { 
  Building2, 
  Search, 
  Filter, 
  Plus, 
  Zap, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Play, 
  Globe, 
  Code2, 
  Database, 
  ExternalLink,
  RefreshCw,
  X,
  Check,
  Cpu
} from 'lucide-react';
import { Source, SourceType, EntityCategory } from '../types';

interface SourcesViewProps {
  sources: Source[];
  onAddSource: (source: Partial<Source>) => Promise<void>;
  onTestSource: (source: Source) => Promise<any>;
}

export const SourcesView: React.FC<SourcesViewProps> = ({
  sources,
  onAddSource,
  onTestSource
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [testingSourceId, setTestingSourceId] = useState<string | null>(null);
  const [testResultModal, setTestResultModal] = useState<any | null>(null);
  const [isNewSourceModalOpen, setIsNewSourceModalOpen] = useState(false);

  // New source form state
  const [newSourceForm, setNewSourceForm] = useState<Partial<Source>>({
    name: '',
    category: 'Prefeitura',
    type: 'SCRAPER',
    uf: 'RS',
    city: '',
    endpointOrUrl: '',
    selectorOrParams: '',
    authType: 'NONE',
    notes: ''
  });

  const filteredSources = sources.filter(source => {
    const matchesSearch = 
      source.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (source.city && source.city.toLowerCase().includes(searchTerm.toLowerCase())) ||
      source.uf.toLowerCase().includes(searchTerm.toLowerCase()) ||
      source.endpointOrUrl.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = selectedCategory === 'ALL' || source.category === selectedCategory;
    const matchesType = selectedType === 'ALL' || source.type === selectedType;

    return matchesSearch && matchesCategory && matchesType;
  });

  const handleRunTest = async (source: Source) => {
    setTestingSourceId(source.id);
    try {
      const result = await onTestSource(source);
      setTestResultModal(result);
    } catch (error) {
      console.error(error);
    } finally {
      setTestingSourceId(null);
    }
  };

  const handleSubmitNewSource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSourceForm.name || !newSourceForm.endpointOrUrl) return;
    await onAddSource(newSourceForm);
    setIsNewSourceModalOpen(false);
    setNewSourceForm({
      name: '',
      category: 'Prefeitura',
      type: 'SCRAPER',
      uf: 'RS',
      city: '',
      endpointOrUrl: '',
      selectorOrParams: '',
      authType: 'NONE',
      notes: ''
    });
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Building2 className="w-4 h-4 text-blue-600" />
            <span>Fontes & Conectores de Monitoramento</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            28 Municípios AMZOP/RS + Portais Nacionais e Regionais do Sistema S + API ComprasNet (Gov.br)
          </p>
        </div>

        <button
          onClick={() => setIsNewSourceModalOpen(true)}
          className="px-3 py-1.5 text-xs font-bold rounded bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Cadastrar Conector (API / Scraper)</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white border border-slate-200 rounded-lg p-3 flex flex-col md:flex-row gap-2.5 items-stretch md:items-center justify-between shadow-xs">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Filtrar por município, órgão, URL ou UF..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded px-3 pl-8 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">Todas as Entidades ({sources.length})</option>
            <option value="ComprasNet">ComprasNet (API Gov.br)</option>
            <option value="SESC">SESC (Nacional & Regionais)</option>
            <option value="SENAT">SEST SENAT</option>
            <option value="SESI">SESI (Nacional & Regionais)</option>
            <option value="Prefeitura">28 Prefeituras AMZOP/RS</option>
          </select>

          {/* Type Filter */}
          <select
            value={selectedType}
            onChange={e => setSelectedType(e.target.value)}
            className="bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">Todos os Tipos</option>
            <option value="API">Conector API REST</option>
            <option value="SCRAPER">Web Scraper</option>
          </select>
        </div>
      </div>

      {/* Sources Table / Grid */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-200">
              <tr>
                <th className="px-3.5 py-2.5">Fonte / Órgão</th>
                <th className="px-3 py-2.5">Tipo Conector</th>
                <th className="px-3 py-2.5">UF / Localidade</th>
                <th className="px-3 py-2.5">Saúde / Latência</th>
                <th className="px-3 py-2.5">Taxa Sucesso</th>
                <th className="px-3 py-2.5">Total Coletado</th>
                <th className="px-3 py-2.5">Última Checagem</th>
                <th className="px-3.5 py-2.5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSources.map(source => {
                const isTesting = testingSourceId === source.id;
                const isApi = source.type === 'API';

                return (
                  <tr key={source.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-3.5 py-2.5">
                      <div className="font-bold text-slate-800">{source.name}</div>
                      <div className="text-[10.5px] text-slate-400 font-mono truncate max-w-xs" title={source.endpointOrUrl}>
                        {source.endpointOrUrl}
                      </div>
                    </td>

                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        isApi
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-orange-100 text-orange-700'
                      }`}>
                        {isApi ? <Code2 className="w-3 h-3" /> : <Globe className="w-3 h-3" />}
                        <span>{source.type}</span>
                      </span>
                    </td>

                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 text-[10.5px] font-bold mr-1.5 border border-slate-200">
                        {source.uf}
                      </span>
                      <span className="text-slate-500 text-[11px]">{source.city || 'Regional'}</span>
                    </td>

                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${source.latencyMs < 400 ? 'bg-green-500' : 'bg-amber-500'}`}></span>
                        <span className="font-mono text-slate-700 font-medium">{source.latencyMs} ms</span>
                      </div>
                    </td>

                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <span className="text-green-700 font-bold">{source.successRate}%</span>
                    </td>

                    <td className="px-3 py-2.5 whitespace-nowrap text-slate-700 font-semibold">
                      {source.totalCollected} editais
                    </td>

                    <td className="px-3 py-2.5 whitespace-nowrap text-slate-400 text-[10.5px]">
                      {new Date(source.lastCheckedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </td>

                    <td className="px-3.5 py-2.5 whitespace-nowrap text-right">
                      <button
                        onClick={() => handleRunTest(source)}
                        disabled={isTesting}
                        className="px-2 py-1 text-xs font-semibold rounded bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 inline-flex items-center gap-1 cursor-pointer transition-colors disabled:opacity-50"
                        title="Testar requisição HTTP ou seletor Scraper imediatamente"
                      >
                        <Zap className={`w-3 h-3 ${isTesting ? 'animate-bounce text-amber-600' : 'text-blue-600'}`} />
                        <span>{isTesting ? 'Testando...' : 'Testar Coleta'}</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredSources.length === 0 && (
          <div className="p-8 text-center text-slate-400 text-xs">
            Nenhuma fonte encontrada com os filtros selecionados.
          </div>
        )}
      </div>

      {/* Modal: Test Probe Result */}
      {testResultModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl max-w-xl w-full p-5 space-y-4 shadow-2xl text-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Resultado do Teste de Coleta</h3>
                  <p className="text-[11px] text-slate-500">Probing em tempo real • Conexão validada</p>
                </div>
              </div>
              <button
                onClick={() => setTestResultModal(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-3 gap-2">
                <div className="p-2.5 rounded bg-slate-50 border border-slate-200">
                  <div className="text-slate-500 text-[10px] uppercase font-bold">Status HTTP</div>
                  <div className="text-sm font-bold text-green-700">200 OK</div>
                </div>
                <div className="p-2.5 rounded bg-slate-50 border border-slate-200">
                  <div className="text-slate-500 text-[10px] uppercase font-bold">Latência</div>
                  <div className="text-sm font-bold text-slate-800">{testResultModal.latencyMs} ms</div>
                </div>
                <div className="p-2.5 rounded bg-slate-50 border border-slate-200">
                  <div className="text-slate-500 text-[10px] uppercase font-bold">Tipo Conector</div>
                  <div className="text-sm font-bold text-blue-700">{testResultModal.type}</div>
                </div>
              </div>

              <div>
                <div className="text-slate-600 text-[11px] mb-1 font-semibold">URL / Endpoint Testado:</div>
                <div className="p-2 rounded bg-slate-50 font-mono text-[11px] text-slate-700 border border-slate-200 break-all">
                  {testResultModal.urlTested}
                </div>
              </div>

              <div>
                <div className="text-slate-600 text-[11px] mb-1 font-semibold">Payload / Elementos Extraídos:</div>
                <pre className="p-3 rounded bg-slate-50 font-mono text-[10.5px] text-slate-800 border border-slate-200 max-h-48 overflow-y-auto">
                  {JSON.stringify(testResultModal.payloadPreview, null, 2)}
                </pre>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                onClick={() => setTestResultModal(null)}
                className="px-3.5 py-1.5 text-xs font-bold rounded bg-slate-800 hover:bg-slate-900 text-white cursor-pointer"
              >
                Concluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: New Source Connector Form */}
      {isNewSourceModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl max-w-lg w-full p-5 space-y-4 shadow-2xl text-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Plus className="w-4 h-4 text-blue-600" />
                <span>Cadastrar Novo Conector (RF-01)</span>
              </h3>
              <button
                onClick={() => setIsNewSourceModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitNewSource} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Nome do Órgão / Prefeitura *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Prefeitura Municipal de Três Passos"
                  value={newSourceForm.name || ''}
                  onChange={e => setNewSourceForm({ ...newSourceForm, name: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded p-2 text-slate-800 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Categoria</label>
                  <select
                    value={newSourceForm.category || 'Prefeitura'}
                    onChange={e => setNewSourceForm({ ...newSourceForm, category: e.target.value as EntityCategory })}
                    className="w-full bg-white border border-slate-200 rounded p-2 text-slate-800 focus:border-blue-500 focus:outline-none"
                  >
                    <option value="Prefeitura">Prefeitura Municipal</option>
                    <option value="SESC">SESC</option>
                    <option value="SENAT">SEST SENAT</option>
                    <option value="SESI">SESI</option>
                    <option value="ComprasNet">ComprasNet</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Tipo de Conector *</label>
                  <select
                    value={newSourceForm.type || 'SCRAPER'}
                    onChange={e => setNewSourceForm({ ...newSourceForm, type: e.target.value as SourceType })}
                    className="w-full bg-white border border-slate-200 rounded p-2 text-slate-800 focus:border-blue-500 focus:outline-none"
                  >
                    <option value="SCRAPER">Web Scraper (HTML / Regex)</option>
                    <option value="API">API REST (JSON)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">UF</label>
                  <input
                    type="text"
                    maxLength={2}
                    placeholder="RS"
                    value={newSourceForm.uf || 'RS'}
                    onChange={e => setNewSourceForm({ ...newSourceForm, uf: e.target.value.toUpperCase() })}
                    className="w-full bg-white border border-slate-200 rounded p-2 text-slate-800 focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Cidade</label>
                  <input
                    type="text"
                    placeholder="Nome do município"
                    value={newSourceForm.city || ''}
                    onChange={e => setNewSourceForm({ ...newSourceForm, city: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded p-2 text-slate-800 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  {newSourceForm.type === 'API' ? 'Endpoint REST (URL) *' : 'URL do Portal de Licitações *'}
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://..."
                  value={newSourceForm.endpointOrUrl || ''}
                  onChange={e => setNewSourceForm({ ...newSourceForm, endpointOrUrl: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded p-2 text-slate-800 focus:border-blue-500 focus:outline-none font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  {newSourceForm.type === 'API' ? 'Parâmetros de Consulta (Query Params)' : 'Seletores CSS / XPath'}
                </label>
                <input
                  type="text"
                  placeholder={newSourceForm.type === 'API' ? '?ncm=9506.91&status=aberta' : 'table.licitacoes tr.edital-item'}
                  value={newSourceForm.selectorOrParams || ''}
                  onChange={e => setNewSourceForm({ ...newSourceForm, selectorOrParams: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded p-2 text-slate-800 focus:border-blue-500 focus:outline-none font-mono text-[11px]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewSourceModalOpen(false)}
                  className="px-3 py-1.5 rounded text-slate-500 hover:text-slate-800 hover:bg-slate-100 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 font-bold rounded bg-blue-600 hover:bg-blue-500 text-white cursor-pointer shadow-xs"
                >
                  Salvar Conector
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
