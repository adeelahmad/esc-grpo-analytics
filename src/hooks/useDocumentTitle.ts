import { useEffect } from 'react';
import { useAppState, useAppDispatch } from '../context/AppContext';

const BASE_TITLE = 'ESC-GRPO Inspector';

export function useDocumentTitle() {
  const { rows, changeInfo } = useAppState();
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (!rows.length) {
      document.title = BASE_TITLE;
      return;
    }
    if (changeInfo && changeInfo.newRowIndices.size > 0) {
      document.title = `+${changeInfo.newRowIndices.size} new \u2014 ${BASE_TITLE} (${rows.length})`;
    } else {
      document.title = `${BASE_TITLE} (${rows.length} rollouts)`;
    }
  }, [rows.length, changeInfo]);

  useEffect(() => {
    const handler = () => {
      if (document.visibilityState === 'visible' && changeInfo) {
        dispatch({ type: 'CLEAR_CHANGE_INFO' });
      }
    };
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }, [changeInfo, dispatch]);

  useEffect(() => {
    if (!changeInfo) return;
    const id = setTimeout(() => dispatch({ type: 'CLEAR_CHANGE_INFO' }), 8000);
    return () => clearTimeout(id);
  }, [changeInfo, dispatch]);
}
