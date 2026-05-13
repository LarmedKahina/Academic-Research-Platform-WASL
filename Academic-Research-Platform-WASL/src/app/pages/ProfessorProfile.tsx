import { useState } from 'react';
import { Link } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Mail, Award, Users, BarChart3, Bell, Settings, BookOpen, Star } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const ProfessorProfile = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const { user } = useAuth();

  const professor = {
    id: 'p1',
    name: 'Dr. Fatima Zahra',
    email: 'f.zahra@usthb.dz',
    university: 'USTHB',
    department: 'Computer Science',
    title: 'Associate Professor',
    avatar: 'FZ',
    bio: 'Researcher specializing in AI, machine learning, and data science. Passionate about guiding students.',
    researchAreas: ['Machine Learning', 'Computer Vision', 'NLP', 'Data Mining'],
    stats: {
      supervisedProjects: 24,
      currentStudents: 8,
      avgProjectRating: 4.6,
      totalPublications: 15,
    },
    projects: [
      {
        id: '1',
        title: 'AI-Powered Crop Disease Detection',
        student: 'Ahmed Benali',
        year: '2026',
        rating: 4.8,
      },
      {
        id: '2',
        title: 'Sentiment Analysis for Algerian Dialect',
        student: 'Leila Khelifi',
        year: '2026',
        rating: 4.7,
      },
      {
        id: '3',
        title: 'Predictive Maintenance System',
        student: 'Youcef Meziane',
        year: '2025',
        rating: 4.5,
      },
    ],
    notifications: [
      { id: 'n1', text: 'Ahmed submitted his final project', time: '1 hour ago', read: false },
      { id: 'n2', text: 'New student request for supervision', time: '3 hours ago', read: false },
      { id: 'n3', text: 'Project review due tomorrow', time: '1 day ago', read: true },
    ],
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-[#1e293b] to-[#334155] text-white py-12">
        <div className="container mx-auto px-6">
          <div className="flex items-center gap-6">
            <Avatar className="w-32 h-32 ring-4 ring-white/20">
              <AvatarFallback className="bg-gradient-to-br from-[#1e293b] to-[#334155] text-white text-4xl">
                {professor.avatar}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h1 className="text-4xl mb-2" style={{ fontWeight: 700 }}>{professor.name}</h1>
              <p className="text-xl text-white/80 mb-3">
                {professor.title} - {professor.department}
              </p>
              <p className="text-white/70">{professor.university}</p>
            </div>
            {user && user.role === 'professor' && (
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
            <Card className="border-2 border-[#1e293b]/20">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-[#1e293b]" />
                  Dashboard Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b">
                  <span className="text-sm text-gray-600">Supervised Projects</span>
                  <Badge className="bg-[#1e293b] text-white">
                    {professor.stats.supervisedProjects}
                  </Badge>
                </div>
                <div className="flex items-center justify-between pb-3 border-b">
                  <span className="text-sm text-gray-600">Current Students</span>
                  <span style={{ fontWeight: 600 }}>{professor.stats.currentStudents}</span>
                </div>
                <div className="flex items-center justify-between pb-3 border-b">
                  <span className="text-sm text-gray-600">Avg. Rating</span>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-[#f97316] fill-current" />
                    <span style={{ fontWeight: 600 }}>{professor.stats.avgProjectRating}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Publications</span>
                  <span style={{ fontWeight: 600 }}>{professor.stats.totalPublications}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Bell className="w-5 h-5 text-[#f97316]" />
                  Notifications
                  <Badge className="bg-[#f97316] text-white ml-auto">
                    {professor.notifications.filter(n => !n.read).length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {professor.notifications.map((notification) => (
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
                <CardTitle className="text-lg">Contact</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="ghost" className="w-full justify-start gap-2 text-sm">
                  <Mail className="w-4 h-4" />
                  {professor.email}
                </Button>
              </CardContent>
            </Card>
          </aside>

          <main className="lg:col-span-3">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-6">
                <TabsTrigger value="overview">
                  Overview
                </TabsTrigger>
                <TabsTrigger value="projects">
                  <BookOpen className="w-4 h-4 mr-2" />
                  Supervised Projects ({professor.projects.length})
                </TabsTrigger>
                <TabsTrigger value="students">
                  <Users className="w-4 h-4 mr-2" />
                  Current Students
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>About</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 leading-relaxed mb-6">{professor.bio}</p>

                    <div>
                      <h4 className="mb-3" style={{ fontWeight: 600 }}>Research Areas</h4>
                      <div className="flex flex-wrap gap-2">
                        {professor.researchAreas.map((area) => (
                          <Badge key={area} variant="secondary" className="px-3 py-1">
                            {area}
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
                      <div className="text-center p-6 bg-gradient-to-br from-[#1e293b]/10 to-[#334155]/10 rounded-xl">
                        <div className="text-3xl mb-2" style={{ fontWeight: 700 }}>
                          {professor.stats.supervisedProjects}
                        </div>
                        <div className="text-sm text-gray-600">Total Supervised</div>
                      </div>
                      <div className="text-center p-6 bg-gradient-to-br from-[#f97316]/10 to-[#fb923c]/10 rounded-xl">
                        <div className="text-3xl mb-2 text-[#f97316]" style={{ fontWeight: 700 }}>
                          {professor.stats.currentStudents}
                        </div>
                        <div className="text-sm text-gray-600">Active Students</div>
                      </div>
                      <div className="text-center p-6 bg-gradient-to-br from-gray-100 to-gray-50 rounded-xl">
                        <div className="text-3xl mb-2" style={{ fontWeight: 700 }}>
                          {professor.stats.avgProjectRating} ★
                        </div>
                        <div className="text-sm text-gray-600">Avg. Rating</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="projects" className="space-y-6">
                {professor.projects.map((project) => (
                  <Link key={project.id} to={`/projects/${project.id}`}>
                    <Card className="hover:shadow-xl transition-all border-l-4 border-l-[#1e293b]">
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="text-xl mb-2" style={{ fontWeight: 600 }}>
                              {project.title}
                            </h3>
                            <p className="text-sm text-gray-600">
                              Student: {project.student} • {project.year}
                            </p>
                          </div>
                          <Badge className="bg-[#f97316] text-white">
                            <Star className="w-4 h-4 mr-1 inline fill-current" />
                            {project.rating}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </TabsContent>

              <TabsContent value="students" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Current Supervision</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {['Ahmed Benali', 'Leila Khelifi', 'Youcef Meziane'].map((name, index) => (
                        <div key={index} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                          <Avatar>
                            <AvatarFallback className="bg-[#f97316] text-white">
                              {name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div style={{ fontWeight: 600 }}>{name}</div>
                            <div className="text-sm text-gray-600">Master 2 - Computer Science</div>
                          </div>
                          <Badge variant="outline">Active</Badge>
                        </div>
                      ))}
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
