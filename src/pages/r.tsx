import Head from 'next/head';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  Bill, Freq, Period,
  toAnnual, fromAnnual, fmt, periodLabel,
  getTotalAnnual, generateBarcode, receiptTagline,
  FREQ_BADGES,
} from '@/lib/calc';
import styles from './r.module.css';

interface ShareData {
  bills: Bill[];
  payAmount: string;
  payFreq: Freq;
  payVisible: boolean;
}

function decode(encoded: string): ShareData | null {
  try {
    const raw = JSON.parse(decodeURIComponent(escape(atob(encoded))));
    const bills: Bill[] = (Array.isArray(raw.bills) ? raw.bills : []).map(
      (b: Record<string, unknown>, i: number) => ({
        id: i,
        name: String(b.name ?? b.n ?? ''),
        amount: String(b.amount ?? b.a ?? ''),
        freq: (b.freq ?? b.f ?? 'monthly') as Freq,
      })
    );
    return {
      bills,
      payAmount: String(raw.pay ?? raw.payAmount ?? ''),
      payFreq: (raw.pf ?? raw.payFreq ?? 'monthly') as Freq,
      payVisible: Boolean(raw.pv ?? raw.payVisible ?? false),
    };
  } catch {
    return null;
  }
}

export default function ReceiptPage() {
  const [data, setData] = useState<ShareData | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const d = params.get('d');
    if (d) setData(decode(d));
    setReady(true);
  }, []);

  if (!ready) return null;

  if (!data || data.bills.length === 0) {
    return (
      <div className={styles.error}>
        <p>No bill data found in this link.</p>
        <Link href="/" className={styles.cta}>Make your own →</Link>
      </div>
    );
  }

  const { bills, payAmount, payFreq, payVisible } = data;
  const annual = getTotalAnnual(bills);
  const sorted = [...bills]
    .filter(b => toAnnual(b.amount, b.freq) > 0)
    .sort((a, b) => toAnnual(b.amount, b.freq) - toAnnual(a.amount, a.freq));

  const payAnnual = toAnnual(payAmount, payFreq);
  const showPay = payVisible && payAnnual > 0;
  const pct = showPay ? (annual / payAnnual) * 100 : 0;

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-AU', {
    day: '2-digit', month: 'short', year: 'numeric',
  }).toUpperCase();
  const timeStr = now.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' });

  const barcode = generateBarcode(annual);
  const barcodeNum = Math.round(annual * 100).toString().padStart(12, '0');
  const tagline = receiptTagline(annual);

  return (
    <>
      <Head>
        <title>Naked Bill — Receipt</title>
        <meta name="description" content={`My life costs ${fmt(fromAnnual(annual, 'monthly'))}/mo — see the breakdown.`} />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="robots" content="noindex" />
        {/* Open Graph — shared receipt */}
        <meta property="og:title" content={`My life costs ${fmt(fromAnnual(annual, 'monthly'))}/mo`} />
        <meta property="og:description" content={`${bills.length} bills totalling ${fmt(annual)}/yr. See what your life costs on Naked Bill.`} />
        <meta property="og:image" content="/og.svg" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`My life costs ${fmt(fromAnnual(annual, 'monthly'))}/mo`} />
        <meta name="twitter:description" content={`${bills.length} bills totalling ${fmt(annual)}/yr.`} />
        <meta name="twitter:image" content="/og.svg" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className={styles.page}>
        <div className={styles.receipt}>
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
              {sorted.map(bill => {
                const ann = toAnnual(bill.amount, bill.freq);
                return (
                  <div key={bill.id} className={styles.line}>
                    <div className={styles.lineName}>
                      <span className={styles.badge}>{FREQ_BADGES[bill.freq]}</span>
                      {bill.name || 'Unnamed bill'}
                    </div>
                    <span className={styles.lineVal}>{fmt(fromAnnual(ann, 'yearly'))}/yr</span>
                  </div>
                );
              })}
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

            <div className={styles.barcode} aria-hidden="true">{barcode}</div>
            <div className={styles.barcodeNum}>{barcodeNum}</div>
            <div className={styles.tagline}>{tagline}</div>
            <div className={styles.thankYou}>Thank you for your expenses</div>
          </div>

          <div className={styles.perfBottom} aria-hidden="true" />
        </div>

        <Link href="/" className={styles.cta}>
          Make your own →
        </Link>
      </div>
    </>
  );
}
