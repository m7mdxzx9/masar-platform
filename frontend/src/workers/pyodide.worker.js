importScripts("https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js");

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
    await pyodide.runPythonAsync(`
import sys
import io
sys.stdout = io.StringIO()
sys.stderr = io.StringIO()
    `);

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
      await pyodide.runPythonAsync(`
import micropip
await micropip.install('${packageName}')
      `);
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
      await pyodide.runPythonAsync(`
import sys
sys.stdout.truncate(0)
sys.stdout.seek(0)
sys.stderr.truncate(0)
sys.stderr.seek(0)
      `);

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
