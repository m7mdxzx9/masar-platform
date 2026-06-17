importScripts("https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js");

const ctx = self;

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
  const { type, code, files } = e.data;

  if (type === 'init') {
    await initPyodide();
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
