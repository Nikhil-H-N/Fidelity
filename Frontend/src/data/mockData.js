// ─── Portfolio & Investment Data ───────────────────────────────
export const portfolioSummary = {
  totalValue: 2847500,
  totalInvested: 2250000,
  totalReturns: 597500,
  returnPercent: 26.56,
  todayChange: 12350,
  todayChangePercent: 0.44,
};

export const portfolioAllocation = [
  { name: 'Equity', value: 45, amount: 1281375, color: '#2E51F5' },
  { name: 'Mutual Funds', value: 25, amount: 711875, color: '#10B981' },
  { name: 'Fixed Deposits', value: 15, amount: 427125, color: '#F59E0B' },
  { name: 'Gold', value: 10, amount: 284750, color: '#8B5CF6' },
  { name: 'Bonds', value: 5, amount: 142375, color: '#EC4899' },
];

export const portfolioPerformance = [
  { month: 'Jan', value: 2150000, benchmark: 2100000 },
  { month: 'Feb', value: 2230000, benchmark: 2140000 },
  { month: 'Mar', value: 2180000, benchmark: 2120000 },
  { month: 'Apr', value: 2350000, benchmark: 2200000 },
  { month: 'May', value: 2420000, benchmark: 2250000 },
  { month: 'Jun', value: 2380000, benchmark: 2280000 },
  { month: 'Jul', value: 2520000, benchmark: 2350000 },
  { month: 'Aug', value: 2610000, benchmark: 2400000 },
  { month: 'Sep', value: 2580000, benchmark: 2420000 },
  { month: 'Oct', value: 2700000, benchmark: 2500000 },
  { month: 'Nov', value: 2780000, benchmark: 2550000 },
  { month: 'Dec', value: 2847500, benchmark: 2600000 },
];

export const activeSIPs = [
  { id: 1, name: 'Axis Bluechip Fund', amount: 5000, date: '5th', returns: 18.4, status: 'active', category: 'Large Cap' },
  { id: 2, name: 'Mirae Asset Emerging', amount: 3000, date: '10th', returns: 22.1, status: 'active', category: 'Large & Mid Cap' },
  { id: 3, name: 'Parag Parikh Flexi Cap', amount: 10000, date: '15th', returns: 20.8, status: 'active', category: 'Flexi Cap' },
  { id: 4, name: 'SBI Small Cap Fund', amount: 2000, date: '1st', returns: 28.3, status: 'active', category: 'Small Cap' },
  { id: 5, name: 'HDFC Mid-Cap Opp.', amount: 5000, date: '20th', returns: 24.6, status: 'paused', category: 'Mid Cap' },
];

export const mutualFunds = [
  { id: 1, name: 'Axis Bluechip Fund', category: 'Large Cap', nav: 48.52, returns1y: 18.4, returns3y: 15.2, returns5y: 14.8, risk: 'Moderate', rating: 5, aum: '34,521 Cr', minSIP: 500 },
  { id: 2, name: 'Mirae Asset Large Cap', category: 'Large Cap', nav: 82.15, returns1y: 16.8, returns3y: 14.5, returns5y: 15.1, risk: 'Moderate', rating: 5, aum: '38,200 Cr', minSIP: 1000 },
  { id: 3, name: 'Parag Parikh Flexi Cap', category: 'Flexi Cap', nav: 62.34, returns1y: 20.8, returns3y: 18.2, returns5y: 17.5, risk: 'Moderate', rating: 5, aum: '45,100 Cr', minSIP: 1000 },
  { id: 4, name: 'SBI Small Cap Fund', category: 'Small Cap', nav: 128.90, returns1y: 28.3, returns3y: 22.1, returns5y: 20.4, risk: 'High', rating: 4, aum: '18,900 Cr', minSIP: 500 },
  { id: 5, name: 'HDFC Mid-Cap Opp.', category: 'Mid Cap', nav: 105.67, returns1y: 24.6, returns3y: 19.8, returns5y: 18.2, risk: 'High', rating: 4, aum: '42,300 Cr', minSIP: 500 },
  { id: 6, name: 'Kotak Emerging Equity', category: 'Mid Cap', nav: 92.45, returns1y: 22.1, returns3y: 18.5, returns5y: 17.8, risk: 'High', rating: 4, aum: '28,600 Cr', minSIP: 1000 },
  { id: 7, name: 'ICICI Pru Technology', category: 'Sectoral', nav: 156.23, returns1y: 32.5, returns3y: 25.4, returns5y: 22.1, risk: 'Very High', rating: 4, aum: '12,400 Cr', minSIP: 500 },
  { id: 8, name: 'Nippon India Growth', category: 'Mid Cap', nav: 2845.10, returns1y: 19.8, returns3y: 17.2, returns5y: 16.5, risk: 'Moderate', rating: 3, aum: '22,100 Cr', minSIP: 100 },
];

