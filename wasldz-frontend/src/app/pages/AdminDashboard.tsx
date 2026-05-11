import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../components/ui/dialog';
import { CheckCircle, XCircle, Clock, Users, Building2, GraduationCap, FileText } from 'lucide-react';
import { api } from '../services/api';
import type { AdminStats, ApiEnvelope, PendingUserEntry, PendingProjectRow } from '../types/api';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';

export const AdminDashboard = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [pendingUsers, setPendingUsers] = useState<PendingUserEntry[]>([]);
  const [pendingProjects, setPendingProjects] = useState<PendingProjectRow[]>([]);
  const [allUsers, setAllUsers] = useState<
    { id: string; name: string; email: string; role: string; verified: boolean }[]
  >([]);
  const [userSearch, setUserSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectTarget, setRejectTarget] = useState<'user' | 'project' | null>(null);
  const [rejectId, setRejectId] = useState<string | null>(null);

  const loadAllUsers = async (q: string) => {
    try {
      const uRes = await api.get<ApiEnvelope<{ id: string; name: string; email: string; role: string; verified: boolean }[]>>(
        '/api/admin/users',
        { params: { q: q.trim() || undefined } }
      );
      if (uRes.data.success && uRes.data.data) setAllUsers(uRes.data.data);
    } catch {
      toast.error('Could not load users');
    }
  };

  const refresh = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [sRes, pRes, projRes] = await Promise.all([
        api.get<ApiEnvelope<AdminStats>>('/api/admin/stats'),
        api.get<ApiEnvelope<{ users: PendingUserEntry[] }>>('/api/admin/users/pending'),
        api.get<ApiEnvelope<PendingProjectRow[]>>('/api/admin/projects/pending'),
      ]);
      if (sRes.data.success && sRes.data.data) setStats(sRes.data.data);
      if (pRes.data.success && pRes.data.data?.users) setPendingUsers(pRes.data.data.users);
      if (projRes.data.success && projRes.data.data) setPendingProjects(projRes.data.data);
    } catch {
      toast.error('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!token || user?.role !== 'admin') {
      navigate('/');
      return;
    }
    refresh();
  }, [token, user?.role, navigate, refresh]);

  const verifyUser = async (id: string) => {
    try {
      await api.put(`/api/admin/users/${id}/verify`);
      toast.success('User verified');
      await refresh();
    } catch {
      toast.error('Verify failed');
    }
  };

  const approveProject = async (id: string) => {
    try {
      await api.put(`/api/admin/projects/${id}/approve`);
      toast.success('Project approved');
      await refresh();
    } catch {
      toast.error('Approve failed');
    }
  };

  const openRejectUser = (id: string) => {
    setRejectTarget('user');
    setRejectId(id);
    setRejectReason('');
  };

  const openRejectProject = (id: string) => {
    setRejectTarget('project');
    setRejectId(id);
    setRejectReason('');
  };

  const confirmReject = async () => {
    if (!rejectId || !rejectTarget) return;
    try {
      if (rejectTarget === 'user') {
        await api.put(`/api/admin/users/${rejectId}/reject`, { reason: rejectReason });
        toast.info('User rejected');
      } else {
        await api.put(`/api/admin/projects/${rejectId}/reject`, { reason: rejectReason });
        toast.info('Project rejected');
      }
      setRejectId(null);
      setRejectTarget(null);
      await refresh();
    } catch {
      toast.error('Reject failed');
    }
  };

  const changeRole = async (id: string, role: string) => {
    try {
      await api.put(`/api/admin/users/${id}/role`, { role });
      toast.success('Role updated');
      await refresh();
    } catch {
      toast.error('Could not update role');
    }
  };

  if (user?.role !== 'admin') {
    return null;
  }

  const totalUsers = stats ? Object.values(stats.users_by_role).reduce((a, b) => a + b, 0) : 0;
  const pendingVerification = pendingUsers.length;
  const totalProjects = stats ? Object.values(stats.projects_by_status).reduce((a, b) => a + b, 0) : 0;
  const pendingProjectsCount = stats?.projects_by_status['pending'] ?? pendingProjects.length;

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'student':
        return <Users className="w-4 h-4" />;
      case 'professor':
        return <GraduationCap className="w-4 h-4" />;
      case 'company':
        return <Building2 className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'student':
        return 'bg-[#2563eb] text-white';
      case 'professor':
        return 'bg-[#fbbf24] text-gray-900';
      case 'company':
        return 'bg-purple-500 text-white';
      default:
        return '';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-4xl mb-2">Admin Dashboard</h1>
          <p className="text-lg text-muted-foreground">Platform verification and management</p>
          {loading && <p className="text-sm text-muted-foreground mt-2">Loading…</p>}
        </div>

        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                <Users className="w-4 h-4" />
                Total Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl">{totalUsers}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Pending verification
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl text-[#fbbf24]">{pendingVerification}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Total Projects
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl">{totalProjects}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Pending Projects
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl text-[#fbbf24]">{pendingProjectsCount}</div>
            </CardContent>
          </Card>
        </div>

        {stats && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-lg">Platform stats</CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-semibold mb-2">Users by role</p>
                <ul className="space-y-1 text-muted-foreground">
                  {Object.entries(stats.users_by_role).map(([k, v]) => (
                    <li key={k}>
                      {k}: {v}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="font-semibold mb-2">Projects by status</p>
                <ul className="space-y-1 text-muted-foreground">
                  {Object.entries(stats.projects_by_status).map(([k, v]) => (
                    <li key={k}>
                      {k || '(null)'}: {v}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="md:col-span-2 flex flex-wrap gap-6">
                <span>
                  Datasets: <strong>{stats.total_datasets}</strong>
                </span>
                <span>
                  Papers: <strong>{stats.total_papers}</strong>
                </span>
                <span>
                  Opportunities: <strong>{stats.total_opportunities ?? '—'}</strong>
                </span>
                <span>
                  New users (week): <strong>{stats.new_users_this_week ?? '—'}</strong>
                </span>
                <span>
                  New projects (week): <strong>{stats.new_projects_this_week ?? '—'}</strong>
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Management</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="pending_users">
              <TabsList className="mb-6 flex flex-wrap h-auto gap-1">
                <TabsTrigger value="pending_users">Pending users ({pendingUsers.length})</TabsTrigger>
                <TabsTrigger value="pending_projects">Pending projects ({pendingProjects.length})</TabsTrigger>
                <TabsTrigger value="all_users">All users</TabsTrigger>
              </TabsList>

              <TabsContent value="pending_users" className="space-y-4">
                {pendingUsers.length === 0 && <p className="text-muted-foreground">No unverified users.</p>}
                {pendingUsers.map((entry) => (
                  <Card key={entry.user.id} className="border-l-4 border-l-[#fbbf24]">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between flex-wrap gap-4">
                        <div className="flex items-start gap-4 flex-1">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3>{entry.user.name}</h3>
                              <Badge className={getRoleBadgeColor(entry.user.role)}>
                                {getRoleIcon(entry.user.role)}
                                <span className="ml-1 capitalize">{entry.user.role}</span>
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{entry.user.email}</p>
                            {entry.user.created_at && (
                              <p className="text-sm text-muted-foreground">
                                Registered {new Date(entry.user.created_at).toLocaleDateString()}
                              </p>
                            )}
                            {entry.verification_documents.map((d) => (
                              <div key={d.id} className="mt-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  type="button"
                                  onClick={() => window.open(d.document_url, '_blank', 'noopener,noreferrer')}
                                >
                                  View document
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="bg-green-500 hover:bg-green-600 text-white gap-2"
                            type="button"
                            onClick={() => verifyUser(entry.user.id)}
                          >
                            <CheckCircle className="w-4 h-4" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="gap-2"
                            type="button"
                            onClick={() => openRejectUser(entry.user.id)}
                          >
                            <XCircle className="w-4 h-4" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="pending_projects" className="space-y-4">
                {pendingProjects.length === 0 && <p className="text-muted-foreground">No pending projects.</p>}
                {pendingProjects.map((p) => (
                  <Card key={p.id}>
                    <CardContent className="pt-6 flex flex-wrap justify-between gap-4">
                      <div>
                        <h3 className="font-semibold">{p.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {p.author_name} · {p.university}
                        </p>
                        <p className="text-xs text-muted-foreground">{p.created_at}</p>
                      </div>
                      <div className="flex flex-wrap gap-2 items-center">
                        {p.file_url && (
                          <Button
                            variant="outline"
                            size="sm"
                            type="button"
                            onClick={() => window.open(p.file_url!, '_blank', 'noopener,noreferrer')}
                          >
                            View PDF
                          </Button>
                        )}
                        <Button
                          size="sm"
                          className="bg-green-600 text-white"
                          type="button"
                          onClick={() => approveProject(p.id)}
                        >
                          Approve
                        </Button>
                        <Button size="sm" variant="destructive" type="button" onClick={() => openRejectProject(p.id)}>
                          Reject
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="all_users" className="space-y-4">
                <div className="flex gap-2 mb-4">
                  <Input
                    placeholder="Search users…"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                  />
                  <Button type="button" variant="secondary" onClick={() => loadAllUsers(userSearch)}>
                    Search
                  </Button>
                </div>
                <div className="overflow-x-auto border rounded-lg">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="text-left p-3">Name</th>
                        <th className="text-left p-3">Email</th>
                        <th className="text-left p-3">Role</th>
                        <th className="text-left p-3">Verified</th>
                        <th className="text-left p-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allUsers.map((u) => (
                        <tr key={u.id} className="border-b">
                          <td className="p-3">{u.name}</td>
                          <td className="p-3">{u.email}</td>
                          <td className="p-3 capitalize">{u.role}</td>
                          <td className="p-3">{u.verified ? 'yes' : 'no'}</td>
                          <td className="p-3 flex flex-wrap gap-2">
                            {(['student', 'professor', 'company'] as const).map((r) => (
                              <Button key={r} size="sm" variant="outline" type="button" onClick={() => changeRole(u.id, r)}>
                                Set {r}
                              </Button>
                            ))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!rejectId && !!rejectTarget} onOpenChange={() => setRejectId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reason (optional)</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="Reason shown to the user"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectId(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmReject}>
              Confirm reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
