import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Search, Filter, Download, Eye, Calendar } from 'lucide-react';
import { api } from '../services/api';
import type { ApiEnvelope, DatasetApi } from '../types/api';

function formatBytes(n?: number | null) {
  if (n == null || n === 0) return '—';
  if (n < 1024) return `${n} B`;
  const kb = n / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  if (mb < 1024) return `${mb.toFixed(1)} MB`;
  return `${(mb / 1024).toFixed(1)} GB`;
}

export const Datasets = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [datasets, setDatasets] = useState<DatasetApi[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await api.get<ApiEnvelope<DatasetApi[]>>('/api/datasets');
        if (res.data.success && res.data.data) setDatasets(res.data.data);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filteredDatasets = useMemo(() => {
    if (!searchQuery.trim()) return datasets;
    const q = searchQuery.toLowerCase();
    return datasets.filter(
      (d) =>
        d.title.toLowerCase().includes(q) ||
        (d.description && d.description.toLowerCase().includes(q)) ||
        (d.category && d.category.toLowerCase().includes(q)) ||
        (d.tags || []).some((t) => t.toLowerCase().includes(q))
    );
  }, [datasets, searchQuery]);

  return (
    <div className="min-h-screen bg-gray-50">
      <section className="bg-gradient-to-br from-[#1e293b] to-[#334155] text-white py-20">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl">
            <Badge className="bg-[#f97316] text-white mb-6">Research Datasets</Badge>
            <h1 className="text-5xl mb-6" style={{ fontWeight: 700 }}>
              Open Research Datasets
            </h1>
            <p className="text-xl text-white/80 mb-8">
              Access curated datasets from universities across Algeria. Accelerate your research with quality data from
              diverse domains.
            </p>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder="Search datasets by title, category, or tags..."
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
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-lg text-gray-600">
              <span style={{ fontWeight: 600 }}>{filteredDatasets.length}</span> datasets available
            </p>
          </div>
          <Button variant="outline" className="gap-2">
            <Filter className="w-4 h-4" />
            Filter by Category
          </Button>
        </div>

        <div className="grid gap-6">
          {filteredDatasets.map((dataset) => (
            <Card key={dataset.id} className="hover:shadow-xl transition-all border-l-4 border-l-[#f97316]">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {dataset.category && (
                      <Badge variant="secondary" className="mb-3">
                        {dataset.category}
                      </Badge>
                    )}
                    <CardTitle className="text-2xl mb-3">{dataset.title}</CardTitle>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {(dataset.tags || []).map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-6 leading-relaxed">{dataset.description}</p>

                <div className="grid md:grid-cols-4 gap-6 mb-6 pb-6 border-b">
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Size</div>
                    <div style={{ fontWeight: 600 }}>{formatBytes(dataset.file_size)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Format</div>
                    <div style={{ fontWeight: 600 }}>{dataset.format || '—'}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Downloads</div>
                    <div style={{ fontWeight: 600 }} className="flex items-center gap-2">
                      <Download className="w-4 h-4 text-gray-400" />
                      {dataset.downloads}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Uploaded</div>
                    <div style={{ fontWeight: 600 }} className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      {new Date(dataset.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    <span style={{ fontWeight: 600 }}>Dataset</span>
                    <span className="mx-2">•</span>
                    <span>ID {dataset.id.slice(0, 8)}…</span>
                  </div>
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      type="button"
                      disabled={!dataset.file_url}
                      onClick={() => dataset.file_url && window.open(dataset.file_url, '_blank')}
                    >
                      <Eye className="w-4 h-4" />
                      Open
                    </Button>
                    <Button
                      size="sm"
                      className="bg-[#f97316] hover:bg-[#ea580c] gap-2"
                      type="button"
                      disabled={!dataset.file_url}
                      onClick={() => dataset.file_url && window.open(dataset.file_url, '_blank')}
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {!loading && filteredDatasets.length === 0 && (
          <div className="text-center py-16">
            <p className="text-lg text-gray-500">No datasets found matching your search.</p>
          </div>
        )}
      </div>
    </div>
  );
};
