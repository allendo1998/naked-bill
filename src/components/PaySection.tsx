import { Freq, Period, toAnnual, fromAnnual, fmt, periodLabel, getTotalAnnual, Bill } from '@/lib/calc';
import styles from './PaySection.module.css';

interface Props {
  bills: Bill[];
  viewPeriod: Period;
  payAmount: string;
  payFreq: Freq;
  payVisible: boolean;
  onAmountChange: (v: string) => void;
  onFreqChange: (f: Freq) => void;
  onToggle: () => void;
}

export default function PaySection({ bills, viewPeriod, payAmount, payFreq, payVisible, onAmountChange, onFreqChange, onToggle }: Props) {
  const payAnnual = toAnnual(payAmount, payFreq);
  const billsAnnual = getTotalAnnual(bills);
  const showBar = payVisible && payAnnual > 0;
  const rawPct = payAnnual > 0 ? (billsAnnual / payAnnual) * 100 : 0;
  const clampedPct = Math.min(rawPct, 100);

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.label}>Take-home pay</div>
          <div className={styles.sublabel}>See how much of your income is committed</div>
        </div>
        <button className={styles.toggleBtn} onClick={onToggle} aria-expanded={payVisible}>
          {payVisible ? 'Remove' : 'Add pay'}
        </button>
      </div>

      {payVisible && (
        <div className={styles.inputArea}>
          <div className={styles.row}>
            <div className={styles.inputWrap}>
              <span className={styles.sym} aria-hidden="true">$</span>
              <input
                type="number"
                className={styles.payInput}
                value={payAmount}
                placeholder="0"
                min="0"
                step="1"
                aria-label="Take-home pay amount"
                onChange={e => {
                  const v = parseFloat(e.target.value);
                  onAmountChange(v > 0 ? e.target.value : '');
                }}
              />
            </div>
            <div className={styles.freqWrap}>
              <select className={styles.freqSel} value={payFreq} onChange={e => onFreqChange(e.target.value as Freq)}>
                <option value="weekly">Weekly</option>
                <option value="fortnightly">Fortnightly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
              <span className={styles.freqArrow} aria-hidden="true">▾</span>
            </div>
          </div>
        </div>
      )}

      {showBar && (
        <div className={styles.commitArea}>
          <div className={styles.commitRow}>
            <span className={styles.commitLabel}>Bills committed</span>
            <div style={{ textAlign: 'right' }}>
              <div className={styles.commitPct}>{isFinite(rawPct) ? rawPct.toFixed(1) + '%' : '—'}</div>
              <div className={styles.commitAmounts}>
                {fmt(fromAnnual(billsAnnual, viewPeriod))} of {fmt(fromAnnual(payAnnual, viewPeriod))} / {periodLabel(viewPeriod)}
              </div>
            </div>
          </div>
          <div className={styles.track} role="progressbar" aria-valuenow={Math.round(rawPct)} aria-valuemin={0} aria-valuemax={100}>
            <div className={styles.fill} style={{ width: `${clampedPct}%`, background: clampedPct > 85 ? '#8E8E93' : 'var(--accent)' }} />
          </div>
        </div>
      )}
    </div>
  );
}
