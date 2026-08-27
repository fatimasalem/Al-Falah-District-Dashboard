export type TrendDirection = 'up' | 'down' | 'same';

export function TrendArrowUpIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path
        d="M3 17L9 11L13 14L21 6"
        stroke="#22A06B"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M15 6H21V12"
        stroke="#22A06B"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function TrendArrowDownIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path
        d="M3 7L9 13L13 10L21 18"
        stroke="#D64545"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M15 18H21V12"
        stroke="#D64545"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function TrendArrowIcon({ direction }: { direction: TrendDirection }) {
  if (direction === 'up') return <TrendArrowUpIcon />;
  if (direction === 'down') return <TrendArrowDownIcon />;
  return <>●</>;
}
