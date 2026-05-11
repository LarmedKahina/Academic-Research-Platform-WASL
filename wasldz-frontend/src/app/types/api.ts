export interface ApiEnvelope<T> {
  success: boolean;
  data?: T;
  error?: { message?: string; code?: string };
}

export interface StudentProfilePayload {
  university?: string | null;
  department?: string | null;
  year?: string | null;
  bio?: string | null;
  skills?: string[] | null;
  github_url?: string | null;
  linkedin_url?: string | null;
  global_rank?: number | null;
  total_views?: number | null;
  total_downloads?: number | null;
  avg_rating?: number | null;
}

export interface ProfessorProfilePayload {
  university?: string | null;
  department?: string | null;
  title?: string | null;
  bio?: string | null;
  research_areas?: string[] | null;
  total_supervised?: number | null;
  avg_project_rating?: number | null;
}

export interface CompanyProfilePayload {
  company_name?: string | null;
  industry?: string | null;
  location?: string | null;
  website?: string | null;
  description?: string | null;
  interests?: string[] | null;
  total_opportunities?: number | null;
}

export type ProfilePayload =
  | StudentProfilePayload
  | ProfessorProfilePayload
  | CompanyProfilePayload
  | null;

export interface AuthUserPayload {
  id: string;
  name: string;
  email: string;
  role: string;
  verified: boolean;
  avatar_url?: string | null;
  profile?: ProfilePayload;
  created_at?: string;
  updated_at?: string;
}

export interface LoginResponseBody {
  access_token: string;
  token_type: string;
  user: AuthUserPayload;
}

export interface ProjectApi {
  id: string;
  user_id: string;
  supervisor_id?: string | null;
  title: string;
  abstract: string;
  tags?: string[] | null;
  university?: string | null;
  department?: string | null;
  project_type?: string | null;
  file_url?: string | null;
  status: string;
  views: number;
  downloads: number;
  avg_rating?: number | null;
  total_ratings?: number | null;
  comments_count?: number;
  author_name?: string | null;
  supervisor_name?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectsListResponse {
  items: ProjectApi[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface DatasetApi {
  id: string;
  user_id: string;
  title: string;
  description?: string | null;
  category?: string | null;
  tags?: string[] | null;
  file_url?: string | null;
  file_size?: number | null;
  format?: string | null;
  downloads: number;
  created_at: string;
}

export interface PaperApi {
  id: string;
  user_id: string;
  title: string;
  abstract?: string | null;
  tags?: string[] | null;
  authors?: string[] | null;
  file_url?: string | null;
  pages?: number | null;
  citations?: number | null;
  views?: number | null;
  created_at: string;
}

export interface CommentApi {
  id: string;
  user_id: string;
  user_name?: string | null;
  user_avatar_url?: string | null;
  content: string;
  created_at: string;
}

export interface RatingApi {
  id: string;
  user_id: string;
  user_name?: string | null;
  user_avatar_url?: string | null;
  rating: number;
  created_at: string;
}

export interface RatingsBundle {
  ratings: RatingApi[];
  my_rating: number | null;
}

export interface AdminStats {
  users_by_role: Record<string, number>;
  projects_by_status: Record<string, number>;
  total_datasets: number;
  total_papers: number;
  total_opportunities?: number;
  new_users_this_week?: number;
  new_projects_this_week?: number;
}

export interface PendingUserEntry {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    verified: boolean;
    created_at?: string;
  };
  verification_documents: {
    id: string;
    document_url: string;
    status: string;
    submitted_at: string;
  }[];
}

export interface PendingProjectRow {
  id: string;
  title: string;
  university?: string | null;
  department?: string | null;
  author_name?: string | null;
  author_id: string;
  file_url?: string | null;
  created_at: string;
}

export interface ApplicationMine {
  id: string;
  opportunity_id: string;
  opportunity_title: string | null;
  company_name: string | null;
  status: string;
  message?: string | null;
  created_at: string;
}
