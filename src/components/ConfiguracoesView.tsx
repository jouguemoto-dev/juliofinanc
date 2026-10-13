import React, { useState, useEffect } from 'react';
import { Account, Category, CreditCard } from '../types';
import { formatCurrency } from '../utils/formatters';
import { Trash2, Plus, Edit2, ShieldCheck, CreditCard as CardIcon, Download, Upload, Cloud, HardDrive, Clock } from 'lucide-react';

interface ConfiguracoesViewProps {
  accounts: Account[];
  categories: Category[];
  creditCards?: CreditCard[];
  initialSubTab?: 'contas' | 'categorias' | 'regras' | 'cartoes' | 'backup';
  storageMode?: 'local' | 'cloud';
  isSyncing?: boolean;
  storageStatusText?: string;
  lastBackupText?: string;
  onExportBackup?: () => void;
  onImportBackup?: () => void;
  onAddCategory: (cat: Category) => void;
  onEditCategory: (cat: Category) => void;
  onDeleteCategory: (id: string) => void;
  onOpenNewAccountModal: () => void;
  onEditAccount: (account: Account) => void;
  onDeleteAccount: (id: string) => void;
  onOpenNewCreditCardModal?: () => void;
  onEditCreditCard?: (card: CreditCard) => void;
  onDeleteCreditCard?: (id: string) => void;
  onResetDataToZero?: () => void;
}

