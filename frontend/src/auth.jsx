import { createContext, useContext, useEffect, useState } from 'react';
import { api, getToken } from './api';

const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(!getToken());

  useEffect(() => {
    if (!getToken()) return;
    api('/auth/me').then((r) => setUser(r.user)).catch(() => localStorage.removeItem('ss_token')).finally(() => setReady(true));
  }, []);
  useEffect(() => { document.documentElement.classList.toggle('dark', user?.theme === 'dark'); }, [user?.theme]);

  const accept = (r) => { localStorage.setItem('ss_token', r.token); setUser(r.user); };
  const value = {
    user, ready, setUser,
    login: async (email, password) => accept(await api('/auth/login', { method: 'POST', body: { email, password } })),
    register: async (form) => accept(await api('/auth/register', { method: 'POST', body: form })),
    logout: async () => { try { await api('/auth/logout', { method: 'POST' }); } catch { /* ignore */ } localStorage.removeItem('ss_token'); setUser(null); },
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
