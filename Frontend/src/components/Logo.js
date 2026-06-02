export default function Logo({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Stethoscope icon */}
      <circle cx="20" cy="20" r="20" fill="#16a34a" />
      <path
        d="M13 12c0 4.5 3 7 7 7s7-2.5 7-7"
        stroke="white" strokeWidth="2.2" strokeLinecap="round" fill="none"
      />
      <path d="M13 12V10a1 1 0 012 0v2" stroke="white" strokeWidth="2" strokeLinecap="round" />
      <path d="M25 12V10a1 1 0 012 0v2" stroke="white" strokeWidth="2" strokeLinecap="round" />
      <path
        d="M20 19v4.5A3.5 3.5 0 0023.5 27v0a3.5 3.5 0 003.5-3.5V22"
        stroke="white" strokeWidth="2.2" strokeLinecap="round" fill="none"
      />
      <circle cx="27" cy="21" r="1.5" fill="white" />
    </svg>
  );
}
