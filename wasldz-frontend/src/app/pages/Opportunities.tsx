import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Building2, MapPin } from 'lucide-react';
import { api } from '../services/api';
import type { ApiEnvelope } from '../types/api';

type OppRow = {
  id: string;
  title: string;
  description?: string | null;
  type?: string | null;
  skills?: string[] | null;
  status?: string | null;
  deadline?: string | null;
  company?: {
    id: string;
    name?: string | null;
    company_name?: string | null;
    industry?: string | null;
    location?: string | null;
  };
  applicant_count?: number;
};

export const Opportunities = () => {
  const [rows, setRows] = useState<OppRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await api.get<ApiEnvelope<OppRow[]>>('/api/opportunities', { params: { open_only: true } });
        if (res.data.success && res.data.data) setRows(res.data.data);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-5xl">
        <h1 className="text-4xl font-bold text-[#1e3a8a] mb-2">Opportunities</h1>
        <p className="text-muted-foreground mb-8">Internships, PFE placements, and collaborations from partner companies.</p>
        {loading && <p className="text-muted-foreground">Loading…</p>}
        <div className="space-y-4">
          {rows.map((o) => (
            <Link key={o.id} to={`/opportunities/${o.id}`}>
              <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-[#f97316]">
                <CardHeader>
                  <CardTitle className="text-xl">{o.title}</CardTitle>
                  <div className="flex flex-wrap gap-3 text-sm text-muted-foreground items-center">
                    <span className="flex items-center gap-1">
                      <Building2 className="w-4 h-4" />
                      {o.company?.company_name || o.company?.name || 'Company'}
                    </span>
                    {o.company?.industry && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {o.company?.location || o.company.industry}
                      </span>
                    )}
                    {o.type && <Badge variant="secondary">{o.type}</Badge>}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground line-clamp-2">{o.description}</p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {(o.skills || []).map((s) => (
                      <Badge key={s} variant="outline">
                        {s}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
        {!loading && rows.length === 0 && <p className="text-muted-foreground">No open opportunities right now.</p>}
      </div>
    </div>
  );
};
