import React from 'react';

interface TruthFileEditorProps {
  name: string;
  content: string;
  onChange?: (content: string) => void;
  readOnly?: boolean;
}

export const TruthFileEditor: React.FC<TruthFileEditorProps> = ({
  name,
  content,
  onChange,
  readOnly = false,
}) => {
  return (
    <div className="truth-file-editor">
      <div className="truth-file-editor__header">
        <span className="truth-file-editor__name">{name}</span>
      </div>
      <textarea
        className="truth-file-editor__textarea"
        value={content}
        onChange={(e) => onChange?.(e.target.value)}
        readOnly={readOnly}
      />
    </div>
  );
};
