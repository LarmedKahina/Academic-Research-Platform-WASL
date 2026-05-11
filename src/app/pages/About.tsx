import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Users, Target, Award, Globe, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';

export const About = () => {
  const stats = [
    { label: 'Active Students', value: '2,400+', icon: Users },
    { label: 'Published Projects', value: '850+', icon: Award },
    { label: 'Partner Universities', value: '32', icon: Globe },
    { label: 'Industry Partners', value: '120+', icon: Target },
  ];

  const team = [
    {
      name: 'Ministry of Higher Education',
      role: 'Government Oversight',
      description: 'Providing strategic direction and ensuring alignment with national education goals',
    },
    {
      name: 'University Consortium',
      role: 'Academic Partners',
      description: 'Leading universities across Algeria contributing content and expertise',
    },
    {
      name: 'Industry Advisory Board',
      role: 'Industry Relations',
      description: 'Top companies guiding platform development and providing opportunities',
    },
    {
      name: 'Technical Team',
      role: 'Platform Development',
      description: 'Dedicated developers and researchers maintaining and improving the platform',
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      <section className="bg-gradient-to-br from-[#1e293b] to-[#334155] text-white py-24">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="max-w-3xl mx-auto text-center"
          >
            <Badge className="bg-[#f97316] text-white mb-6">About Us</Badge>
            <h1 className="text-5xl lg:text-6xl mb-8" style={{ fontWeight: 700 }}>
              Building Algeria's Academic Future
            </h1>
            <p className="text-xl text-white/80 leading-relaxed">
              AcademicDZ is a national initiative to connect students, professors, and companies,
              fostering innovation and excellence in Algerian higher education.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="text-center border-2 hover:border-[#f97316] transition-colors">
                  <CardContent className="pt-8 pb-8">
                    <div className="w-16 h-16 bg-[#f97316]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <stat.icon className="w-8 h-8 text-[#f97316]" />
                    </div>
                    <div className="text-4xl mb-2" style={{ fontWeight: 700 }}>
                      {stat.value}
                    </div>
                    <div className="text-gray-600">{stat.label}</div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center mb-24">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl lg:text-5xl mb-6" style={{ fontWeight: 700 }}>
                Our <span className="text-[#f97316]">Mission</span>
              </h2>
              <p className="text-xl text-gray-600 mb-6 leading-relaxed">
                To create a comprehensive digital ecosystem that empowers Algerian students to
                showcase their research, enables professors to guide the next generation, and
                facilitates meaningful collaboration between academia and industry.
              </p>
              <p className="text-lg text-gray-600 leading-relaxed">
                We believe that by making academic research accessible and promoting collaboration,
                we can accelerate innovation and contribute to Algeria's development as a knowledge-based economy.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="grid grid-cols-2 gap-4"
            >
              <div className="space-y-4">
                <div className="h-56 rounded-2xl overflow-hidden shadow-lg">
                  <ImageWithFallback
                    src="https://images.unsplash.com/photo-1758270705172-07b53627dfcb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600"
                    alt="Students"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="h-40 rounded-2xl overflow-hidden shadow-lg">
                  <ImageWithFallback
                    src="https://images.unsplash.com/photo-1565350897149-38dfafa81d83?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600"
                    alt="Collaboration"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              <div className="space-y-4 mt-8">
                <div className="h-40 rounded-2xl overflow-hidden shadow-lg">
                  <ImageWithFallback
                    src="https://images.unsplash.com/photo-1758876022356-9e7597f556d8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600"
                    alt="Innovation"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="h-56 rounded-2xl overflow-hidden shadow-lg">
                  <ImageWithFallback
                    src="https://images.unsplash.com/photo-1752650736054-8fd5334c09fa?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600"
                    alt="Research"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </motion.div>
          </div>

          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="order-2 lg:order-1"
            >
              <div className="bg-gradient-to-br from-[#f97316] to-[#fb923c] rounded-3xl p-12 text-white">
                <h3 className="text-3xl mb-6" style={{ fontWeight: 700 }}>
                  Why AcademicDZ?
                </h3>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    </div>
                    <div>
                      <div className="mb-1" style={{ fontWeight: 600 }}>Official Government Platform</div>
                      <div className="text-white/90">Backed by the Ministry of Higher Education</div>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    </div>
                    <div>
                      <div className="mb-1" style={{ fontWeight: 600 }}>Verified Academic Community</div>
                      <div className="text-white/90">All users verified for authenticity and credibility</div>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    </div>
                    <div>
                      <div className="mb-1" style={{ fontWeight: 600 }}>Industry Connections</div>
                      <div className="text-white/90">Direct access to leading companies and opportunities</div>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    </div>
                    <div>
                      <div className="mb-1" style={{ fontWeight: 600 }}>Open Research Data</div>
                      <div className="text-white/90">Access to curated datasets and research resources</div>
                    </div>
                  </li>
                </ul>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="order-1 lg:order-2"
            >
              <h2 className="text-4xl lg:text-5xl mb-6" style={{ fontWeight: 700 }}>
                Our <span className="text-[#f97316]">Vision</span>
              </h2>
              <p className="text-xl text-gray-600 mb-6 leading-relaxed">
                To become the leading platform for academic collaboration in North Africa,
                setting the standard for how universities, students, and industry work together
                to drive innovation and solve real-world challenges.
              </p>
              <p className="text-lg text-gray-600 leading-relaxed">
                By 2030, we envision every Algerian student having access to world-class research
                resources, every professor equipped with modern collaboration tools, and every
                company able to tap into the nation's academic talent pool.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-24 bg-gray-50">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl lg:text-5xl mb-6" style={{ fontWeight: 700 }}>
              Who We <span className="text-[#f97316]">Work With</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              AcademicDZ is a collaborative effort bringing together key stakeholders in Algeria's education ecosystem
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            {team.map((member, index) => (
              <motion.div
                key={member.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="h-full hover:shadow-xl transition-all border-l-4 border-l-[#f97316]">
                  <CardContent className="p-8">
                    <h3 className="text-2xl mb-2" style={{ fontWeight: 600 }}>
                      {member.name}
                    </h3>
                    <div className="text-[#f97316] mb-4" style={{ fontWeight: 500 }}>
                      {member.role}
                    </div>
                    <p className="text-gray-600 leading-relaxed">{member.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 bg-gradient-to-br from-[#1e293b] to-[#334155] text-white">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto text-center"
          >
            <h2 className="text-4xl lg:text-5xl mb-8" style={{ fontWeight: 700 }}>
              Ready to Join Our Community?
            </h2>
            <p className="text-xl mb-12 text-white/80 max-w-2xl mx-auto">
              Whether you're a student, professor, or company representative, there's a place for you on AcademicDZ
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link to="/signup">
                <Button size="lg" className="bg-[#f97316] hover:bg-[#ea580c] text-white h-14 px-10 text-lg group">
                  Get Started
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link to="/projects">
                <Button size="lg" variant="outline" className="border-2 border-white text-white hover:bg-white/10 h-14 px-10 text-lg">
                  Explore Platform
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};
