import React from 'react';
import type { ChapterMeta } from '../../shared/types';

interface ChapterPreviewProps {
  chapter: ChapterMeta;
  onClick?: () => void;
}

export const ChapterPreview: React.FC<ChapterPreviewProps> = ({ chapter, onClick }) => {
  return (
    <div className="chapter-preview" onClick={onClick} role="button" tabIndex={0}>
      <span className="chapter-preview__title">{chapter.title}</span>
      <span className="chapter-preview__status">{chapter.status}</span>
      <span className="chapter-preview__words">{chapter.wordCount} 字</span>
    </div>
  );
};
