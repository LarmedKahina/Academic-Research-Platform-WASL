import { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Building2, Globe, MapPin } from 'lucide-react';
import { api } from '../services/api';
import type { ApiEnvelope, CompanyProfilePayload } from '../types/api';

type PublicPayload = {
  id: string;
  name: string;
  profile?: CompanyProfilePayload | null;
  avatar_url?: string | null;
};

export const CompanyProfile = () => {
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
      <div className="min-h-screen bg-gray-50 py-20 text-center">
        {loading ? 'Loading…' : 'Not found'}
      </div>
    );
  }

  const p = data.profile;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-[#1e293b] to-[#334155] text-white py-12">
        <div className="container mx-auto px-6">
          <div className="flex items-center gap-4">
            <div className="w-24 h-24 rounded-2xl bg-[#f97316]/20 flex items-center justify-center">
              <Building2 className="w-12 h-12 text-[#f97316]" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">{p?.company_name || data.name}</h1>
              <p className="flex items-center gap-2 text-white/80 mt-2">
                <MapPin className="w-4 h-4" /> {p?.location}
              </p>
              <p className="text-white/70">{p?.industry}</p>
              {p?.website && (
                <a href={p.website} className="text-[#f97316] text-sm flex items-center gap-2 mt-2">
                  <Globe className="w-4 h-4" /> Website
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-10 max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle>About</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground whitespace-pre-wrap">{p?.description || '—'}</p>
            <div className="flex flex-wrap gap-2 mt-4">
              {(p?.interests || []).map((x) => (
                <Badge key={x} variant="secondary">
                  {x}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
