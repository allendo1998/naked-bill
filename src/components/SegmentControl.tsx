import { Period } from '@/lib/calc';
import styles from './SegmentControl.module.css';

interface Props { value: Period; onChange: (p: Period) => void; }

const PERIODS: { value: Period; label: string }[] = [
  { value: 'weekly',  label: 'Weekly'  },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly',  label: 'Yearly'  },
];

export default function SegmentControl({ value, onChange }: Props) {
  return (
    <div className={styles.control} role="group" aria-label="View period">
      {PERIODS.map(p => (
        <button
          key={p.value}
          className={`${styles.btn} ${value === p.value ? styles.active : ''}`}
          aria-pressed={value === p.value}
          onClick={() => onChange(p.value)}
        >{p.label}</button>
      ))}
    </div>
  );
}
