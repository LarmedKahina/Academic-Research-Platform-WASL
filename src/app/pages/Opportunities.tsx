import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Briefcase, Building2, Search } from 'lucide-react';
import { getOpportunities } from '../../services/companiesService';
import { applyToOpportunity } from '../../services/applicationsService';
import { getErrorMessage } from '../../services/errors';

type Opportunity = {
  id: string;
  title: string;
  description?: string;
  type?: string;
  skills?: string[];
  status?: string;
  company_name?: string;
};

export const Opportunities = () => {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [type, setType] = useState('all');
  const [skills, setSkills] = useState('');
  const [messageByOpportunity, setMessageByOpportunity] = useState<Record<string, string>>({});

  useEffect(() => {
    const loadOpportunities = async () => {
      try {
        const params = {
          ...(type !== 'all' ? { type } : {}),
          ...(skills.trim() ? { skills: skills.trim() } : {}),
        };
        const response = await getOpportunities(params);
        setOpportunities(response.data.opportunities ?? response.data ?? []);
      } catch (error) {
        toast.error(getErrorMessage(error));
      }
    };

    loadOpportunities();
  }, [type, skills]);

  const handleApply = async (opportunityId: string) => {
    try {
      await applyToOpportunity(opportunityId, messageByOpportunity[opportunityId]);
      toast.success('Application sent');
    } catch (error) {
      toast.error(getErrorMessage(error, 'You already applied'));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <section className="bg-gradient-to-br from-[#1e293b] to-[#334155] text-white py-16">
        <div className="container mx-auto px-6">
          <Badge className="bg-[#f97316] text-white mb-6">Opportunities</Badge>
          <h1 className="text-5xl mb-6" style={{ fontWeight: 700 }}>Find Internships, PFE Topics, and Collaborations</h1>
          <div className="grid md:grid-cols-[220px_1fr] gap-3 max-w-3xl">
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="bg-white text-gray-900">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                <SelectItem value="internship">Internship</SelectItem>
                <SelectItem value="pfe">PFE</SelectItem>
                <SelectItem value="collaboration">Collaboration</SelectItem>
              </SelectContent>
            </Select>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                className="pl-12 bg-white text-gray-900"
                placeholder="Filter by skill..."
                value={skills}
                onChange={(event) => setSkills(event.target.value)}
              />
            </div>
          </div>
        </div>
      </section>

      <main className="container mx-auto px-6 py-10">
        <div className="grid gap-6">
          {opportunities.map((opportunity) => (
            <Card key={opportunity.id} className="border-l-4 border-l-[#f97316]">
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle className="text-2xl mb-2">{opportunity.title}</CardTitle>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                      <span className="flex items-center gap-2">
                        <Building2 className="w-4 h-4" />
                        {opportunity.company_name ?? 'Company'}
                      </span>
                      <Badge variant="outline">{opportunity.type ?? 'opportunity'}</Badge>
                      <Badge className="bg-green-600 text-white">{opportunity.status ?? 'open'}</Badge>
                    </div>
                  </div>
                  <Briefcase className="w-6 h-6 text-[#f97316]" />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-600">{opportunity.description}</p>
                <div className="flex flex-wrap gap-2">
                  {(opportunity.skills ?? []).map((skill) => (
                    <Badge key={skill} variant="secondary">{skill}</Badge>
                  ))}
                </div>
                <Textarea
                  value={messageByOpportunity[opportunity.id] ?? ''}
                  onChange={(event) => setMessageByOpportunity((current) => ({
                    ...current,
                    [opportunity.id]: event.target.value,
                  }))}
                  placeholder="Optional cover message"
                />
                <Button onClick={() => handleApply(opportunity.id)} className="bg-[#f97316] hover:bg-[#ea580c]">
                  Apply
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
};
