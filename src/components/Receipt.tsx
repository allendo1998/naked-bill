import { useState } from 'react';
import { Bill, Period, Freq, toAnnual, fromAnnual, fmt, periodLabel, getTotalAnnual, generateBarcode, receiptTagline, FREQ_BADGES } from '@/lib/calc';
import styles from './Receipt.module.css';

interface Props {
  bills: Bill[];
  viewPeriod: Period;
  payAmount: string;
  payFreq: Freq;
  payVisible: boolean;
}

export default function Receipt({ bills, payAmount, payFreq, payVisible }: Props) {
  const [open, setOpen] = useState(false);

  const annual = getTotalAnnual(bills);
  const sorted = [...bills].filter(b => toAnnual(b.amount, b.freq) > 0).sort((a, b) => toAnnual(b.amount, b.freq) - toAnnual(a.amount, a.freq));
  const payAnnual = toAnnual(payAmount, payFreq);
  const showPay = payVisible && payAnnual > 0;
  const pct = showPay ? (annual / payAnnual) * 100 : 0;

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();
  const timeStr = now.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' });

  return (
    <section className={styles.section} aria-label="Receipt breakdown">
      <button
        className={`${styles.trigger} ${open ? styles.triggerOpen : ''}`}
        onClick={() => setOpen(p => !p)}
        aria-expanded={open}
      >
        <span className={styles.triggerIcon} aria-hidden="true">🧾</span>
        See where it goes
        <span className={styles.chevron} aria-hidden="true">›</span>
      </button>

      <div className={`${styles.wrapper} ${open ? styles.wrapperOpen : ''}`} role="region">
        <div className={`${styles.receipt} ${open ? styles.receiptOpen : ''}`} aria-live="polite">
          <div className={styles.perfTop} aria-hidden="true" />
          <div className={styles.inner}>
            <div className={styles.store}>
              <div className={styles.storeName}>NAKED BILL</div>
              <div className={styles.storeSub}>Your life, itemised</div>
            </div>
            <hr className={styles.divider} />
            <div className={styles.meta}>
              <span>{dateStr} {timeStr}</span>
              <span>{bills.length} ITEM{bills.length !== 1 ? 'S' : ''}</span>
            </div>
            <div className={styles.lines}>
              {sorted.length === 0
                ? <div className={styles.emptyLine}>No bills added.</div>
                : sorted.map(bill => (
                  <div key={bill.id} className={styles.line}>
                    <div className={styles.lineName}>
                      <span className={styles.badge}>{FREQ_BADGES[bill.freq]}</span>
                      {bill.name || 'Unnamed bill'}
                    </div>
                    <span className={styles.lineVal}>{fmt(fromAnnual(toAnnual(bill.amount, bill.freq), 'yearly'))}/yr</span>
                  </div>
                ))
              }
            </div>
            <hr className={styles.divider} />
            <div className={styles.subtotals}>
              {(['weekly', 'monthly', 'yearly'] as Period[]).map(p => (
                <div key={p} className={styles.subtotalRow}>
                  <span>/ {periodLabel(p).toUpperCase()}</span>
                  <span>{fmt(fromAnnual(annual, p))}</span>
                </div>
              ))}
            </div>
            <hr className={styles.divider} />
            <div className={styles.totalRow}>
              <span>TOTAL / YEAR</span>
              <span>{fmt(annual)}</span>
            </div>
            {showPay && (
              <div className={styles.payLine}>
                <span>OF INCOME</span>
                <span>{pct.toFixed(1)}%</span>
              </div>
            )}
            <div className={styles.barcode} aria-hidden="true">{generateBarcode(annual)}</div>
            <div className={styles.barcodeNum}>{Math.round(annual * 100).toString().padStart(12, '0')}</div>
            <div className={styles.tagline}>{receiptTagline(annual)}</div>
            <div className={styles.thankYou}>Thank you for your expenses</div>
          </div>
          <div className={styles.perfBottom} aria-hidden="true" />
        </div>
      </div>
    </section>
  );
}
