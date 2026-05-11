import { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import { Building2, MapPin, Globe, Briefcase, BarChart3, Bell, Settings, Users, TrendingUp } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { useAuth } from '../contexts/AuthContext';
import { createOpportunity, getCompany, getCompanyOpportunities } from '../../services/companiesService';
import { getApplicationsForOpportunity, updateApplicationStatus } from '../../services/applicationsService';
import { getErrorMessage } from '../../services/errors';

type Opportunity = {
  id: string;
  title: string;
  type?: string;
  skills?: string[];
  status?: string;
  applicants?: number;
};

type Application = {
  id: string;
  student_name: string;
  status: string;
  message?: string;
};

export const CompanyProfile = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [companyData, setCompanyData] = useState<Record<string, any> | null>(null);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [applicationsByOpportunity, setApplicationsByOpportunity] = useState<Record<string, Application[]>>({});
  const [newOpportunity, setNewOpportunity] = useState({
    title: '',
    description: '',
    type: 'internship',
    skills: '',
  });
  const { user } = useAuth();
  const { id } = useParams();
  const companyId = id || user?.id || 'c1';

  const fallbackCompany = {
    id: 'c1',
    name: 'TechNova Algeria',
    industry: 'Software Development',
    location: 'Algiers, Algeria',
    website: 'technova.dz',
    avatar: 'TN',
    description: 'Leading software development company specializing in AI solutions and digital transformation.',
    interests: ['AI', 'Web Development', 'Mobile Apps', 'Cloud Computing', 'Cybersecurity'],
    stats: {
      opportunities: 12,
      hiredStudents: 8,
      activeProjects: 5,
      totalViews: 2340,
    },
    opportunities: [
      {
        id: 'o1',
        title: 'AI Chatbot for Customer Service',
        type: 'Internship',
        skills: ['Python', 'NLP', 'ML'],
        status: 'Open',
        applicants: 12,
      },
      {
        id: 'o2',
        title: 'Mobile App for Fleet Management',
        type: 'PFE Project',
        skills: ['React Native', 'GPS'],
        status: 'Open',
        applicants: 8,
      },
      {
        id: 'o3',
        title: 'Blockchain Supply Chain System',
        type: 'Collaboration',
        skills: ['Blockchain', 'Web3'],
        status: 'In Progress',
        applicants: 3,
      },
    ],
    notifications: [
      { id: 'n1', text: 'New applicant for AI Chatbot position', time: '2 hours ago', read: false },
      { id: 'n2', text: 'Project proposal approved', time: '5 hours ago', read: false },
      { id: 'n3', text: 'Interview scheduled with Ahmed', time: '1 day ago', read: true },
    ],
  };

  const company = {
    ...fallbackCompany,
    id: companyData?.id ?? companyId,
    name: companyData?.company_name ?? companyData?.name ?? fallbackCompany.name,
    industry: companyData?.industry ?? fallbackCompany.industry,
    location: companyData?.location ?? fallbackCompany.location,
    website: companyData?.website ?? fallbackCompany.website,
    description: companyData?.description ?? fallbackCompany.description,
    stats: {
      ...fallbackCompany.stats,
      opportunities: companyData?.total_opportunities ?? (opportunities.length || fallbackCompany.stats.opportunities),
      totalViews: companyData?.profile_views ?? fallbackCompany.stats.totalViews,
    },
    opportunities: opportunities.length ? opportunities : fallbackCompany.opportunities,
  };

  useEffect(() => {
    const loadCompany = async () => {
      try {
        const [companyResponse, opportunitiesResponse] = await Promise.all([
          getCompany(companyId),
          getCompanyOpportunities(companyId),
        ]);
        const loadedOpportunities = opportunitiesResponse.data.opportunities ?? opportunitiesResponse.data ?? [];
        setCompanyData(companyResponse.data);
        setOpportunities(loadedOpportunities);

        const applicationEntries = await Promise.all(
          loadedOpportunities.map(async (opportunity: Opportunity) => {
            try {
              const response = await getApplicationsForOpportunity(opportunity.id);
              return [opportunity.id, response.data] as const;
            } catch {
              return [opportunity.id, []] as const;
            }
          }),
        );
        setApplicationsByOpportunity(Object.fromEntries(applicationEntries));
      } catch (error) {
        toast.error(getErrorMessage(error));
      }
    };

    loadCompany();
  }, [companyId]);

  const handlePostOpportunity = async () => {
    if (!newOpportunity.title.trim()) return;

    try {
      const payload = {
        title: newOpportunity.title,
        description: newOpportunity.description,
        type: newOpportunity.type,
        skills: newOpportunity.skills.split(',').map((skill) => skill.trim()).filter(Boolean),
      };
      const response = await createOpportunity(companyId, payload);
      setOpportunities((current) => [response.data, ...current]);
      setNewOpportunity({ title: '', description: '', type: 'internship', skills: '' });
      toast.success('Opportunity posted');
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleApplicationStatus = async (opportunityId: string, applicationId: string, status: string) => {
    try {
      const response = await updateApplicationStatus(applicationId, status);
      setApplicationsByOpportunity((current) => ({
        ...current,
        [opportunityId]: (current[opportunityId] ?? []).map((application) =>
          application.id === applicationId ? response.data : application,
        ),
      }));
      toast.success(`Application ${status}`);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-[#1e293b] to-[#334155] text-white py-12">
        <div className="container mx-auto px-6">
          <div className="flex items-center gap-6">
            <Avatar className="w-32 h-32 ring-4 ring-white/20">
              <AvatarFallback className="bg-gradient-to-br from-[#f97316] to-[#fb923c] text-white text-2xl">
                <Building2 className="w-16 h-16" />
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h1 className="text-4xl mb-2" style={{ fontWeight: 700 }}>{company.name}</h1>
              <div className="flex flex-wrap gap-4 text-lg text-white/80 mb-3">
                <span className="flex items-center gap-2">
                  <Briefcase className="w-5 h-5" />
                  {company.industry}
                </span>
                <span className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  {company.location}
                </span>
                <span className="flex items-center gap-2">
                  <Globe className="w-5 h-5" />
                  {company.website}
                </span>
              </div>
            </div>
            {user && user.role === 'company' && (
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
                  <span className="text-sm text-gray-600">Open Opportunities</span>
                  <Badge className="bg-[#f97316] text-white">
                    {company.stats.opportunities}
                  </Badge>
                </div>
                <div className="flex items-center justify-between pb-3 border-b">
                  <span className="text-sm text-gray-600">Hired Students</span>
                  <span style={{ fontWeight: 600 }}>{company.stats.hiredStudents}</span>
                </div>
                <div className="flex items-center justify-between pb-3 border-b">
                  <span className="text-sm text-gray-600">Active Projects</span>
                  <span style={{ fontWeight: 600 }}>{company.stats.activeProjects}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Profile Views</span>
                  <span style={{ fontWeight: 600 }}>{company.stats.totalViews.toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Bell className="w-5 h-5 text-[#f97316]" />
                  Notifications
                  <Badge className="bg-[#f97316] text-white ml-auto">
                    {company.notifications.filter(n => !n.read).length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {company.notifications.map((notification) => (
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
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button onClick={() => setActiveTab('opportunities')} className="w-full bg-[#f97316] hover:bg-[#ea580c]">
                  Post New Opportunity
                </Button>
                <Button variant="outline" className="w-full">
                  Browse Students
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
                <TabsTrigger value="opportunities">
                  Opportunities ({company.opportunities.length})
                </TabsTrigger>
                <TabsTrigger value="analytics">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Analytics
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>About Us</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 leading-relaxed mb-6">{company.description}</p>

                    <div>
                      <h4 className="mb-3" style={{ fontWeight: 600 }}>Areas of Interest</h4>
                      <div className="flex flex-wrap gap-2">
                        {company.interests.map((interest) => (
                          <Badge key={interest} variant="secondary" className="px-3 py-1">
                            {interest}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Company Overview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-3 gap-6">
                      <div className="text-center p-6 bg-gradient-to-br from-[#f97316]/10 to-[#fb923c]/10 rounded-xl">
                        <div className="text-3xl mb-2 text-[#f97316]" style={{ fontWeight: 700 }}>
                          {company.stats.opportunities}
                        </div>
                        <div className="text-sm text-gray-600">Opportunities Posted</div>
                      </div>
                      <div className="text-center p-6 bg-gradient-to-br from-gray-100 to-gray-50 rounded-xl">
                        <div className="text-3xl mb-2" style={{ fontWeight: 700 }}>
                          {company.stats.hiredStudents}
                        </div>
                        <div className="text-sm text-gray-600">Students Hired</div>
                      </div>
                      <div className="text-center p-6 bg-gradient-to-br from-[#1e293b]/10 to-[#334155]/10 rounded-xl">
                        <div className="text-3xl mb-2" style={{ fontWeight: 700 }}>
                          {company.stats.activeProjects}
                        </div>
                        <div className="text-sm text-gray-600">Active Projects</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="opportunities" className="space-y-6">
                {user?.role === 'company' && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Post New Opportunity</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Input
                        value={newOpportunity.title}
                        onChange={(event) => setNewOpportunity((current) => ({ ...current, title: event.target.value }))}
                        placeholder="Opportunity title"
                      />
                      <div className="grid md:grid-cols-2 gap-3">
                        <Input
                          value={newOpportunity.type}
                          onChange={(event) => setNewOpportunity((current) => ({ ...current, type: event.target.value }))}
                          placeholder="internship, pfe, or collaboration"
                        />
                        <Input
                          value={newOpportunity.skills}
                          onChange={(event) => setNewOpportunity((current) => ({ ...current, skills: event.target.value }))}
                          placeholder="Skills, comma separated"
                        />
                      </div>
                      <Textarea
                        value={newOpportunity.description}
                        onChange={(event) => setNewOpportunity((current) => ({ ...current, description: event.target.value }))}
                        placeholder="Describe the opportunity"
                      />
                      <Button onClick={handlePostOpportunity} className="bg-[#f97316] hover:bg-[#ea580c]">
                        Post Opportunity
                      </Button>
                    </CardContent>
                  </Card>
                )}
                {company.opportunities.map((opportunity) => (
                  <Card key={opportunity.id} className="border-l-4 border-l-[#f97316]">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-xl" style={{ fontWeight: 600 }}>
                              {opportunity.title}
                            </h3>
                            <Badge variant="outline">{opportunity.type}</Badge>
                          </div>
                          <div className="flex flex-wrap gap-2 mb-3">
                            {(opportunity.skills ?? []).map((skill) => (
                              <Badge key={skill} variant="secondary" className="text-xs">
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <Badge className={opportunity.status === 'Open' ? 'bg-green-500 text-white' : 'bg-[#f97316] text-white'}>
                          {opportunity.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span className="flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          {applicationsByOpportunity[opportunity.id]?.length ?? opportunity.applicants ?? 0} applicants
                        </span>
                      </div>
                      {user?.role === 'company' && (
                        <div className="mt-5 space-y-3">
                          {(applicationsByOpportunity[opportunity.id] ?? []).map((application) => (
                            <div key={application.id} className="rounded-md border p-3">
                              <div className="flex flex-wrap items-center justify-between gap-3">
                                <div>
                                  <div style={{ fontWeight: 600 }}>{application.student_name}</div>
                                  <p className="text-sm text-gray-600">{application.message}</p>
                                  <Badge variant="outline" className="mt-2">{application.status}</Badge>
                                </div>
                                <div className="flex gap-2">
                                  <Button size="sm" onClick={() => handleApplicationStatus(opportunity.id, application.id, 'accepted')}>
                                    Accept
                                  </Button>
                                  <Button size="sm" variant="outline" onClick={() => handleApplicationStatus(opportunity.id, application.id, 'rejected')}>
                                    Reject
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
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
                          <span className="text-sm text-gray-600">Profile Views</span>
                          <span style={{ fontWeight: 600 }}>
                            {company.stats.totalViews.toLocaleString()}
                          </span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-[#f97316] to-[#fb923c]" style={{ width: '78%' }}></div>
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-gray-600">Opportunity Applications</span>
                          <span style={{ fontWeight: 600 }}>
                            23
                          </span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div className="h-full bg-gray-600" style={{ width: '62%' }}></div>
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-gray-600">Successful Hires</span>
                          <span style={{ fontWeight: 600 }}>
                            {company.stats.hiredStudents}
                          </span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div className="h-full bg-green-500" style={{ width: '45%' }}></div>
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
