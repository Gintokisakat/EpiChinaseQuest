interface EmptyStateProps {
  icon?: string
  title: string
  description?: string
  action?: { label: string; href: string }
}

export default function EmptyState({ icon = '📭', title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
      <div className="text-6xl">{icon}</div>
      <h3 className="text-lg font-bold text-[#f0e6d0]">{title}</h3>
      {description && <p className="text-sm text-[#6b7280] max-w-sm">{description}</p>}
      {action && (
        <a
          href={action.href}
          className="bg-[#f59e0b] text-black font-bold px-6 py-2 rounded-xl hover:bg-[#d97706] transition-colors text-sm"
        >
          {action.label}
        </a>
      )}
    </div>
  )
}
