import React, { useState } from 'react';
import { 
  GitCompare, 
  CheckCircle2, 
  AlertTriangle, 
  PlusCircle, 
  MinusCircle, 
  RefreshCw, 
  FileText, 
  ExternalLink,
  Calendar,
  Layers,
  ArrowRight
} from 'lucide-react';
import { RetificationDiff, Edital } from '../types';

interface RetificationDiffViewProps {
  diffs: RetificationDiff[];
  editais: Edital[];
  onSelectEdital: (edital: Edital) => void;
}

export const RetificationDiffView: React.FC<RetificationDiffViewProps> = ({
  diffs,
  editais,
  onSelectEdital
}) => {
  const [selectedDiffId, setSelectedDiffId] = useState<string>(diffs[0]?.id || '');
  const activeDiff = diffs.find(d => d.id === selectedDiffId) || diffs[0];

  const targetEdital = activeDiff ? editais.find(e => e.id === activeDiff.retifiedEditalId) : null;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <GitCompare className="w-4 h-4 text-blue-600" />
            <span>Gestão de Retificações & Diff Textual</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Classificação automática de achados (Corrigido / Persistente / Inconclusivo) conforme RF-10
          </p>
        </div>
      </div>

      {/* Diffs Selector Tabs */}
      <div className="flex overflow-x-auto gap-2 pb-1">
        {diffs.map(diff => {
          const isSelected = diff.id === activeDiff?.id;
          return (
            <button
              key={diff.id}
              onClick={() => setSelectedDiffId(diff.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer border shadow-xs ${
                isSelected
                  ? 'bg-blue-50 text-blue-700 border-blue-500'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <GitCompare className="w-3.5 h-3.5" />
              <span>{diff.processNumber}</span>
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-purple-100 text-purple-700 border border-purple-200">
                v1.0 → v2.0
              </span>
            </button>
          );
        })}
      </div>

      {activeDiff ? (
        <div className="space-y-4">
          {/* Diff Summary Card */}
          <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-3.5 shadow-xs text-slate-800">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
              <div>
                <span className="text-[10.5px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 border border-slate-200 mr-2">
                  {activeDiff.entityName}
                </span>
                <span className="text-xs font-bold text-slate-800 font-mono">
                  {activeDiff.processNumber}
                </span>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                <Calendar className="w-3.5 h-3.5" />
                <span>Análise de Retificação: {new Date(activeDiff.dateAnalyzed).toLocaleDateString('pt-BR')}</span>
              </div>
            </div>

            <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-200">
              <strong className="text-slate-800">Resumo do Impacto da Retificação:</strong> {activeDiff.summary}
            </p>

            {/* Findings Transitions (RF-10) */}
            <div className="space-y-2.5">
              <div className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <RefreshCw className="w-3.5 h-3.5 text-blue-600" />
                <span>Transição de Status dos Achados Anteriores</span>
              </div>

              <div className="space-y-2">
                {activeDiff.findingsTransitions.map((t, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="text-slate-500 text-[11px]">
                        Cláusula Anterior: <span className="text-slate-700 italic">"{t.previousSnippet}"</span>
                      </div>
                      <div className="text-slate-800">
                        <strong>Motivação Técnica:</strong> {t.justification}
                      </div>
                    </div>

                    <div className="shrink-0">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                        t.newStatus === 'CORRIGIDO'
                          ? 'bg-green-100 text-green-800 border border-green-200'
                          : t.newStatus === 'PERSISTENTE'
                          ? 'bg-rose-100 text-rose-800 border border-rose-200'
                          : 'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}>
                        {t.newStatus === 'CORRIGIDO' ? '✓ Corrigido pela Administração' : t.newStatus}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Side-by-side or Clause Diff Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-1">
              {/* Removed Clauses (Expurgadas) */}
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 space-y-2">
                <div className="text-rose-800 font-bold text-xs uppercase flex items-center gap-1.5">
                  <MinusCircle className="w-3.5 h-3.5 text-rose-600" />
                  <span>Cláusulas Revogadas / Excluídas ({activeDiff.removedClauses.length})</span>
                </div>
                <div className="space-y-1.5">
                  {activeDiff.removedClauses.map((c, i) => (
                    <div key={i} className="p-2 rounded bg-white border border-rose-200 text-slate-700 font-mono text-[11px] leading-relaxed">
                      <span className="text-rose-700 font-bold mr-1">[Pág. {c.page}]</span>
                      <del className="text-rose-800/80">{c.text}</del>
                    </div>
                  ))}
                </div>
              </div>

              {/* Added Clauses (Novas Inclusões) */}
              <div className="p-3 rounded-lg bg-green-50 border border-green-200 space-y-2">
                <div className="text-green-800 font-bold text-xs uppercase flex items-center gap-1.5">
                  <PlusCircle className="w-3.5 h-3.5 text-green-600" />
                  <span>Novas Cláusulas Inseridas ({activeDiff.addedClauses.length})</span>
                </div>
                <div className="space-y-1.5">
                  {activeDiff.addedClauses.map((c, i) => (
                    <div key={i} className="p-2 rounded bg-white border border-green-200 text-slate-700 font-mono text-[11px] leading-relaxed">
                      <span className="text-green-700 font-bold mr-1">[Pág. {c.page}]</span>
                      <ins className="text-green-800 no-underline font-medium">{c.text}</ins>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modified Clauses */}
            {activeDiff.modifiedClauses.length > 0 && (
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-2 text-xs">
                <div className="text-blue-700 font-bold text-xs uppercase flex items-center gap-1.5">
                  <GitCompare className="w-3.5 h-3.5 text-blue-600" />
                  <span>Alterações Pontuais de Campo / Texto</span>
                </div>

                <div className="space-y-1.5">
                  {activeDiff.modifiedClauses.map((m, i) => (
                    <div key={i} className="p-2.5 rounded bg-white border border-slate-200 space-y-1">
                      <div className="font-bold text-slate-800">
                        {m.field} (Página {m.page})
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-[11px]">
                        <span className="text-rose-700 line-through bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200">
                          {m.oldText}
                        </span>
                        <ArrowRight className="w-3 h-3 text-slate-400 hidden sm:inline" />
                        <span className="text-green-800 font-semibold bg-green-50 px-1.5 py-0.2 rounded border border-green-200">
                          {m.newText}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action to target edital */}
            {targetEdital && (
              <div className="flex justify-end pt-1">
                <button
                  onClick={() => onSelectEdital(targetEdital)}
                  className="px-3.5 py-1.5 text-xs font-bold rounded bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Ver Edital Retificado v2.0 Completo</span>
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="p-8 text-center text-slate-400 text-xs bg-white rounded-lg border border-slate-200">
          Nenhuma retificação cadastrada no momento.
        </div>
      )}
    </div>
  );
};
