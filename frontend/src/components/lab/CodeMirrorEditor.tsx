import { useEffect, useRef } from 'react';
import { EditorState } from '@codemirror/state';
import { EditorView, keymap, lineNumbers, highlightActiveLine, highlightActiveLineGutter } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { python } from '@codemirror/lang-python';
import { autocompletion, closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete';
import { oneDark } from '@codemirror/theme-one-dark';
import { bracketMatching, syntaxHighlighting, defaultHighlightStyle, indentOnInput } from '@codemirror/language';

interface CodeMirrorEditorProps {
  value: string;
  onChange: (value: string) => void;
  height?: string;
}

export default function CodeMirrorEditor({ value, onChange, height = '400px' }: CodeMirrorEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    if (!editorRef.current || viewRef.current) return;

    const updateListener = EditorView.updateListener.of((update) => {
      if (update.docChanged) onChangeRef.current(update.state.doc.toString());
    });

    const state = EditorState.create({
      doc: value,
      extensions: [
        lineNumbers(),
        highlightActiveLine(),
        highlightActiveLineGutter(),
        history(),
        python(),
        autocompletion({ activateOnTyping: true, closeOnBlur: false }),
        closeBrackets(),
        bracketMatching(),
        syntaxHighlighting(defaultHighlightStyle),
        indentOnInput(),
        oneDark,
        keymap.of([...defaultKeymap, ...historyKeymap, ...closeBracketsKeymap]),
        updateListener,
        EditorView.lineWrapping,
        EditorView.theme({
          '&': { height },
          '.cm-scroller': { overflow: 'auto' },
          '&.cm-editor.cm-focused': { outline: 'none' },
          '.cm-content': { fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace", fontSize: '14px', lineHeight: 1.7 },
          '.cm-gutters': { backgroundColor: '#0F172A', borderRight: '1px solid rgba(255,255,255,0.06)', color: '#475569' },
        }),
      ],
    });

    const view = new EditorView({ state, parent: editorRef.current });
    viewRef.current = view;
    return () => { view.destroy(); viewRef.current = null; };
  }, []);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const currentDoc = view.state.doc.toString();
    if (value !== currentDoc) view.dispatch({ changes: { from: 0, to: currentDoc.length, insert: value } });
  }, [value]);

  return <div ref={editorRef} className="w-full rounded-xl overflow-hidden border border-[rgba(255,255,255,0.06)]" />;
}
