import { Account, Transaction } from '../types';

export function isMirroredTransfer(transfer: Transaction, transactions: Transaction[]): boolean {
  if (transfer.type !== 'transferencia' || !transfer.toAccount) return false;
  return transactions.some(
    (candidate) =>
      candidate.id !== transfer.id &&
      candidate.type === 'transferencia' &&
      candidate.date === transfer.date &&
      candidate.account.trim().toLowerCase() === transfer.toAccount?.trim().toLowerCase() &&
      candidate.toAccount?.trim().toLowerCase() === transfer.account.trim().toLowerCase() &&
      Math.abs(candidate.amount + transfer.amount) < 0.005 &&
      (!transfer.transferGroupId ||
        !candidate.transferGroupId ||
        candidate.transferGroupId === transfer.transferGroupId)
  );
}

export function getTransactionImpactOnAccount(
  transaction: Transaction,
  accountName: string,
  transactions: Transaction[]
): number {
  const target = accountName.trim().toLowerCase();
  if (transaction.account.trim().toLowerCase() === target) return transaction.amount;
  if (
    transaction.type === 'transferencia' &&
    transaction.toAccount?.trim().toLowerCase() === target &&
    !isMirroredTransfer(transaction, transactions)
  ) {
    return Math.abs(transaction.amount);
  }
  return 0;
}

export function calculateAccountBalance(
  account: Pick<Account, 'name' | 'initialBalance'>,
  transactions: Transaction[],
  includePending: boolean
): number {
  return transactions.reduce((balance, transaction) => {
    if (!includePending && !transaction.isConsolidated) return balance;
    return balance + getTransactionImpactOnAccount(transaction, account.name, transactions);
  }, account.initialBalance);
}

export function calculateAccountBalanceAsOf(
  account: Pick<Account, 'name' | 'initialBalance'>,
  transactions: Transaction[],
  asOfDate: string,
  includePending = false
): number {
  const transactionsThroughDate = transactions.filter(
    (transaction) => transaction.date <= asOfDate
  );
  return calculateAccountBalance(account, transactionsThroughDate, includePending);
}

export function calculateReconciliationDifference(
  statementBalance: number,
  recordedBalance: number
): number {
  const statementCents = Math.round(statementBalance * 100);
  const recordedCents = Math.round(recordedBalance * 100);
  return (statementCents - recordedCents) / 100;
}
