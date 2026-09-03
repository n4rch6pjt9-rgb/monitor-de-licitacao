import React, { useState } from 'react';
import { 
  MessageSquare, 
  Send, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ExternalLink, 
  Phone, 
  ShieldCheck, 
  Copy, 
  Check,
  Zap,
  Smartphone
} from 'lucide-react';
import { WhatsAppNotification, Edital } from '../types';

interface WhatsAppNotificationsViewProps {
  notifications: WhatsAppNotification[];
  editais: Edital[];
  onSendNotification: (editalId: string, phone: string) => Promise<any>;
}

export const WhatsAppNotificationsView: React.FC<WhatsAppNotificationsViewProps> = ({
  notifications,
  editais,
  onSendNotification
}) => {
  const [selectedEditalId, setSelectedEditalId] = useState<string>(
    editais.find(e => e.humanReviewStatus === 'APPROVED')?.id || editais[0]?.id || ''
  );
  const [phoneInput, setPhoneInput] = useState('+55 55 99876-5432');
  const [isSending, setIsSending] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const selectedEdital = editais.find(e => e.id === selectedEditalId);
  const isSelectedApproved = selectedEdital?.humanReviewStatus === 'APPROVED';

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEditalId) return;

    setErrorMessage(null);
    setSuccessMessage(null);

    if (!isSelectedApproved) {
      setErrorMessage('Regra de Ouro do PRD: O edital deve ter Revisão Humana Aprovada antes do disparo de notificações externas.');
      return;
    }

    setIsSending(true);
    try {
      await onSendNotification(selectedEditalId, phoneInput);
      setSuccessMessage('Notificação enviada com sucesso via Meta Business Cloud API!');
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao disparar notificação');
    } finally {
      setIsSending(false);
    }
  };

  const handleCopyMessage = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-blue-600" />
            <span>Notificações WhatsApp (Meta Business API)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Disparos automáticos e sob demanda conforme RF-09 (Template homologado Meta Cloud)
          </p>
        </div>
      </div>

      {/* Grid: Dispatch Simulator & History */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column (5/12): Dispatch Console */}
        <div className="lg:col-span-5 space-y-3">
          <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-3.5 shadow-xs text-slate-800">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2.5">
              <Zap className="w-4 h-4 text-blue-600" />
              <span>Disparar Notificação Meta Cloud API (RF-09)</span>
            </div>

            <form onSubmit={handleSend} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Selecione o Edital Homologado *
                </label>
                <select
                  value={selectedEditalId}
                  onChange={e => {
                    setSelectedEditalId(e.target.value);
                    setErrorMessage(null);
                    setSuccessMessage(null);
                  }}
                  className="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5 text-slate-800 focus:outline-none focus:border-blue-500 text-xs"
                >
                  {editais.map(e => (
                    <option key={e.id} value={e.id}>
                      [{e.humanReviewStatus === 'APPROVED' ? '✓ REVISADO' : '⏳ PENDENTE'}] {e.sourceName} - {e.processNumber}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Telefone Destinatário (WhatsApp) *
                </label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="+55 55 99876-5432"
                    value={phoneInput}
                    onChange={e => setPhoneInput(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded pl-8 pr-3 py-1.5 text-slate-800 focus:outline-none focus:border-blue-500 font-mono text-xs"
                  />
                </div>
              </div>

              {/* Message Template Preview (Strict PRD Compliance) */}
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5">
                <div className="text-[10px] font-bold text-slate-500 uppercase">
                  Prévia da Mensagem (Template Meta Homologado):
                </div>
                <div className="p-2.5 rounded bg-green-50 border border-green-200 text-green-900 font-mono text-[11px] leading-relaxed whitespace-pre-wrap">
                  {`🚨 *Novo relatório:* ${selectedEdital ? selectedEdital.sourceName : 'Nome Prefeitura/Entidade'}\nEdital ${selectedEdital ? selectedEdital.processNumber : '000/2026'} (NCM 9506.91.00 - Cultura Física)\nStatus: Revisão Concluída\nAcesse com segurança: https://monitor-editais.gov.br/r/${selectedEdital?.id || 'id'}`}
                </div>
              </div>

              {/* Warning or Success alerts */}
              {!isSelectedApproved && (
                <div className="p-2.5 rounded bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                  <span>
                    <strong>Atenção:</strong> Este edital ainda não possui Revisão Humana Aprovada. O envio permanece bloqueado conforme a Regra de Ouro do PRD v1.1.
                  </span>
                </div>
              )}

              {errorMessage && (
                <div className="p-2.5 rounded bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                  {errorMessage}
                </div>
              )}

              {successMessage && (
                <div className="p-2.5 rounded bg-green-50 border border-green-200 text-green-800 text-xs flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span>{successMessage}</span>
                </div>
              )}

              <div className="pt-1">
                <button
                  type="submit"
                  disabled={!isSelectedApproved || isSending}
                  className="w-full py-2 px-4 text-xs font-bold rounded bg-green-600 hover:bg-green-500 text-white flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50 transition-colors"
                >
                  <Send className={`w-3.5 h-3.5 ${isSending ? 'animate-bounce' : ''}`} />
                  <span>{isSending ? 'Enviando Mensagem...' : 'Disparar Notificação'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column (7/12): Notification Dispatch History */}
        <div className="lg:col-span-7 space-y-3">
          <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-3.5 shadow-xs text-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 uppercase tracking-wider">
                <Clock className="w-4 h-4 text-blue-600" />
                <span>Histórico de Notificações Enviadas ({notifications.length})</span>
              </div>
              <span className="text-[11px] text-slate-500 font-medium">Status em Tempo Real</span>
            </div>

            <div className="space-y-2.5 max-h-[70vh] overflow-y-auto pr-1">
              {notifications.map(notif => {
                const encodedMsg = encodeURIComponent(notif.messageBody);
                const rawDigits = notif.recipientPhone.replace(/[^0-9]/g, '');
                const waLink = `https://api.whatsapp.com/send?phone=${rawDigits}&text=${encodedMsg}`;

                return (
                  <div
                    key={notif.id}
                    className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-2 text-xs"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-800">{notif.entityName}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-white text-slate-600 border border-slate-200 font-semibold">
                          {notif.processNumber}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] px-1.5 py-0.2 rounded font-bold bg-green-100 text-green-800 border border-green-200 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-green-600" />
                          <span>{notif.status}</span>
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {new Date(notif.sentAt).toLocaleTimeString('pt-BR')}
                        </span>
                      </div>
                    </div>

                    <pre className="p-2.5 rounded bg-white font-mono text-[11px] text-slate-700 whitespace-pre-wrap leading-relaxed border border-slate-200">
                      {notif.messageBody}
                    </pre>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                      <div className="text-[11px] text-slate-500">
                        Destinatário: <strong className="text-slate-700">{notif.recipientPhone}</strong>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleCopyMessage(notif.messageBody, notif.id)}
                          className="px-2 py-1 rounded bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-[11px] font-medium flex items-center gap-1 cursor-pointer"
                        >
                          {copiedId === notif.id ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedId === notif.id ? 'Copiado' : 'Copiar'}</span>
                        </button>

                        <a
                          href={waLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2 py-1 rounded bg-green-50 hover:bg-green-100 text-green-800 border border-green-200 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <Smartphone className="w-3 h-3 text-green-700" />
                          <span>Abrir WhatsApp Web</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}

              {notifications.length === 0 && (
                <div className="p-6 text-center text-slate-400 text-xs">
                  Nenhuma notificação enviada ainda.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
