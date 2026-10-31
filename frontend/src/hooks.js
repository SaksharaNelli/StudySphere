import { useCallback, useEffect, useState } from 'react';
import { api } from './api';

export function useFetch(path, deps = []) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    if (!path) return;
    try { setData(await api(path)); setError(''); } catch (e) { setError(e.message); }
  }, [path, ...deps]);
  useEffect(() => { load(); }, [load]);
  return { data, error, loading: data === null && !error, reload: load, setData };
}
