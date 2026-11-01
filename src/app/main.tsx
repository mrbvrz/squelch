import React, { Component, ErrorInfo, ReactNode } from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import './styles.css';
import { initTauriBridge } from '../bridge/tauri-bridge';

initTauriBridge();

class ErrorBoundary extends Component<
    { children: ReactNode },
    { hasError: boolean; error: Error | null }
> {
    constructor(props: { children: ReactNode }) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error) {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Squelch UI Error:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="p-8 text-white bg-slate-900 min-h-screen">
                    <h1 className="text-xl font-bold text-red-400 mb-2">
                        Something went wrong in Squelch UI
                    </h1>
                    <pre className="bg-slate-800 p-4 rounded text-sm text-red-200 overflow-auto">
                        {this.state.error?.stack || this.state.error?.message}
                    </pre>
                </div>
            );
        }
        return this.props.children;
    }
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
    <React.StrictMode>
        <ErrorBoundary>
            <App />
        </ErrorBoundary>
    </React.StrictMode>
);
