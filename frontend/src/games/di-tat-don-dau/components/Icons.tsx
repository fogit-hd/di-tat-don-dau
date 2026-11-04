const PATHS: Record<string, string> = {
  eng: '<circle cx="32" cy="20" r="10" fill="#f2d3b3"/><path d="M20 18q12-14 24 0" fill="#fbf3e4"/><path d="M16 58q2-22 16-22t16 22z" fill="#fbf3e4"/><circle cx="28" cy="20" r="1.4" fill="#3b2a22"/><circle cx="36" cy="20" r="1.4" fill="#3b2a22"/>',
  line: '<rect x="8" y="26" width="48" height="24" rx="3" fill="#c9b9a6"/><rect x="14" y="31" width="20" height="10" fill="#9fc6bf"/><circle cx="44" cy="36" r="5" fill="#e7a93b"/><path d="M6 54h52"/>',
  prod: '<rect x="16" y="16" width="32" height="32" rx="3" fill="#8a8079"/><path d="M20 12v4M28 12v4M36 12v4M44 12v4M20 48v4M28 48v4M36 48v4M44 48v4" stroke="#c99a3b"/>',
  tech: '<path d="M32 8l6 12 13 2-9 9 2 13-12-6-12 6 2-13-9-9 13-2z" fill="#e7a93b"/>',
  sup: '<circle cx="26" cy="30" r="12" fill="#b9c79a"/><circle cx="26" cy="30" r="4" fill="#fbf3e4"/><path d="M38 44l14 12M46 40l10 4" stroke-width="4"/>',
  inst: '<path d="M10 24l22-12 22 12z" fill="#d98b6a"/><path d="M14 26h36v24H14z" fill="#f0e0c4"/><path d="M20 28v20M28 28v20M36 28v20M44 28v20M10 52h44"/>',
  leaf: '<path d="M14 40c8-18 28-26 38-24-2 16-16 30-32 32-4-2-6-6-6-8z" fill="#7eaa78"/><path d="M22 42c6-8 12-14 20-18"/>',
}

export function Icon({ name }: { name: string }) {
  const body = PATHS[name] ?? PATHS.eng
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true">
      <g stroke="#4a3328" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" dangerouslySetInnerHTML={{ __html: body }} />
    </svg>
  )
}
