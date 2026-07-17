import { AR_NUM } from '../../shared/utils/format';

export default function ProgressRing({ done }) {
  const n = Math.min(4, done.size);
  const arc = (n / 4) * 150.8;
  return (
    <svg className="ring" viewBox="0 0 60 60">
      <circle cx="30" cy="30" r="24" fill="none" stroke="#242013" strokeWidth="5.5" />
      <circle
        cx="30" cy="30" r="24" fill="none" stroke="#E3A83B" strokeWidth="5.5"
        strokeDasharray={`${arc} 150.8`} strokeLinecap="round"
        transform="rotate(-90 30 30)"
        style={{ transition: 'stroke-dasharray .8s' }}
      />
      <text x="30" y="35" textAnchor="middle" fontSize="13" fontWeight="800" fill="#F5F1E6">
        {AR_NUM[n]}/٤
      </text>
    </svg>
  );
}
