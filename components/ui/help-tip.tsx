'use client';

/**
 * HelpTip — lightweight inline tooltip for contextual help.
 * Shows a ? icon; on hover/focus reveals the tip text above it.
 * No external dependency — pure Tailwind.
 */
export function HelpTip({ text }: { text: string }) {
  return (
    <span className="relative inline-flex items-center group">
      <span
        className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full text-[9px] font-bold
          border border-muted-foreground/40 text-muted-foreground/60
          cursor-default select-none leading-none
          group-hover:border-foreground/40 group-hover:text-foreground/60
          transition-colors"
        tabIndex={0}
        aria-label={text}
        role="tooltip"
      >
        ?
      </span>
      <span
        className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5
          w-max max-w-[220px] rounded-md bg-foreground px-2.5 py-1.5
          text-[11px] leading-snug text-background shadow-md
          opacity-0 group-hover:opacity-100 group-focus-within:opacity-100
          transition-opacity duration-150 z-50 text-center"
        aria-hidden="true"
      >
        {text}
        <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-foreground" />
      </span>
    </span>
  );
}