export const investmentPlans = [
  { id: 1, name: 'Wealth Builder', description: 'Long-term equity-focused portfolio for maximum growth', minInvestment: 5000, expectedReturns: '15-18%', horizon: '7+ years', risk: 'Moderate-High', features: ['Diversified equity mix', 'Quarterly rebalancing', 'Tax optimization'] },
  { id: 2, name: 'Balanced Growth', description: 'Mix of equity and debt for stable, consistent returns', minInvestment: 10000, expectedReturns: '12-15%', horizon: '5+ years', risk: 'Moderate', features: ['60:40 equity-debt split', 'Monthly monitoring', 'Risk-adjusted returns'] },
  { id: 3, name: 'Tax Saver Pro', description: 'ELSS-focused strategy with Section 80C benefits', minInvestment: 500, expectedReturns: '14-17%', horizon: '3+ years', risk: 'Moderate', features: ['Tax saving up to ₹1.5L', '3-year lock-in', 'High-quality ELSS funds'] },
  { id: 4, name: 'Conservative Shield', description: 'Capital protection with steady income generation', minInvestment: 25000, expectedReturns: '8-10%', horizon: '3+ years', risk: 'Low', features: ['80% debt allocation', 'Monthly income option', 'Capital protection'] },
];

export const goals = [
  { id: 1, name: 'Dream Home', target: 5000000, current: 1850000, icon: 'Home', deadline: '2029', monthly: 35000, onTrack: true },
  { id: 2, name: 'Child Education', target: 3000000, current: 920000, icon: 'GraduationCap', deadline: '2032', monthly: 15000, onTrack: true },
  { id: 3, name: 'Retirement', target: 20000000, current: 4200000, icon: 'Palmtree', deadline: '2045', monthly: 25000, onTrack: false },
  { id: 4, name: 'Emergency Fund', target: 600000, current: 480000, icon: 'Shield', deadline: '2026', monthly: 10000, onTrack: true },
  { id: 5, name: 'World Trip', target: 800000, current: 320000, icon: 'Plane', deadline: '2027', monthly: 20000, onTrack: true },
];

export const transactions = [
  { id: 1, type: 'SIP', fund: 'Axis Bluechip Fund', amount: 5000, date: '2025-01-05', status: 'completed', units: 103.08 },
  { id: 2, type: 'Lumpsum', fund: 'Parag Parikh Flexi Cap', amount: 50000, date: '2025-01-03', status: 'completed', units: 802.37 },
  { id: 3, type: 'SIP', fund: 'SBI Small Cap Fund', amount: 2000, date: '2025-01-01', status: 'completed', units: 15.52 },
  { id: 4, type: 'Withdrawal', fund: 'HDFC Liquid Fund', amount: 25000, date: '2024-12-28', status: 'completed', units: -525.26 },
  { id: 5, type: 'SIP', fund: 'Mirae Asset Emerging', amount: 3000, date: '2024-12-10', status: 'completed', units: 36.54 },
  { id: 6, type: 'SIP', fund: 'Axis Bluechip Fund', amount: 5000, date: '2024-12-05', status: 'completed', units: 105.26 },
  { id: 7, type: 'Lumpsum', fund: 'ICICI Pru Technology', amount: 100000, date: '2024-12-01', status: 'processing', units: 640.12 },
  { id: 8, type: 'SIP', fund: 'Kotak Emerging Equity', amount: 5000, date: '2024-11-20', status: 'completed', units: 54.08 },
];

