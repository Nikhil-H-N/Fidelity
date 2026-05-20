import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import {
  HeroSection,
  InvestmentProducts,
  GoalInvesting,
  WhyChooseUs,
  PortfolioPerformanceSection,
  TestimonialsSection,
  BehavioralShowcase,
  CTASection,
} from '../components/landing/LandingSections';
import { usePageTracking } from '../hooks/useTracking';

export default function Landing() {
  usePageTracking('landing');

  return (
    <div className="min-h-screen">
      <Navbar />
      <main>
        <HeroSection />
        <InvestmentProducts />
        <GoalInvesting />
        <WhyChooseUs />
        <PortfolioPerformanceSection />
        <TestimonialsSection />
        <BehavioralShowcase />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
