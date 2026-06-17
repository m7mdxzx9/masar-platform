import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#0a0e17] text-slate-200 p-6" dir="rtl">
          <div className="max-w-md w-full bg-slate-800/50 backdrop-blur-sm border border-slate-700 p-8 rounded-2xl shadow-xl text-center">
            <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle size={32} />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">عذراً، حدث خطأ غير متوقع!</h1>
            <p className="text-slate-400 mb-6 text-sm leading-relaxed">
              لقد واجهنا مشكلة أثناء تحميل هذه الصفحة. يرجى محاولة إعادة تحديث الصفحة أو العودة لاحقاً.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="flex items-center justify-center gap-2 w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-4 rounded-xl transition-colors font-medium"
            >
              <RefreshCw size={18} />
              إعادة تحديث الصفحة
            </button>
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mt-6 text-left" dir="ltr">
                <div className="p-4 bg-slate-900 rounded-lg overflow-x-auto text-xs text-red-400 font-mono">
                  {this.state.error.toString()}
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