// ─── Behavioral Analytics Data ────────────────────────────────
export const liveEvents = [
  { id: 1, event: 'page_view', page: '/mutual-funds', user: 'user_4821', timestamp: '2 sec ago', device: 'Mobile' },
  { id: 2, event: 'button_click', element: 'Start SIP', user: 'user_3295', timestamp: '5 sec ago', device: 'Desktop' },
  { id: 3, event: 'scroll_depth', depth: '75%', user: 'user_7832', timestamp: '8 sec ago', device: 'Tablet' },
  { id: 4, event: 'form_start', form: 'KYC Form', user: 'user_1204', timestamp: '12 sec ago', device: 'Mobile' },
  { id: 5, event: 'page_view', page: '/sip-plans', user: 'user_5621', timestamp: '15 sec ago', device: 'Desktop' },
  { id: 6, event: 'form_abandon', form: 'Investment Form', user: 'user_9032', timestamp: '18 sec ago', device: 'Mobile' },
  { id: 7, event: 'button_click', element: 'Compare Funds', user: 'user_2187', timestamp: '22 sec ago', device: 'Desktop' },
  { id: 8, event: 'session_end', duration: '4m 32s', user: 'user_6543', timestamp: '25 sec ago', device: 'Mobile' },
];

export const intentScores = [
  { user: 'user_4821', score: 92, signals: ['Visited 5 fund pages', 'Compared 3 funds', 'Started KYC'], status: 'Hot' },
  { user: 'user_3295', score: 78, signals: ['Clicked Start SIP 3x', 'Viewed returns calculator'], status: 'Warm' },
  { user: 'user_7832', score: 65, signals: ['Deep scroll on SIP page', 'Read 2 blog articles'], status: 'Warm' },
  { user: 'user_1204', score: 45, signals: ['Started KYC form', 'Form 40% complete'], status: 'Engaged' },
  { user: 'user_9032', score: 35, signals: ['Abandoned investment form', '2nd visit today'], status: 'At Risk' },
  { user: 'user_2187', score: 88, signals: ['Compared 5 funds', 'Used SIP calculator', 'High scroll depth'], status: 'Hot' },
];

export const funnelData = [
  { stage: 'Website Visit', users: 12500, percentage: 100 },
  { stage: 'Account Created', users: 4200, percentage: 33.6 },
  { stage: 'KYC Started', users: 2800, percentage: 22.4 },
  { stage: 'KYC Completed', users: 2100, percentage: 16.8 },
  { stage: 'First Investment', users: 1450, percentage: 11.6 },
  { stage: 'Active Investor', users: 980, percentage: 7.84 },
];

export const sessionTimeline = [
  { time: '0:00', action: 'Session Start', page: '/landing', type: 'session' },
  { time: '0:12', action: 'Scrolled to Investment Products', page: '/landing', type: 'scroll' },
  { time: '0:28', action: 'Clicked "Explore Mutual Funds"', page: '/landing', type: 'click' },
  { time: '0:35', action: 'Page View', page: '/mutual-funds', type: 'navigation' },
  { time: '1:02', action: 'Filtered by "Large Cap"', page: '/mutual-funds', type: 'click' },
  { time: '1:15', action: 'Viewed Fund Details - Axis Bluechip', page: '/mutual-funds/1', type: 'click' },
  { time: '1:45', action: 'Scrolled to Returns Section (85%)', page: '/mutual-funds/1', type: 'scroll' },
  { time: '2:10', action: 'Clicked "Start SIP"', page: '/mutual-funds/1', type: 'click' },
  { time: '2:22', action: 'Form Started - SIP Setup', page: '/sip/setup', type: 'form' },
  { time: '3:05', action: 'Form Field: Amount = ₹5000', page: '/sip/setup', type: 'form' },
  { time: '3:30', action: 'Form Submitted', page: '/sip/setup', type: 'conversion' },
];

export const heatmapData = [
  { hour: '6AM', Mon: 12, Tue: 8, Wed: 15, Thu: 10, Fri: 18, Sat: 25, Sun: 30 },
  { hour: '9AM', Mon: 45, Tue: 52, Wed: 48, Thu: 55, Fri: 42, Sat: 35, Sun: 28 },
  { hour: '12PM', Mon: 65, Tue: 70, Wed: 62, Thu: 68, Fri: 72, Sat: 40, Sun: 35 },
  { hour: '3PM', Mon: 55, Tue: 58, Wed: 60, Thu: 52, Fri: 48, Sat: 30, Sun: 25 },
  { hour: '6PM', Mon: 78, Tue: 82, Wed: 75, Thu: 80, Fri: 85, Sat: 45, Sun: 38 },
  { hour: '9PM', Mon: 90, Tue: 88, Wed: 92, Thu: 85, Fri: 95, Sat: 60, Sun: 55 },
];

export const conversionAnalytics = {
  totalUsers: 12500,
  activeUsers: 4800,
  conversionRate: 11.6,
  avgSessionDuration: '4m 23s',
  bounceRate: 32.5,
  returnRate: 68.4,
  formCompletionRate: 75.2,
  avgIntentScore: 62,
};

