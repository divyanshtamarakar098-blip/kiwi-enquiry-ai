import React from 'react';

/**
 * High-fidelity vector recreation of the official Kiwi Connect Digital logo
 * from the company branding:
 * - Multi-colored spiral / sunburst vortex pinwheel (purple, magenta, orange, yellow, green, cyan)
 * - Brand typography: "KIWI" (bold purple) + "Connect Digital" (violet)
 * - Tagline: "Think Social. Think Kiwi."
 */
export default function KiwiLogo({ size = 'md', showTagline = true, className = '' }) {
  const isSm = size === 'sm';
  const isLg = size === 'lg';

  const iconSize = isSm ? 'w-8 h-8' : isLg ? 'w-14 h-14' : 'w-10 h-10';
  const titleSize = isSm ? 'text-sm' : isLg ? 'text-2xl' : 'text-lg';
  const taglineSize = isSm ? 'text-[9px]' : isLg ? 'text-xs' : 'text-[10px]';

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Official Spiral Vortex Pinwheel Symbol */}
      <svg
        className={`${iconSize} flex-shrink-0 animate-[spin_25s_linear_infinite] hover:animate-[spin_4s_linear_infinite] transition-all`}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <radialGradient id="kiwiCenter" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ec4899" />
            <stop offset="50%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#3b82f6" />
          </radialGradient>
        </defs>

        {/* Outer swirling flower petal droplets in brand spectrum */}
        {/* Violet / Purple Petals */}
        <path d="M50 15 C54 22 55 30 50 35 C45 30 46 22 50 15 Z" fill="#7c3aed" />
        <path d="M68 22 C68 30 63 36 57 38 C56 31 62 25 68 22 Z" fill="#6366f1" />
        <path d="M82 36 C77 42 70 44 65 40 C67 33 75 31 82 36 Z" fill="#3b82f6" />

        {/* Cyan / Teal / Green Petals */}
        <path d="M85 55 C78 58 71 55 68 49 C74 45 81 48 85 55 Z" fill="#06b6d4" />
        <path d="M78 72 C71 71 67 64 68 57 C75 57 79 64 78 72 Z" fill="#10b981" />
        <path d="M63 85 C58 80 58 72 62 66 C68 70 68 78 63 85 Z" fill="#84cc16" />

        {/* Yellow / Orange / Red Petals */}
        <path d="M45 87 C44 79 48 72 54 70 C55 77 50 84 45 87 Z" fill="#eab308" />
        <path d="M28 80 C32 74 39 72 43 76 C40 83 32 85 28 80 Z" fill="#f97316" />
        <path d="M16 66 C23 63 29 67 30 73 C23 76 17 71 16 66 Z" fill="#ef4444" />

        {/* Magenta / Pink Petals */}
        <path d="M14 47 C21 47 26 53 24 60 C18 58 14 53 14 47 Z" fill="#ec4899" />
        <path d="M22 30 C28 33 29 41 25 47 C20 44 18 36 22 30 Z" fill="#d946ef" />
        <path d="M35 18 C38 25 36 33 30 36 C28 29 31 22 35 18 Z" fill="#a855f7" />

        {/* Center Vortex Core */}
        <circle cx="50" cy="50" r="14" fill="url(#kiwiCenter)" opacity="0.9" />
        <circle cx="50" cy="50" r="7" fill="#ffffff" />
        <circle cx="50" cy="50" r="3" fill="#6d28d9" />
      </svg>

      {/* Typography: KIWI Connect Digital */}
      <div className="flex flex-col">
        <div className={`font-black tracking-tight leading-none ${titleSize} flex items-baseline gap-1.5`}>
          <span className="text-[#3b0764] font-extrabold tracking-wider">KIWI</span>
          <span className="text-[#7c3aed] font-bold">Connect Digital</span>
        </div>

        {showTagline && (
          <div className={`font-semibold tracking-wide text-[#ea580c] mt-1 leading-none ${taglineSize}`}>
            Think Social. Think Kiwi.
          </div>
        )}
      </div>
    </div>
  );
}

