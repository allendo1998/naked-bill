import Head from 'next/head';
import { useEffect, useRef, useState } from 'react';
import { useBills } from '@/hooks/useBills';
import { Freq, fmt, fromAnnual, periodLabel, getTotalAnnual } from '@/lib/calc';
import BillRow from '@/components/BillRow';
import SegmentControl from '@/components/SegmentControl';
import PaySection from '@/components/PaySection';
import Receipt from '@/components/Receipt';
import Toast from '@/components/Toast';
import styles from './index.module.css';

const QUICK_ADDS: { name: string; amount: string; freq: Freq }[] = [
  { name: 'Rent',      amount: '1500', freq: 'monthly' },
  { name: 'Groceries', amount: '200',  freq: 'weekly'  },
  { name: 'Phone',     amount: '65',   freq: 'monthly' },
  { name: 'Internet',  amount: '79',   freq: 'monthly' },
  { name: 'Gym',       amount: '49',   freq: 'monthly' },
  { name: 'Streaming', amount: '22',   freq: 'monthly' },
];

export default function Home() {
  const {
    bills, viewPeriod, payAmount, payFreq, payVisible,
    addBill, removeBill, updateBill,
    setViewPeriod, setPayAmount, setPayFreq, setPayVisible,
    clearAll, shareUrl,
  } = useBills();

  const [toast, setToast] = useState({ message: '', visible: false });
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  function showToast(msg: string) {
    clearTimeout(toastTimer.current);
    setToast({ message: msg, visible: true });
    toastTimer.current = setTimeout(() => setToast(t => ({ ...t, visible: false })), 2200);
  }

  const annual = getTotalAnnual(bills);
  const current = fromAnnual(annual, viewPeriod);
  const others = (['weekly', 'monthly', 'yearly'] as const).filter(p => p !== viewPeriod);

  function handleShare() {
    const url = shareUrl();
    const el = document.createElement('textarea');
    el.value = url;
    el.style.cssText = 'position:fixed;opacity:0;pointer-events:none';
    document.body.appendChild(el);
    el.focus(); el.select();
    try { document.execCommand('copy'); } catch {}
    document.body.removeChild(el);
    navigator.clipboard?.writeText(url).catch(() => {});
    showToast('Link copied to clipboard');
  }

  function handleClear() {
    if (bills.length === 0 && !payAmount) return;
    if (!window.confirm('Clear all bills and income?')) return;
    clearAll();
  }

  const shouldFocusLast = useRef(false);
  useEffect(() => {
    if (!shouldFocusLast.current) return;
    shouldFocusLast.current = false;
    const inputs = document.querySelectorAll<HTMLInputElement>('.bill-row-item:last-child input[type="text"]');
    if (inputs.length) inputs[inputs.length - 1].focus();
  }, [bills.length]);

  function handleAddBill(name = '', amount = '', freq: Freq = 'monthly') {
    shouldFocusLast.current = true;
    addBill(name, amount, freq);
  }

  const hasBills = bills.length > 0;

  return (
    <>
      <Head>
        <title>Naked Bill — What does your life cost?</title>
        <meta name="description" content="Enter your bills. See what your life actually costs. No signup, no ads, no fluff." />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        {/* Open Graph */}
        <meta property="og:title" content="Naked Bill — What does your life cost?" />
        <meta property="og:description" content="Add your recurring expenses. See exactly what your life costs per week, month, and year. No signup, no ads." />
        <meta property="og:image" content="/og.svg" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://nakedbill.com" />
        {/* Twitter / X */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Naked Bill — What does your life cost?" />
        <meta name="twitter:description" content="Add your recurring expenses. See exactly what your life costs per week, month, and year." />
        <meta name="twitter:image" content="/og.svg" />
        {/* Canonical */}
        <link rel="canonical" href="https://nakedbill.com" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Toast message={toast.message} visible={toast.visible} />

      <header className={styles.header} role="banner">
        <div className={styles.headerInner}>
          <div className={styles.wordmark}>NAKED BILL</div>
          <div className={styles.totalDisplay} role="region" aria-label="Total cost">
            <div className={`${styles.totalAmount} ${annual === 0 ? styles.totalZero : ''}`} aria-live="polite">
              {fmt(current)}
            </div>
            {annual > 0 && (
              <div className={styles.totalSub} aria-live="polite">
                <span className={styles.subLine}><strong>{fmt(fromAnnual(annual, others[0]))}</strong> / {periodLabel(others[0])}</span>
                <span className={styles.subLine}><strong>{fmt(fromAnnual(annual, others[1]))}</strong> / {periodLabel(others[1])}</span>
              </div>
            )}
          </div>
          <div className={styles.segmentRow}>
            <SegmentControl value={viewPeriod} onChange={setViewPeriod} />
          </div>
        </div>
      </header>

      <main className={styles.main}>
        <section className={styles.section} aria-label="Your bills">
          <div className={styles.card}>
            {!hasBills && (
              <div className={styles.emptyState}>
                <div className={styles.emptyHeadline}>What does your life cost?</div>
                <div className={styles.emptySub}>Add your recurring expenses to find out.</div>
                <button className={`${styles.actionBtn} ${styles.btnPrimary}`} onClick={() => handleAddBill()}>
                  + Add your first bill
                </button>
                <div className={styles.quickAdds} role="list">
                  {QUICK_ADDS.map(q => (
                    <button key={q.name} className={styles.quickAddChip} role="listitem" onClick={() => handleAddBill(q.name, q.amount, q.freq)}>
                      {q.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <ul className={styles.billList} aria-label="Bill entries">
              {bills.map(bill => (
                <BillRow key={bill.id} bill={bill} onUpdate={updateBill} onRemove={removeBill} />
              ))}
            </ul>
            {hasBills && (
              <div className={styles.addBillWrap}>
                <button className={styles.addBillBtn} onClick={() => handleAddBill()}>+ Add bill</button>
              </div>
            )}
          </div>
        </section>

        <section className={styles.section} aria-label="Take-home pay">
          <PaySection
            bills={bills}
            viewPeriod={viewPeriod}
            payAmount={payAmount}
            payFreq={payFreq}
            payVisible={payVisible}
            onAmountChange={setPayAmount}
            onFreqChange={setPayFreq}
            onToggle={() => setPayVisible(!payVisible)}
          />
        </section>

        <Receipt bills={bills} viewPeriod={viewPeriod} payAmount={payAmount} payFreq={payFreq} payVisible={payVisible} />

        <div className={styles.actionsRow}>
          <button className={`${styles.actionBtn} ${styles.btnPrimary}`} onClick={handleShare}>Share breakdown</button>
          <button className={`${styles.actionBtn} ${styles.btnSecondary}`} onClick={handleClear}>Clear all</button>
        </div>
      </main>

      <footer className={styles.footer}>
        <p>All data stays on your device. No accounts, no tracking.</p>
      </footer>
    </>
  );
}
