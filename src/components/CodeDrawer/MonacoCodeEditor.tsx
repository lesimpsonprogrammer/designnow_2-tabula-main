import Editor, { loader } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';

loader.config({ monaco });

type Props = {
  path: string;
  language: string;
  value: string;
  onChange: (value: string) => void;
};

export default function MonacoCodeEditor({ path, language, value, onChange }: Props) {
  return (
    <Editor
      path={path}
      language={language}
      value={value}
      theme="vs-dark"
      onChange={(next) => onChange(next ?? '')}
      options={{
        automaticLayout: true,
        bracketPairColorization: { enabled: true },
        fontFamily: 'var(--font-mono)',
        fontSize: 12,
        guides: { bracketPairs: true, indentation: true },
        lineHeight: 19,
        minimap: { enabled: true },
        padding: { top: 8, bottom: 8 },
        renderWhitespace: 'selection',
        scrollBeyondLastLine: false,
        tabSize: 2,
        wordWrap: 'off',
      }}
    />
  );
}
