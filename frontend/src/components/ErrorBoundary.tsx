import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Button } from './ui/button'

interface Props {
  children?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in ErrorBoundary:', error, errorInfo)
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null })
    window.location.href = '/app'
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 text-center">
          <div className="w-full max-w-md animate-fade-slide-up rounded-2xl border bg-card p-6 shadow-xl">
            <h2 className="text-2xl font-bold tracking-tight text-destructive">Something went wrong</h2>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
              An unexpected error occurred in the application. Please try reloading or head back to the dashboard.
            </p>
            {this.state.error && (
              <pre className="mt-4 max-h-32 overflow-auto rounded-xl bg-muted p-3 text-left font-mono text-xs text-muted-foreground">
                {this.state.error.message}
              </pre>
            )}
            <div className="mt-6 flex justify-center gap-3">
              <Button onClick={this.handleReset} className="rounded-xl">
                Go to Dashboard
              </Button>
              <Button variant="outline" onClick={() => window.location.reload()} className="rounded-xl">
                Reload Page
              </Button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
