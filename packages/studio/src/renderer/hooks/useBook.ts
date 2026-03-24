import { useState, useEffect, useCallback } from 'react';
import { ipcRenderer } from '../lib/api';
import type { BookSummary, CreateBookRequest } from '../../shared/types';

interface UseBookReturn {
  books: BookSummary[];
  isLoading: boolean;
  error: string | null;
  refreshBooks: () => Promise<void>;
  createBook: (req: CreateBookRequest) => Promise<string | null>;
  deleteBook: (bookId: string) => Promise<boolean>;
  getBook: (bookId: string) => Promise<BookSummary | null>;
}

export function useBook(): UseBookReturn {
  const [books, setBooks] = useState<BookSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshBooks = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const result = await ipcRenderer.invoke<BookSummary[]>('book:list');
    if (result.success && result.data) {
      setBooks(result.data);
    } else {
      setError(result.error || null);
    }
    setIsLoading(false);
  }, []);

  const createBook = useCallback(async (req: CreateBookRequest): Promise<string | null> => {
    const result = await ipcRenderer.invoke<{ bookId: string }>('book:create', req);
    if (result.success && result.data) {
      await refreshBooks();
      return result.data.bookId;
    }
    setError(result.error || null);
    return null;
  }, [refreshBooks]);

  const deleteBook = useCallback(async (bookId: string): Promise<boolean> => {
    const result = await ipcRenderer.invoke<boolean>('book:delete', bookId);
    if (result.success) {
      await refreshBooks();
      return true;
    }
    setError(result.error || null);
    return false;
  }, [refreshBooks]);

  const getBook = useCallback(async (bookId: string): Promise<BookSummary | null> => {
    const result = await ipcRenderer.invoke<BookSummary>('book:get', bookId);
    if (result.success && result.data) {
      return result.data;
    }
    setError(result.error || null);
    return null;
  }, []);

  useEffect(() => {
    refreshBooks();
  }, [refreshBooks]);

  return { books, isLoading, error, refreshBooks, createBook, deleteBook, getBook };
}
