import { Link } from 'react-router-dom';
import { TrendingUp, Mail, Phone, MapPin, MessageCircle, Share2, Globe, ExternalLink } from 'lucide-react';

const footerLinks = {
  'Products': [
    { name: 'Mutual Funds', href: '/mutual-funds' },
    { name: 'SIP Plans', href: '/sip-plans' },
    { name: 'Investment Plans', href: '/investment-plans' },
    { name: 'Retirement Planning', href: '/retirement-planning' },
    { name: 'Goal Planning', href: '/goal-planning' },
  ],
  'Company': [
    { name: 'About Us', href: '/about' },
    { name: 'Blog', href: '/blog' },
    { name: 'Contact', href: '/contact' },
    { name: 'Careers', href: '#' },
    { name: 'Press', href: '#' },
  ],
  'Support': [
    { name: 'Help Center', href: '/help' },
    { name: 'FAQs', href: '/help' },
    { name: 'Security', href: '#' },
    { name: 'Privacy Policy', href: '#' },
    { name: 'Terms of Service', href: '#' },
  ],
  'Resources': [
    { name: 'Investment Calculator', href: '#' },
    { name: 'Market Updates', href: '#' },
    { name: 'Tax Guide', href: '#' },
    { name: 'Glossary', href: '#' },
    { name: 'API Docs', href: '#' },
  ],
};

export default function Footer() {
  return (
    <footer className="bg-surface-900 text-surface-300">
      {/* Main Footer */}
      <div className="container-custom pt-16 pb-12">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 lg:gap-12">
          {/* Brand */}
          <div className="col-span-2">
            <Link to="/" className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <span className="font-display font-bold text-xl text-white">
                Finova<span className="text-primary-400">Wealth</span>
              </span>
            </Link>
            <p className="text-sm text-surface-400 mb-6 max-w-xs leading-relaxed">
              Smart investment strategies powered by intelligent behavioral analytics. Building financial freedom for everyone.
            </p>
            <div className="space-y-2.5 text-sm">
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-primary-400" />
                <span>hello@finovawealth.com</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-primary-400" />
                <span>+91 1800-XXX-XXXX</span>
              </div>
              <div className="flex items-center gap-2.5">
                <MapPin className="w-4 h-4 text-primary-400" />
                <span>Mumbai, Maharashtra, India</span>
              </div>
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="font-semibold text-white mb-4 text-sm">{title}</h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.name}>
                    <Link to={link.href} className="text-sm text-surface-400 hover:text-white transition-colors">
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-surface-800">
        <div className="container-custom py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-surface-500">
            © {new Date().getFullYear()} Finova Wealth. All rights reserved. SEBI Registered | AMFI Certified
          </p>
          <div className="flex items-center gap-4">
            {[MessageCircle, Share2, Globe, ExternalLink].map((Icon, i) => (
              <a key={i} href="#" className="p-2 rounded-lg text-surface-500 hover:text-white hover:bg-surface-800 transition-all">
                <Icon className="w-4 h-4" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
