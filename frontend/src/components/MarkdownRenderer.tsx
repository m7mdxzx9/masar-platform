import React, { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import { Copy, Check } from 'lucide-react'
import 'katex/dist/katex.min.css'

interface MarkdownRendererProps {
  content: string
}

function hasArabic(children: any): boolean {
  if (!children) return false;
  if (typeof children === 'string') {
    const arabicRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
    return arabicRegex.test(children);
  }
  if (Array.isArray(children)) {
    return children.some(child => hasArabic(child));
  }
  if (typeof children === 'object' && children.props && children.props.children) {
    return hasArabic(children.props.children);
  }
  return false;
}

function getLayoutProps(children: any) {
  const isAr = hasArabic(children);
  return {
    dir: isAr ? ("rtl" as const) : ("ltr" as const),
    className: isAr ? "text-right" : "text-left",
  };
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  const [copiedMap, setCopiedMap] = useState<Record<string, boolean>>({})

  const handleCopy = (codeText: string, id: string) => {
    navigator.clipboard.writeText(codeText)
    setCopiedMap((prev) => ({ ...prev, [id]: true }))
    setTimeout(() => {
      setCopiedMap((prev) => ({ ...prev, [id]: false }))
    }, 2000)
  }

  return (
    <div className="space-y-3 max-w-full overflow-hidden break-words text-right" dir="rtl">
      <style>{`
        .katex {
          direction: ltr !important;
          display: inline-block;
          text-align: left;
        }
        .katex-display {
          direction: ltr !important;
          text-align: center;
          margin: 1.5rem 0 !important;
          width: 100%;
          overflow-x: auto;
          overflow-y: hidden;
          padding: 0.5rem 0;
        }
        .katex-html {
          direction: ltr !important;
        }
      `}</style>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          h1: ({ children }) => {
            const lp = getLayoutProps(children);
            return <h1 className={`text-3xl font-black mt-6 mb-3 text-white break-words ${lp.className}`} dir={lp.dir}>{children}</h1>;
          },
          h2: ({ children }) => {
            const lp = getLayoutProps(children);
            return <h2 className={`text-2xl font-extrabold mt-5 mb-2.5 text-white break-words ${lp.className}`} dir={lp.dir}>{children}</h2>;
          },
          h3: ({ children }) => {
            const lp = getLayoutProps(children);
            return <h3 className={`text-xl font-bold mt-4 mb-2 text-white break-words ${lp.className}`} dir={lp.dir}>{children}</h3>;
          },
          h4: ({ children }) => {
            const lp = getLayoutProps(children);
            return <h4 className={`text-lg font-bold mt-4 mb-2 text-white break-words ${lp.className}`} dir={lp.dir}>{children}</h4>;
          },
          h5: ({ children }) => {
            const lp = getLayoutProps(children);
            return <h5 className={`text-base font-bold mt-3 mb-1.5 text-white break-words ${lp.className}`} dir={lp.dir}>{children}</h5>;
          },
          h6: ({ children }) => {
            const lp = getLayoutProps(children);
            return <h6 className={`text-sm font-bold mt-3 mb-1 text-white break-words ${lp.className}`} dir={lp.dir}>{children}</h6>;
          },
          p: ({ children }) => {
            const lp = getLayoutProps(children);
            return <p className={`text-white/80 leading-relaxed my-2 text-[15px] break-words whitespace-pre-wrap font-normal ${lp.className}`} dir={lp.dir}>{children}</p>;
          },
          ul: ({ children }) => {
            const isAr = hasArabic(children);
            return <ul className={`list-disc list-inside space-y-1 my-2 ${isAr ? 'pr-4 text-right' : 'pl-4 text-left'}`} dir={isAr ? 'rtl' : 'ltr'}>{children}</ul>;
          },
          ol: ({ children }) => {
            const isAr = hasArabic(children);
            return <ol className={`list-decimal list-inside space-y-1 my-2 ${isAr ? 'pr-4 text-right' : 'pl-4 text-left'}`} dir={isAr ? 'rtl' : 'ltr'}>{children}</ol>;
          },
          li: ({ children }) => {
            const lp = getLayoutProps(children);
            return <li className={`text-white/80 leading-relaxed text-[15px] my-1 break-words ${lp.className}`} dir={lp.dir}>{children}</li>;
          },
          a: ({ href, children }) => <a href={href} target="_blank" rel="noopener noreferrer" className="text-[#00FFCC] hover:underline break-words">{children}</a>,
          strong: ({ children }) => <strong className="font-extrabold text-white">{children}</strong>,
          em: ({ children }) => <em className="italic text-white/90">{children}</em>,
          code: ({ className, children, ...props }) => {
            const match = /language-(\w+)/.exec(className || '')
            const inline = !match
            const codeText = String(children).replace(/\n$/, '')
            const id = React.useId()

            if (inline) {
              return (
                <code className="bg-white/10 px-1.5 py-0.5 rounded font-mono text-xs text-[#00FFCC] border border-white/5" {...props}>
                  {codeText}
                </code>
              )
            }

            return (
              <div className="relative my-4 rounded-xl overflow-hidden border border-white/10 shadow-lg text-left" dir="ltr">
                <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/10 text-xs text-white/50 font-mono">
                  <span>{match ? match[1] : 'code'}</span>
                  <button
                    onClick={() => handleCopy(codeText, id)}
                    className="flex items-center gap-1 hover:text-white transition-colors p-1 rounded hover:bg-white/5"
                  >
                    {copiedMap[id] ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
                    <span>{copiedMap[id] ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <pre className="p-4 bg-[#0a0e17] overflow-x-auto text-[#00FFCC] leading-relaxed">
                  <code className="font-mono text-sm">{children}</code>
                </pre>
              </div>
            )
          },
          table: ({ children }) => (
            <div className="overflow-x-auto my-4 max-w-full rounded-xl border border-white/10 shadow-lg" dir="rtl">
              <table className="min-w-full text-right border-collapse text-sm table-layout-fixed">{children}</table>
            </div>
          ),
          thead: ({ children }) => <thead className="bg-white/5 border-b border-white/10">{children}</thead>,
          tbody: ({ children }) => <tbody>{children}</tbody>,
          tr: ({ children }) => <tr className="border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors">{children}</tr>,
          th: ({ children }) => <th className="px-4 py-3 font-bold text-white border-l border-white/10 last:border-l-0 break-words whitespace-pre-wrap text-right">{children}</th>,
          td: ({ children }) => <td className="px-4 py-2.5 text-white/80 border-l border-white/5 last:border-l-0 break-words whitespace-pre-wrap text-right">{children}</td>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}

export default MarkdownRenderer
