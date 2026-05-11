import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Search, Filter, Eye, Star } from 'lucide-react';
import { api } from '../services/api';
import type { ApiEnvelope, ProjectApi } from '../types/api';

export const Projects = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [projects, setProjects] = useState<ProjectApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await api.get<ApiEnvelope<{ items: ProjectApi[] }>>('/api/projects', {
          params: { q: searchQuery.trim() || undefined, per_page: 100 },
        });
        if (res.data.success && res.data.data?.items) {
          setProjects(res.data.data.items);
        } else {
          setProjects([]);
        }
        setError(null);
      } catch {
        setError('Could not load projects.');
        setProjects([]);
      } finally {
        setLoading(false);
      }
    };
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const filteredProjects = useMemo(() => {
    if (!searchQuery.trim()) return projects;
    const q = searchQuery.toLowerCase();
    return projects.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        (p.abstract && p.abstract.toLowerCase().includes(q)) ||
        (p.tags || []).some((tag) => tag.toLowerCase().includes(q))
    );
  }, [projects, searchQuery]);

  return (
    <div className="min-h-screen bg-gray-50">
      <section className="bg-gradient-to-br from-[#1e293b] to-[#334155] text-white py-20">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl">
            <Badge className="bg-[#f97316] text-white mb-6">Project Repository</Badge>
            <h1 className="text-5xl mb-6" style={{ fontWeight: 700 }}>
              Discover Innovative Research
            </h1>
            <p className="text-xl text-white/80 mb-8">
              Browse PFE and thesis projects from universities across Algeria. Find inspiration,
              learn from peer research, and connect with fellow innovators.
            </p>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder="Search projects by title, description, or tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-14 bg-white text-gray-900"
              />
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-lg text-gray-600">
              <span style={{ fontWeight: 600 }}>{loading ? '…' : filteredProjects.length}</span> projects
              found
            </p>
            {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
          </div>
          <Button variant="outline" className="gap-2">
            <Filter className="w-4 h-4" />
            Filter
          </Button>
        </div>

        <div className="grid gap-6">
          {filteredProjects.map((project) => (
            <Link key={project.id} to={`/projects/${project.id}`}>
              <Card className="hover:shadow-xl transition-all border-l-4 border-l-[#f97316]">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-2xl mb-3">{project.title}</CardTitle>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {(project.tags || []).map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <Badge className="bg-[#f97316] text-white ml-4 px-3 py-1.5">
                      <Star className="w-4 h-4 mr-1 inline" />
                      {project.avg_rating != null ? Number(project.avg_rating).toFixed(1) : '—'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-6 leading-relaxed line-clamp-3">{project.abstract}</p>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex gap-4 text-gray-600">
                      <span style={{ fontWeight: 600 }}>{project.university || '—'}</span>
                      <span>•</span>
                      <span>Supervisor: {project.supervisor_name || '—'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-500">
                      <Eye className="w-4 h-4" />
                      {project.views}
                    </div>
                  </div>
                  {project.status !== 'approved' && (
                    <p className="text-xs text-amber-700 mt-2">Status: {project.status}</p>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {!loading && filteredProjects.length === 0 && (
          <div className="text-center py-16">
            <p className="text-lg text-gray-500">No projects found matching your search.</p>
          </div>
        )}
      </div>
    </div>
  );
};
