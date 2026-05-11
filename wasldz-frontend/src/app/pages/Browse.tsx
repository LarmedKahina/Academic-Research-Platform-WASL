import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
  Search,
  Filter,
  Eye,
  Star,
  MessageSquare,
  Download,
  FileText,
  Database,
  BookOpen,
} from 'lucide-react';
import { api } from '../services/api';
import type { ApiEnvelope, DatasetApi, PaperApi, ProjectApi } from '../types/api';

type BrowseType = 'project' | 'dataset' | 'paper';

type BrowseItem = {
  id: string;
  type: BrowseType;
  title: string;
  tags: string[];
  description: string;
  university?: string;
  author: string;
  date: string;
  rating?: number;
  views?: number;
  comments: number;
  downloads?: number;
  size?: string;
  citations?: number;
};

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString();
  } catch {
    return iso;
  }
}

function formatBytes(n?: number | null) {
  if (n == null) return '—';
  if (n < 1024) return `${n} B`;
  const kb = n / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  if (mb < 1024) return `${mb.toFixed(1)} MB`;
  return `${(mb / 1024).toFixed(1)} GB`;
}

export const Browse = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [items, setItems] = useState<BrowseItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [pr, ds, pa] = await Promise.all([
          api.get<ApiEnvelope<ProjectApi[]>>('/api/projects'),
          api.get<ApiEnvelope<DatasetApi[]>>('/api/datasets'),
          api.get<ApiEnvelope<PaperApi[]>>('/api/papers'),
        ]);

        const merged: BrowseItem[] = [];

        const projectPayload = pr.data.data as ProjectApi[] | { items: ProjectApi[] } | undefined;
        const projectList = Array.isArray(projectPayload)
          ? projectPayload
          : projectPayload?.items ?? [];
        if (pr.data.success) {
          for (const p of projectList) {
            merged.push({
              id: p.id,
              type: 'project',
              title: p.title,
              tags: p.tags || [],
              description: p.abstract,
              university: p.university || '',
              author: p.author_name || 'Student',
              date: formatDate(p.created_at),
              rating: p.avg_rating != null ? Number(p.avg_rating) : undefined,
              views: p.views,
              comments: p.total_ratings || 0,
            });
          }
        }

        if (ds.data.success && ds.data.data) {
          for (const d of ds.data.data) {
            merged.push({
              id: d.id,
              type: 'dataset',
              title: d.title,
              tags: d.tags || [],
              description: d.description || '',
              university: '',
              author: 'Uploader',
              date: formatDate(d.created_at),
              downloads: d.downloads,
              size: formatBytes(d.file_size),
              comments: 0,
            });
          }
        }

        if (pa.data.success && pa.data.data) {
          for (const paper of pa.data.data) {
            merged.push({
              id: paper.id,
              type: 'paper',
              title: paper.title,
              tags: paper.tags || [],
              description: paper.abstract || '',
              university: '',
              author: (paper.authors && paper.authors[0]) || 'Authors',
              date: formatDate(paper.created_at),
              views: paper.views ?? undefined,
              citations: paper.citations ?? undefined,
              comments: 0,
            });
          }
        }

        setItems(merged);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filteredContent = useMemo(() => {
    if (!searchQuery.trim()) return items;
    const q = searchQuery.toLowerCase();
    return items.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.tags.some((tag) => tag.toLowerCase().includes(q))
    );
  }, [items, searchQuery]);

  const getTypeIcon = (t: BrowseType) => {
    switch (t) {
      case 'project':
        return <BookOpen className="w-5 h-5" />;
      case 'dataset':
        return <Database className="w-5 h-5" />;
      case 'paper':
        return <FileText className="w-5 h-5" />;
    }
  };

  const getTypeBadge = (t: BrowseType) => {
    switch (t) {
      case 'project':
        return 'bg-[#f97316] text-white';
      case 'dataset':
        return 'bg-[#016257] text-white';
      case 'paper':
        return 'bg-[#1e3a8a] text-white';
    }
  };

  const content = (item: BrowseItem) => {
    const inner = (
      <>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <Badge className={getTypeBadge(item.type)}>
                  {getTypeIcon(item.type)}
                  <span className="ml-1 capitalize">{item.type}</span>
                </Badge>
              </div>
              <CardTitle className="text-2xl mb-3">{item.title}</CardTitle>
              <div className="flex flex-wrap gap-2 mb-4">
                {item.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-6 leading-relaxed">{item.description}</p>

          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              <span style={{ fontWeight: 600 }}>{item.author}</span>
              <span className="mx-2">•</span>
              <span>{item.university || '—'}</span>
              <span className="mx-2">•</span>
              <span>{item.date}</span>
            </div>

            <div className="flex items-center gap-6 text-sm">
              {item.type === 'project' && (
                <>
                  <div className="flex items-center gap-2 text-[#f97316]">
                    <Star className="w-4 h-4 fill-current" />
                    <span style={{ fontWeight: 600 }}>
                      {item.rating != null ? item.rating.toFixed(1) : '—'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Eye className="w-4 h-4" />
                    {item.views ?? 0}
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <MessageSquare className="w-4 h-4" />
                    {item.comments}
                  </div>
                </>
              )}
              {item.type === 'dataset' && (
                <>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Download className="w-4 h-4" />
                    {item.downloads ?? 0}
                  </div>
                  <Badge variant="outline">{item.size}</Badge>
                </>
              )}
              {item.type === 'paper' && (
                <>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Eye className="w-4 h-4" />
                    {item.views ?? 0}
                  </div>
                  <Badge variant="outline">{item.citations ?? 0} citations</Badge>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </>
    );

    if (item.type === 'project') {
      return (
        <Link to={`/projects/${item.id}`}>
          <Card className="hover:shadow-xl transition-all border-l-4 border-l-[#f97316]">{inner}</Card>
        </Link>
      );
    }

    return <Card className="hover:shadow-xl transition-all border-l-4 border-l-[#f97316]">{inner}</Card>;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <section className="bg-gradient-to-br from-[#1e293b] to-[#334155] text-white py-20">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl">
            <Badge className="bg-[#f97316] text-white mb-6">Unified Browse</Badge>
            <h1 className="text-5xl mb-6" style={{ fontWeight: 700 }}>
              Explore Projects, Datasets & Papers
            </h1>
            <p className="text-xl text-white/80 mb-8">
              Access everything from one place. Filter by type and discover what matters to you.
            </p>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder="Search by title, description, or tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-14 bg-white text-gray-900"
              />
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-6 py-12">
        {loading && <p className="text-gray-600 mb-4">Loading…</p>}
        <Tabs defaultValue="all" className="w-full">
          <div className="flex items-center justify-between mb-8">
            <TabsList>
              <TabsTrigger value="all">All ({filteredContent.length})</TabsTrigger>
              <TabsTrigger value="projects">
                <BookOpen className="w-4 h-4 mr-2" />
                Projects
              </TabsTrigger>
              <TabsTrigger value="datasets">
                <Database className="w-4 h-4 mr-2" />
                Datasets
              </TabsTrigger>
              <TabsTrigger value="papers">
                <FileText className="w-4 h-4 mr-2" />
                Papers
              </TabsTrigger>
            </TabsList>

            <Button variant="outline" className="gap-2">
              <Filter className="w-4 h-4" />
              Filter
            </Button>
          </div>

          <TabsContent value="all" className="space-y-6">
            <div className="grid gap-6">
              {filteredContent.map((item) => (
                <div key={`${item.type}-${item.id}`}>{content(item)}</div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="projects">
            <div className="grid gap-6">
              {filteredContent
                .filter((item) => item.type === 'project')
                .map((item) => (
                  <div key={item.id}>{content(item)}</div>
                ))}
            </div>
          </TabsContent>

          <TabsContent value="datasets">
            <div className="grid gap-6">
              {filteredContent
                .filter((item) => item.type === 'dataset')
                .map((item) => (
                  <div key={item.id}>{content(item)}</div>
                ))}
            </div>
          </TabsContent>

          <TabsContent value="papers">
            <div className="grid gap-6">
              {filteredContent
                .filter((item) => item.type === 'paper')
                .map((item) => (
                  <div key={item.id}>{content(item)}</div>
                ))}
            </div>
          </TabsContent>
        </Tabs>

        {!loading && filteredContent.length === 0 && (
          <div className="text-center py-16">
            <p className="text-lg text-gray-500">No content found matching your search.</p>
          </div>
        )}
      </div>
    </div>
  );
};
