'use client'
import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error) {
    console.error('[ErrorBoundary]', error)
  }

  render() {
    if (this.state.error) {
      return this.props.fallback ?? (
        <div className="flex flex-col items-center justify-center min-h-[200px] gap-md p-lg text-center">
          <span className="material-symbols-outlined text-error text-[36px]">error</span>
          <div>
            <div className="text-label-md text-on-surface font-semibold mb-xs">Something went wrong</div>
            <div className="text-label-sm text-on-surface-variant">{this.state.error.message}</div>
          </div>
          <button
            onClick={() => this.setState({ error: null })}
            className="glass-card px-md py-xs rounded-full text-label-sm text-on-surface-variant hover:text-on-surface transition-colors"
          >
            Try again
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
