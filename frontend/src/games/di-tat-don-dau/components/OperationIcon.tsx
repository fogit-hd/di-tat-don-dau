export function OperationIcon({ name }: { name: 'report' | 'back' | 'verified' | 'warning' | 'arrow' | 'chevron' }) {
  return <svg className="operation-icon" viewBox="0 0 48 48" aria-hidden="true" focusable="false" data-game-art="true"><use href={`/assets/ui/operation-icons.svg#${name}`} /></svg>
}
