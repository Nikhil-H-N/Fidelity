import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Send, MessageSquare, Clock } from 'lucide-react';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import { usePageTracking } from '../hooks/useTracking';

export default function Contact() {
  usePageTracking('contact');

  return (
    <div className="min-h-screen"><Navbar />
      <main className="pt-20">
        <section className="section-padding gradient-hero">
          <div className="container-custom text-center">
            <h1 className="font-display text-4xl font-bold text-surface-900 mb-4">Get in Touch</h1>
            <p className="text-lg text-surface-500 max-w-xl mx-auto">Have questions? Our team is here to help you with your investment journey.</p>
          </div>
        </section>
        <section className="section-padding bg-white">
          <div className="container-custom">
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="space-y-6">
                {[
                  { icon: Mail, label: 'Email', value: 'hello@finovawealth.com', desc: 'We reply within 24 hours' },
                  { icon: Phone, label: 'Phone', value: '+91 1800-XXX-XXXX', desc: 'Mon-Sat, 9AM-6PM IST' },
                  { icon: MapPin, label: 'Office', value: 'Mumbai, Maharashtra', desc: 'BKC, Mumbai - 400051' },
                ].map(c => (
                  <div key={c.label} className="flex items-start gap-4 p-4 rounded-xl bg-surface-50">
                    <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0"><c.icon className="w-5 h-5 text-primary-600" /></div>
                    <div><p className="font-semibold text-surface-900 text-sm">{c.label}</p><p className="text-sm text-primary-600">{c.value}</p><p className="text-xs text-surface-500">{c.desc}</p></div>
                  </div>
                ))}
              </div>
              <div className="lg:col-span-2">
                <form className="bg-white rounded-2xl p-6 shadow-card border border-surface-100 space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div><label className="block text-sm font-medium text-surface-700 mb-1.5">Name</label><input className="input-field" placeholder="Your name" /></div>
                    <div><label className="block text-sm font-medium text-surface-700 mb-1.5">Email</label><input className="input-field" type="email" placeholder="you@example.com" /></div>
                  </div>
                  <div><label className="block text-sm font-medium text-surface-700 mb-1.5">Subject</label><input className="input-field" placeholder="How can we help?" /></div>
                  <div><label className="block text-sm font-medium text-surface-700 mb-1.5">Message</label><textarea className="input-field min-h-[120px]" placeholder="Tell us more..." /></div>
                  <button type="submit" className="btn-primary gap-2"><Send className="w-4 h-4" /> Send Message</button>
                </form>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
