import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Textarea } from '../components/ui/textarea';
import { api } from '../services/api';
import type { ApiEnvelope } from '../types/api';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

export const OpportunityDetail = () => {
  const { id } = useParams();
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      setLoading(true);
      try {
        const res = await api.get<ApiEnvelope<Record<string, unknown>>>(`/api/opportunities/${id}`);
        if (res.data.success && res.data.data) setData(res.data.data);
      } catch {
        toast.error('Could not load opportunity');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const apply = async () => {
    if (!token || !id) {
      toast.error('Sign in as a student to apply');
      navigate('/login');
      return;
    }
    if (user?.role !== 'student') {
      toast.error('Only students can apply');
      return;
    }
    try {
      await api.post(`/api/opportunities/${id}/apply`, { message: msg || null });
      toast.success('Application submitted');
      setMsg('');
    } catch {
      toast.error('Could not apply');
    }
  };

  if (loading || !data) {
    return (
      <div className="min-h-screen bg-gray-50 py-20 text-center">
        {loading ? 'Loading…' : 'Not found'}
      </div>
    );
  }

  const title = String(data.title || '');
  const description = data.description as string | undefined;
  const skills = (data.skills as string[]) || [];
  const cp = data.company_profile as Record<string, unknown> | null;

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-3xl">
        <Link to="/opportunities" className="text-[#f97316] hover:underline text-sm mb-6 inline-block">
          ← All opportunities
        </Link>
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">{title}</CardTitle>
            {cp && (
              <p className="text-muted-foreground">
                {[cp.company_name, cp.industry, cp.location].filter(Boolean).join(' · ')}
              </p>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground whitespace-pre-wrap">{description}</p>
            <div className="flex flex-wrap gap-2">
              {skills.map((s) => (
                <Badge key={s} variant="outline">
                  {s}
                </Badge>
              ))}
            </div>
            {token && user?.role === 'student' && (
              <div className="border-t pt-6 space-y-3">
                <h3 className="font-semibold">Apply</h3>
                <Textarea
                  placeholder="Optional message to the company"
                  value={msg}
                  onChange={(e) => setMsg(e.target.value)}
                  rows={4}
                />
                <Button className="bg-[#016257] hover:bg-[#014d48]" onClick={apply}>
                  Submit application
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
