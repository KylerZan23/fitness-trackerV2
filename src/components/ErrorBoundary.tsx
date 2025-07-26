'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { logger } from '@/lib/logging'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  showDetails?: boolean
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

export class ErrorBoundary extends Component<Props, State> {
  private retryCount = 0
  private readonly maxRetries = 3

  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error(
      'React error boundary caught an error',
      {
        component: 'ErrorBoundary',
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        retryCount: this.retryCount,
      },
      error
    )

    this.setState({
      error,
      errorInfo,
    })

    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }
  }

  private handleRetry = () => {
    this.retryCount++

    logger.info('User retrying after error boundary', {
      component: 'ErrorBoundary',
      retryCount: this.retryCount,
    })

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    })
  }

  private handleReload = () => {
    logger.info('User reloading page after error boundary', {
      component: 'ErrorBoundary',
      retryCount: this.retryCount,
    })

    window.location.reload()
  }

  private handleGoHome = () => {
    logger.info('User navigating to home after error boundary', {
      component: 'ErrorBoundary',
      retryCount: this.retryCount,
    })

    window.location.href = '/'
  }

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback
      }

      const { error, errorInfo } = this.state
      const canRetry = this.retryCount < this.maxRetries

      return (
        <div className="min-h-[400px] flex items-center justify-center p-6">
          <div className="max-w-md w-full">
            <div className="text-center mb-6">
              <div className="flex justify-center mb-4">
                <div className="rounded-full bg-red-100 dark:bg-red-900/20 p-3">
                  <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                Something went wrong
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                {error?.message || 'An unexpected error occurred'}
              </p>
            </div>

            <div className="space-y-3">
              {canRetry && (
                <Button onClick={this.handleRetry} className="w-full" variant="default">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again ({this.maxRetries - this.retryCount} attempts left)
                </Button>
              )}
              
              <Button onClick={this.handleReload} variant="outline" className="w-full">
                <RefreshCw className="h-4 w-4 mr-2" />
                Reload Page
              </Button>
              
              <Button onClick={this.handleGoHome} variant="ghost" className="w-full">
                <Home className="h-4 w-4 mr-2" />
                Go to Home
              </Button>
            </div>

            {this.props.showDetails && error && errorInfo && (
              <details className="mt-6 text-sm">
                <summary className="cursor-pointer text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200">
                  Technical Details
                </summary>
                <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-800 rounded text-xs font-mono overflow-auto max-h-48">
                  <div>
                    <strong>Error:</strong> {error.message}
                  </div>
                  {error.stack && (
                    <div className="mt-2">
                      <strong>Stack Trace:</strong>
                      <pre className="whitespace-pre-wrap mt-1">{error.stack}</pre>
                    </div>
                  )}
                  {errorInfo.componentStack && (
                    <div className="mt-2">
                      <strong>Component Stack:</strong>
                      <pre className="whitespace-pre-wrap mt-1">{errorInfo.componentStack}</pre>
                    </div>
                  )}
                </div>
              </details>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// Higher-order component for wrapping components with error boundary
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  )

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`

  return WrappedComponent
}

// Async error boundary for handling promise rejections
export class AsyncErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  componentDidMount() {
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', this.handleUnhandledRejection)
  }

  componentWillUnmount() {
    window.removeEventListener('unhandledrejection', this.handleUnhandledRejection)
  }

  private handleUnhandledRejection = (event: PromiseRejectionEvent) => {
    const error = event.reason instanceof Error ? event.reason : new Error(String(event.reason))

    logger.error(
      'Unhandled promise rejection',
      {
        component: 'AsyncErrorBoundary',
        error: error.message,
        stack: error.stack,
      },
      error
    )

    // Prevent the default browser error handling
    event.preventDefault()
  }

  render() {
    return <ErrorBoundary {...this.props}>{this.props.children}</ErrorBoundary>
  }
}