export const ConfiguracoesView: React.FC<ConfiguracoesViewProps> = ({
  accounts,
  categories,
  creditCards = [],
  initialSubTab = 'contas',
  storageMode = 'local',
  isSyncing = false,
  storageStatusText = 'Ainda não registrado',
  lastBackupText = 'Ainda não registrado',
  onExportBackup,
  onImportBackup,
  onAddCategory,
  onEditCategory,
  onDeleteCategory,
  onOpenNewAccountModal,
  onEditAccount,
  onDeleteAccount,
  onOpenNewCreditCardModal,
  onEditCreditCard,
  onDeleteCreditCard,
  onResetDataToZero,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'contas' | 'categorias' | 'regras' | 'cartoes' | 'backup'>(initialSubTab);
  const [newCatName, setNewCatName] = useState('');
  const [newCatType, setNewCatType] = useState<'despesa' | 'receita'>('despesa');
  const [cardToDelete, setCardToDelete] = useState<CreditCard | null>(null);

  useEffect(() => {
    if (initialSubTab) {
      setActiveSubTab(initialSubTab);
    }
  }, [initialSubTab]);

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    onAddCategory({
      id: `cat-${Date.now()}`,
      name: newCatName.trim(),
      type: newCatType,
    });
    setNewCatName('');
  };

  return (
    <div className="flex-1 bg-white min-w-0 text-[14.5px] font-sans select-none space-y-4 text-[#000000]">
      <div className="pb-2 border-b border-[#bbbbbb] flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-[16px] font-black text-[#000000]">Configurações do Sistema</h2>
          <p className="text-[13px] text-[#000000] font-bold">Gerencie suas contas, cartões, categorias, sincronização e backups.</p>
        </div>

        {/* Subtabs */}
        <div className="flex max-w-full overflow-x-auto border-2 border-[#888888] rounded-xs">
          <button
            onClick={() => setActiveSubTab('contas')}
            className={`px-3 sm:px-4 py-1.5 text-[13px] font-black cursor-pointer ${
              activeSubTab === 'contas' ? 'bg-[#577708] text-white' : 'bg-gray-100 text-[#000000] hover:bg-gray-200'
            }`}
          >
            Contas
          </button>
          <button
            onClick={() => setActiveSubTab('cartoes')}
            className={`px-3 sm:px-4 py-1.5 text-[13px] font-black cursor-pointer ${
              activeSubTab === 'cartoes' ? 'bg-[#577708] text-white' : 'bg-gray-100 text-[#000000] hover:bg-gray-200'
            }`}
          >
            Cartões ({creditCards.length})
          </button>
          <button
            onClick={() => setActiveSubTab('categorias')}
            className={`px-3 sm:px-4 py-1.5 text-[13px] font-black cursor-pointer ${
              activeSubTab === 'categorias' ? 'bg-[#577708] text-white' : 'bg-gray-100 text-[#000000] hover:bg-gray-200'
            }`}
          >
            Categorias
          </button>
          <button
            onClick={() => setActiveSubTab('regras')}
            className={`px-3 sm:px-4 py-1.5 text-[13px] font-black cursor-pointer ${
              activeSubTab === 'regras' ? 'bg-[#577708] text-white' : 'bg-gray-100 text-[#000000] hover:bg-gray-200'
            }`}
          >
            Regras
          </button>
          <button
            onClick={() => setActiveSubTab('backup')}
            className={`px-3 sm:px-4 py-1.5 text-[13px] font-black cursor-pointer ${
              activeSubTab === 'backup' ? 'bg-[#577708] text-white' : 'bg-gray-100 text-[#000000] hover:bg-gray-200'
            }`}
          >
            Backup e dados
          </button>
        </div>
      </div>

      {activeSubTab === 'backup' && (
        <section className="space-y-4 rounded-md border border-slate-200 bg-white p-4 sm:p-5">
          <div className="flex items-start gap-3">
            {storageMode === 'local' ? (
              <HardDrive className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" aria-hidden="true" />
            ) : (
              <Cloud className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" aria-hidden="true" />
            )}
            <div>
              <h3 className="text-sm font-black text-slate-900">
                {storageMode === 'local' ? 'Dados somente neste dispositivo' : 'Dados sincronizados na nuvem'}
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-slate-600">
                {storageStatusText}
                {isSyncing ? ' Sincronização em andamento.' : ''}
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
              <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-wide text-slate-600">
                <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                Último backup exportado
              </div>
              <p className="mt-1 text-sm font-bold text-slate-900">{lastBackupText}</p>
            </div>
            <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3">
              <p className="text-[11px] font-black uppercase tracking-wide text-emerald-900">Proteja seus dados</p>
              <p className="mt-1 text-xs leading-relaxed text-emerald-900">
                Baixe um arquivo JSON e guarde-o em local seguro. O backup não substitui a sincronização em nuvem.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 border-t border-slate-200 pt-4">
            <button
              type="button"
              onClick={onExportBackup}
              className="inline-flex items-center gap-1.5 rounded border border-[#5a8710] bg-[#5a8710] px-3.5 py-2 text-xs font-black text-white hover:bg-[#4d740c]"
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              Fazer backup agora
            </button>
            <button
              type="button"
              onClick={onImportBackup}
              className="inline-flex items-center gap-1.5 rounded border border-slate-300 bg-white px-3.5 py-2 text-xs font-black text-slate-800 hover:bg-slate-50"
            >
              <Upload className="h-4 w-4" aria-hidden="true" />
              Restaurar backup
            </button>
          </div>
          <p className="text-[11px] leading-relaxed text-amber-900">
            Atenção: restaurar um backup substitui os dados atuais. O app pedirá confirmação antes de prosseguir.
          </p>
        </section>
      )}

      {activeSubTab === 'cartoes' && (
        <div className="space-y-3">
          <div className="flex justify-between items-center flex-wrap gap-2">
            <span className="font-black text-[14.5px] text-[#000000]">
              Cartões de Crédito Cadastrados ({creditCards.length})
            </span>
            {onOpenNewCreditCardModal && (
              <button
                type="button"
                onClick={onOpenNewCreditCardModal}
                className="bg-[#5a8710] hover:bg-[#4d740c] text-white px-4 py-1.5 font-black rounded-xs text-[13px] cursor-pointer flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
                <span>+ Novo Cartão</span>
              </button>
            )}
          </div>

          {creditCards.length === 0 ? (
            <div className="border border-dashed border-[#b8b8b8] bg-gray-50 p-8 text-center text-gray-600 font-bold">
              Nenhum cartão cadastrado ainda. Clique em “+ Novo Cartão” para cadastrar.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {creditCards.map((card) => (
                <article
                  key={card.id}
                  className="overflow-hidden rounded-xl border border-[#b8b8b8] bg-white shadow-sm"
                >
                  <div
                    className="min-h-32 p-4 text-white flex flex-col justify-between"
                    style={{
                      background: `linear-gradient(135deg, ${card.color || '#334155'} 0%, #1e293b 100%)`,
                    }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-2">
                        <CardIcon className="h-6 w-6 shrink-0" />
                        <span className="truncate font-black uppercase tracking-wide">
                          {card.name}
                        </span>
                      </div>
                      <span className="shrink-0 rounded bg-black/20 px-2 py-1 text-[10px] font-black uppercase tracking-wider">
                        {card.brand}
                      </span>
                    </div>
                    <div className="flex items-end justify-between gap-3">
                      <span className="text-sm font-semibold tracking-[0.2em]">
                        {card.last4Digits ? `•••• ${card.last4Digits}` : '•••• ••••'}
                      </span>
                      <span className="text-right text-[11px] font-semibold text-white/85">
                        Fecha dia {card.closingDay || 5}
                        <br />
                        Vence dia {card.dueDay || 10}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3 p-3.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold uppercase text-gray-600">Limite total</span>
                      <span className="text-lg font-black tabular-nums text-[#000000]">
                        {formatCurrency(card.limit || 0)}
                      </span>
                    </div>
                    <div className="flex items-center justify-end gap-2 border-t border-gray-200 pt-3">
                      {onEditCreditCard && (
                        <button
                          type="button"
                          onClick={() => onEditCreditCard(card)}
                          className="px-2.5 py-1.5 bg-white hover:bg-gray-100 border border-gray-300 rounded text-[#000000] font-bold cursor-pointer text-xs flex items-center gap-1.5"
                          title="Editar cartão"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-gray-700" />
                          <span>Editar</span>
                        </button>
                      )}
                      {onDeleteCreditCard && (
                        <button
                          type="button"
                          onClick={() => setCardToDelete(card)}
                          className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 border border-red-200 rounded text-red-700 font-bold cursor-pointer text-xs flex items-center gap-1.5"
                          title="Excluir cartão"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-red-600" />
                          <span>Excluir</span>
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}

          {/* Delete Card Confirmation Modal in Config */}
          {cardToDelete && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-2xs flex items-center justify-center p-4">
              <div className="bg-white border-2 border-red-500 shadow-2xl p-4 sm:p-5 max-w-md w-full rounded-xs space-y-3.5">
                <div className="flex items-center gap-2.5 text-red-700">
                  <Trash2 className="w-5 h-5 shrink-0" />
                  <h4 className="font-black text-[15.5px]">Excluir Cartão de Crédito?</h4>
                </div>
                <p className="text-[13px] text-gray-800 font-medium">
                  Tem certeza que deseja excluir o cartão <strong>"{cardToDelete.name}"</strong>?
                </p>
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setCardToDelete(null)}
                    className="px-3 py-1.5 border border-gray-400 bg-white hover:bg-gray-100 font-bold text-[12.5px] rounded-xs cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (onDeleteCreditCard) onDeleteCreditCard(cardToDelete.id);
                      setCardToDelete(null);
                    }}
                    className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white font-black text-[12.5px] rounded-xs cursor-pointer flex items-center gap-1.5 shadow-2xs"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Sim, Excluir</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeSubTab === 'contas' && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="font-black text-[14.5px] text-[#000000]">Contas Cadastradas ({accounts.length})</span>
            <button
              onClick={onOpenNewAccountModal}
              className="bg-[#5a8710] hover:bg-[#4d740c] text-white px-4 py-1.5 font-black rounded-xs text-[13px] cursor-pointer"
            >
              + Nova Conta
            </button>
          </div>

          <div className="border border-[#b8b8b8] bg-white">
            <table className="w-full text-left border-collapse text-[14px]">
              <thead>
                <tr className="bg-[#e8e8e8] border-b border-[#b8b8b8] font-black text-[#000000]">
                  <th className="p-2.5 font-black">Nome</th>
                  <th className="p-2.5 font-black">Tipo</th>
                  <th className="p-2.5 text-right font-black">Saldo Atual</th>
                  <th className="p-2.5 text-center w-24 font-black">Ações</th>
                </tr>
              </thead>
              <tbody>
                {accounts.map(acc => (
                  <tr key={acc.id} className="border-b border-gray-200 hover:bg-[#f9f9f9] group">
                    <td className="p-2.5 font-black text-[#000000]">{acc.name}</td>
                    <td className="p-2.5 text-[#000000] capitalize font-bold">{acc.type}</td>
                    <td className="p-2.5 text-right font-black tabular-nums text-[#000000]">{formatCurrency(acc.balance)}</td>
                    <td className="p-2.5 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => onEditAccount(acc)}
                          className="text-[#000000] hover:text-[#5a8710] font-black p-0.5 cursor-pointer text-[14px]"
                          title="Editar conta"
                        >
                          ✎
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteAccount(acc.id)}
                          className="text-[#000000] hover:text-red-700 font-black p-0.5 cursor-pointer text-[14px]"
                          title="Excluir conta"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Reset / Zerar dados panel */}
          <div className="mt-4 pt-4 border-t border-gray-300 flex items-center justify-between flex-wrap gap-2 bg-[#fcfcfc] p-3 border rounded-xs">
            <div>
              <div className="font-black text-[14px] text-black">Zerar Dados do Sistema</div>
              <div className="text-[12px] text-gray-600">Apaga todos os lançamentos e zera os saldos de todas as contas no banco de dados.</div>
            </div>
            {onResetDataToZero && (
              <button
                type="button"
                onClick={onResetDataToZero}
                className="px-3.5 py-1.5 bg-red-700 hover:bg-red-800 text-white font-bold text-xs rounded cursor-pointer"
              >
                🗑️ Zerar dados
              </button>
            )}
          </div>
        </div>
      )}

      {activeSubTab === 'categorias' && (
        <div className="space-y-3">
          <form onSubmit={handleCreateCategory} className="flex items-center gap-2 bg-[#f4f4f4] p-3 border border-[#b8b8b8]">
            <input
              type="text"
              placeholder="Nova Categoria..."
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              className="border border-[#888888] px-3 py-1.5 text-[14px] font-black text-[#000000] flex-1 bg-white"
            />
            <select
              value={newCatType}
              onChange={(e) => setNewCatType(e.target.value as any)}
              className="border border-[#888888] px-3 py-1.5 text-[14px] font-black text-[#000000] bg-white"
            >
              <option value="despesa">Despesa</option>
              <option value="receita">Receita</option>
            </select>
            <button
              type="submit"
              className="bg-[#5a8710] hover:bg-[#4d740c] text-white px-4 py-1.5 font-black text-[13.5px] rounded-xs cursor-pointer"
            >
              Adicionar
            </button>
          </form>

          <div className="border border-[#b8b8b8] bg-white max-h-96 overflow-y-auto">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 p-3">
              {categories.map(cat => (
                <div key={cat.id} className="p-2.5 border border-[#cccccc] bg-[#fafafa] flex items-center justify-between group">
                  <div className="flex items-center gap-2 truncate">
                    <span className="font-black text-[#000000] truncate text-[14px]">{cat.name}</span>
                    <span className={`text-[11px] font-black px-1.5 py-0.5 rounded shrink-0 ${cat.type === 'receita' ? 'bg-green-100 text-green-950' : 'bg-red-100 text-red-950'}`}>
                      {cat.type}
                    </span>
                  </div>

                  {cat.name !== 'Sem Categoria' && cat.name !== 'Transferência' && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <button
                        type="button"
                        onClick={() => onEditCategory(cat)}
                        className="text-[#000000] hover:text-[#5a8710] font-black p-0.5 cursor-pointer text-[13px]"
                        title="Editar categoria"
                      >
                        ✎
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteCategory(cat.id)}
                        className="text-[#000000] hover:text-red-700 font-black p-0.5 cursor-pointer text-[13px]"
                        title="Excluir categoria"
                      >
                        🗑️
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'regras' && (
        <div className="p-5 border-2 border-[#b8b8b8] bg-[#fafafa] text-center space-y-2">
          <ShieldCheck className="w-9 h-9 text-[#82af07] mx-auto" />
          <h4 className="font-black text-[14.5px] text-[#000000]">Regras de Categorização Automática</h4>
          <p className="text-[#000000] font-bold max-w-md mx-auto text-[12.5px]">
            As regras preenchem automaticamente a categoria e conta ao importar extratos bancários com base em palavras-chave da descrição.
          </p>
        </div>
      )}
    </div>
  );
};
