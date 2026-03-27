import React from 'react';
import Editor, { loader, type Monaco, type OnMount } from '@monaco-editor/react';

loader.init().then((monaco: Monaco) => {
  if (monaco.languages.html?.htmlDefaults) {
    monaco.languages.html.htmlDefaults.setOptions({
      suggest: { html5: false, angular1: false, ionic: false },
    });
  }
});

interface TemplateVariableLike {
  name: string;
  description?: string;
  category?: string;
}

interface TemplateBodyEditorProps {
  editorKey: string;
  value: string;
  availableVariables: TemplateVariableLike[];
  editorRef: React.MutableRefObject<Parameters<OnMount>[0] | null>;
  onChange: (value: string) => void;
}

type MonacoLanguageInfo = {
  id: string;
};

type MonacoPosition = {
  lineNumber: number;
  column: number;
};

type MonacoWordAtPosition = {
  startColumn: number;
  endColumn: number;
};

type MonacoRange = {
  startLineNumber: number;
  startColumn: number;
  endLineNumber: number;
  endColumn: number;
};

type MonacoTextModel = {
  getValueInRange(range: MonacoRange): string;
  getWordUntilPosition(position: MonacoPosition): MonacoWordAtPosition;
};

const LANG_ID = 'template-vars';

const TemplateBodyEditor: React.FC<TemplateBodyEditorProps> = ({
  editorKey,
  value,
  availableVariables,
  editorRef,
  onChange,
}) => {
  return (
    <Editor
      key={editorKey}
      height="100%"
      value={value}
      onChange={(nextValue) => onChange(nextValue || '')}
      beforeMount={(monaco) => {
        if (!monaco.languages.getLanguages().some((lang: MonacoLanguageInfo) => lang.id === LANG_ID)) {
          monaco.languages.register({ id: LANG_ID });

          monaco.editor.defineTheme('template-theme', {
            base: 'vs',
            inherit: true,
            rules: [
              { token: 'delimiter.template', foreground: '1677ff' },
              { token: 'variable.template', foreground: '16a34a' },
            ],
            colors: {
              'editorBracketMatch.background': '#00000000',
              'editorBracketMatch.border': '#00000000',
            },
          });

          monaco.languages.setMonarchTokensProvider(LANG_ID, {
            tokenizer: {
              root: [
                [/\{\{/, 'delimiter.template', '@variable'],
                [/./, ''],
              ],
              variable: [
                [/\}\}/, 'delimiter.template', '@pop'],
                [/[a-zA-Z_][\w.]*/, 'variable.template'],
                [/./, ''],
              ],
            },
          });
          monaco.languages.setLanguageConfiguration(LANG_ID, {
            autoClosingPairs: [
              { open: '{', close: '}' },
              { open: '{{', close: '}}' },
            ],
          });

          monaco.languages.registerCompletionItemProvider(LANG_ID, {
            triggerCharacters: ['{'],
            provideCompletionItems: (model: MonacoTextModel, position: MonacoPosition) => {
              const textUntilPosition = model.getValueInRange({
                startLineNumber: position.lineNumber,
                startColumn: 1,
                endLineNumber: position.lineNumber,
                endColumn: position.column,
              });

              if (!textUntilPosition.match(/\{\{[a-z0-9_.]*$/i)) {
                return { suggestions: [] };
              }

              const word = model.getWordUntilPosition(position);
              const range = {
                startLineNumber: position.lineNumber,
                endLineNumber: position.lineNumber,
                startColumn: word.startColumn,
                endColumn: word.endColumn,
              };

              const suggestions = availableVariables.map((variable) => ({
                label: variable.name,
                kind: monaco.languages.CompletionItemKind.Variable,
                documentation: {
                  value: `**${variable.name}**\n\n${variable.description || '无描述'}\n\n分类: \`${variable.category || 'variable'}\``,
                  isTrusted: true,
                },
                insertText: variable.name,
                range,
                detail: variable.description || variable.category || '模板变量',
              }));

              return { suggestions };
            },
          });
        }
      }}
      language={LANG_ID}
      theme="template-theme"
      options={{
        fontSize: 14,
        fontFamily: "'SF Mono', 'Menlo', 'Monaco', 'Consolas', monospace",
        lineNumbers: 'on',
        minimap: { enabled: false },
        wordWrap: 'on',
        automaticLayout: true,
        scrollBeyondLastLine: false,
        padding: { top: 12, bottom: 12 },
        tabSize: 2,
        renderWhitespace: 'selection',
        quickSuggestions: true,
        suggestOnTriggerCharacters: true,
        wordBasedSuggestions: 'off',
        folding: true,
        lineDecorationsWidth: 8,
        lineNumbersMinChars: 3,
        glyphMargin: false,
        contextmenu: true,
        autoClosingBrackets: 'always',
        'bracketPairColorization.enabled': false,
        matchBrackets: 'never',
        scrollbar: {
          vertical: 'auto',
          horizontal: 'auto',
          verticalScrollbarSize: 10,
          horizontalScrollbarSize: 10,
        },
      }}
      onMount={((editorInstance) => {
        editorRef.current = editorInstance;
      }) satisfies OnMount}
    />
  );
};

export default TemplateBodyEditor;
