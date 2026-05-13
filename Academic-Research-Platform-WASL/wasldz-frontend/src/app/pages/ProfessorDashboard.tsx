import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router';
import { DashboardShell } from '../components/DashboardShell';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Star, Eye, GraduationCap } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import type { ApiEnvelope, AuthUserPayload, ProfessorProfilePayload, ProjectApi } from '../types/api';
import { toast } from 'sonner';

export const ProfessorDashboard = () => {
  const { user, token, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [me, setMe] = useState<AuthUserPayload | null>(null);
  const [stats, setStats] = useState<Record<string, unknown> | null>(null);
  const [projects, setProjects] = useState<ProjectApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState({
    name: '',
    university: '',
    department: '',
    title: '',
    bio: '',
    research_areas: '',
  });

  const load = useCallback(async () => {
    if (!token || user?.role !== 'professor') return;
    setLoading(true);
    try {
      const [meRes, stRes, pubRes] = await Promise.all([
        api.get<ApiEnvelope<AuthUserPayload>>('/api/users/me'),
        api.get<ApiEnvelope<Record<string, unknown>>>(`/api/users/${user.id}/stats`),
        api.get<ApiEnvelope<{ projects?: ProjectApi[] }>>(`/api/users/${user.id}`),
      ]);
      if (meRes.data.success && meRes.data.data) {
        setMe(meRes.data.data);
        const pp = meRes.data.data.profile as ProfessorProfilePayload | null | undefined;
        setForm({
          name: meRes.data.data.name,
          university: pp?.university || '',
          department: pp?.department || '',
          title: pp?.title || '',
          bio: pp?.bio || '',
          research_areas: (pp?.research_areas || []).join(', '),
        });
      }
      if (stRes.data.success && stRes.data.data) setStats(stRes.data.data);
      if (pubRes.data.success && pubRes.data.data?.projects) {
        setProjects(pubRes.data.data.projects as ProjectApi[]);
      }
    } catch {
      toast.error('Failed to load');
    } finally {
      setLoading(false);
    }
  }, [token, user?.id, user?.role]);

  useEffect(() => {
    if (!token || user?.role !== 'professor') {
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
        title: form.title || null,
        bio: form.bio || null,
        research_areas: form.research_areas
          ? form.research_areas.split(',').map((s) => s.trim()).filter(Boolean)
          : [],
      });
      await refreshUser();
      await load();
      setEditOpen(false);
      toast.success('Profile updated');
    } catch {
      toast.error('Save failed');
    }
  };

  if (!user || user.role !== 'professor') return null;

  const profile = me?.profile as ProfessorProfilePayload | undefined;

  const statusBadge = (s: string | undefined) => {
    const v = (s || '').toLowerCase();
    if (v === 'approved') return 'bg-emerald-600 text-white border-0';
    if (v === 'pending') return 'bg-amber-500 text-white border-0';
    if (v === 'rejected') return 'bg-red-600 text-white border-0';
    return 'bg-slate-500 text-white border-0';
  };

  return (
    <DashboardShell
      portal="professor"
      navItems={[
        { href: '/profile/professor', label: 'Dashboard' },
        { href: '/projects', label: 'Projects' },
        { href: '/community', label: 'Community' },
      ]}
    >
      {loading && <p className="text-muted-foreground">Loading…</p>}
      {!loading && (
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="relative overflow-hidden rounded-3xl border border-violet-500/25 bg-gradient-to-br from-slate-900 via-violet-950 to-slate-900 text-white shadow-2xl p-8 md:p-10 flex flex-col md:flex-row justify-between gap-6">
            <div
              className="pointer-events-none absolute inset-0 opacity-25"
              style={{
                backgroundImage:
                  'radial-gradient(circle at 15% 30%, rgba(167,139,250,0.4), transparent 45%), radial-gradient(circle at 90% 10%, rgba(249,115,22,0.2), transparent 40%)',
              }}
            />
            <div className="relative flex items-start gap-6">
              <Avatar className="h-24 w-24 border-4 border-violet-300 shadow-lg ring-4 ring-white/10">
                {user.avatar ? <AvatarImage src={user.avatar} alt="" /> : null}
                <AvatarFallback className="bg-violet-600 text-xl text-white">
                  {user.name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-violet-200 text-sm font-medium uppercase tracking-wide flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-orange-400" />
                  Professor space
                </p>
                <h1 className="text-3xl md:text-4xl font-bold mt-1">
                  {profile?.title ? `${profile.title} ` : ''}
                  {user.name}
                </h1>
                <p className="text-white/80 mt-2 text-lg">{profile?.department || 'Add your department'}</p>
                <p className="text-white/60">{profile?.university || 'Add your university'}</p>
              </div>
            </div>
            <Button
              variant="secondary"
              className="relative bg-white/10 text-white border border-white/25 hover:bg-white/20 shrink-0"
              onClick={() => setEditOpen(true)}
            >
              Edit profile
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Supervised projects</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-[#1e3a8a]">
                  {stats?.total_supervised != null ? String(stats.total_supervised) : projects.length}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Avg project rating</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-[#f97316]">
                  {stats?.avg_project_rating != null
                    ? Number(stats.avg_project_rating).toFixed(1)
                    : profile?.avg_project_rating != null
                      ? Number(profile.avg_project_rating).toFixed(1)
                      : '—'}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Supervised projects</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {projects.length === 0 && <p className="text-muted-foreground">No projects linked yet.</p>}
              {projects.map((p) => (
                <Link key={p.id} to={`/projects/${p.id}`}>
                  <div className="border rounded-lg p-4 flex justify-between hover:bg-gray-50">
                    <div>
                      <p className="font-medium">{p.title}</p>
                      <Badge className={`capitalize mt-1 border-0 ${statusBadge(p.status)}`}>
                        {p.status}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground flex flex-col items-end">
                      <span className="flex items-center gap-1">
                        <Eye className="w-4 h-4" /> {p.views}
                      </span>
                      <span className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-[#f97316]" />
                        {p.avg_rating != null ? Number(p.avg_rating).toFixed(1) : '—'}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>

          {profile?.bio && (
            <Card>
              <CardHeader>
                <CardTitle>Bio</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{profile.bio}</p>
                <div className="flex flex-wrap gap-2 mt-4">
                  {(profile.research_areas || []).map((a) => (
                    <Badge key={a} variant="secondary">
                      {a}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Dialog open={editOpen} onOpenChange={setEditOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit profile</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <label className="text-sm">Name</label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                <label className="text-sm">Title (Dr. / Prof.)</label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                <label className="text-sm">University</label>
                <Input
                  value={form.university}
                  onChange={(e) => setForm({ ...form, university: e.target.value })}
                />
                <label className="text-sm">Department</label>
                <Input
                  value={form.department}
                  onChange={(e) => setForm({ ...form, department: e.target.value })}
                />
                <label className="text-sm">Bio</label>
                <Textarea rows={4} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
                <label className="text-sm">Research areas (comma-separated)</label>
                <Input
                  value={form.research_areas}
                  onChange={(e) => setForm({ ...form, research_areas: e.target.value })}
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditOpen(false)}>
                  Cancel
                </Button>
                <Button className="bg-[#016257]" onClick={saveProfile}>
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
