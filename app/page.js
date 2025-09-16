import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, FileText, Users, BarChart3, Mail, Phone, MapPin, Award, Shield, Clock } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/95 backdrop-blur-sm border-b border-slate-200 z-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="text-xl font-semibold text-slate-900">
                Evalura
              </Link>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#home" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
                Home
              </a>
              <a href="#features" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
                Features
              </a>
              <a href="#about" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
                About
              </a>
              <a href="#contact" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
                Contact
              </a>
              <Link href="/login">
                <Button className="bg-slate-900 hover:bg-slate-800 text-white border-0 shadow-sm font-medium px-4 py-2 h-9 text-sm">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>
      {/* Hero Section */}
      <main className="flex-1">
        <section id="home" className="w-full py-16 md:py-24 lg:py-32 pt-24">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
              {/* Left Content */}
              <div className="flex flex-col justify-center space-y-6">
                <div className="space-y-4">
                  <h1 className="text-4xl font-light tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
                    Enterprise Assignment
                    <span className="block font-normal text-slate-700">Management Platform</span>
                  </h1>
                  <p className="max-w-[600px] text-lg text-slate-600 leading-relaxed">
                    Streamline academic workflows with our professional-grade platform.
                    Manage projects, track submissions, and deliver results with enterprise precision.
                  </p>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Link href="/login">
                    <Button className="bg-slate-900 hover:bg-slate-800 text-white border-0 shadow-sm font-medium px-6 py-3 h-11 text-sm">
                      Access Platform
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="/register">
                    <Button variant="outline" className="border-slate-200 hover:bg-slate-50 text-slate-700 font-medium px-6 py-3 h-11 text-sm">
                      Create Account
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Right Mockup */}
              <div className="flex items-center justify-center">
                <div className="relative h-[400px] w-full bg-white border border-slate-200 rounded-lg shadow-sm p-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="h-6 w-32 bg-slate-200 rounded"></div>
                      <div className="h-6 w-6 bg-slate-300 rounded"></div>
                    </div>
                    <div className="h-20 w-full bg-slate-100 rounded border border-slate-200"></div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="h-16 bg-slate-50 rounded border border-slate-200"></div>
                      <div className="h-16 bg-slate-50 rounded border border-slate-200"></div>
                      <div className="h-16 bg-slate-50 rounded border border-slate-200"></div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-4 w-full bg-slate-200 rounded"></div>
                      <div className="h-4 w-3/4 bg-slate-200 rounded"></div>
                      <div className="h-4 w-1/2 bg-slate-200 rounded"></div>
                    </div>
                    <div className="flex justify-between items-center pt-4">
                      <div className="h-8 w-20 bg-slate-900 rounded"></div>
                      <div className="h-6 w-16 bg-slate-200 rounded"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="w-full py-16 md:py-24 bg-white border-t border-slate-200">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-light tracking-tight text-slate-900 sm:text-4xl mb-4">
                Enterprise-Grade Capabilities
              </h2>
              <p className="max-w-2xl mx-auto text-lg text-slate-600 leading-relaxed">
                Professional tools designed for institutional excellence and operational efficiency.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              <div className="bg-white border border-slate-200 rounded-lg p-6 hover:shadow-sm transition-shadow duration-200">
                <div className="h-12 w-12 bg-slate-100 rounded-lg flex items-center justify-center mb-4">
                  <FileText className="h-6 w-6 text-slate-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Project Management</h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Comprehensive project lifecycle management with deadline tracking, requirement specifications, and automated workflow orchestration.
                </p>
              </div>
              <div className="bg-white border border-slate-200 rounded-lg p-6 hover:shadow-sm transition-shadow duration-200">
                <div className="h-12 w-12 bg-slate-100 rounded-lg flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-slate-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Submission Intelligence</h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Real-time submission monitoring with advanced analytics, automated status tracking, and comprehensive audit trails.
                </p>
              </div>
              <div className="bg-white border border-slate-200 rounded-lg p-6 hover:shadow-sm transition-shadow duration-200">
                <div className="h-12 w-12 bg-slate-100 rounded-lg flex items-center justify-center mb-4">
                  <BarChart3 className="h-6 w-6 text-slate-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Performance Analytics</h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Advanced evaluation frameworks with detailed performance metrics, automated reporting, and strategic insights dashboard.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* About Us Section */}
        <section id="about" className="w-full py-16 md:py-24 bg-slate-50">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-light tracking-tight text-slate-900 sm:text-4xl mb-4">
                About Evalura
              </h2>
              <p className="max-w-2xl mx-auto text-lg text-slate-600 leading-relaxed">
                Empowering educational institutions with cutting-edge assignment management solutions.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 items-center">
              <div className="space-y-6">
                <h3 className="text-2xl font-semibold text-slate-900">
                  Our Mission
                </h3>
                <p className="text-slate-600 leading-relaxed">
                  We believe in transforming the educational experience through innovative technology. 
                   Our platform bridges the gap between educators and students, creating seamless workflows 
                   that enhance learning outcomes and administrative efficiency.
                </p>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="text-center">
                    <div className="h-12 w-12 bg-slate-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                      <Award className="h-6 w-6 text-slate-600" />
                    </div>
                    <h4 className="font-semibold text-slate-900 text-sm">Excellence</h4>
                    <p className="text-xs text-slate-600">Committed to quality</p>
                  </div>
                  <div className="text-center">
                    <div className="h-12 w-12 bg-slate-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                      <Shield className="h-6 w-6 text-slate-600" />
                    </div>
                    <h4 className="font-semibold text-slate-900 text-sm">Security</h4>
                    <p className="text-xs text-slate-600">Enterprise-grade protection</p>
                  </div>
                  <div className="text-center">
                    <div className="h-12 w-12 bg-slate-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                      <Clock className="h-6 w-6 text-slate-600" />
                    </div>
                    <h4 className="font-semibold text-slate-900 text-sm">Efficiency</h4>
                    <p className="text-xs text-slate-600">Streamlined processes</p>
                  </div>
                </div>
              </div>
              <div className="bg-white border border-slate-200 rounded-lg p-8">
                <h3 className="text-xl font-semibold text-slate-900 mb-4">
                  Why Choose Evalura?
                </h3>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <div className="h-2 w-2 bg-slate-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <span className="text-slate-600 text-sm">Trusted by 500+ educational institutions worldwide</span>
                  </li>
                  <li className="flex items-start">
                    <div className="h-2 w-2 bg-slate-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <span className="text-slate-600 text-sm">99.9% uptime with enterprise-grade infrastructure</span>
                  </li>
                  <li className="flex items-start">
                    <div className="h-2 w-2 bg-slate-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <span className="text-slate-600 text-sm">24/7 dedicated support and training resources</span>
                  </li>
                  <li className="flex items-start">
                    <div className="h-2 w-2 bg-slate-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <span className="text-slate-600 text-sm">GDPR compliant with advanced data protection</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section id="contact" className="w-full py-16 md:py-24 bg-white border-t border-slate-200">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-light tracking-tight text-slate-900 sm:text-4xl mb-4">
                Get in Touch
              </h2>
              <p className="max-w-2xl mx-auto text-lg text-slate-600 leading-relaxed">
                Ready to transform your institution&apos;s assignment management? Let&apos;s discuss your needs.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
              {/* Contact Information */}
              <div className="space-y-8">
                <div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-6">
                    Contact Information
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <div className="h-10 w-10 bg-slate-100 rounded-lg flex items-center justify-center mr-4">
                        <Mail className="h-5 w-5 text-slate-600" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">Email</p>
                        <p className="text-slate-600 text-sm">contact@evalura.com</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <div className="h-10 w-10 bg-slate-100 rounded-lg flex items-center justify-center mr-4">
                        <Phone className="h-5 w-5 text-slate-600" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">Phone</p>
                        <p className="text-slate-600 text-sm">+1 (555) 123-4567</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <div className="h-10 w-10 bg-slate-100 rounded-lg flex items-center justify-center mr-4">
                        <MapPin className="h-5 w-5 text-slate-600" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">Address</p>
                        <p className="text-slate-600 text-sm">123 Education Ave, Suite 100<br />San Francisco, CA 94105</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-6">
                  <h4 className="font-semibold text-slate-900 mb-2">Business Hours</h4>
                  <div className="space-y-1 text-sm text-slate-600">
                    <p>Monday - Friday: 9:00 AM - 6:00 PM PST</p>
                    <p>Saturday: 10:00 AM - 4:00 PM PST</p>
                    <p>Sunday: Closed</p>
                  </div>
                </div>
              </div>

              {/* Contact Form */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-8">
                <h3 className="text-xl font-semibold text-slate-900 mb-6">
                  Send us a Message
                </h3>
                <form className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        First Name
                      </label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent bg-white text-sm"
                        placeholder="John"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Last Name
                      </label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent bg-white text-sm"
                        placeholder="Doe"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent bg-white text-sm"
                      placeholder="john.doe@university.edu"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Institution
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent bg-white text-sm"
                      placeholder="University Name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Message
                    </label>
                    <textarea
                      rows={4}
                      className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent bg-white text-sm"
                      placeholder="Tell us about your assignment management needs..."
                    ></textarea>
                  </div>
                  <Button className="w-full bg-slate-900 hover:bg-slate-800 text-white border-0 shadow-sm font-medium py-2 h-10 text-sm">
                    Send Message
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-200 bg-white py-8">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <p className="text-sm text-slate-600">
              © 2024 Evalura. All rights reserved.
            </p>
            <div className="flex gap-6">
              <Link href="/terms" className="text-sm text-slate-600 hover:text-slate-900 font-medium transition-colors">
                Terms of Service
              </Link>
              <Link href="/privacy" className="text-sm text-slate-600 hover:text-slate-900 font-medium transition-colors">
                Privacy Policy
              </Link>
              <Link href="/support" className="text-sm text-slate-600 hover:text-slate-900 font-medium transition-colors">
                Support
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
