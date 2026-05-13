import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import { Search, GraduationCap, Building2, MapPin, Award, Users } from 'lucide-react';
import { getCompanies } from '../../services/companiesService';
import { getErrorMessage } from '../../services/errors';

export const Community = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [apiCompanies, setApiCompanies] = useState<any[]>([]);

  const professors = [
    {
      id: 'p1',
      name: 'Dr. Fatima Zahra',
      university: 'USTHB',
      department: 'Computer Science',
      specialization: ['Machine Learning', 'Computer Vision', 'NLP'],
      supervisedProjects: 24,
      rating: 4.8,
      avatar: 'FZ',
    },
    {
      id: 'p2',
      name: 'Prof. Karim Mansouri',
      university: 'ENP',
      department: 'Engineering',
      specialization: ['IoT', 'Embedded Systems', 'Urban Tech'],
      supervisedProjects: 32,
      rating: 4.7,
      avatar: 'KM',
    },
    {
      id: 'p3',
      name: 'Dr. Amina Benali',
      university: 'University of Algiers 1',
      department: 'Information Systems',
      specialization: ['Blockchain', 'Cybersecurity', 'Distributed Systems'],
      supervisedProjects: 18,
      rating: 4.9,
      avatar: 'AB',
    },
    {
      id: 'p4',
      name: 'Prof. Mohamed Salah',
      university: 'University of Constantine 1',
      department: 'Mathematics & CS',
      specialization: ['Optimization', 'Algorithms', 'Data Science'],
      supervisedProjects: 28,
      rating: 4.6,
      avatar: 'MS',
    },
  ];

  const companies = [
    {
      id: 'c1',
      name: 'TechNova Algeria',
      industry: 'Software Development',
      location: 'Algiers',
      interests: ['AI', 'Web Development', 'Mobile Apps'],
      opportunities: 12,
      hiredStudents: 8,
      avatar: 'TN',
    },
    {
      id: 'c2',
      name: 'DataMinds',
      industry: 'Data Analytics',
      location: 'Oran',
      interests: ['Data Science', 'Machine Learning', 'Big Data'],
      opportunities: 8,
      hiredStudents: 5,
      avatar: 'DM',
    },
    {
      id: 'c3',
      name: 'GreenTech Solutions',
      industry: 'AgriTech',
      location: 'Constantine',
      interests: ['IoT', 'Agriculture', 'Sustainability'],
      opportunities: 6,
      hiredStudents: 4,
      avatar: 'GT',
    },
    {
      id: 'c4',
      name: 'AlgeriaChain',
      industry: 'Blockchain',
      location: 'Algiers',
      interests: ['Blockchain', 'FinTech', 'Web3'],
      opportunities: 5,
      hiredStudents: 3,
      avatar: 'AC',
    },
  ];

  useEffect(() => {
    const loadCompanies = async () => {
      try {
        const response = await getCompanies(searchQuery ? { industry: searchQuery, page: 1, limit: 20 } : { page: 1, limit: 20 });
        setApiCompanies(response.data.companies ?? response.data ?? []);
      } catch (error) {
        toast.error(getErrorMessage(error));
      }
    };

    loadCompanies();
  }, [searchQuery]);

  const companyList = apiCompanies.length
    ? apiCompanies.map((company) => ({
        id: company.id ?? company.user_id,
        name: company.company_name ?? company.name,
        industry: company.industry ?? '',
        location: company.location ?? '',
        interests: company.interests ?? company.skills ?? [],
        opportunities: company.total_opportunities ?? 0,
        hiredStudents: company.hired_students ?? 0,
        avatar: company.avatar ?? '',
      }))
    : companies;

  const filteredProfessors = professors.filter(prof =>
    prof.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    prof.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
    prof.specialization.some(spec => spec.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredCompanies = companyList.filter(company =>
    company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    company.industry.toLowerCase().includes(searchQuery.toLowerCase()) ||
    company.interests.some(interest => interest.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <section className="bg-gradient-to-br from-[#1e293b] to-[#334155] text-white py-20">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl">
            <Badge className="bg-[#f97316] text-white mb-6">
              Our Community
            </Badge>
            <h1 className="text-5xl mb-6" style={{ fontWeight: 700 }}>
              Connect with Professors & Companies
            </h1>
            <p className="text-xl text-white/80 mb-8">
              Find supervisors, explore company opportunities, and join Algeria's academic network.
            </p>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder="Search by name, department, industry, or interests..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-14 bg-white text-gray-900"
              />
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-6 py-12">
        <Tabs defaultValue="professors" className="w-full">
          <TabsList className="mb-8">
            <TabsTrigger value="professors" className="gap-2">
              <GraduationCap className="w-4 h-4" />
              Professors ({filteredProfessors.length})
            </TabsTrigger>
            <TabsTrigger value="companies" className="gap-2">
              <Building2 className="w-4 h-4" />
              Companies ({filteredCompanies.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="professors" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {filteredProfessors.map((professor) => (
                <Link key={professor.id} to={`/professor/${professor.id}`}>
                  <Card className="hover:shadow-xl transition-all border-l-4 border-l-[#1e293b] h-full">
                    <CardHeader>
                      <div className="flex items-start gap-4">
                        <Avatar className="w-16 h-16">
                          <AvatarFallback className="bg-[#1e293b] text-white text-xl">
                            {professor.avatar}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <CardTitle className="text-xl mb-2">{professor.name}</CardTitle>
                          <div className="text-sm text-gray-600 mb-2">
                            <div>{professor.department}</div>
                            <div>{professor.university}</div>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="mb-4">
                        <div className="text-sm text-gray-500 mb-2">Specialization:</div>
                        <div className="flex flex-wrap gap-2">
                          {professor.specialization.map((spec) => (
                            <Badge key={spec} variant="secondary" className="text-xs">
                              {spec}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Award className="w-4 h-4" />
                          <span>{professor.supervisedProjects} projects</span>
                        </div>
                        <Badge className="bg-[#f97316] text-white">
                          ★ {professor.rating}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="companies" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {filteredCompanies.map((company) => (
                <Link key={company.id} to={`/company/${company.id}`}>
                  <Card className="hover:shadow-xl transition-all border-l-4 border-l-[#f97316] h-full">
                    <CardHeader>
                      <div className="flex items-start gap-4">
                        <Avatar className="w-16 h-16">
                          <AvatarFallback className="bg-gradient-to-br from-[#f97316] to-[#fb923c] text-white text-xl">
                            <Building2 className="w-8 h-8" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <CardTitle className="text-xl mb-2 text-[#1e3a8a]">{company.name}</CardTitle>
                          <div className="text-sm text-gray-600 mb-2">
                            <div>{company.industry}</div>
                            <div className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {company.location}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="mb-4">
                        <div className="text-sm text-gray-500 mb-2">Interests:</div>
                        <div className="flex flex-wrap gap-2">
                          {company.interests.map((interest) => (
                            <Badge key={interest} variant="secondary" className="text-xs">
                              {interest}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <div>{company.opportunities} opportunities</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          {company.hiredStudents} hired
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
