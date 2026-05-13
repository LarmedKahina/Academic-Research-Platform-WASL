import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { CheckCircle, XCircle, Clock, Users, Building2, GraduationCap, FileText } from 'lucide-react';

export const AdminDashboard = () => {
  const [pendingUsers] = useState([
    {
      id: 'u1',
      name: 'Amina Khelifi',
      email: 'amina.khelifi@esi.dz',
      role: 'student',
      university: 'ESI',
      document: 'student_card_001.jpg',
      submittedDate: '2026-04-20',
    },
    {
      id: 'u2',
      name: 'Dr. Youcef Meziane',
      email: 'y.meziane@univ-constantine.dz',
      role: 'professor',
      university: 'University of Constantine 1',
      document: 'prof_certificate_002.pdf',
      submittedDate: '2026-04-19',
    },
    {
      id: 'u3',
      name: 'InnovateTech Solutions',
      email: 'contact@innovatetech.dz',
      role: 'company',
      industry: 'Software Development',
      document: 'company_registration_003.pdf',
      submittedDate: '2026-04-18',
    },
  ]);

  const stats = {
    totalUsers: 1247,
    pendingVerification: 15,
    totalProjects: 342,
    pendingProjects: 8,
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'student':
        return <Users className="w-4 h-4" />;
      case 'professor':
        return <GraduationCap className="w-4 h-4" />;
      case 'company':
        return <Building2 className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'student':
        return 'bg-[#2563eb] text-white';
      case 'professor':
        return 'bg-[#fbbf24] text-gray-900';
      case 'company':
        return 'bg-purple-500 text-white';
      default:
        return '';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-4xl mb-2">Admin Dashboard</h1>
          <p className="text-lg text-muted-foreground">
            Platform verification and management
          </p>
        </div>

        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                <Users className="w-4 h-4" />
                Total Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl">{stats.totalUsers}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Pending Verification
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl text-[#fbbf24]">{stats.pendingVerification}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Total Projects
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl">{stats.totalProjects}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Pending Projects
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl text-[#fbbf24]">{stats.pendingProjects}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Account Verification</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="pending">
              <TabsList className="mb-6">
                <TabsTrigger value="pending">Pending ({pendingUsers.length})</TabsTrigger>
                <TabsTrigger value="approved">Approved</TabsTrigger>
                <TabsTrigger value="rejected">Rejected</TabsTrigger>
              </TabsList>

              <TabsContent value="pending" className="space-y-4">
                {pendingUsers.map((user) => (
                  <Card key={user.id} className="border-l-4 border-l-[#fbbf24]">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4 flex-1">
                          <Avatar className="w-12 h-12">
                            <AvatarFallback className={getRoleBadgeColor(user.role)}>
                              {user.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>

                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3>{user.name}</h3>
                              <Badge className={getRoleBadgeColor(user.role)}>
                                {getRoleIcon(user.role)}
                                <span className="ml-1 capitalize">{user.role}</span>
                              </Badge>
                            </div>

                            <div className="text-sm text-muted-foreground space-y-1 mb-3">
                              <p>{user.email}</p>
                              <p>
                                {user.role === 'company' ? user.industry : user.university}
                              </p>
                              <p>Submitted: {user.submittedDate}</p>
                            </div>

                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="gap-2"
                              >
                                <FileText className="w-4 h-4" />
                                View Document
                              </Button>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2 ml-4">
                          <Button
                            size="sm"
                            className="bg-green-500 hover:bg-green-600 text-white gap-2"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="gap-2"
                          >
                            <XCircle className="w-4 h-4" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="approved">
                <div className="text-center py-12 text-muted-foreground">
                  No approved accounts to display
                </div>
              </TabsContent>

              <TabsContent value="rejected">
                <div className="text-center py-12 text-muted-foreground">
                  No rejected accounts to display
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
