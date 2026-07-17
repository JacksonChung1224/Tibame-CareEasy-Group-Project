export function CareEasyIcon({ name }) {
  const common = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round",
    strokeLinejoin: "round",
  };

  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" focusable="false">
      {name === "calculator" && <>
        <rect {...common} x="7" y="3.5" width="18" height="25" rx="3" />
        <rect {...common} x="10.5" y="7" width="11" height="5" rx="1" />
        <path {...common} d="M11 16.5h2M16 16.5h2M21 16.5h.1M11 21h2M16 21h2M21 21h.1M11 25.5h2M16 25.5h2M21 25.5h.1" />
      </>}

      {name === "diary" && <>
        <rect {...common} x="6" y="4" width="20" height="24" rx="3" />
        <path {...common} d="M10 4v24M6 9h4M6 14h4M6 19h4" />
        <path {...common} d="M17.5 11.5c-1.8-2.2-5.2.2-3.3 2.8l3.3 3.2 3.3-3.2c1.9-2.6-1.5-5-3.3-2.8Z" />
        <path {...common} d="M14.5 22h7" />
      </>}

      {name === "institution" && <>
        <path {...common} d="M5 27h22M8 27V13h16v14M12 13V6h8v7" />
        <path {...common} d="M14.5 9.5h3M12 17h2M18 17h2M12 21h2M18 21h2M14 27v-3h4v3" />
        <path {...common} d="M23 20.5h5v5.2c0 1.6-1.1 2.8-2.5 3.3-1.4-.5-2.5-1.7-2.5-3.3z" />
        <path {...common} d="m24.3 24.8 1 1 1.7-2" />
      </>}

      {name === "resources" && <>
        <path {...common} d="M4.5 7.5c4-1.7 7.5-.8 11.5 2.2v18c-4-3-7.5-3.9-11.5-2.2zM27.5 7.5c-4-1.7-7.5-.8-11.5 2.2v18c4-3 7.5-3.9 11.5-2.2z" />
        <path {...common} d="M22 7v8l2-1.5 2 1.5V7.8" />
      </>}

      {name === "navigation" && <>
        <path {...common} d="M7 23.5c-2.4-1.7-3.4-4-2.5-5.4.9-1.4 3.2-1 5.2.5l4.2 3" />
        <path {...common} d="M7 23.5 15 28c1 .6 2.1.6 3.1.1l8.5-4.3c1.7-.9 1.8-3.3.2-4.4-1-.7-2.2-.7-3.2-.1l-4.3 2.4" />
        <path {...common} d="M21 5.5a6.5 6.5 0 0 0-6.5 6.5c0 4.8 6.5 9 6.5 9s6.5-4.2 6.5-9A6.5 6.5 0 0 0 21 5.5Z" />
        <path {...common} d="m19 12 2.8-2-1.1 3.2-2.8 2z" />
      </>}

      {name === "shield" && <>
        <path {...common} d="M16 3.5 26 7v7.2c0 6.4-4.1 11.3-10 14.3-5.9-3-10-7.9-10-14.3V7z" />
        <path {...common} d="m11.2 15.7 3.1 3.1 6.5-7" />
      </>}

      {name === "wallet" && <>
        <path {...common} d="M6 9.5h18a3 3 0 0 1 3 3v12H7a3 3 0 0 1-3-3v-14a3 3 0 0 1 3-3h15" />
        <path {...common} d="M20 14h7v6h-7a3 3 0 0 1 0-6Z" />
        <circle cx="21.5" cy="17" r=".8" fill="currentColor" />
      </>}

      {name === "services" && <>
        <circle {...common} cx="16" cy="10" r="4" />
        <path {...common} d="M8.5 26v-2.5c0-4.1 3.4-7.5 7.5-7.5s7.5 3.4 7.5 7.5V26" />
        <path {...common} d="M5 20.5h5M22 20.5h5" />
      </>}
    </svg>
  );
}

export function UiIcon({ name, className = "" }) {
  return (
    <span className={`ui-icon ${className}`} aria-hidden="true">
      <CareEasyIcon name={name} />
    </span>
  );
}
