import{b as e}from"./react-vendor-C_eMylfm.js";import{x as E,y as F}from"./index-CrsNbkor.js";const I=`importScripts("https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js");

const ctx = self;

// Intercept fetch to track package/wasm downloads progress
const originalFetch = self.fetch;
self.fetch = async function (url, options) {
  const urlStr = typeof url === 'string' ? url : (url.url || '');
  const response = await originalFetch(url, options);
  
  if (urlStr.includes('.wasm') || urlStr.includes('.whl')) {
    const contentLength = response.headers.get('content-length');
    if (contentLength && response.body) {
      const total = parseInt(contentLength, 10);
      let loaded = 0;
      const reader = response.body.getReader();
      const filename = urlStr.split('/').pop() || 'file';
      
      const stream = new ReadableStream({
        async start(controller) {
          const startTime = performance.now();
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) {
                controller.close();
                break;
              }
              loaded += value.length;
              const elapsed = (performance.now() - startTime) / 1000; // seconds
              const speed = elapsed > 0 ? (loaded / elapsed) : 0; // bytes/sec
              
              ctx.postMessage({
                type: 'loading_progress',
                file: filename,
                loaded,
                total,
                speed
              });
              
              controller.enqueue(value);
            }
          } catch (err) {
            controller.error(err);
          }
        }
      });
      
      return new Response(stream, {
        headers: response.headers,
        status: response.status,
        statusText: response.statusText
      });
    }
  }
  return response;
};

let pyodide = null;

async function initPyodide() {
  if (pyodide) {
    ctx.postMessage({ type: 'ready' });
    return;
  }
  try {
    pyodide = await self.loadPyodide({
      indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.25.0/full/'
    });

    // Preload numpy and pandas
    await pyodide.loadPackage(['numpy', 'pandas']);

    // Setup stdout and stderr redirection
    await pyodide.runPythonAsync(\`
import sys
import io
sys.stdout = io.StringIO()
sys.stderr = io.StringIO()
    \`);

    ctx.postMessage({ type: 'ready' });
  } catch (err) {
    ctx.postMessage({ type: 'error', error: err.message || 'Failed to initialize Pyodide' });
  }
}

ctx.addEventListener('message', async (e) => {
  const { type, code, files, packageName } = e.data;

  if (type === 'init') {
    await initPyodide();
  } else if (type === 'install_package') {
    if (!pyodide) {
      ctx.postMessage({ type: 'install_result', success: false, packageName, error: 'Python environment is not ready' });
      return;
    }
    try {
      // First load micropip package if not loaded
      await pyodide.loadPackage('micropip');
      await pyodide.runPythonAsync(\`
import micropip
await micropip.install('\${packageName}')
      \`);
      ctx.postMessage({ type: 'install_result', success: true, packageName });
    } catch (err) {
      ctx.postMessage({ type: 'install_result', success: false, packageName, error: err.message || String(err) });
    }
  } else if (type === 'run') {
    if (!pyodide) {
      ctx.postMessage({ type: 'run_result', error: 'Python environment is not ready', output: '', duration: 0 });
      return;
    }

    const start = performance.now();
    try {
      // Inject files to virtual FS
      if (files && Array.isArray(files)) {
        for (const file of files) {
          if (file.filename && typeof file.content === 'string') {
            // Ensure any directories exist
            const parts = file.filename.split('/');
            let currentDir = '';
            for (let i = 0; i < parts.length - 1; i++) {
              currentDir += (i === 0 ? '' : '/') + parts[i];
              try {
                pyodide.FS.mkdir(currentDir);
              } catch (mkdirErr) {
                // directory may already exist, ignore error
              }
            }
            pyodide.FS.writeFile(file.filename, file.content, { overwrite: true });
          }
        }
      }

      // Reset stdout/stderr buffers
      await pyodide.runPythonAsync(\`
import sys
sys.stdout.truncate(0)
sys.stdout.seek(0)
sys.stderr.truncate(0)
sys.stderr.seek(0)
      \`);

      // Run code
      await pyodide.runPythonAsync(code);

      // Get stdout/stderr values
      const stdout = pyodide.runPython('sys.stdout.getvalue()');
      const stderr = pyodide.runPython('sys.stderr.getvalue()');

      ctx.postMessage({
        type: 'run_result',
        output: stdout || '',
        error: stderr || null,
        duration: Math.round(performance.now() - start)
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      ctx.postMessage({
        type: 'run_result',
        output: '',
        error: errorMsg,
        duration: Math.round(performance.now() - start)
      });
    }
  }
});
`;function A(){const[h,i]=e.useState(!0),[l,m]=e.useState(!1),[c,d]=e.useState(null),[w,a]=e.useState(null),n=e.useRef(null),p=e.useRef(null),y=e.useRef(null),f=e.useCallback(()=>{i(!0),m(!1),d(null),a(null);try{const o=new Blob([I],{type:"application/javascript"}),u=URL.createObjectURL(o),r=new Worker(u);r.onmessage=t=>{const{type:s,error:g,output:M,duration:R,file:b,loaded:v,total:S,speed:_,success:L}=t.data;s==="ready"?(m(!0),i(!1),a(null)):s==="error"?(d(g||"فشل تشغيل بيئة Python"),i(!1),a(null)):s==="run_result"?p.current&&(p.current({output:M,error:g,duration:R}),p.current=null):s==="loading_progress"?a({file:b,loaded:v,total:S,speed:_}):s==="install_result"&&(y.current&&(y.current({success:L,error:g}),y.current=null),a(null))},r.onerror=t=>{console.error("Pyodide Worker Error:",t),d("خطأ في تشغيل Worker الخاص بـ Python"),i(!1),a(null)},r.postMessage({type:"init"}),n.current=r}catch(o){d(o.message||"فشل إنشاء Web Worker"),i(!1),a(null)}},[]);e.useEffect(()=>(f(),()=>{n.current&&(n.current.terminate(),n.current=null)}),[f]);const k=e.useCallback(async(o,u)=>{if(!n.current||!l||c){const r=performance.now();try{const t=await E.post(`${F.defaults.baseURL}/labs/run`,{code:o,language:"python"}),s=Math.round(performance.now()-r);return{output:t.data.output||"",error:t.data.error||null,duration:s}}catch(t){const s=Math.round(performance.now()-r);return{output:"",error:t.response?.data?.detail||t.message||"فشل تشغيل الكود عبر الخادم المرفق",duration:s}}}return new Promise(r=>{p.current=r,n.current?.postMessage({type:"run",code:o,files:u})})},[l,c]),P=e.useCallback(async o=>!n.current||!l||c?{success:!1,error:"بيئة Python غير جاهزة للتثبيت"}:new Promise(u=>{y.current=u,n.current?.postMessage({type:"install_package",packageName:o})}),[l,c]),x=e.useCallback(()=>{n.current&&(n.current.terminate(),n.current=null),f()},[f]);return{isLoading:h,isReady:l,error:c,loadingProgress:w,runPython:k,installPackage:P,retry:x}}export{A as u};
//# sourceMappingURL=usePyodide-PvzqCFle.js.map
