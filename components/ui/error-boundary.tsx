'use client'

import { Component, type ReactNode } from 'react'

interface Props { children: ReactNode; fallback?: ReactNode }
interface State { hasError: boolean; error?: Error }

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4 p-8">
          <div className="text-5xl">😅</div>
          <h2 className="text-xl font-bold text-[#f0e6d0]">Algo salió mal</h2>
          <p className="text-sm text-[#6b7280] text-center max-w-md">
            Ocurrió un error inesperado. Recargá la página o intentá de nuevo.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-[#f59e0b] text-black font-bold px-6 py-2 rounded-xl hover:bg-[#d97706] transition-colors"
          >
            Recargar
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
