import React, { useMemo, useState } from 'react';
import { Account, Transaction } from '../types';
import { calculateAccountBalanceAsOf, calculateReconciliationDifference, getTransactionImpactOnAccount } from '../utils/accounting';
import { formatCurrency, formatCurrencyInput, formatDateBR, getTodayDateStr, parseCurrencyInput } from '../utils/formatters';
import { Check, Scale, X } from 'lucide-react';

interface ReconciliationModalProps {
  accounts: Account[];
  transactions: Transaction[];
  isOpen: boolean;
  onClose: () => void;
  onRecordAdjustment: (transaction: Omit<Transaction, 'id'>) => void;
}

export const ReconciliationModal: React.FC<ReconciliationModalProps> = ({
  accounts,
  transactions,
  isOpen,
  onClose,
  onRecordAdjustment,
}) => {
  const reconcilableAccounts = accounts;
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? '');
  const [asOfDate, setAsOfDate] = useState(getTodayDateStr());
  const [statementBalanceInput, setStatementBalanceInput] = useState('');
  const [formError, setFormError] = useState('');
  const account = reconcilableAccounts.find((item) => item.id === accountId);
  const enteredStatementBalance = parseCurrencyInput(statementBalanceInput);
  const statementBalance = account?.type === 'cartao'
    ? -Math.abs(enteredStatementBalance)
    : enteredStatementBalance;
  const hasStatementBalance = statementBalanceInput.trim() !== '';
  const recordedBalance = useMemo(
    () => account ? calculateAccountBalanceAsOf(account, transactions, asOfDate) : 0,
    [account, transactions, asOfDate]
  );
  const difference = hasStatementBalance
    ? calculateReconciliationDifference(statementBalance, recordedBalance)
    : 0;
  const relevantTransactions = useMemo(() => {
    if (!account) return [];
    return transactions
      .filter((transaction) =>
        transaction.date <= asOfDate &&
        getTransactionImpactOnAccount(transaction, account.name, transactions) !== 0
      )
      .sort((left, right) => right.date.localeCompare(left.date))
      .slice(0, 8);
  }, [account, transactions, asOfDate]);

  if (!isOpen) return null;

  const handleRecordAdjustment = () => {
    setFormError('');
    if (!account) {
      setFormError('Cadastre uma conta antes de iniciar a conciliação.');
      return;
    }
    if (!asOfDate || !hasStatementBalance || !Number.isFinite(statementBalance)) {
      setFormError('Informe a data e o saldo que aparecem no extrato.');
      return;
    }
    if (difference === 0) {
      onClose();
      return;
    }

    const signedDifference = difference;
    onRecordAdjustment({
      date: asOfDate,
      description: `Ajuste de conciliação - ${account.name}`,
      category: 'Ajuste de conciliação',
      account: account.name,
      amount: signedDifference,
      type: signedDifference < 0 ? 'despesa' : 'receita',
      isConsolidated: true,
      note: `Conciliação em ${formatDateBR(asOfDate)}. Saldo registrado antes do ajuste: ${formatCurrency(recordedBalance)}. Saldo informado no extrato: ${formatCurrency(statementBalance)}. Diferença ajustada: ${formatCurrency(signedDifference)}. O ajuste foi registrado como novo lançamento; os lançamentos anteriores foram preservados.`,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/55 p-3 sm:p-5" role="presentation">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="reconciliation-title"
        className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-slate-300 bg-white shadow-2xl"
      >
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 sm:px-5">
          <div className="flex items-center gap-2.5">
            <Scale className="h-5 w-5 text-[#5a8710]" aria-hidden="true" />
            <div>
              <h2 id="reconciliation-title" className="text-base font-black text-slate-900">Conciliar saldo</h2>
              <p className="text-xs text-slate-600">Compare com o extrato bancário sem apagar lançamentos.</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded p-1.5 text-slate-600 hover:bg-slate-100" aria-label="Fechar conciliação">
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="space-y-4 p-4 sm:p-5">
          {reconcilableAccounts.length === 0 ? (
            <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-950">
              Não há contas bancárias para conciliar. Cadastre uma conta corrente, poupança, carteira ou investimento primeiro.
            </div>
          ) : (
            <>
              <div className="grid gap-3 sm:grid-cols-3">
                <label className="space-y-1 text-xs font-bold text-slate-700">
                  Conta
                  <select
                    value={account?.id ?? ''}
                    onChange={(event) => setAccountId(event.target.value)}
                    className="w-full rounded border border-slate-300 bg-white px-2.5 py-2 text-sm font-semibold text-slate-900"
                  >
                    {reconcilableAccounts.map((item) => (
                      <option key={item.id} value={item.id}>{item.name}</option>
                    ))}
                  </select>
                </label>
                <label className="space-y-1 text-xs font-bold text-slate-700">
                  Saldo em
                  <input
                    type="date"
                    value={asOfDate}
                    onChange={(event) => setAsOfDate(event.target.value)}
                    className="w-full rounded border border-slate-300 bg-white px-2.5 py-2 text-sm font-semibold text-slate-900"
                  />
                </label>
                <label className="space-y-1 text-xs font-bold text-slate-700">
                  {account?.type === 'cartao' ? 'Fatura em aberto (R$)' : 'Saldo no extrato (R$)'}
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="0,00"
                    value={statementBalanceInput}
                    onChange={(event) => {
                      const isNegative = event.target.value.includes('-');
                      const formatted = formatCurrencyInput(event.target.value.replace(/-/g, ''));
                      setStatementBalanceInput(formatted && isNegative ? `-${formatted}` : formatted);
                    }}
                    className="w-full rounded border border-slate-300 bg-white px-2.5 py-2 text-right text-sm font-bold tabular-nums text-slate-900"
                  />
                </label>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-slate-600">Saldo calculado no app</p>
                  <p className="mt-1 text-lg font-black tabular-nums text-slate-900">{formatCurrency(recordedBalance)}</p>
                  <p className="mt-0.5 text-[11px] text-slate-600">
                    {account?.type === 'cartao'
                      ? 'Fatura tratada como dívida (saldo negativo), após pagamentos e lançamentos consolidados.'
                      : 'Inclui saldo inicial e lançamentos consolidados'} até {formatDateBR(asOfDate)}.
                  </p>
                </div>
                <div className={`rounded-md border p-3 ${!hasStatementBalance ? 'border-slate-200 bg-slate-50' : difference === 0 ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'}`}>
                  <p className="text-[11px] font-bold uppercase tracking-wide text-slate-600">Diferença (extrato − app)</p>
                  <p className="mt-1 text-lg font-black tabular-nums text-slate-900">
                    {hasStatementBalance ? `${difference > 0 ? '+' : ''}${formatCurrency(difference)}` : 'Informe o saldo do extrato'}
                  </p>
                  {hasStatementBalance && (
                    <p className="mt-0.5 text-[11px] font-semibold text-slate-700">
                      {difference === 0 ? 'Os saldos conferem.' : 'Será registrado como um novo lançamento consolidado.'}
                    </p>
                  )}
                </div>
              </div>

              <div className="overflow-hidden rounded-md border border-slate-200">
                <div className="border-b border-slate-200 bg-slate-50 px-3 py-2">
                  <h3 className="text-xs font-black text-slate-800">Lançamentos que compõem o saldo (até 8 mais recentes)</h3>
                </div>
                {relevantTransactions.length === 0 ? (
                  <p className="px-3 py-4 text-center text-xs text-slate-600">Nenhum lançamento consolidado nesta conta até a data escolhida.</p>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {relevantTransactions.map((transaction) => {
                      const impact = getTransactionImpactOnAccount(transaction, account?.name ?? '', transactions);
                      return (
                        <div key={transaction.id} className="grid grid-cols-[1fr_auto] items-center gap-3 px-3 py-2 text-xs">
                          <div className="min-w-0">
                            <p className="truncate font-bold text-slate-800">{transaction.description}</p>
                            <p className="text-[10.5px] text-slate-500">
                              {formatDateBR(transaction.date)} · {transaction.isConsolidated ? 'Consolidado' : 'Pendente (não incluído no saldo)'}
                            </p>
                          </div>
                          <span className={`font-black tabular-nums ${transaction.isConsolidated ? (impact < 0 ? 'text-red-700' : 'text-emerald-700') : 'text-slate-500'}`}>
                            {transaction.isConsolidated ? formatCurrency(impact) : 'Pendente'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}

          {formError && <p role="alert" className="rounded border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-800">{formError}</p>}
          <p className="text-[11px] leading-relaxed text-slate-600">
            Se houver diferença, confira os lançamentos acima. Se optar pelo ajuste, ele será adicionado ao histórico com a data e os valores usados nesta conciliação; nenhum lançamento existente será alterado ou excluído.
          </p>
        </div>

        <footer className="flex flex-wrap justify-end gap-2 border-t border-slate-200 bg-slate-50 px-4 py-3 sm:px-5">
          <button type="button" onClick={onClose} className="rounded border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-800 hover:bg-slate-100">Cancelar</button>
          <button
            type="button"
            onClick={handleRecordAdjustment}
            disabled={!account || !hasStatementBalance}
            className="inline-flex items-center gap-1.5 rounded bg-[#5a8710] px-3.5 py-2 text-xs font-black text-white hover:bg-[#4d740c] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Check className="h-4 w-4" aria-hidden="true" />
            {difference === 0 && hasStatementBalance ? 'Concluir conciliação' : 'Registrar ajuste no histórico'}
          </button>
        </footer>
      </section>
    </div>
  );
};
