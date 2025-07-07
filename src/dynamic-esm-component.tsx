'use client'

import React, { Component, lazy, useState, useSyncExternalStore, Suspense } from 'react'

// Hook to detect hydration state
const noop = (callback: () => void) => {
    return () => {}
}

function useHydrated() {
    return useSyncExternalStore(
        noop,
        () => true, // client snapshot
        () => false, // server snapshot (always false)
    )
}

// Error boundary for ESM components
class EsmErrorBoundary extends Component<
    { children: React.ReactNode; componentName: string },
    { hasError: boolean }
> {
    constructor(props: { children: React.ReactNode; componentName: string }) {
        super(props)
        this.state = { hasError: false }
    }

    static getDerivedStateFromError() {
        return { hasError: true }
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error(`Error loading ESM component ${this.props.componentName}:`, error, errorInfo)
    }

    render() {
        if (this.state.hasError) {
            return null
        }
        return this.props.children
    }
}

// Dynamic ESM component loader
export function DynamicEsmComponent({ 
    importUrl, 
    componentName,
    ...props 
}: { 
    importUrl: string
    componentName: string
    [key: string]: any 
}) {
    const isHydrated = useHydrated()
    const [LazyComponent] = useState(() => {
        if (typeof window === 'undefined') {
            return null
        }
        return lazy(async () => {
            try {
                const module = await import(/* @vite-ignore */ importUrl)
                const Component = module[componentName] || module.default
                if (!Component) {
                    throw new Error(`Component "${componentName}" not found in module ${importUrl}`)
                }
                return { default: Component }
            } catch (error) {
                console.error(`Failed to load ESM component from ${importUrl}:`, error)
                throw error
            }
        })
    })

    if (!isHydrated || !LazyComponent) {
        return null
    }

    return (
        <EsmErrorBoundary componentName={componentName}>
            <Suspense fallback={null}>
                <LazyComponent {...props} />
            </Suspense>
        </EsmErrorBoundary>
    )
}