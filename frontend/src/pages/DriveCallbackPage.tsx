import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { API_BASE_URL } from '@/services/api'

export default function DriveCallbackPage() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [errorMsg, setErrorMsg] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    let active = true
    let pollInterval: any = null

    console.log('Attempting API connection to:', API_BASE_URL)
    const runAuth = async () => {
      try {
        const params = new URLSearchParams(window.location.search)
        const code = params.get('code')
        if (!code) {
          throw new Error('لم يتم العثور على رمز التحقق (authorization code) في الرابط.')
        }

        const sessionKey = `gdrive_auth_state_${code}`
        const currentState = sessionStorage.getItem(sessionKey)

        if (currentState === 'success') {
          console.log('Authorization code already processed successfully in this session.')
          if (active) {
            setStatus('success')
            setTimeout(() => {
              if (active) {
                if (window.opener) {
                  window.close()
                } else {
                  navigate('/drive')
                }
              }
            }, 1000)
          }
          return
        }

        if (currentState === 'error') {
          console.log('Authorization code failed in a previous attempt in this session.')
          if (active) {
            setStatus('error')
            setErrorMsg(sessionStorage.getItem(`${sessionKey}_err`) || 'فشل تأكيد الاتصال مع Google Drive.')
          }
          return
        }

        if (currentState === 'processing') {
          console.log('Authorization code exchange is currently in progress. Polling for results...')
          pollInterval = setInterval(() => {
            if (!active) return
            const state = sessionStorage.getItem(sessionKey)
            if (state === 'success') {
              clearInterval(pollInterval)
              setStatus('success')
              setTimeout(() => {
                if (active) {
                  if (window.opener) {
                    window.close()
                  } else {
                    navigate('/drive')
                  }
                }
              }, 1000)
            } else if (state === 'error') {
              clearInterval(pollInterval)
              setStatus('error')
              setErrorMsg(sessionStorage.getItem(`${sessionKey}_err`) || 'فشل تأكيد الاتصال مع Google Drive.')
            }
          }, 200)
          return
        }

        // Set state to processing so other mounts wait
        sessionStorage.setItem(sessionKey, 'processing')

        // Send auth code to backend
        const redirectUri = window.location.origin + '/drive/callback'
        const targetUrl = `${API_BASE_URL}/drive/auth-callback?redirect_uri=${encodeURIComponent(redirectUri)}`
        console.log('Sending authorization code to targetUrl:', targetUrl)
        const res = await fetch(targetUrl, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          credentials: 'same-origin',
          body: JSON.stringify({ code }),
        })

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}))
          const detail = errData.detail || 'فشل تأكيد الاتصال مع Google Drive في الخادم.'
          sessionStorage.setItem(sessionKey, 'error')
          sessionStorage.setItem(`${sessionKey}_err`, detail)
          throw new Error(detail)
        }

        // Save success status
        sessionStorage.setItem(sessionKey, 'success')

        // Post message to opener if it was a popup
        if (window.opener) {
          try {
            window.opener.postMessage({ type: 'gdrive-auth-success', code }, window.location.origin)
          } catch (e) {
            console.error(e)
          }
        }

        if (active) {
          setStatus('success')
          
          // Wait and redirect/close
          setTimeout(() => {
            if (window.opener) {
              window.close()
            } else {
              navigate('/drive')
            }
          }, 1500)
        }

      } catch (err: any) {
        console.error('Auth callback error:', err)
        if (active) {
          setStatus('error')
          const targetUrl = `${API_BASE_URL}/drive/auth-callback`
          setErrorMsg(`${err.message || 'حدث خطأ غير متوقع أثناء ربط الحساب.'}\n\nFailed to fetch from: ${targetUrl}`)
        }
      }
    }

    runAuth()
    return () => {
      active = false
      if (pollInterval) {
        clearInterval(pollInterval)
      }
    }
  }, [navigate])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-white bg-[#0a0e17] p-6">
      <div className="text-center space-y-4 max-w-md w-full p-8 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md">
        {status === 'loading' && (
          <>
            <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <h2 className="text-xl font-bold">جاري تأكيد الاتصال بـ Google Drive...</h2>
            <p className="text-sm text-white/60">يرجى الانتظار، يتم الآن تبادل البيانات مع Google.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-16 h-16 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto text-3xl">✓</div>
            <h2 className="text-xl font-bold text-green-400">تم الاتصال بنجاح!</h2>
            <p className="text-sm text-white/60">تم ربط حسابك بـ Google Drive بنجاح. سيتم توجيهك الآن...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-16 h-16 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mx-auto text-3xl">✗</div>
            <h2 className="text-xl font-bold text-red-400">فشل الاتصال</h2>
            <p className="text-sm text-red-300 font-medium whitespace-pre-wrap">{errorMsg}</p>
            <button
              onClick={() => navigate('/drive')}
              className="mt-4 px-6 py-2.5 rounded-xl font-bold text-sm bg-indigo-600 hover:bg-indigo-700 text-white transition-all"
            >
              العودة لإعدادات التخزين
            </button>
          </>
        )}
      </div>
    </div>
  )
}
