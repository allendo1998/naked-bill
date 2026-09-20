import { useState, useEffect, useCallback } from 'react';
import { Bill, Freq, Period } from '@/lib/calc';

const LS_KEY = 'nakedBill_v2';

interface UseBillsReturn {
  bills: Bill[];
  viewPeriod: Period;
  payAmount: string;
  payFreq: Freq;
  payVisible: boolean;
  addBill: (name?: string, amount?: string, freq?: Freq) => void;
  removeBill: (id: number) => void;
  updateBill: (id: number, field: keyof Pick<Bill, 'name' | 'amount' | 'freq'>, value: string) => void;
  setViewPeriod: (p: Period) => void;
  setPayAmount: (v: string) => void;
  setPayFreq: (f: Freq) => void;
  setPayVisible: (v: boolean) => void;
  clearAll: () => void;
  shareUrl: () => string;
}

let _nextId = 1;

export function useBills(): UseBillsReturn {
  const [bills, setBills] = useState<Bill[]>([]);
  const [viewPeriod, setViewPeriodState] = useState<Period>('monthly');
  const [payAmount, setPayAmountState] = useState('');
  const [payFreq, setPayFreqState] = useState<Freq>('monthly');
  const [payVisible, setPayVisibleState] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlData = params.get('d');
    let parsed: Record<string, unknown> | null = null;

    if (urlData) {
      try {
        parsed = JSON.parse(decodeURIComponent(escape(atob(urlData))));
        window.history.replaceState(null, '', window.location.pathname);
      } catch { /* ignore */ }
    }

    if (!parsed) {
      try {
        const raw = localStorage.getItem(LS_KEY);
        if (raw) parsed = JSON.parse(raw);
      } catch { /* ignore */ }
    }

    if (parsed) applyData(parsed);
    setLoaded(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function applyData(data: Record<string, unknown>) {
    if (Array.isArray(data.bills)) {
      const mapped: Bill[] = (data.bills as Array<Record<string, unknown>>).map((b) => {
        const id = (typeof b.id === 'number' ? b.id : _nextId++);
        if (id >= _nextId) _nextId = id + 1;
        return {
          id,
          name: String(b.name ?? b.n ?? ''),
          amount: String(b.amount ?? b.a ?? ''),
          freq: (b.freq ?? b.f ?? 'monthly') as Freq,
        };
      });
      setBills(mapped);
    }
    if (data.viewPeriod || data.vp) setViewPeriodState((data.viewPeriod ?? data.vp) as Period);
    if (data.payAmount !== undefined || data.pay !== undefined)
      setPayAmountState(String(data.payAmount ?? data.pay ?? ''));
    if (data.payFreq || data.pf) setPayFreqState((data.payFreq ?? data.pf) as Freq);
    if (data.payVisible !== undefined || data.pv !== undefined)
      setPayVisibleState(Boolean(data.payVisible ?? data.pv));
  }

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(LS_KEY, JSON.stringify({
        bills: bills.map(b => ({ id: b.id, name: b.name, amount: b.amount, freq: b.freq })),
        viewPeriod, payAmount, payFreq, payVisible,
      }));
    } catch { /* ignore */ }
  }, [loaded, bills, viewPeriod, payAmount, payFreq, payVisible]);

  const addBill = useCallback((name = '', amount = '', freq: Freq = 'monthly') => {
    setBills(prev => [...prev, { id: _nextId++, name, amount, freq }]);
  }, []);

  const removeBill = useCallback((id: number) => {
    setBills(prev => prev.filter(b => b.id !== id));
  }, []);

  const updateBill = useCallback((id: number, field: keyof Pick<Bill, 'name' | 'amount' | 'freq'>, value: string) => {
    setBills(prev => prev.map(b => b.id === id ? { ...b, [field]: value } : b));
  }, []);

  const setViewPeriod = useCallback((p: Period) => setViewPeriodState(p), []);
  const setPayAmount = useCallback((v: string) => setPayAmountState(v), []);
  const setPayFreq = useCallback((f: Freq) => setPayFreqState(f), []);
  const setPayVisible = useCallback((v: boolean) => setPayVisibleState(v), []);

  const clearAll = useCallback(() => {
    setBills([]);
    setPayAmountState('');
    setPayVisibleState(false);
  }, []);

  const shareUrl = useCallback(() => {
    const data = {
      bills: bills.map(b => ({ n: b.name, a: b.amount, f: b.freq })),
      pay: payAmount, pf: payFreq, pv: payVisible ? 1 : 0, vp: viewPeriod,
    };
    const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(data))));
    return `${window.location.origin}/r?d=${encoded}`;
  }, [bills, payAmount, payFreq, payVisible, viewPeriod]);

  return {
    bills, viewPeriod, payAmount, payFreq, payVisible,
    addBill, removeBill, updateBill,
    setViewPeriod, setPayAmount, setPayFreq, setPayVisible,
    clearAll, shareUrl,
  };
}
