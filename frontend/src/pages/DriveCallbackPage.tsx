import { useEffect } from 'react'

export default function DriveCallbackPage() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    if (code) {
      if (window.opener) {
        window.opener.postMessage({ type: 'gdrive-auth-success', code }, window.location.origin)
      } else {
        localStorage.setItem('gdrive_auth_code', code)
      }
      setTimeout(() => {
        window.close()
      }, 1500)
    }
  }, [])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-white bg-[#0a0e17] p-6">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <h2 className="text-xl font-bold">جاري تأكيد الاتصال بـ Google Drive...</h2>
        <p className="text-sm text-white/60">تم تسجيل الدخول بنجاح. سيتم إغلاق هذه النافذة تلقائياً والعودة للمنصة.</p>
      </div>
    </div>
  )
}
