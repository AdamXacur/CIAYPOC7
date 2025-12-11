import React from 'react';

export const Logo = ({ className = "h-12 w-auto" }: { className?: string }) => (
  <svg viewBox="0 0 300 80" className={className}>
    {/* Icon Section */}
    <g transform="translate(10, 10) scale(0.6)">
       {/* Top Diamond/Chevron - Gold */}
      <path d="M0 45 L15 60 L0 75 L-15 60 Z" transform="translate(50, -50)" fill="#C49B64" />
      <path d="M30 30 L50 5 L70 30" fill="none" stroke="#C49B64" strokeWidth="6" />

      {/* Center Diamond - Gold */}
      <path d="M50 40 L60 50 L50 60 L40 50 Z" fill="#C49B64" />

      {/* Side Chevrons - Brown (Adaptado a la paleta) */}
      <path d="M30 50 L10 30 L-10 50 L10 70 Z" transform="translate(0,0)" fill="#624E32" />
      <path d="M70 50 L90 30 L110 50 L90 70 Z" transform="translate(0,0)" fill="#624E32" />
      
      {/* Bottom Chevron - Brown */}
      <path d="M50 70 L70 90 L50 110 L30 90 Z" fill="#624E32" />

      {/* Dots */}
      <circle cx="20" cy="20" r="4" fill="#C49B64" />
      <circle cx="80" cy="20" r="4" fill="#C49B64" />
      <circle cx="20" cy="80" r="4" fill="#C49B64" />
      <circle cx="80" cy="80" r="4" fill="#C49B64" />
    </g>

    {/* Text Section */}
    <g transform="translate(90, 0)">
       <text x="0" y="25" fontFamily="sans-serif" fontSize="10" fontWeight="bold" fill="#C49B4B" letterSpacing="2">RENACIMIENTO MAYA</text>
       <text x="0" y="55" fontFamily="serif" fontSize="34" fontWeight="bold" fill="#624E32" letterSpacing="1">YUCATÁN</text>
       <line x1="0" y1="62" x2="180" y2="62" stroke="#624E32" strokeWidth="0.5" />
       <text x="0" y="74" fontFamily="sans-serif" fontSize="8" fontWeight="medium" fill="#71706C" letterSpacing="1">GOBIERNO DEL ESTADO | 2024 - 2030</text>
    </g>
  </svg>
);