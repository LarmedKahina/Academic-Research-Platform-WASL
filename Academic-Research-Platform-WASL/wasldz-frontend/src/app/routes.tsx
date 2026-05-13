import { createBrowserRouter, Navigate } from 'react-router';
import { Layout } from './components/Layout';
import { Landing } from './pages/Landing';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { Browse } from './pages/Browse';
import { Community } from './pages/Community';
import { Projects } from './pages/Projects';
import { ProjectDetail } from './pages/ProjectDetail';
import { StudentProfile } from './pages/StudentProfile';
import { StudentDashboard } from './pages/StudentDashboard';
import { ProfessorProfile } from './pages/ProfessorProfile';
import { ProfessorDashboard } from './pages/ProfessorDashboard';
import { CompanyProfile } from './pages/CompanyProfile';
import { CompanyDashboard } from './pages/CompanyDashboard';
import { SubmitProject } from './pages/SubmitProject';
import { AdminDashboard } from './pages/AdminDashboard';
import { Datasets } from './pages/Datasets';
import { Topics } from './pages/Topics';
import { About } from './pages/About';
import { NotFound } from './pages/NotFound';
import { Opportunities } from './pages/Opportunities';
import { OpportunityDetail } from './pages/OpportunityDetail';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: Layout,
    children: [
      { index: true, Component: Landing },
      { path: 'login', Component: Login },
      { path: 'signup', Component: Signup },
      { path: 'browse', Component: Browse },
      { path: 'community', Component: Community },
      { path: 'projects', Component: Projects },
      { path: 'projects/:id', Component: ProjectDetail },
      { path: 'datasets', Component: Datasets },
      { path: 'topics', Component: Topics },
      { path: 'about', Component: About },
      { path: 'profile/student', Component: StudentDashboard },
      { path: 'profile/professor', Component: ProfessorDashboard },
      { path: 'profile/company', Component: CompanyDashboard },
      { path: 'profile/:id', Component: StudentProfile },
      { path: 'professor/:id', Component: ProfessorProfile },
      { path: 'company/:id', Component: CompanyProfile },
      { path: 'submit', Component: SubmitProject },
      { path: 'dashboard/admin', Component: AdminDashboard },
      { path: 'admin', element: <Navigate to="/dashboard/admin" replace /> },
      { path: 'opportunities', Component: Opportunities },
      { path: 'opportunities/:id', Component: OpportunityDetail },
      { path: '*', Component: NotFound },
    ],
  },
]);
