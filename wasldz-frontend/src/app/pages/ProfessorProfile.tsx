import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Star, Eye } from 'lucide-react';
import { api } from '../services/api';
import type { ApiEnvelope, ProfessorProfilePayload, ProjectApi } from '../types/api';

type PublicPayload = {
  id: string;
  name: string;
  role: string;
  avatar_url?: string | null;
  profile?: ProfessorProfilePayload | null;
  projects?: ProjectApi[];
};

export const ProfessorProfile = () => {
  const { id } = useParams();
  const [data, setData] = useState<PublicPayload | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      setLoading(true);
      try {
        const res = await api.get<ApiEnvelope<PublicPayload>>(`/api/users/${id}`);
        if (res.data.success && res.data.data) setData(res.data.data);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading || !data) {
    return (
      <div className="min-h-screen bg-gray-50 py-20 text-center text-muted-foreground">
        {loading ? 'Loading…' : 'Not found'}
      </div>
    );
  }

  const p = data.profile;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-[#1e293b] to-[#334155] text-white py-12">
        <div className="container mx-auto px-6 flex items-center gap-6">
          <Avatar className="w-28 h-28 ring-4 ring-white/20">
            {data.avatar_url ? <AvatarImage src={data.avatar_url} alt="" /> : null}
            <AvatarFallback className="bg-[#1e3a8a] text-white text-3xl">{data.name.slice(0, 2)}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-3xl font-bold">
              {p?.title ? `${p.title} ` : ''}
              {data.name}
            </h1>
            <p className="text-white/80">{p?.department}</p>
            <p className="text-white/70">{p?.university}</p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-10 max-w-5xl space-y-8">
        {p?.bio && (
          <Card>
            <CardHeader>
              <CardTitle>Bio</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{p.bio}</p>
              <div className="flex flex-wrap gap-2 mt-4">
                {(p.research_areas || []).map((a) => (
                  <Badge key={a} variant="secondary">
                    {a}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Supervised projects</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(data.projects || []).length === 0 && <p className="text-muted-foreground">No projects listed.</p>}
            {(data.projects || []).map((proj) => (
              <Link key={proj.id} to={`/projects/${proj.id}`}>
                <div className="border rounded-lg p-4 flex justify-between hover:bg-gray-50">
                  <div>
                    <h3 className="font-medium">{proj.title}</h3>
                    <Badge variant="outline" className="capitalize mt-1">
                      {proj.status}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground flex flex-col items-end gap-1">
                    <span className="flex items-center gap-1">
                      <Eye className="w-4 h-4" /> {proj.views}
                    </span>
                    <span className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-[#f97316]" />
                      {proj.avg_rating != null ? Number(proj.avg_rating).toFixed(1) : '—'}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
