import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Github, Linkedin, Mail, Download, Eye, Star, TrendingUp, Bell, BarChart3, User, Settings, Plus, Upload } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getMyApplications } from '../../services/applicationsService';
import { getSavedProjects } from '../../services/savedProjectsService';
import { getErrorMessage } from '../../services/errors';

type MyApplication = {
  id: string;
  opportunity_title?: string;
  company_name?: string;
  status: string;
  message?: string;
};

type SavedProject = {
  id?: string;
  project_id?: string;
  title?: string;
  project?: {
    id: string;
    title: string;
  };
};

export const StudentProfile = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [applications, setApplications] = useState<MyApplication[]>([]);
  const [savedProjects, setSavedProjects] = useState<SavedProject[]>([]);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const loadStudentDashboard = async () => {
      try {
        const [applicationsResponse, savedProjectsResponse] = await Promise.all([
          getMyApplications(),
          getSavedProjects(),
        ]);
        setApplications(applicationsResponse.data.applications ?? applicationsResponse.data ?? []);
        setSavedProjects(savedProjectsResponse.data.projects ?? savedProjectsResponse.data.saved_projects ?? savedProjectsResponse.data ?? []);
      } catch (error) {
        toast.error(getErrorMessage(error));
      }
    };

    loadStudentDashboard();
  }, []);

  const student = {
    id: 's1',
    name: 'Ahmed Benali',
    email: 'ahmed.benali@usthb.dz',
    university: 'USTHB',
    department: 'Computer Science',
    year: 'Master 2',
    avatar: 'AB',
    bio: 'Passionate about machine learning and AI. Building solutions for real-world problems.',
    skills: ['Machine Learning', 'Python', 'TensorFlow', 'React', 'Node.js'],
    github: 'github.com/abenali',
    linkedin: 'linkedin.com/in/ahmed-benali',
    stats: {
      projects: 3,
      totalViews: 4847,
      totalDownloads: 234,
      avgRating: 4.7,
      rank: 12,
      totalComments: 67,
    },
    projects: [
      {
        id: '1',
        title: 'AI-Powered Crop Disease Detection',
        tags: ['ML', 'Agriculture'],
        rating: 4.8,
        views: 2134,
        downloads: 142,
        comments: 28,
      },
      {
        id: '2',
        title: 'Healthcare Appointment System',
        tags: ['Web Dev', 'Healthcare'],
        rating: 4.6,
        views: 1892,
        downloads: 67,
        comments: 22,
      },
      {
        id: '3',
        title: 'Smart Campus Navigation',
        tags: ['Mobile', 'IoT'],
        rating: 4.5,
        views: 821,
        downloads: 25,
        comments: 17,
      },
    ],
    notifications: [
      { id: 'n1', type: 'comment', text: 'Prof. Karim commented on your AI project', time: '2 hours ago', read: false },
      { id: 'n2', type: 'rating', text: 'Your project received a 5-star rating', time: '5 hours ago', read: false },
      { id: 'n3', type: 'download', text: '10 new downloads on your dataset', time: '1 day ago', read: true },
      { id: 'n4', type: 'message', text: 'TechNova sent you a message', time: '2 days ago', read: true },
    ],
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-[#1e293b] to-[#334155] text-white py-12">
        <div className="container mx-auto px-6">
          <div className="flex items-center gap-6">
            <Avatar className="w-32 h-32 ring-4 ring-white/20">
              <AvatarFallback className="bg-gradient-to-br from-[#f97316] to-[#fb923c] text-white text-4xl">
                {student.avatar}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h1 className="text-4xl mb-2" style={{ fontWeight: 700 }}>{student.name}</h1>
              <p className="text-xl text-white/80 mb-3">
                {student.year} - {student.department}
              </p>
              <p className="text-white/70">{student.university}</p>
            </div>
            {user && user.id === student.id && (
              <div className="flex gap-3">
                <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                  <Settings className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          <aside className="lg:col-span-1 space-y-6">
            <Card className="border-2 border-[#f97316]/20">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-[#f97316]" />
                  Dashboard Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b">
                  <span className="text-sm text-gray-600">Global Rank</span>
                  <Badge className="bg-gradient-to-r from-[#f97316] to-[#fb923c] text-white">
                    #{student.stats.rank}
                  </Badge>
                </div>
                <div className="flex items-center justify-between pb-3 border-b">
                  <span className="text-sm text-gray-600">Avg Rating</span>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-[#f97316] fill-current" />
                    <span style={{ fontWeight: 600 }}>{student.stats.avgRating}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between pb-3 border-b">
                  <span className="text-sm text-gray-600">Total Views</span>
                  <span style={{ fontWeight: 600 }}>{student.stats.totalViews.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between pb-3 border-b">
                  <span className="text-sm text-gray-600">Downloads</span>
                  <span style={{ fontWeight: 600 }}>{student.stats.totalDownloads}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Comments</span>
                  <span style={{ fontWeight: 600 }}>{student.stats.totalComments}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Bell className="w-5 h-5 text-[#f97316]" />
                  Notifications
                  <Badge className="bg-[#f97316] text-white ml-auto">
                    {student.notifications.filter(n => !n.read).length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {student.notifications.slice(0, 4).map((notification) => (
                  <div
                    key={notification.id}
                    className={`text-sm pb-3 border-b last:border-0 ${
                      !notification.read ? 'font-medium' : 'text-gray-600'
                    }`}
                  >
                    <p className="mb-1">{notification.text}</p>
                    <span className="text-xs text-gray-500">{notification.time}</span>
                  </div>
                ))}
                <Button variant="outline" className="w-full text-sm">
                  View All
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Links</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="ghost" className="w-full justify-start gap-2 text-sm">
                  <Mail className="w-4 h-4" />
                  {student.email}
                </Button>
                <Button variant="ghost" className="w-full justify-start gap-2 text-sm">
                  <Github className="w-4 h-4" />
                  GitHub Profile
                </Button>
                <Button variant="ghost" className="w-full justify-start gap-2 text-sm">
                  <Linkedin className="w-4 h-4" />
                  LinkedIn Profile
                </Button>
                <Button variant="ghost" className="w-full justify-start gap-2 text-sm">
                  <Download className="w-4 h-4" />
                  Export Portfolio
                </Button>
              </CardContent>
            </Card>
          </aside>

          <main className="lg:col-span-3">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-6">
                <TabsTrigger value="overview">
                  <User className="w-4 h-4 mr-2" />
                  Overview
                </TabsTrigger>
                <TabsTrigger value="projects">
                  Projects ({student.projects.length})
                </TabsTrigger>
                <TabsTrigger value="applications">
                  Applications ({applications.length})
                </TabsTrigger>
                <TabsTrigger value="saved">
                  Saved ({savedProjects.length})
                </TabsTrigger>
                <TabsTrigger value="upload">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload
                </TabsTrigger>
                <TabsTrigger value="analytics">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Analytics
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>About</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 leading-relaxed mb-6">{student.bio}</p>

                    <div>
                      <h4 className="mb-3" style={{ fontWeight: 600 }}>Skills</h4>
                      <div className="flex flex-wrap gap-2">
                        {student.skills.map((skill) => (
                          <Badge key={skill} variant="secondary" className="px-3 py-1">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Performance Overview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-3 gap-6">
                      <div className="text-center p-6 bg-gradient-to-br from-[#f97316]/10 to-[#fb923c]/10 rounded-xl">
                        <div className="text-3xl mb-2 text-[#f97316]" style={{ fontWeight: 700 }}>
                          {student.stats.projects}
                        </div>
                        <div className="text-sm text-gray-600">Projects Published</div>
                      </div>
                      <div className="text-center p-6 bg-gradient-to-br from-gray-100 to-gray-50 rounded-xl">
                        <div className="text-3xl mb-2" style={{ fontWeight: 700 }}>
                          #{student.stats.rank}
                        </div>
                        <div className="text-sm text-gray-600">Global Ranking</div>
                      </div>
                      <div className="text-center p-6 bg-gradient-to-br from-[#f97316]/10 to-[#fb923c]/10 rounded-xl">
                        <div className="text-3xl mb-2 text-[#f97316]" style={{ fontWeight: 700 }}>
                          {student.stats.totalDownloads}
                        </div>
                        <div className="text-sm text-gray-600">Total Downloads</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="projects" className="space-y-6">
                {student.projects.map((project) => (
                  <Link key={project.id} to={`/projects/${project.id}`}>
                    <Card className="hover:shadow-xl transition-all border-l-4 border-l-[#f97316]">
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h3 className="text-xl mb-3" style={{ fontWeight: 600 }}>
                              {project.title}
                            </h3>
                            <div className="flex flex-wrap gap-2">
                              {project.tags.map((tag) => (
                                <Badge key={tag} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <Badge className="bg-[#f97316] text-white ml-4">
                            <Star className="w-4 h-4 mr-1 inline fill-current" />
                            {project.rating}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-8 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <Eye className="w-4 h-4" />
                            <span>{project.views.toLocaleString()} views</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Download className="w-4 h-4" />
                            <span>{project.downloads} downloads</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Bell className="w-4 h-4" />
                            <span>{project.comments} comments</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </TabsContent>

              <TabsContent value="applications" className="space-y-6">
                {applications.map((application) => (
                  <Card key={application.id} className="border-l-4 border-l-[#f97316]">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="text-xl mb-2" style={{ fontWeight: 600 }}>
                            {application.opportunity_title ?? 'Opportunity'}
                          </h3>
                          <p className="text-sm text-gray-600">{application.company_name ?? 'Company'}</p>
                          {application.message && (
                            <p className="text-sm text-gray-600 mt-3">{application.message}</p>
                          )}
                        </div>
                        <Badge className={
                          application.status === 'accepted'
                            ? 'bg-green-600 text-white'
                            : application.status === 'rejected'
                              ? 'bg-red-600 text-white'
                              : 'bg-[#f97316] text-white'
                        }>
                          {application.status}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {applications.length === 0 && (
                  <Card>
                    <CardContent className="pt-6 text-gray-600">No applications submitted yet.</CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="saved" className="space-y-6">
                {savedProjects.map((savedProject) => {
                  const project = savedProject.project;
                  const projectId = project?.id ?? savedProject.project_id ?? savedProject.id ?? '';
                  return (
                    <Link key={projectId} to={`/projects/${projectId}`}>
                      <Card className="hover:shadow-xl transition-all border-l-4 border-l-[#f97316]">
                        <CardContent className="pt-6">
                          <h3 className="text-xl" style={{ fontWeight: 600 }}>
                            {project?.title ?? savedProject.title ?? 'Saved project'}
                          </h3>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
                {savedProjects.length === 0 && (
                  <Card>
                    <CardContent className="pt-6 text-gray-600">No saved projects yet.</CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="upload" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Upload className="w-5 h-5 text-[#f97316]" />
                      Upload New Content
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-3 gap-6">
                      <Button
                        onClick={() => navigate('/submit')}
                        className="h-40 flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-[#f97316]/10 to-[#fb923c]/10 hover:from-[#f97316]/20 hover:to-[#fb923c]/20 text-gray-900 border-2 border-dashed border-[#f97316]/30"
                      >
                        <Plus className="w-12 h-12 text-[#f97316]" />
                        <div className="text-center">
                          <div style={{ fontWeight: 600 }}>Upload Project</div>
                          <div className="text-xs text-gray-600 mt-1">PFE, Thesis, etc.</div>
                        </div>
                      </Button>

                      <Button
                        className="h-40 flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 text-gray-900 border-2 border-dashed border-gray-300"
                      >
                        <Plus className="w-12 h-12 text-gray-600" />
                        <div className="text-center">
                          <div style={{ fontWeight: 600 }}>Upload Dataset</div>
                          <div className="text-xs text-gray-600 mt-1">Research data</div>
                        </div>
                      </Button>

                      <Button
                        className="h-40 flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-[#f97316]/10 to-[#fb923c]/10 hover:from-[#f97316]/20 hover:to-[#fb923c]/20 text-gray-900 border-2 border-dashed border-[#f97316]/30"
                      >
                        <Plus className="w-12 h-12 text-[#f97316]" />
                        <div className="text-center">
                          <div style={{ fontWeight: 600 }}>Upload Paper</div>
                          <div className="text-xs text-gray-600 mt-1">Research paper</div>
                        </div>
                      </Button>
                    </div>

                    <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
                      <h4 className="mb-2" style={{ fontWeight: 600 }}>Upload Guidelines</h4>
                      <ul className="text-sm text-gray-700 space-y-1">
                        <li>• Projects: PDF or ZIP format, max 50MB</li>
                        <li>• Datasets: Any format, include description</li>
                        <li>• Papers: PDF format, include abstract</li>
                        <li>• All uploads require supervisor approval</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="analytics" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Engagement Analytics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-gray-600">Views</span>
                          <span style={{ fontWeight: 600 }}>
                            {student.stats.totalViews.toLocaleString()}
                          </span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-[#f97316] to-[#fb923c]" style={{ width: '85%' }}></div>
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-gray-600">Downloads</span>
                          <span style={{ fontWeight: 600 }}>
                            {student.stats.totalDownloads}
                          </span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div className="h-full bg-gray-600" style={{ width: '65%' }}></div>
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-gray-600">Engagement (Comments)</span>
                          <span style={{ fontWeight: 600 }}>
                            {student.stats.totalComments}
                          </span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-[#f97316] to-[#fb923c]" style={{ width: '75%' }}></div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </main>
        </div>
      </div>
    </div>
  );
};
