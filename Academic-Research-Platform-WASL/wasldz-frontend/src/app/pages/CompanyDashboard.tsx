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
import { Building2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import type { ApiEnvelope, AuthUserPayload, CompanyProfilePayload } from '../types/api';
import { toast } from 'sonner';

type Opp = {
  id: string;
  title: string;
  status?: string | null;
  applicant_count?: number;
};

type AppRow = {
  id: string;
  student_name?: string | null;
  status: string;
  message?: string | null;
  opportunity_id: string;
};

export const CompanyDashboard = () => {
  const { user, token, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [me, setMe] = useState<AuthUserPayload | null>(null);
  const [stats, setStats] = useState<Record<string, unknown> | null>(null);
  const [opportunities, setOpportunities] = useState<Opp[]>([]);
  const [applications, setApplications] = useState<AppRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [newOppOpen, setNewOppOpen] = useState(false);
  const [form, setForm] = useState({
    name: '',
    company_name: '',
    industry: '',
    location: '',
    website: '',
    description: '',
    interests: '',
  });
  const [newOpp, setNewOpp] = useState({ title: '', description: '', type: '', skills: '' });

  const load = useCallback(async () => {
    if (!token || user?.role !== 'company' || !user.id) return;
    setLoading(true);
    try {
      const [meRes, stRes, oppRes] = await Promise.all([
        api.get<ApiEnvelope<AuthUserPayload>>('/api/users/me'),
        api.get<ApiEnvelope<Record<string, unknown>>>(`/api/users/${user.id}/stats`),
        api.get<ApiEnvelope<Record<string, unknown>[]>>(`/api/opportunities`, { params: { open_only: false } }),
      ]);
      if (meRes.data.success && meRes.data.data) {
        setMe(meRes.data.data);
        const cp = meRes.data.data.profile as CompanyProfilePayload | null | undefined;
        setForm({
          name: meRes.data.data.name,
          company_name: cp?.company_name || '',
          industry: cp?.industry || '',
          location: cp?.location || '',
          website: cp?.website || '',
          description: cp?.description || '',
          interests: (cp?.interests || []).join(', '),
        });
      }
      if (stRes.data.success && stRes.data.data) setStats(stRes.data.data);
      const all = (oppRes.data.data || []) as Record<string, unknown>[];
      const mine = all
        .filter((o) => o.company_id === user.id)
        .map((o) => ({
          id: String(o.id),
          title: String(o.title),
          status: o.status as string | undefined,
          applicant_count: o.applicant_count as number | undefined,
        }));
      setOpportunities(mine);

      const apps: AppRow[] = [];
      for (const o of mine) {
        try {
          const ar = await api.get<ApiEnvelope<AppRow[]>>(`/api/opportunities/${o.id}/applications`);
          if (ar.data.success && ar.data.data) {
            for (const a of ar.data.data) {
              apps.push({ ...a, opportunity_id: o.id });
            }
          }
        } catch {
          /* skip */
        }
      }
      setApplications(apps);
    } catch {
      toast.error('Failed to load');
    } finally {
      setLoading(false);
    }
  }, [token, user?.id, user?.role]);

  useEffect(() => {
    if (!token || user?.role !== 'company') {
      navigate('/');
      return;
    }
    load();
  }, [token, user?.role, navigate, load]);

  const saveProfile = async () => {
    try {
      await api.put('/api/users/me', {
        name: form.name,
        company_name: form.company_name || null,
        industry: form.industry || null,
        location: form.location || null,
        website: form.website || null,
        description: form.description || null,
        interests: form.interests
          ? form.interests.split(',').map((s) => s.trim()).filter(Boolean)
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

  const createOpp = async () => {
    try {
      await api.post('/api/opportunities', {
        title: newOpp.title,
        description: newOpp.description || null,
        type: newOpp.type || null,
        skills: newOpp.skills
          ? newOpp.skills.split(',').map((s) => s.trim()).filter(Boolean)
          : [],
        status: 'open',
      });
      setNewOpp({ title: '', description: '', type: '', skills: '' });
      setNewOppOpen(false);
      await load();
      toast.success('Opportunity posted');
    } catch {
      toast.error('Could not create opportunity');
    }
  };

  const setApplicationStatus = async (appId: string, status: 'accepted' | 'rejected') => {
    try {
      await api.put(`/api/applications/${appId}/status`, { status });
      await load();
      toast.success(`Marked ${status}`);
    } catch {
      toast.error('Update failed');
    }
  };

  if (!user || user.role !== 'company') return null;

  const profile = me?.profile as CompanyProfilePayload | undefined;

  return (
    <DashboardShell
      portal="company"
      navItems={[
        { href: '/profile/company', label: 'Dashboard' },
        { href: '/opportunities', label: 'Public listings' },
      ]}
    >
      {loading && <p className="text-muted-foreground">Loading…</p>}
      {!loading && (
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="relative overflow-hidden rounded-3xl border border-teal-500/25 bg-gradient-to-br from-slate-900 via-teal-950 to-slate-900 text-white shadow-2xl p-8 md:p-10 flex flex-col md:flex-row justify-between gap-6">
            <div
              className="pointer-events-none absolute inset-0 opacity-25"
              style={{
                backgroundImage:
                  'radial-gradient(circle at 20% 20%, rgba(45,212,191,0.35), transparent 45%), radial-gradient(circle at 80% 0%, rgba(249,115,22,0.2), transparent 40%)',
              }}
            />
            <div className="relative flex items-start gap-6 min-w-0">
              <Avatar className="h-24 w-24 border-4 border-teal-300 shadow-lg ring-4 ring-white/10 shrink-0">
                {user.avatar ? <AvatarImage src={user.avatar} alt="" /> : null}
                <AvatarFallback className="bg-teal-600 text-xl text-white">
                  <Building2 className="w-10 h-10" />
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="text-teal-200 text-sm font-medium uppercase tracking-wide">Company space</p>
                <h1 className="text-3xl md:text-4xl font-bold mt-1 truncate">{profile?.company_name || user.name}</h1>
                <p className="text-white/80 mt-2">{profile?.industry || 'Add your industry'}</p>
                <p className="text-white/60 text-sm">{profile?.location || 'Add location'}</p>
              </div>
            </div>
            <div className="relative flex flex-col sm:flex-row gap-2 shrink-0">
              <Button
                variant="secondary"
                className="bg-white/10 text-white border border-white/25 hover:bg-white/20"
                onClick={() => setEditOpen(true)}
              >
                Edit profile
              </Button>
              <Button className="bg-orange-500 hover:bg-orange-600 text-white shadow-lg" onClick={() => setNewOppOpen(true)}>
                Post opportunity
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Total opportunities</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-[#1e3a8a]">
                  {String(stats?.total_opportunities ?? opportunities.length)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Open</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-[#016257]">{String(stats?.open_opportunities ?? '—')}</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Our opportunities</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {opportunities.map((o) => (
                <div key={o.id} className="border rounded-lg p-4 flex justify-between">
                  <div>
                    <Link to={`/opportunities/${o.id}`} className="font-medium text-[#1e3a8a]">
                      {o.title}
                    </Link>
                    <Badge variant="outline" className="ml-2 capitalize">
                      {o.status || 'open'}
                    </Badge>
                  </div>
                  <span className="text-sm text-muted-foreground">{o.applicant_count ?? 0} applicants</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Applications received</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {applications.length === 0 && <p className="text-muted-foreground">No applications yet.</p>}
              {applications.map((a) => (
                <div key={a.id} className="border rounded-lg p-4 flex flex-col md:flex-row md:justify-between gap-4">
                  <div>
                    <p className="font-medium">{a.student_name}</p>
                    <p className="text-sm text-muted-foreground">{a.message}</p>
                    <Badge className="mt-2 capitalize">{a.status}</Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="bg-[#016257]"
                      onClick={() => setApplicationStatus(a.id, 'accepted')}
                    >
                      Accept
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => setApplicationStatus(a.id, 'rejected')}>
                      Reject
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Dialog open={editOpen} onOpenChange={setEditOpen}>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Edit company profile</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <label className="text-sm">Display name</label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                <label className="text-sm">Company name</label>
                <Input
                  value={form.company_name}
                  onChange={(e) => setForm({ ...form, company_name: e.target.value })}
                />
                <label className="text-sm">Industry</label>
                <Input value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })} />
                <label className="text-sm">Location</label>
                <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
                <label className="text-sm">Website</label>
                <Input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} />
                <label className="text-sm">Description</label>
                <Textarea
                  rows={4}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
                <label className="text-sm">Interests (comma-separated)</label>
                <Input
                  value={form.interests}
                  onChange={(e) => setForm({ ...form, interests: e.target.value })}
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={saveProfile}>Save</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={newOppOpen} onOpenChange={setNewOppOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>New opportunity</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <Input
                  placeholder="Title"
                  value={newOpp.title}
                  onChange={(e) => setNewOpp({ ...newOpp, title: e.target.value })}
                />
                <Textarea
                  placeholder="Description"
                  value={newOpp.description}
                  onChange={(e) => setNewOpp({ ...newOpp, description: e.target.value })}
                />
                <Input
                  placeholder="Type (e.g. internship)"
                  value={newOpp.type}
                  onChange={(e) => setNewOpp({ ...newOpp, type: e.target.value })}
                />
                <Input
                  placeholder="Skills (comma-separated)"
                  value={newOpp.skills}
                  onChange={(e) => setNewOpp({ ...newOpp, skills: e.target.value })}
                />
              </div>
              <DialogFooter>
                <Button onClick={createOpp} className="bg-[#f97316]">
                  Publish
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      )}
    </DashboardShell>
  );
};
