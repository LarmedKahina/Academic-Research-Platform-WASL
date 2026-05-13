import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Search, Eye, Star, MessageSquare, BookOpen, Bookmark } from 'lucide-react';
import { getProjects } from '../../services/projectsService';
import { checkSaved, saveProject, unsaveProject } from '../../services/savedProjectsService';
import { getErrorMessage } from '../../services/errors';

type Project = {
  id: string;
  title: string;
  description?: string;
  avg_rating?: number;
  total_ratings?: number;
  created_at?: string;
};

export const Browse = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [projects, setProjects] = useState<Project[]>([]);
  const [savedProjectIds, setSavedProjectIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProjects = async () => {
      setLoading(true);
      try {
        const response = await getProjects(searchQuery ? { search: searchQuery, page: 1, limit: 20 } : { page: 1, limit: 20 });
        const loadedProjects = response.data.projects ?? response.data ?? [];
        setProjects(loadedProjects);
        const savedResults = await Promise.all(
          loadedProjects.map(async (project: Project) => {
            try {
              const savedResponse = await checkSaved(project.id);
              return [project.id, Boolean(savedResponse.data.saved)] as const;
            } catch {
              return [project.id, false] as const;
            }
          }),
        );
        setSavedProjectIds(new Set(savedResults.filter(([, saved]) => saved).map(([projectId]) => projectId)));
      } catch (error) {
        toast.error(getErrorMessage(error));
      } finally {
        setLoading(false);
      }
    };

    loadProjects();
  }, [searchQuery]);

  const handleToggleSaved = async (projectId: string) => {
    try {
      if (savedProjectIds.has(projectId)) {
        await unsaveProject(projectId);
        setSavedProjectIds((current) => {
          const next = new Set(current);
          next.delete(projectId);
          return next;
        });
        toast.success('Project removed from saved');
      } else {
        await saveProject(projectId);
        setSavedProjectIds((current) => new Set(current).add(projectId));
        toast.success('Project saved');
      }
    } catch (error) {
      toast.error(getErrorMessage(error, 'Project is already saved'));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <section className="bg-gradient-to-br from-[#1e293b] to-[#334155] text-white py-20">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl">
            <Badge className="bg-[#f97316] text-white mb-6">Unified Browse</Badge>
            <h1 className="text-5xl mb-6" style={{ fontWeight: 700 }}>Explore Academic Projects</h1>
            <p className="text-xl text-white/80 mb-8">Access project work from one place.</p>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder="Search by title or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-14 bg-white text-gray-900"
              />
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-6 py-12">
        {loading && <p className="text-gray-600">Loading projects...</p>}
        <div className="grid gap-6">
          {projects.map((project) => (
            <Card key={project.id} className="hover:shadow-xl transition-all border-l-4 border-l-[#f97316]">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <Badge className="bg-[#f97316] text-white">
                        <BookOpen className="w-5 h-5" />
                        <span className="ml-1">Project</span>
                      </Badge>
                      <Button
                        type="button"
                        variant={savedProjectIds.has(project.id) ? 'default' : 'outline'}
                        size="sm"
                        className="gap-2"
                        onClick={() => handleToggleSaved(project.id)}
                      >
                        <Bookmark className={`w-4 h-4 ${savedProjectIds.has(project.id) ? 'fill-current' : ''}`} />
                      </Button>
                    </div>
                    <Link to={`/projects/${project.id}`}>
                      <CardTitle className="text-2xl mb-3">{project.title}</CardTitle>
                    </Link>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-6 leading-relaxed">{project.description}</p>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    {project.created_at ? new Date(project.created_at).toLocaleDateString() : 'Recently added'}
                  </div>
                  <div className="flex items-center gap-6 text-sm">
                    <div className="flex items-center gap-2 text-[#f97316]">
                      <Star className="w-4 h-4 fill-current" />
                      <span style={{ fontWeight: 600 }}>{Number(project.avg_rating ?? 0).toFixed(1)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Eye className="w-4 h-4" />
                      {project.total_ratings ?? 0}
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <MessageSquare className="w-4 h-4" />
                      Comments
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        {!loading && projects.length === 0 && (
          <div className="text-center py-16">
            <p className="text-lg text-gray-500">No projects found.</p>
          </div>
        )}
      </div>
    </div>
  );
};
