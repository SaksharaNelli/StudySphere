import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './auth';
import Layout from './Layout';
import { Login, Register } from './pages/AuthPages';
import Dashboard from './pages/Dashboard';
import Subjects from './pages/Subjects';
import Assignments from './pages/Assignments';
import Exams from './pages/Exams';
import Syllabus from './pages/Syllabus';
import Preparation from './pages/Preparation';
import Planner from './pages/Planner';
import CalendarPage from './pages/CalendarPage';
import Focus from './pages/Focus';
import Goals from './pages/Goals';
import Notes from './pages/Notes';
import Analytics from './pages/Analytics';
import Insights from './pages/Insights';
import Sessions from './pages/Sessions';
import Assistant from './pages/Assistant';
import SettingsPage from './pages/SettingsPage';
import SearchPage from './pages/SearchPage';

export default function App() {
  const { user, ready } = useAuth();
  if (!ready) return <div className="grid min-h-screen place-items-center text-muted">Loading StudySphere...</div>;
  if (!user) return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/subjects" element={<Subjects />} />
        <Route path="/assignments" element={<Assignments />} />
        <Route path="/exams" element={<Exams />} />
        <Route path="/syllabus" element={<Syllabus />} />
        <Route path="/preparation" element={<Preparation />} />
        <Route path="/planner" element={<Planner />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/focus" element={<Focus />} />
        <Route path="/goals" element={<Goals />} />
        <Route path="/notes" element={<Notes />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/insights" element={<Insights />} />
        <Route path="/sessions" element={<Sessions />} />
        <Route path="/assistant" element={<Assistant />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
