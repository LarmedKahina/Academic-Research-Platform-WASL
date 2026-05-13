import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Building2, Sparkles, TrendingUp, Bookmark, Users } from 'lucide-react';

export const Topics = () => {
  const companySuggested = [
    {
      id: '1',
      title: 'AI-Powered Customer Support Chatbot for Banking',
      company: 'BNP Paribas Algeria',
      category: 'Artificial Intelligence',
      description: 'Develop an intelligent chatbot capable of handling customer inquiries in Arabic and French, with integration to banking systems for account information retrieval.',
      skills: ['NLP', 'Python', 'TensorFlow', 'Arabic Language Processing'],
      difficulty: 'Advanced',
      spots: 2,
      deadline: '2026-05-30',
    },
    {
      id: '2',
      title: 'IoT-Based Smart Agriculture Monitoring System',
      company: 'Agritech Solutions DZ',
      category: 'Internet of Things',
      description: 'Create a comprehensive system for monitoring soil moisture, temperature, and crop health using sensor networks and predictive analytics.',
      skills: ['IoT', 'Arduino', 'Data Analytics', 'Mobile Development'],
      difficulty: 'Intermediate',
      spots: 3,
      deadline: '2026-06-15',
    },
    {
      id: '3',
      title: 'Blockchain-Based Supply Chain Transparency',
      company: 'LogiChain Algeria',
      category: 'Blockchain',
      description: 'Build a decentralized platform for tracking products through the supply chain, ensuring transparency and authenticity.',
      skills: ['Blockchain', 'Smart Contracts', 'Ethereum', 'Web Development'],
      difficulty: 'Advanced',
      spots: 1,
      deadline: '2026-05-20',
    },
    {
      id: '4',
      title: 'Mobile App for Public Transportation',
      company: 'Transport Urbain Algiers',
      category: 'Mobile Development',
      description: 'Develop a user-friendly mobile application for real-time bus tracking, route planning, and digital ticketing.',
      skills: ['React Native', 'GPS', 'Backend Development', 'UI/UX'],
      difficulty: 'Intermediate',
      spots: 4,
      deadline: '2026-07-01',
    },
  ];

  const aiSuggested = [
    {
      id: 'ai1',
      title: 'Algerian Dialect Sentiment Analysis',
      category: 'Natural Language Processing',
      description: 'Build a sentiment analysis model specifically trained on Algerian Arabic dialect for social media monitoring.',
      trending: 'High',
      relatedProjects: 12,
      tags: ['NLP', 'Deep Learning', 'Arabic', 'Social Media'],
    },
    {
      id: 'ai2',
      title: 'Predictive Maintenance for Industrial Equipment',
      category: 'Machine Learning',
      description: 'Develop ML models to predict equipment failures in manufacturing plants using sensor data and historical maintenance records.',
      trending: 'High',
      relatedProjects: 8,
      tags: ['Machine Learning', 'IoT', 'Industry 4.0', 'Time Series'],
    },
    {
      id: 'ai3',
      title: 'Smart Energy Grid Optimization',
      category: 'Optimization',
      description: 'Create algorithms for optimal distribution of renewable energy in smart grids, balancing supply and demand.',
      trending: 'Medium',
      relatedProjects: 5,
      tags: ['Optimization', 'Energy', 'Algorithms', 'Sustainability'],
    },
    {
      id: 'ai4',
      title: 'Healthcare Appointment Management System',
      category: 'Web Development',
      description: 'Design a comprehensive platform for managing medical appointments, patient records, and doctor schedules.',
      trending: 'Medium',
      relatedProjects: 15,
      tags: ['Web Dev', 'Healthcare', 'Database', 'Full Stack'],
    },
    {
      id: 'ai5',
      title: 'Computer Vision for Traffic Violation Detection',
      category: 'Computer Vision',
      description: 'Implement a system using cameras and deep learning to automatically detect traffic violations like speeding and red light running.',
      trending: 'High',
      relatedProjects: 6,
      tags: ['Computer Vision', 'Deep Learning', 'Public Safety', 'Real-time'],
    },
    {
      id: 'ai6',
      title: 'E-Learning Platform with Adaptive Content',
      category: 'Education Technology',
      description: 'Build an intelligent e-learning platform that adapts content difficulty based on student performance and learning patterns.',
      trending: 'Medium',
      relatedProjects: 10,
      tags: ['EdTech', 'AI', 'Web Development', 'Personalization'],
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <section className="bg-gradient-to-br from-[#1e293b] to-[#334155] text-white py-20">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl">
            <Badge className="bg-[#f97316] text-white mb-6">Project Topics</Badge>
            <h1 className="text-5xl mb-6" style={{ fontWeight: 700 }}>
              Discover Your Next <span className="text-[#f97316]">Project Idea</span>
            </h1>
            <p className="text-xl text-white/80">
              Explore trending research topics suggested by industry partners and AI recommendations
              based on current academic trends and market demands.
            </p>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-6 py-12">
        <Tabs defaultValue="company" className="w-full">
          <TabsList className="mb-8">
            <TabsTrigger value="company" className="gap-2">
              <Building2 className="w-4 h-4" />
              Company Suggested
            </TabsTrigger>
            <TabsTrigger value="ai" className="gap-2">
              <Sparkles className="w-4 h-4" />
              AI Recommended
            </TabsTrigger>
          </TabsList>

          <TabsContent value="company" className="space-y-6">
            <div className="mb-6">
              <h2 className="text-2xl mb-2" style={{ fontWeight: 600 }}>
                Topics from Industry Partners
              </h2>
              <p className="text-gray-600">
                Real-world projects proposed by companies looking for student collaboration
              </p>
            </div>

            <div className="grid gap-6">
              {companySuggested.map((topic) => (
                <Card key={topic.id} className="hover:shadow-xl transition-all border-l-4 border-l-[#f97316]">
                  <CardHeader>
                    <div className="flex items-start justify-between mb-3">
                      <Badge variant="secondary">{topic.category}</Badge>
                      <Badge className="bg-[#f97316] text-white">
                        {topic.spots} spot{topic.spots > 1 ? 's' : ''} available
                      </Badge>
                    </div>
                    <CardTitle className="text-2xl mb-3">{topic.title}</CardTitle>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Building2 className="w-4 h-4" />
                      <span style={{ fontWeight: 600 }}>{topic.company}</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 mb-6 leading-relaxed">{topic.description}</p>

                    <div className="mb-6">
                      <div className="text-sm text-gray-500 mb-2">Required Skills:</div>
                      <div className="flex flex-wrap gap-2">
                        {topic.skills.map((skill) => (
                          <Badge key={skill} variant="outline">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t">
                      <div className="flex gap-6 text-sm">
                        <div>
                          <span className="text-gray-500">Difficulty: </span>
                          <Badge variant="secondary">{topic.difficulty}</Badge>
                        </div>
                        <div>
                          <span className="text-gray-500">Deadline: </span>
                          <span style={{ fontWeight: 600 }}>{topic.deadline}</span>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <Button variant="outline" size="sm" className="gap-2">
                          <Bookmark className="w-4 h-4" />
                          Save
                        </Button>
                        <Button size="sm" className="bg-[#f97316] hover:bg-[#ea580c]">
                          Express Interest
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="ai" className="space-y-6">
            <div className="mb-6">
              <h2 className="text-2xl mb-2" style={{ fontWeight: 600 }}>
                AI-Recommended Topics
              </h2>
              <p className="text-gray-600">
                Trending research areas based on current academic trends and industry demand
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {aiSuggested.map((topic) => (
                <Card key={topic.id} className="hover:shadow-xl transition-all">
                  <CardHeader>
                    <div className="flex items-start justify-between mb-3">
                      <Badge variant="secondary">{topic.category}</Badge>
                      {topic.trending === 'High' && (
                        <Badge className="bg-[#f97316] text-white gap-1">
                          <TrendingUp className="w-3 h-3" />
                          Trending
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-xl mb-3">{topic.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 mb-4 leading-relaxed">{topic.description}</p>

                    <div className="mb-4">
                      <div className="flex flex-wrap gap-2">
                        {topic.tags.map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Users className="w-4 h-4" />
                        <span>{topic.relatedProjects} related projects</span>
                      </div>
                      <Button variant="outline" size="sm" className="gap-2">
                        <Bookmark className="w-4 h-4" />
                        Save Topic
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
