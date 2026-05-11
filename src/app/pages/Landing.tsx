import { Link } from 'react-router';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { ArrowRight, TrendingUp, Users, Building2, Award, BookOpen, Database, Lightbulb, Star, Eye, MessageSquare, Trophy } from 'lucide-react';
import { motion } from 'motion/react';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';

export const Landing = () => {
  const topProjects = [
    {
      id: '1',
      title: 'AI-Powered Crop Disease Detection',
      student: 'Ahmed Benali',
      university: 'USTHB',
      rating: 4.9,
      views: 2456,
      comments: 34,
      rank: 1,
      tags: ['AI', 'Agriculture'],
    },
    {
      id: '2',
      title: 'Smart Traffic Management System',
      student: 'Leila Khelifi',
      university: 'ENP',
      rating: 4.8,
      views: 2134,
      comments: 28,
      rank: 2,
      tags: ['IoT', 'Urban Planning'],
    },
    {
      id: '3',
      title: 'Blockchain Educational Credentials',
      student: 'Youcef Meziane',
      university: 'University of Algiers 1',
      rating: 4.7,
      views: 1923,
      comments: 25,
      rank: 3,
      tags: ['Blockchain', 'Education'],
    },
  ];

  return (
    <div className="w-full bg-white">
      <section className="relative overflow-hidden bg-gradient-to-br from-white via-gray-50 to-white">
        <div className="absolute top-0 right-0 w-1/2 h-full">
          <div className="absolute top-0 right-0 w-[800px] h-[600px] bg-[#f97316] opacity-10 transform rotate-12 translate-x-64 -translate-y-32"></div>
          <div className="absolute bottom-0 right-0 w-[600px] h-[400px] bg-[#1e293b] opacity-5 transform -rotate-12 translate-x-32 translate-y-32"></div>
        </div>

        <div className="container mx-auto px-6 py-24 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="inline-block mb-6">
                <Badge className="bg-[#f97316] text-white border-0 px-4 py-1.5">
                  Algeria's Project Platform
                </Badge>
              </div>

              <h1 className="text-5xl lg:text-7xl mb-8 leading-tight">
                <span style={{ fontWeight: 800 }}>Connect.</span>{' '}
                <span className="text-[#f97316]" style={{ fontWeight: 800 }}>Share.</span>
                <br />
                <span style={{ fontWeight: 800 }}>Innovate</span>{' '}
                <span style={{ fontWeight: 800 }}>Together.</span>
              </h1>

              <p className="text-xl text-gray-600 mb-10 leading-relaxed max-w-xl">
                WaslDZ is Algeria's premier platform for sharing academic projects, research papers,
                and datasets. Connect with top professors and leading companies.
              </p>

              <div className="flex flex-wrap gap-4">
                <Link to="/signup">
                  <Button size="lg" className="bg-[#f97316] hover:bg-[#ea580c] text-white h-14 px-8 text-lg group">
                    Start Sharing Today
                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link to="/browse">
                  <Button size="lg" variant="outline" className="h-14 px-8 text-lg border-2">
                    Explore Projects
                  </Button>
                </Link>
              </div>

              <div className="grid grid-cols-3 gap-8 mt-16 pt-8 border-t border-gray-200">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                >
                  <div className="text-3xl mb-1" style={{ fontWeight: 700 }}>2,400+</div>
                  <div className="text-sm text-gray-600">Projects Shared</div>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                >
                  <div className="text-3xl mb-1 text-[#f97316]" style={{ fontWeight: 700 }}>850+</div>
                  <div className="text-sm text-gray-600">Active Users</div>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.5 }}
                >
                  <div className="text-3xl mb-1" style={{ fontWeight: 700 }}>120+</div>
                  <div className="text-sm text-gray-600">Partners</div>
                </motion.div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative hidden lg:block"
            >
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                    className="h-64 rounded-2xl overflow-hidden shadow-xl"
                  >
                    <ImageWithFallback
                      src="https://images.unsplash.com/photo-1758270705172-07b53627dfcb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600"
                      alt="Students collaborating"
                      className="w-full h-full object-cover"
                    />
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.5 }}
                    className="h-48 rounded-2xl overflow-hidden shadow-xl"
                  >
                    <ImageWithFallback
                      src="https://images.unsplash.com/photo-1565350897149-38dfafa81d83?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600"
                      alt="Group collaboration"
                      className="w-full h-full object-cover"
                    />
                  </motion.div>
                </div>
                <div className="space-y-4 mt-8">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.6 }}
                    className="h-48 rounded-2xl overflow-hidden shadow-xl"
                  >
                    <ImageWithFallback
                      src="https://images.unsplash.com/photo-1758876022356-9e7597f556d8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600"
                      alt="Modern workspace"
                      className="w-full h-full object-cover"
                    />
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.7 }}
                    className="h-64 rounded-2xl overflow-hidden shadow-xl"
                  >
                    <ImageWithFallback
                      src="https://images.unsplash.com/photo-1752650736054-8fd5334c09fa?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600"
                      alt="Team working"
                      className="w-full h-full object-cover"
                    />
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-24 bg-[#1e293b] text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 left-0 w-96 h-96 bg-[#f97316] rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
        </div>

        <div className="container mx-auto px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl lg:text-5xl mb-6" style={{ fontWeight: 700 }}>
              For Every <span className="text-[#f97316]">Innovator</span>
            </h2>
            <p className="text-xl text-white/70 max-w-3xl mx-auto">
              Whether you're sharing your project, guiding students, or seeking talent,
              WaslDZ connects you to Algeria's academic community.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
            >
              <Card className="bg-white/5 border-white/10 backdrop-blur h-full hover:bg-white/10 transition-all hover:scale-105 duration-300">
                <CardContent className="p-8">
                  <div className="w-14 h-14 bg-gradient-to-br from-[#f97316] to-[#fb923c] rounded-xl flex items-center justify-center mb-6">
                    <Users className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-2xl mb-4 text-white" style={{ fontWeight: 600 }}>For Students</h3>
                  <p className="text-white/70 leading-relaxed mb-6">
                    Share your PFE projects, upload datasets, publish papers, and build your
                    academic portfolio. Get recognized by companies.
                  </p>
                  <Link to="/signup" className="text-[#f97316] hover:underline inline-flex items-center gap-2 group">
                    Start Building
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <Card className="bg-white/5 border-white/10 backdrop-blur h-full hover:bg-white/10 transition-all hover:scale-105 duration-300">
                <CardContent className="p-8">
                  <div className="w-14 h-14 bg-white/10 rounded-xl flex items-center justify-center mb-6">
                    <Award className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-2xl mb-4 text-white" style={{ fontWeight: 600 }}>For Professors</h3>
                  <p className="text-white/70 leading-relaxed mb-6">
                    Supervise projects, share your expertise, and guide the next generation.
                    Join our community of academic leaders.
                  </p>
                  <Link to="/signup" className="text-white/90 hover:text-white hover:underline inline-flex items-center gap-2 group">
                    Join Community
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              viewport={{ once: true }}
            >
              <Card className="bg-white/5 border-white/10 backdrop-blur h-full hover:bg-white/10 transition-all hover:scale-105 duration-300">
                <CardContent className="p-8">
                  <div className="w-14 h-14 bg-white/10 rounded-xl flex items-center justify-center mb-6">
                    <Building2 className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-2xl mb-4 text-white" style={{ fontWeight: 600 }}>For Companies</h3>
                  <p className="text-white/70 leading-relaxed mb-6">
                    Discover talented students, propose project topics, and connect with
                    Algeria's brightest minds for internships.
                  </p>
                  <Link to="/signup" className="text-white/90 hover:text-white hover:underline inline-flex items-center gap-2 group">
                    Find Talent
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-24 bg-gray-50">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <Badge className="bg-[#f97316] text-white mb-6">
              <Trophy className="w-4 h-4 mr-2 inline" />
              Top Rated Projects
            </Badge>
            <h2 className="text-4xl lg:text-5xl mb-6" style={{ fontWeight: 700 }}>
              Community <span className="text-[#f97316]">Favorites</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Discover the highest-rated projects from students across Algeria
            </p>
          </motion.div>

          <div className="grid gap-6 max-w-5xl mx-auto">
            {topProjects.map((project, index) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: index * 0.15 }}
                viewport={{ once: true }}
              >
                <Link to={`/projects/${project.id}`}>
                  <Card className="hover:shadow-2xl transition-all duration-300 border-l-4 border-l-[#f97316] hover:scale-[1.02]">
                    <CardContent className="p-8">
                      <div className="flex items-start gap-6">
                        <div className="flex-shrink-0">
                          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl ${
                            project.rank === 1 ? 'bg-gradient-to-br from-[#f59e0b] to-[#d97706]' :
                            project.rank === 2 ? 'bg-gradient-to-br from-[#94a3b8] to-[#64748b]' :
                            'bg-gradient-to-br from-[#cd7f32] to-[#b87333]'
                          }`} style={{ fontWeight: 700 }}>
                            #{project.rank}
                          </div>
                        </div>

                        <div className="flex-1">
                          <h3 className="text-2xl mb-3" style={{ fontWeight: 600 }}>
                            {project.title}
                          </h3>

                          <div className="flex flex-wrap gap-2 mb-4">
                            {project.tags.map((tag) => (
                              <Badge key={tag} variant="secondary">
                                {tag}
                              </Badge>
                            ))}
                          </div>

                          <div className="flex items-center gap-6 text-sm text-gray-600 mb-4">
                            <span style={{ fontWeight: 600 }}>{project.student}</span>
                            <span>•</span>
                            <span>{project.university}</span>
                          </div>

                          <div className="flex items-center gap-8 text-sm">
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1 text-[#f97316]">
                                <Star className="w-5 h-5 fill-current" />
                                <span style={{ fontWeight: 700 }}>{project.rating}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 text-gray-600">
                              <Eye className="w-4 h-4" />
                              <span>{project.views.toLocaleString()}</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-600">
                              <MessageSquare className="w-4 h-4" />
                              <span>{project.comments}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mt-12"
          >
            <Link to="/browse">
              <Button size="lg" className="bg-[#1e293b] hover:bg-[#334155] text-white">
                View All Rankings
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      <section className="py-24 bg-white">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl lg:text-5xl mb-6" style={{ fontWeight: 700 }}>
              Everything in <span className="text-[#f97316]">One Place</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Browse projects, research papers, and datasets all from a single unified platform
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <Link to="/browse">
                <Card className="group hover:shadow-2xl transition-all duration-300 border-2 border-transparent hover:border-[#f97316] h-full">
                  <CardContent className="p-8">
                    <div className="w-16 h-16 bg-[#f97316]/10 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-[#f97316] transition-colors">
                      <BookOpen className="w-8 h-8 text-[#f97316] group-hover:text-white transition-colors" />
                    </div>
                    <h3 className="text-2xl mb-3" style={{ fontWeight: 600 }}>Projects</h3>
                    <p className="text-gray-600 mb-6 leading-relaxed">
                      Explore PFE projects from universities. Rate, comment, and learn from peers.
                    </p>
                    <div className="text-[#f97316] group-hover:underline inline-flex items-center gap-2">
                      Browse Projects
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
            >
              <Link to="/browse">
                <Card className="group hover:shadow-2xl transition-all duration-300 border-2 border-transparent hover:border-[#1e293b] h-full">
                  <CardContent className="p-8">
                    <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-[#1e293b] transition-colors">
                      <Database className="w-8 h-8 text-gray-600 group-hover:text-white transition-colors" />
                    </div>
                    <h3 className="text-2xl mb-3" style={{ fontWeight: 600 }}>Datasets</h3>
                    <p className="text-gray-600 mb-6 leading-relaxed">
                      Access research datasets. Download and share data for your projects.
                    </p>
                    <div className="text-gray-900 group-hover:underline inline-flex items-center gap-2">
                      Find Datasets
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <Link to="/browse">
                <Card className="group hover:shadow-2xl transition-all duration-300 border-2 border-transparent hover:border-[#f97316] h-full">
                  <CardContent className="p-8">
                    <div className="w-16 h-16 bg-[#f97316]/10 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-[#f97316] transition-colors">
                      <Lightbulb className="w-8 h-8 text-[#f97316] group-hover:text-white transition-colors" />
                    </div>
                    <h3 className="text-2xl mb-3" style={{ fontWeight: 600 }}>Research Papers</h3>
                    <p className="text-gray-600 mb-6 leading-relaxed">
                      Publish and read academic papers. Contribute to Algeria's knowledge base.
                    </p>
                    <div className="text-[#f97316] group-hover:underline inline-flex items-center gap-2">
                      Read Papers
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-24 bg-gradient-to-br from-[#f97316] via-[#fb923c] to-[#f97316] text-white relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-white opacity-5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#1e293b] opacity-10 rounded-full blur-3xl"></div>
        </div>

        <div className="container mx-auto px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto text-center"
          >
            <h2 className="text-4xl lg:text-6xl mb-8" style={{ fontWeight: 700 }}>
              Ready to Join WaslDZ?
            </h2>
            <p className="text-xl mb-12 text-white/90 max-w-2xl mx-auto leading-relaxed">
              Join thousands of students, professors, and companies building Algeria's
              future through innovation and collaboration.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link to="/signup">
                <Button size="lg" className="bg-white text-[#f97316] hover:bg-gray-100 h-14 px-10 text-lg">
                  Create Free Account
                </Button>
              </Link>
              <Link to="/community">
                <Button size="lg" variant="outline" className="border-2 border-white text-white hover:bg-white/10 h-14 px-10 text-lg">
                  Explore Community
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};
