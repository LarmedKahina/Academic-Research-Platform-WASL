import { createBrowserRouter } from 'react-router';
import { Layout } from './components/Layout';
import { Landing } from './pages/Landing';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { Browse } from './pages/Browse';
import { Community } from './pages/Community';
import { Projects } from './pages/Projects';
import { ProjectDetail } from './pages/ProjectDetail';
import { StudentProfile } from './pages/StudentProfile';
import { ProfessorProfile } from './pages/ProfessorProfile';
import { CompanyProfile } from './pages/CompanyProfile';
import { Opportunities } from './pages/Opportunities';
import { SubmitProject } from './pages/SubmitProject';
import { AdminDashboard } from './pages/AdminDashboard';
import { Datasets } from './pages/Datasets';
import { Topics } from './pages/Topics';
import { About } from './pages/About';
import { NotFound } from './pages/NotFound';

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
      { path: 'profile/:id', Component: StudentProfile },
      { path: 'professor/:id', Component: ProfessorProfile },
      { path: 'company/:id', Component: CompanyProfile },
      { path: 'submit', Component: SubmitProject },
      { path: 'admin', Component: AdminDashboard },
      { path: 'opportunities', Component: Opportunities },
      { path: '*', Component: NotFound },
    ],
  },
]);
