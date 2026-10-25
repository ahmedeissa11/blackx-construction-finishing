type GlyphIconProps = {
  icon: string;
  className?: string;
};

/**
 * Draws the interface's symbolic icons as inline SVG so navigation and
 * information tiles never depend on optional symbol fonts in the browser.
 */
export function GlyphIcon({ icon, className }: GlyphIconProps) {
  const common = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className: className ? `glyph-icon ${className}` : "glyph-icon",
    "aria-hidden": true,
    focusable: false,
  };

  switch (icon) {
    case "🔔":
      return (
        <svg {...common}>
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 8-3 8h18s-3-1-3-8" />
          <path d="M13.7 20a2 2 0 0 1-3.4 0" />
        </svg>
      );
    case "◉":
      return (
        <svg {...common}>
          <circle cx="12" cy="8" r="4" />
          <path d="M4 21c1.5-4 5-6 8-6s6.5 2 8 6" />
        </svg>
      );
    case "✉":
      return (
        <svg {...common}>
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="m3 7 9 6 9-6" />
        </svg>
      );
    case "◎":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <circle cx="12" cy="12" r="5" />
          <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
        </svg>
      );
    case "▣":
      return (
        <svg {...common}>
          <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
          <path d="M14 3v5h5" />
          <path d="m9 15 2 2 4-4" />
        </svg>
      );
    case "⬢":
      return (
        <svg {...common}>
          <path d="M4 21V5a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v16" />
          <path d="M15 9h4a1 1 0 0 1 1 1v11" />
          <path d="M2 21h20" />
          <path d="M8 8h3M8 12h3M8 16h3" />
        </svg>
      );
    case "⚑":
      return (
        <svg {...common}>
          <path d="M5 21V4" />
          <path d="M5 4h12l-2.5 4L17 12H5" />
        </svg>
      );
    case "✎":
      return (
        <svg {...common}>
          <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
          <path d="m15 5 4 4" />
        </svg>
      );
    case "↗":
      return (
        <svg {...common}>
          <path d="m3 17 6-6 4 4 8-8" />
          <path d="M14 7h7v7" />
        </svg>
      );
    case "⚠":
      return (
        <svg {...common}>
          <path d="M10.3 3.9 1.9 18a2 2 0 0 0 1.7 3h16.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
          <path d="M12 9v4" />
          <path d="M12 17h.01" />
        </svg>
      );
    case "✓":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="m8 12.5 2.5 2.5L16 9.5" />
        </svg>
      );
    case "🔑":
      return (
        <svg {...common}>
          <circle cx="8" cy="15" r="4" />
          <path d="m11 12 9-9" />
          <path d="m15 8 3 3M18 5l2 2" />
        </svg>
      );
    case "⛨":
      return (
        <svg {...common}>
          <path d="M12 22s8-3.6 8-10V5l-8-3-8 3v7c0 6.4 8 10 8 10Z" />
          <path d="m9 11.5 2 2 4-4" />
        </svg>
      );
    case "⌂":
      return (
        <svg {...common}>
          <path d="m3 11 9-8 9 8" />
          <path d="M5 10v10h14V10" />
          <path d="M10 20v-6h4v6" />
        </svg>
      );
    case "▥":
      return (
        <svg {...common}>
          <path d="M5 20v-9M11 20V4M17 20v-6M2 20h20" />
        </svg>
      );
    case "🗀":
      return (
        <svg {...common}>
          <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />
        </svg>
      );
    case "☰":
      return (
        <svg {...common}>
          <path d="M8 6h13M8 12h13M8 18h13" />
          <path d="M3.5 6h.01M3.5 12h.01M3.5 18h.01" />
        </svg>
      );
    case "▤":
      return (
        <svg {...common}>
          <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
          <path d="M14 3v5h5M9 13h6M9 17h6" />
        </svg>
      );
    case "⚙":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="3.2" />
          <path d="M12 2.8v3M12 18.2v3M2.8 12h3M18.2 12h3M5.5 5.5l2.1 2.1M16.4 16.4l2.1 2.1M18.5 5.5l-2.1 2.1M7.6 16.4l-2.1 2.1" />
        </svg>
      );
    case "◈":
      return (
        <svg {...common}>
          <path d="M3 7a2 2 0 0 1 2-2h13a1 1 0 0 1 1 1v2" />
          <rect x="3" y="8" width="18" height="11" rx="2" />
          <circle cx="16.5" cy="13.5" r="1.1" fill="currentColor" stroke="none" />
        </svg>
      );
    case "▩":
      return (
        <svg {...common}>
          <path d="M5.5 8h13l-.9 11a2 2 0 0 1-2 1.8H8.4a2 2 0 0 1-2-1.8Z" />
          <path d="M9 10.2V6a3 3 0 0 1 6 0v4.2" />
        </svg>
      );
    case "✦":
      return (
        <svg {...common}>
          <path d="M21 11.5a8.5 8.5 0 0 1-12.4 7.5L3 21l2-5.6A8.5 8.5 0 1 1 21 11.5Z" />
          <path d="M12 7.5v4" />
          <path d="M12 15h.01" />
        </svg>
      );
    case "☏":
      return (
        <svg {...common}>
          <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.13.96.36 1.9.7 2.8a2 2 0 0 1-.45 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.45c.9.34 1.84.57 2.8.7A2 2 0 0 1 22 16.9Z" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <rect x="3" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="3" width="7" height="7" rx="1.5" />
          <rect x="3" y="14" width="7" height="7" rx="1.5" />
          <rect x="14" y="14" width="7" height="7" rx="1.5" />
        </svg>
      );
  }
}
