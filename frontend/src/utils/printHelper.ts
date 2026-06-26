/**
 * Reusable utility to print markdown content cleanly using native browser print engine.
 * Supports beautiful formatting, syntax styling, RTL direction for Arabic, and auto-disposes print window.
 */
export function exportToPDF(title: string, markdownContent: string) {
  const printWindow = window.open('', '_blank')
  if (!printWindow) {
    alert('يرجى السماح بالنوافذ المنبثقة لتصدير ملف PDF')
    return
  }

  // Detect if Arabic exists to set document direction
  const arabicRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/
  const isArabic = arabicRegex.test(title) || arabicRegex.test(markdownContent)
  const dir = isArabic ? 'rtl' : 'ltr'
  const textAlign = isArabic ? 'right' : 'left'

  // Write custom styled HTML content
  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="${isArabic ? 'ar' : 'en'}" dir="${dir}">
      <head>
        <meta charset="utf-8" />
        <title>${title}</title>
        <style>
          @page {
            size: A4;
            margin: 20mm;
          }
          body {
            font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
            color: #1e293b;
            line-height: 1.6;
            margin: 0;
            padding: 0;
            text-align: ${textAlign};
            background-color: #fff;
          }
          h1 {
            font-size: 26px;
            color: #0f172a;
            border-bottom: 2px solid #e2e8f0;
            padding-bottom: 12px;
            margin-top: 0;
            margin-bottom: 24px;
          }
          h2 {
            font-size: 20px;
            color: #1e293b;
            margin-top: 24px;
            margin-bottom: 12px;
            border-bottom: 1px solid #f1f5f9;
            padding-bottom: 6px;
          }
          h3 {
            font-size: 16px;
            color: #334155;
            margin-top: 18px;
            margin-bottom: 8px;
          }
          p {
            margin-top: 0;
            margin-bottom: 14px;
            font-size: 14px;
            color: #334155;
          }
          ul, ol {
            margin-top: 0;
            margin-bottom: 14px;
            padding-left: ${isArabic ? '0' : '24px'};
            padding-right: ${isArabic ? '24px' : '0'};
            font-size: 14px;
          }
          li {
            margin-bottom: 6px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            font-size: 13px;
          }
          th, td {
            border: 1px solid #e2e8f0;
            padding: 10px 12px;
            text-align: ${textAlign};
          }
          th {
            background-color: #f8fafc;
            font-weight: bold;
            color: #0f172a;
          }
          tr:nth-child(even) {
            background-color: #fcfdfe;
          }
          blockquote {
            margin: 16px 0;
            padding: 8px 16px;
            border-left: ${isArabic ? 'none' : '4px solid #cbd5e1'};
            border-right: ${isArabic ? '4px solid #cbd5e1' : 'none'};
            background-color: #f8fafc;
            color: #475569;
            font-style: italic;
          }
          code {
            font-family: 'Consolas', 'Courier New', monospace;
            background-color: #f1f5f9;
            padding: 2px 5px;
            border-radius: 4px;
            font-size: 13px;
            color: #0f172a;
          }
          pre {
            background-color: #0f172a;
            color: #f8fafc;
            padding: 16px;
            border-radius: 8px;
            overflow-x: auto;
            direction: ltr;
            text-align: left;
            margin: 16px 0;
          }
          pre code {
            background-color: transparent;
            color: inherit;
            padding: 0;
            font-size: 12px;
          }
          .footer {
            margin-top: 40px;
            border-top: 1px solid #e2e8f0;
            padding-top: 12px;
            font-size: 11px;
            color: #94a3b8;
            text-align: center;
          }
          @media print {
            body {
              background-color: #fff;
              color: #000;
            }
            .no-print {
              display: none;
            }
            pre {
              background-color: #f8fafc;
              color: #0f172a;
              border: 1px solid #e2e8f0;
            }
            pre code {
              color: #0f172a;
            }
          }
        </style>
      </head>
      <body>
        <div class="content-wrapper">
          <h1>${title}</h1>
          <div id="content-body"></div>
          <div class="footer">
            تم التصدير تلقائياً بواسطة منصة مسار التعليمية الذكية - Masar Platform
          </div>
        </div>
        
        <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
        <script>
          // Clean content formatting
          const rawMarkdown = \`${markdownContent.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\${/g, '\\${')}\`;
          document.getElementById('content-body').innerHTML = marked.parse(rawMarkdown);
          
          // Wait slightly for resources to load, then print and close
          setTimeout(function() {
            window.print();
            // Optional: close window after print dialog is closed
            window.close();
          }, 350);
        </script>
      </body>
    </html>
  `)
  printWindow.document.close()
}
