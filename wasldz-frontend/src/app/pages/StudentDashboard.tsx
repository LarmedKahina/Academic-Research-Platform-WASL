import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router';
import { DashboardShell } from '../components/DashboardShell';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Star, Eye, Download, Github, Linkedin, Upload, Plus } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import type {
  ApiEnvelope,
  ApplicationMine,
  AuthUserPayload,
  ProjectApi,
  StudentProfilePayload,
} from '../types/api';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';

export const StudentDashboard = () => {
  const { user, token, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [me, setMe] = useState<AuthUserPayload | null>(null);
  const [stats, setStats] = useState<Record<string, unknown> | null>(null);
  const [projects, setProjects] = useState<ProjectApi[]>([]);
  const [applications, setApplications] = useState<ApplicationMine[]>([]);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState({
    name: '',
    university: '',
    department: '',
    year: '',
    bio: '',
    skills: '',
    github_url: '',
    linkedin_url: '',
  });

  const load = useCallback(async () => {
    if (!token || user?.role !== 'student') return;
    setLoading(true);
    try {
      const [meRes, stRes, projRes, appRes] = await Promise.all([
        api.get<ApiEnvelope<AuthUserPayload>>('/api/users/me'),
        api.get<ApiEnvelope<Record<string, unknown>>>(`/api/users/${user.id}/stats`),
        api.get<ApiEnvelope<{ projects?: ProjectApi[] }>>(`/api/users/${user.id}`),
        api.get<ApiEnvelope<ApplicationMine[]>>('/api/applications/me'),
      ]);
      if (meRes.data.success && meRes.data.data) {
        setMe(meRes.data.data);
        const sp = meRes.data.data.profile as StudentProfilePayload | null | undefined;
        setForm({
          name: meRes.data.data.name,
          university: sp?.university || '',
          department: sp?.department || '',
          year: sp?.year || '',
          bio: sp?.bio || '',
          skills: (sp?.skills || []).join(', '),
          github_url: sp?.github_url || '',
          linkedin_url: sp?.linkedin_url || '',
        });
      }
      if (stRes.data.success && stRes.data.data) setStats(stRes.data.data);
      if (projRes.data.success && projRes.data.data?.projects) {
        setProjects(projRes.data.data.projects as ProjectApi[]);
      }
      if (appRes.data.success && appRes.data.data) setApplications(appRes.data.data);
    } catch {
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, [token, user?.id, user?.role]);

  useEffect(() => {
    if (!token || user?.role !== 'student') {
      navigate('/');
      return;
    }
    load();
  }, [token, user?.role, navigate, load]);

  const saveProfile = async () => {
    try {
      await api.put('/api/users/me', {
        name: form.name,
        university: form.university || null,
        department: form.department || null,
        year: form.year || null,
        bio: form.bio || null,
        skills: form.skills
          ? form.skills.split(',').map((s) => s.trim()).filter(Boolean)
          : [],
        github_url: form.github_url || null,
        linkedin_url: form.linkedin_url || null,
      });
      await refreshUser();
      await load();
      setEditOpen(false);
      toast.success('Profile updated');
    } catch {
      toast.error('Could not save profile');
    }
  };

  const uploadAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    try {
      await api.post('/api/users/me/avatar', fd);
      await refreshUser();
      await load();
      toast.success('Avatar updated');
    } catch {
      toast.error('Avatar upload failed');
    }
  };

  if (!user || user.role !== 'student') return null;

  const profile = me?.profile as StudentProfilePayload | undefined;
  const rank = stats?.global_rank != null ? Number(stats.global_rank) : null;
  const avgRating = stats?.avg_rating != null ? Number(stats.avg_rating) : profile?.avg_rating ?? null;

  return (
    <DashboardShell
      navItems={[
        { href: '/profile/student', label: 'Overview' },
        { href: '/submit', label: 'Submit project' },
        { href: '/projects', label: 'Browse projects' },
        { href: '/community', label: 'Community' },
      ]}
    >
      {loading && <p className="text-muted-foreground">Loading…</p>}

      {!loading && (
        <div className="space-y-8 max-w-6xl mx-auto">
          <div className="bg-gradient-to-r from-[#1e3a8a] to-[#1e293b] rounded-2xl p-8 text-white flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
            <div className="flex items-center gap-6">
              <Avatar className="h-24 w-24 border-4 border-[#f97316]">
                {user.avatar ? <AvatarImage src={user.avatar} alt="" /> : null}
                <AvatarFallback className="bg-[#f97316] text-2xl text-white">
                  {user.name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-3xl font-bold">{user.name}</h1>
                <p className="text-white/80 mt-1">
                  {[profile?.year, profile?.department].filter(Boolean).join(' · ')}
                </p>
                <p className="text-white/70 text-sm">{profile?.university}</p>
                {!user.verified && (
                  <Badge className="mt-2 bg-amber-500 text-white">Pending verification</Badge>
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <label className="cursor-pointer">
                <span className="inline-flex items-center justify-center rounded-md border border-white/30 px-4 py-2 text-sm hover:bg-white/10">
                  <Upload className="w-4 h-4 mr-2 inline" />
                  Upload avatar
                </span>
                <input type="file" accept="image/*" className="hidden" onChange={uploadAvatar} />
              </label>
              <Button variant="secondary" onClick={() => setEditOpen(true)}>
                Edit profile
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Global rank', value: rank != null ? `#${Math.round(rank)}` : '—' },
              { label: 'Avg rating', value: avgRating != null ? avgRating.toFixed(1) : '—' },
              { label: 'Total views', value: String(stats?.total_views ?? profile?.total_views ?? 0) },
              { label: 'Downloads', value: String(stats?.total_downloads ?? profile?.total_downloads ?? 0) },
            ].map((s) => (
              <Card key={s.label}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">{s.label}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-[#1e3a8a]">{s.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Tabs defaultValue="projects">
            <TabsList>
              <TabsTrigger value="projects">My projects</TabsTrigger>
              <TabsTrigger value="applications">My applications</TabsTrigger>
            </TabsList>
            <TabsContent value="projects" className="space-y-4 mt-4">
              {projects.length === 0 && <p className="text-muted-foreground">No projects yet.</p>}
              {projects.map((p) => (
                <Link key={p.id} to={`/projects/${p.id}`}>
                  <Card className="hover:shadow-md border-l-4 border-l-[#f97316] transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex justify-between gap-4">
                        <div>
                          <h3 className="text-lg font-semibold">{p.title}</h3>
                          <div className="flex flex-wrap gap-2 mt-2">
                            <Badge variant="outline" className="capitalize">
                              {p.status}
                            </Badge>
                            {(p.tags || []).map((t) => (
                              <Badge key={t} variant="secondary">
                                {t}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground flex flex-col items-end gap-1">
                          <span className="flex items-center gap-1">
                            <Eye className="w-4 h-4" /> {p.views}
                          </span>
                          <span className="flex items-center gap-1">
                            <Download className="w-4 h-4" /> {p.downloads}
                          </span>
                          <span className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-[#f97316]" />{' '}
                            {p.avg_rating != null ? Number(p.avg_rating).toFixed(1) : '—'}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
              <Button className="bg-[#f97316] hover:bg-[#ea580c]" asChild>
                <Link to="/submit">
                  <Plus className="w-4 h-4 mr-2 inline" />
                  New project
                </Link>
              </Button>
            </TabsContent>
            <TabsContent value="applications" className="space-y-4 mt-4">
              {applications.length === 0 && <p className="text-muted-foreground">No applications yet.</p>}
              {applications.map((a) => (
                <Card key={a.id}>
                  <CardContent className="pt-6 flex justify-between flex-wrap gap-4">
                    <div>
                      <p className="font-medium">{a.opportunity_title}</p>
                      <p className="text-sm text-muted-foreground">{a.company_name}</p>
                      <p className="text-sm mt-2">{a.message}</p>
                    </div>
                    <Badge className="capitalize h-fit">{a.status}</Badge>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
          </Tabs>

          {profile?.bio && (
            <Card>
              <CardHeader>
                <CardTitle>About</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground whitespace-pre-wrap">{profile.bio}</p>
                <div className="flex flex-wrap gap-2 mt-4">
                  {(profile.skills || []).map((s) => (
                    <Badge key={s} variant="outline">
                      {s}
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-4 mt-4">
                  {profile.github_url && (
                    <a href={profile.github_url} className="text-[#1e3a8a] flex items-center gap-2 text-sm">
                      <Github className="w-4 h-4" /> GitHub
                    </a>
                  )}
                  {profile.linkedin_url && (
                    <a href={profile.linkedin_url} className="text-[#1e3a8a] flex items-center gap-2 text-sm">
                      <Linkedin className="w-4 h-4" /> LinkedIn
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          <Dialog open={editOpen} onOpenChange={setEditOpen}>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Edit profile</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <label className="text-sm font-medium">Name</label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                <label className="text-sm font-medium">University</label>
                <Input
                  value={form.university}
                  onChange={(e) => setForm({ ...form, university: e.target.value })}
                />
                <label className="text-sm font-medium">Department</label>
                <Input
                  value={form.department}
                  onChange={(e) => setForm({ ...form, department: e.target.value })}
                />
                <label className="text-sm font-medium">Year</label>
                <Input value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} />
                <label className="text-sm font-medium">Bio</label>
                <Textarea rows={4} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
                <label className="text-sm font-medium">Skills (comma-separated)</label>
                <Input value={form.skills} onChange={(e) => setForm({ ...form, skills: e.target.value })} />
                <label className="text-sm font-medium">GitHub URL</label>
                <Input
                  value={form.github_url}
                  onChange={(e) => setForm({ ...form, github_url: e.target.value })}
                />
                <label className="text-sm font-medium">LinkedIn URL</label>
                <Input
                  value={form.linkedin_url}
                  onChange={(e) => setForm({ ...form, linkedin_url: e.target.value })}
                />
              </div>
              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => setEditOpen(false)}>
                  Cancel
                </Button>
                <Button className="bg-[#016257] hover:bg-[#014d48]" onClick={saveProfile}>
                  Save
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      )}
    </DashboardShell>
  );
};
