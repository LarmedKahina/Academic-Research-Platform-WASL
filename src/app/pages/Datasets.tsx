import { useState } from 'react';
import { Link } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Search, Filter, Download, Eye, Calendar } from 'lucide-react';

export const Datasets = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const datasets = [
    {
      id: '1',
      title: 'Algerian Arabic Dialect Speech Corpus',
      category: 'Natural Language Processing',
      description: 'Comprehensive dataset of Algerian Arabic dialect speech recordings from multiple regions, annotated with transcriptions and regional markers.',
      size: '12.5 GB',
      format: 'WAV, CSV',
      downloads: 342,
      university: 'ESI Algiers',
      uploadedBy: 'Dr. Amina Saidi',
      date: '2026-03-15',
      tags: ['NLP', 'Speech Recognition', 'Arabic'],
    },
    {
      id: '2',
      title: 'Algerian Traffic Patterns Dataset',
      category: 'Urban Analytics',
      description: 'Real-time traffic flow data collected from major intersections in Algiers, Constantine, and Oran over a 6-month period.',
      size: '8.2 GB',
      format: 'JSON, CSV',
      downloads: 198,
      university: 'USTHB',
      uploadedBy: 'Prof. Karim Mansouri',
      date: '2026-02-28',
      tags: ['IoT', 'Urban Planning', 'Transportation'],
    },
    {
      id: '3',
      title: 'North African Crop Disease Images',
      category: 'Agriculture',
      description: 'Labeled dataset of crop disease images from Algerian farms, including wheat, tomato, and olive diseases common to the region.',
      size: '25.8 GB',
      format: 'JPG, JSON',
      downloads: 567,
      university: 'University of Constantine 1',
      uploadedBy: 'Dr. Fatima Zahra',
      date: '2026-04-01',
      tags: ['Computer Vision', 'Agriculture', 'Deep Learning'],
    },
    {
      id: '4',
      title: 'Algerian E-Commerce Customer Behavior',
      category: 'Business Analytics',
      description: 'Anonymized dataset of customer browsing and purchasing behavior from Algerian e-commerce platforms.',
      size: '3.4 GB',
      format: 'CSV, SQL',
      downloads: 234,
      university: 'HEC Algiers',
      uploadedBy: 'Prof. Nadia Benali',
      date: '2026-03-20',
      tags: ['Data Science', 'E-Commerce', 'Marketing'],
    },
    {
      id: '5',
      title: 'Renewable Energy Production Dataset',
      category: 'Energy',
      description: 'Solar and wind energy production data from pilot projects across southern Algeria, including weather correlations.',
      size: '5.6 GB',
      format: 'CSV, HDF5',
      downloads: 189,
      university: 'University of Ouargla',
      uploadedBy: 'Dr. Mohamed Salah',
      date: '2026-01-10',
      tags: ['Energy', 'Sustainability', 'Time Series'],
    },
  ];

  const filteredDatasets = datasets.filter(dataset =>
    dataset.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    dataset.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    dataset.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    dataset.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

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
              Access curated datasets from universities across Algeria. Accelerate your research
              with quality data from diverse domains.
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
                    <Badge variant="secondary" className="mb-3">
                      {dataset.category}
                    </Badge>
                    <CardTitle className="text-2xl mb-3">{dataset.title}</CardTitle>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {dataset.tags.map((tag) => (
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
                    <div style={{ fontWeight: 600 }}>{dataset.size}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Format</div>
                    <div style={{ fontWeight: 600 }}>{dataset.format}</div>
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
                      {dataset.date}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    <span style={{ fontWeight: 600 }}>{dataset.university}</span>
                    <span className="mx-2">•</span>
                    <span>By {dataset.uploadedBy}</span>
                  </div>
                  <div className="flex gap-3">
                    <Button variant="outline" size="sm" className="gap-2">
                      <Eye className="w-4 h-4" />
                      Preview
                    </Button>
                    <Button size="sm" className="bg-[#f97316] hover:bg-[#ea580c] gap-2">
                      <Download className="w-4 h-4" />
                      Download
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredDatasets.length === 0 && (
          <div className="text-center py-16">
            <p className="text-lg text-gray-500">No datasets found matching your search.</p>
          </div>
        )}
      </div>
    </div>
  );
};
