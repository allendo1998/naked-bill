import { Bill, Freq } from '@/lib/calc';
import styles from './BillRow.module.css';

interface Props {
  bill: Bill;
  onUpdate: (id: number, field: keyof Pick<Bill, 'name' | 'amount' | 'freq'>, value: string) => void;
  onRemove: (id: number) => void;
}

export default function BillRow({ bill, onUpdate, onRemove }: Props) {
  return (
    <li className={`${styles.row} bill-row-item`} role="group" aria-label={`Bill: ${bill.name || 'Unnamed'}`}>
      <div className={`${styles.cell} ${styles.nameCell}`}>
        <label className={styles.srOnly} htmlFor={`name-${bill.id}`}>Bill name</label>
        <input
          id={`name-${bill.id}`}
          type="text"
          className={styles.input}
          value={bill.name}
          placeholder="Bill name"
          autoComplete="off"
          onChange={e => onUpdate(bill.id, 'name', e.target.value)}
        />
      </div>
      <div className={`${styles.cell} ${styles.amountCell}`}>
        <span className={styles.currencySym} aria-hidden="true">$</span>
        <label className={styles.srOnly} htmlFor={`amount-${bill.id}`}>Amount</label>
        <input
          id={`amount-${bill.id}`}
          type="number"
          className={`${styles.input} ${styles.amountInput}`}
          value={bill.amount}
          placeholder="0"
          min="0"
          step="0.01"
          onChange={e => {
            if (parseFloat(e.target.value) < 0) return;
            onUpdate(bill.id, 'amount', e.target.value);
          }}
        />
      </div>
      <div className={`${styles.cell} ${styles.freqCell}`}>
        <label className={styles.srOnly} htmlFor={`freq-${bill.id}`}>Frequency</label>
        <select
          id={`freq-${bill.id}`}
          className={`${styles.input} ${styles.freqSelect}`}
          value={bill.freq}
          onChange={e => onUpdate(bill.id, 'freq', e.target.value as Freq)}
        >
          <option value="weekly">Weekly</option>
          <option value="fortnightly">Fortnightly</option>
          <option value="monthly">Monthly</option>
          <option value="yearly">Yearly</option>
        </select>
        <span className={styles.freqArrow} aria-hidden="true">▾</span>
      </div>
      <div className={`${styles.cell} ${styles.deleteCell}`}>
        <button
          className={styles.deleteBtn}
          aria-label={`Remove ${bill.name || 'this bill'}`}
          onClick={() => onRemove(bill.id)}
        >×</button>
      </div>
    </li>
  );
}