export const notifications = [
  { id: 1, type: 'investment', title: 'SIP Processed', message: 'Your SIP of ₹5,000 in Axis Bluechip Fund has been processed.', time: '2 hours ago', read: false },
  { id: 2, type: 'alert', title: 'Market Alert', message: 'Nifty 50 crossed 24,000 mark. Your portfolio is up 1.2% today.', time: '4 hours ago', read: false },
  { id: 3, type: 'recommendation', title: 'AI Recommendation', message: 'Based on your goals, consider increasing SIP in mid-cap funds by ₹2,000.', time: '1 day ago', read: true },
  { id: 4, type: 'system', title: 'KYC Update', message: 'Your KYC verification has been completed successfully.', time: '2 days ago', read: true },
  { id: 5, type: 'investment', title: 'Dividend Credited', message: '₹1,250 dividend from HDFC Equity Fund credited to your account.', time: '3 days ago', read: true },
  { id: 6, type: 'alert', title: 'Goal Milestone', message: 'You\'ve reached 80% of your Emergency Fund goal. Great progress!', time: '5 days ago', read: true },
];

export const aiRecommendations = [
  { id: 1, type: 'increase_sip', title: 'Increase SIP Amount', description: 'Your income has grown 15% YoY. Consider increasing monthly SIP by ₹3,000 to stay on track for retirement goal.', impact: 'Retire 2 years earlier', confidence: 94, priority: 'high' },
  { id: 2, type: 'rebalance', title: 'Portfolio Rebalancing', description: 'Your equity allocation has drifted to 52% from target 45%. Consider rebalancing to maintain risk profile.', impact: 'Reduce risk by 8%', confidence: 88, priority: 'medium' },
  { id: 3, type: 'tax_saving', title: 'Tax Optimization', description: 'You have ₹45,000 remaining under Section 80C. Invest in ELSS before March to save ₹13,500 in taxes.', impact: 'Save ₹13,500', confidence: 96, priority: 'high' },
  { id: 4, type: 'new_fund', title: 'Fund Recommendation', description: 'Based on your risk profile and goals, Quant Small Cap Fund could boost returns by 3-4% annually.', impact: '+3.5% annual returns', confidence: 72, priority: 'low' },
];

export const testimonials = [
  { name: 'Rajesh Sharma', role: 'Software Engineer', quote: 'Finova Wealth helped me build a disciplined investment habit. The AI recommendations are spot-on.', avatar: 'RS', returns: '+24.5%' },
  { name: 'Priya Patel', role: 'Business Analyst', quote: 'The goal planning feature made retirement planning so much simpler. I can see my progress in real-time.', avatar: 'PP', returns: '+18.2%' },
  { name: 'Amit Verma', role: 'Doctor', quote: 'As a busy professional, the automated SIP management saves me hours. Best fintech platform I\'ve used.', avatar: 'AV', returns: '+21.7%' },
];

export const adminStats = {
  totalUsers: 125000,
  newUsersToday: 342,
  activeInvestors: 48200,
  totalAUM: '₹2,840 Cr',
  avgTicketSize: '₹58,500',
  monthlyGrowth: 12.4,
  notificationsSent: 45200,
  triggersFired: 12800,
  conversionFromTriggers: 23.5,
};

// ─── Admin Preview Override ───────────────────────────────────
// If the app is loaded via the admin portal preview iframe, we dynamically
// mutate the mock data to provide distinctly different "preview" metrics.
const isAdminPreview = typeof window !== 'undefined' && window.location.search.includes('adminPreview=true');

if (isAdminPreview) {
  portfolioSummary.totalValue = 5432100;
  portfolioSummary.totalInvested = 3800000;
  portfolioSummary.totalReturns = 1632100;
  portfolioSummary.returnPercent = 42.95;
  portfolioSummary.todayChange = -8500;
  portfolioSummary.todayChangePercent = -0.15;

  if (activeSIPs.length > 2) {
    activeSIPs[0].amount = 15000;
    activeSIPs[1].amount = 25000;
    activeSIPs[2].amount = 50000;
  }

  if (goals.length > 2) {
    goals[0].current = 4500000;
    goals[1].current = 2800000;
    goals[2].current = 15000000;
  }
  
  portfolioPerformance.forEach(p => {
    p.value = Math.floor(p.value * 1.85);
    p.benchmark = Math.floor(p.benchmark * 1.5);
  });
}
