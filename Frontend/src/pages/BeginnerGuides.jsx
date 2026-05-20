import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Compass, Lightbulb, Map, ArrowRight, X, CheckCircle2, ChevronLeft, Share2, AlertCircle, TrendingUp, ShieldCheck, Zap, Activity } from 'lucide-react';
import { usePageTracking } from '../hooks/useTracking';

const guides = [
  {
    id: 'basics-101',
    title: 'Investment Basics 101',
    duration: '10 min read',
    description: 'Understand the core concepts of risk, return, asset allocation, and fighting inflation.',
    icon: BookOpen,
    color: 'text-primary-600',
    bg: 'bg-primary-50',
    content: (
      <div className="space-y-10">
        <section>
          <h2 className="text-2xl font-bold text-surface-900 mb-4">What is investing, really?</h2>
          <p className="text-surface-600 leading-relaxed mb-4">
            Investing is the process of putting your money into assets that have the potential to grow in value or generate income over time. It is not just about making more money; it's about <strong>protecting your purchasing power</strong>.
          </p>
          <div className="bg-surface-50 p-6 rounded-2xl border border-surface-100">
            <h3 className="font-bold text-surface-900 mb-2">The Silent Thief: Inflation</h3>
            <p className="text-sm text-surface-600 leading-relaxed">
              If inflation is at 6%, and your money is sitting in a savings account earning 3%, you are actually <em>losing</em> 3% of your purchasing power every year. To truly build wealth, your investments must generate returns that beat the inflation rate after taxes. Saving protects your money; investing grows it.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-surface-900 mb-4">Risk vs Return: The Golden Rule</h2>
          <p className="text-surface-600 leading-relaxed mb-6">
            The fundamental rule of the financial universe is simple: <strong>Higher potential returns demand higher risk.</strong> There is no such thing as a "safe, high-return" investment. If someone promises you one, it is likely a scam.
          </p>
          <div className="bg-amber-50 rounded-2xl p-6 border border-amber-100 shadow-sm">
            <h3 className="flex items-center gap-2 font-bold text-amber-800 mb-2">
              <AlertCircle className="w-5 h-5" /> Understanding Your Risk Capacity
            </h3>
            <p className="text-amber-700 font-medium mb-3">
              Your ability to take risks depends on two factors:
            </p>
            <ul className="list-disc list-inside space-y-2 text-amber-700/90 text-sm">
              <li><strong>Time Horizon:</strong> Money you need in 1-3 years should take ZERO risk (FDs, Liquid Funds). Money you need in 10+ years can take HIGH risk (Equity).</li>
              <li><strong>Psychology:</strong> Can you sleep at night if your portfolio drops 20% in a week? If not, you need a more conservative portfolio regardless of your age.</li>
            </ul>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-surface-900 mb-4">The Major Asset Classes</h2>
          <p className="text-surface-600 leading-relaxed mb-6">
            An "asset class" is a grouping of investments that exhibit similar characteristics and are subject to the same laws and regulations.
          </p>
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="p-6 rounded-2xl bg-white shadow-sm border border-surface-100 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold mb-4">Eq</div>
              <h4 className="font-bold text-surface-900 mb-2 text-lg">Equity (Stocks)</h4>
              <p className="text-sm text-surface-600 leading-relaxed mb-3">You buy partial ownership in a business. As the business grows and profits, your stock value rises.</p>
              <ul className="text-xs text-surface-500 space-y-1">
                <li>• <strong>Returns:</strong> Highest potential (10-15% historically)</li>
                <li>• <strong>Risk:</strong> High short-term volatility</li>
                <li>• <strong>Horizon:</strong> 5 to 7+ Years</li>
              </ul>
            </div>
            <div className="p-6 rounded-2xl bg-white shadow-sm border border-surface-100 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 font-bold mb-4">Dt</div>
              <h4 className="font-bold text-surface-900 mb-2 text-lg">Debt (Bonds / FDs)</h4>
              <p className="text-sm text-surface-600 leading-relaxed mb-3">You lend your money to the government or a corporation in exchange for regular interest payments.</p>
              <ul className="text-xs text-surface-500 space-y-1">
                <li>• <strong>Returns:</strong> Moderate and predictable (6-8%)</li>
                <li>• <strong>Risk:</strong> Low (unless the borrower defaults)</li>
                <li>• <strong>Horizon:</strong> 1 to 3 Years</li>
              </ul>
            </div>
            <div className="p-6 rounded-2xl bg-white shadow-sm border border-surface-100 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-full bg-yellow-50 flex items-center justify-center text-yellow-600 font-bold mb-4">Au</div>
              <h4 className="font-bold text-surface-900 mb-2 text-lg">Gold (SGBs, ETFs)</h4>
              <p className="text-sm text-surface-600 leading-relaxed mb-3">Acts as a hedge against inflation and currency depreciation. Shines brightest when equities fall.</p>
              <ul className="text-xs text-surface-500 space-y-1">
                <li>• <strong>Returns:</strong> Matches inflation (7-9%)</li>
                <li>• <strong>Risk:</strong> Moderate</li>
                <li>• <strong>Horizon:</strong> 5+ Years</li>
              </ul>
            </div>
            <div className="p-6 rounded-2xl bg-white shadow-sm border border-surface-100 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center text-purple-600 font-bold mb-4">Re</div>
              <h4 className="font-bold text-surface-900 mb-2 text-lg">Real Estate</h4>
              <p className="text-sm text-surface-600 leading-relaxed mb-3">Physical property or REITs. Generates rental yield and capital appreciation.</p>
              <ul className="text-xs text-surface-500 space-y-1">
                <li>• <strong>Returns:</strong> Moderate to High</li>
                <li>• <strong>Risk:</strong> Illiquid, high entry barrier</li>
                <li>• <strong>Horizon:</strong> 10+ Years</li>
              </ul>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-surface-900 mb-4">The Magic of Asset Allocation</h2>
          <p className="text-surface-600 leading-relaxed mb-4">
            Asset allocation is simply the strategy of dividing your investment portfolio across different asset categories. <strong>Studies show that asset allocation drives over 90% of your portfolio's returns, not the specific stocks you pick.</strong>
          </p>
          <p className="text-surface-600 leading-relaxed mb-4">
            A common rule of thumb is the "100 minus your age" rule. If you are 30, you put 70% in Equity (100 - 30) and 30% in Debt. However, this is just a baseline. If you are saving for a house downpayment in 2 years, that money should be 100% in Debt, regardless of your age.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-surface-900 mb-4">Beginner Mistakes to Avoid</h2>
          <ul className="space-y-4 text-surface-600">
            <li className="flex items-start gap-3 bg-surface-50 p-4 rounded-xl">
              <X className="w-5 h-5 text-red-500 shrink-0 mt-0.5" /> 
              <span><strong className="text-surface-900 block mb-1">Trying to time the market</strong> Waiting for the "perfect dip" often results in missing out on major growth days. "Time IN the market beats timing the market."</span>
            </li>
            <li className="flex items-start gap-3 bg-surface-50 p-4 rounded-xl">
              <X className="w-5 h-5 text-red-500 shrink-0 mt-0.5" /> 
              <span><strong className="text-surface-900 block mb-1">Following "Hot Tips" from friends</strong> By the time a stock tip reaches you, the big players have already made their money. Invest based on logic, not hearsay.</span>
            </li>
            <li className="flex items-start gap-3 bg-surface-50 p-4 rounded-xl">
              <X className="w-5 h-5 text-red-500 shrink-0 mt-0.5" /> 
              <span><strong className="text-surface-900 block mb-1">Panic Selling during crashes</strong> Markets go up and down. A 20% crash is normal every few years. Selling during a dip turns a temporary paper loss into a permanent real loss.</span>
            </li>
            <li className="flex items-start gap-3 bg-surface-50 p-4 rounded-xl">
              <X className="w-5 h-5 text-red-500 shrink-0 mt-0.5" /> 
              <span><strong className="text-surface-900 block mb-1">Ignoring Costs and Taxes</strong> High expense ratios, exit loads, and short-term capital gains taxes can eat up 30-40% of your profits if you trade frequently. Keep it simple and hold long-term.</span>
            </li>
          </ul>
        </section>
      </div>
    )
  },
  {
    id: 'power-compounding',
    title: 'The Power of Compounding',
    duration: '8 min read',
    description: 'Learn why time is your greatest ally and how starting early creates massive wealth.',
    icon: Lightbulb,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    content: (
      <div className="space-y-10">
        <section>
          <h2 className="text-2xl font-bold text-surface-900 mb-4">The Snowball Effect</h2>
          <p className="text-surface-600 leading-relaxed mb-4">
            Imagine a small snowball rolling down a hill. As it rolls, it gathers more snow. The larger it gets, the more snow it can gather with each rotation. This is <strong>compounding</strong>.
          </p>
          <p className="text-surface-600 leading-relaxed">
            In finance, compounding happens when the returns you earn on your investments start generating their own returns. You earn "interest on your interest." Over long periods, the returns generated completely dwarf your original investment amount.
          </p>
        </section>

        <section>
          <div className="bg-gradient-to-br from-surface-900 to-amber-900 rounded-3xl p-10 text-white text-center shadow-lg transform transition-transform hover:scale-[1.02]">
            <p className="text-2xl font-medium italic opacity-95 leading-relaxed">
              "Compound interest is the eighth wonder of the world. He who understands it, earns it; he who doesn't, pays it."
            </p>
            <p className="mt-6 font-bold text-amber-300 tracking-wide uppercase text-sm">— Albert Einstein</p>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-surface-900 mb-4">The Rule of 72</h2>
          <p className="text-surface-600 leading-relaxed mb-4">
            Want a quick mental shortcut to understand compounding? Use the Rule of 72. Divide 72 by your expected annual return, and you'll get the number of years it takes for your money to double.
          </p>
          <div className="bg-surface-50 p-6 rounded-2xl border border-surface-200">
            <ul className="space-y-3 text-sm text-surface-700">
              <li className="flex justify-between border-b border-surface-200 pb-2"><span>Savings Account (4%)</span> <strong className="text-surface-900">72 ÷ 4 = 18 Years to double</strong></li>
              <li className="flex justify-between border-b border-surface-200 pb-2"><span>Fixed Deposit (7%)</span> <strong className="text-surface-900">72 ÷ 7 = ~10 Years to double</strong></li>
              <li className="flex justify-between border-b border-surface-200 pb-2"><span>Index Fund (12%)</span> <strong className="text-surface-900">72 ÷ 12 = 6 Years to double</strong></li>
              <li className="flex justify-between"><span>Small Cap Fund (15%)</span> <strong className="text-surface-900">72 ÷ 15 = 4.8 Years to double</strong></li>
            </ul>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-surface-900 mb-4">Why Starting Early is the ONLY Cheat Code</h2>
          <p className="text-surface-600 leading-relaxed mb-6">
            In the math of compounding, time is exponentially more powerful than the amount of money you invest. Let's look at the classic example of two investors aiming for age 60, assuming a 12% return.
          </p>
          <div className="overflow-hidden rounded-2xl border border-surface-100 shadow-sm bg-white">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-50/80 text-surface-600 border-b border-surface-100">
                <tr>
                  <th className="p-5 font-bold uppercase tracking-wider text-xs">Investor</th>
                  <th className="p-5 font-bold uppercase tracking-wider text-xs">Start Age</th>
                  <th className="p-5 font-bold uppercase tracking-wider text-xs">Monthly SIP</th>
                  <th className="p-5 font-bold uppercase tracking-wider text-xs text-amber-600">Corpus at Age 60</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-50">
                <tr className="hover:bg-surface-50/50 transition-colors">
                  <td className="p-5 font-bold text-surface-900 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">R</div> Ravi
                  </td>
                  <td className="p-5 text-surface-600">25 years</td>
                  <td className="p-5 font-medium text-surface-700">₹5,000</td>
                  <td className="p-5 font-black text-amber-600 text-lg">₹3.2 Crores</td>
                </tr>
                <tr className="hover:bg-surface-50/50 transition-colors">
                  <td className="p-5 font-bold text-surface-900 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center">P</div> Priya
                  </td>
                  <td className="p-5 text-surface-600">35 years</td>
                  <td className="p-5 font-medium text-surface-700">₹15,000</td>
                  <td className="p-5 font-black text-amber-600 text-lg">₹2.8 Crores</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-5 text-sm font-medium text-surface-500 bg-surface-50 p-4 rounded-xl border border-surface-100">
            <strong className="text-surface-900 block mb-2">The Insight:</strong> 
            Ravi invested a total of ₹21 Lakhs over 35 years. Priya invested a total of ₹45 Lakhs over 25 years. Despite Priya investing more than DOUBLE the money, Ravi ended up with ₹40 Lakhs more in profit! Why? Because Ravi gave compounding 10 extra years to work its magic.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-surface-900 mb-4">SIP Milestones: The First Crore is the Hardest</h2>
          <p className="text-surface-600 leading-relaxed mb-6">
            Charlie Munger famously said, "The first $100,000 is a b*tch, but you gotta do it." The same applies to rupees. Compounding starts slow, and explodes later. Look at how long it takes to hit each ₹50 Lakh milestone with a ₹10,000 monthly SIP at 12%:
          </p>
          <div className="space-y-3">
            <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-surface-200">
              <div className="w-12 text-center font-black text-surface-400">#1</div>
              <div className="flex-1">
                <div className="flex justify-between mb-1">
                  <span className="font-bold text-surface-900">0 to ₹50 Lakhs</span>
                  <span className="font-bold text-amber-600">Takes 15 Years</span>
                </div>
                <div className="w-full bg-surface-100 rounded-full h-1.5"><div className="bg-amber-600 h-1.5 rounded-full w-1/4"></div></div>
              </div>
            </div>
            <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-surface-200">
              <div className="w-12 text-center font-black text-surface-400">#2</div>
              <div className="flex-1">
                <div className="flex justify-between mb-1">
                  <span className="font-bold text-surface-900">₹50L to ₹1 Crore</span>
                  <span className="font-bold text-amber-600">Takes Only 5 Years!</span>
                </div>
                <div className="w-full bg-surface-100 rounded-full h-1.5"><div className="bg-amber-600 h-1.5 rounded-full w-2/4"></div></div>
              </div>
            </div>
            <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-surface-200">
              <div className="w-12 text-center font-black text-surface-400">#3</div>
              <div className="flex-1">
                <div className="flex justify-between mb-1">
                  <span className="font-bold text-surface-900">₹1 Cr to ₹1.5 Crore</span>
                  <span className="font-bold text-amber-600">Takes Only 3 Years!</span>
                </div>
                <div className="w-full bg-surface-100 rounded-full h-1.5"><div className="bg-amber-600 h-1.5 rounded-full w-3/4"></div></div>
              </div>
            </div>
            <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-surface-200">
              <div className="w-12 text-center font-black text-surface-400">#4</div>
              <div className="flex-1">
                <div className="flex justify-between mb-1">
                  <span className="font-bold text-surface-900">₹1.5 Cr to ₹2 Crore</span>
                  <span className="font-bold text-amber-600">Takes Barely 2 Years!</span>
                </div>
                <div className="w-full bg-surface-100 rounded-full h-1.5"><div className="bg-amber-600 h-1.5 rounded-full w-full"></div></div>
              </div>
            </div>
          </div>
          <p className="mt-4 text-surface-600 font-medium">The takeaway? Never stop your SIPs midway. The biggest gains happen in the final years.</p>
        </section>
      </div>
    )
  },
  {
    id: 'first-fund',
    title: 'Choosing Your First Fund',
    duration: '12 min read',
    description: 'A step-by-step guide to decoding mutual funds, index funds, and active vs passive investing.',
    icon: Compass,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    content: (
      <div className="space-y-10">
        <section>
          <h2 className="text-2xl font-bold text-surface-900 mb-4">What exactly is a Mutual Fund?</h2>
          <p className="text-surface-600 leading-relaxed mb-4">
            Imagine a giant pizza. Buying a whole pizza (a direct stock like Reliance or TCS) is expensive, and what if you don't like the flavor? A mutual fund is like a massive buffet where millions of people pool their money together. A professional chef (the Fund Manager) uses this massive pool of money to buy a tiny piece of everything—stocks, bonds, gold. 
          </p>
          <p className="text-surface-600 leading-relaxed">
            By investing just ₹500, you instantly get a diversified portfolio of 50+ companies. You receive "Units" based on the current Net Asset Value (NAV) of the fund.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-surface-900 mb-4">Active vs Passive Funds: The Great Debate</h2>
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-surface-200">
              <div className="flex items-center gap-2 mb-3">
                <Activity className="w-6 h-6 text-indigo-500" />
                <h3 className="font-bold text-surface-900">Active Funds</h3>
              </div>
              <p className="text-sm text-surface-600 mb-4">A highly paid manager actively researches and trades stocks, trying to "beat the market".</p>
              <ul className="text-xs space-y-2 text-surface-500">
                <li>• Higher expense ratio (1-2%)</li>
                <li>• Potential to beat the benchmark</li>
                <li>• Manager risk (what if they pick wrong?)</li>
                <li>• Example: Flexi Cap, Mid Cap funds</li>
              </ul>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-surface-200">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-6 h-6 text-emerald-500" />
                <h3 className="font-bold text-surface-900">Passive (Index) Funds</h3>
              </div>
              <p className="text-sm text-surface-600 mb-4">A computer simply buys the top 50 companies (Nifty 50) in exact proportions. Nobody is guessing.</p>
              <ul className="text-xs space-y-2 text-surface-500">
                <li>• Very low expense ratio (0.1-0.3%)</li>
                <li>• Guarantees market returns</li>
                <li>• No human bias or manager risk</li>
                <li>• Example: Nifty 50 Index Fund</li>
              </ul>
            </div>
          </div>
          <p className="mt-4 text-surface-600 text-sm font-medium p-4 bg-surface-50 rounded-xl">
            <strong>Pro Tip:</strong> For most beginners, a simple Nifty 50 Index Fund is the absolute best starting point. Over 10+ years, 80% of Active fund managers fail to beat the Index!
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-surface-900 mb-4">Understanding Market Capitalization</h2>
          <p className="text-surface-600 leading-relaxed mb-6">
            If you choose Active funds, you must understand Market Caps. Companies are ranked 1 to 1000+ based on their total market value.
          </p>
          
          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-6 rounded-2xl bg-white border border-surface-100 shadow-sm hover:border-emerald-200 hover:shadow-md transition-all">
              <h3 className="font-bold text-surface-900 mb-2 flex items-center justify-between">
                Large Cap Funds <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-lg font-black tracking-wide">LOW VOLATILITY</span>
              </h3>
              <p className="text-sm text-surface-600 leading-relaxed mb-2">Invest in top 100 established companies (TCS, HDFC, RIL).</p>
              <p className="text-xs text-surface-400">They won't double overnight, but they won't go bankrupt easily either. Stable 10-12% growers.</p>
            </div>
            <div className="p-6 rounded-2xl bg-white border border-surface-100 shadow-sm hover:border-emerald-200 hover:shadow-md transition-all">
              <h3 className="font-bold text-surface-900 mb-2 flex items-center justify-between">
                Mid Cap Funds <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded-lg font-black tracking-wide">MED VOLATILITY</span>
              </h3>
              <p className="text-sm text-surface-600 leading-relaxed mb-2">Invest in 101st-250th companies.</p>
              <p className="text-xs text-surface-400">Tomorrow's giants. Higher risk, higher growth potential (14-16%). Need a 7+ year horizon.</p>
            </div>
            <div className="p-6 rounded-2xl bg-white border border-surface-100 shadow-sm hover:border-emerald-200 hover:shadow-md transition-all">
              <h3 className="font-bold text-surface-900 mb-2 flex items-center justify-between">
                Small Cap Funds <span className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded-lg font-black tracking-wide">HIGH VOLATILITY</span>
              </h3>
              <p className="text-sm text-surface-600 leading-relaxed mb-2">Invest in 251st and below companies.</p>
              <p className="text-xs text-surface-400">Can deliver 20%+ returns or crash by 50%. Strictly for aggressive investors with a 10+ year view.</p>
            </div>
            <div className="p-6 rounded-2xl bg-white border border-surface-100 shadow-sm hover:border-emerald-200 hover:shadow-md transition-all">
              <h3 className="font-bold text-surface-900 mb-2 flex items-center justify-between">
                Flexi Cap Funds <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-lg font-black tracking-wide">ALL WEATHER</span>
              </h3>
              <p className="text-sm text-surface-600 leading-relaxed mb-2">Manager dynamically shifts between Large, Mid, and Small.</p>
              <p className="text-xs text-surface-400">The "fill it, shut it, forget it" active fund. The manager takes the stress of market cap balancing.</p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-surface-900 mb-4">Direct vs Regular Plans (Don't lose lakhs!)</h2>
          <p className="text-surface-600 leading-relaxed mb-4">
            Every mutual fund has two variations: <strong>Regular</strong> and <strong>Direct</strong>. 
          </p>
          <ul className="list-disc list-inside space-y-2 text-surface-600 mb-4">
            <li><strong>Regular Plans:</strong> Sold by banks and brokers. They charge you a hidden commission of 1-1.5% every year, forever.</li>
            <li><strong>Direct Plans:</strong> Bought directly from the AMC or via platforms like FinovaWealth. NO commissions.</li>
          </ul>
          <p className="text-surface-600 font-medium">Over 20 years, a 1% commission difference can eat away 25-30% of your total wealth. Always choose DIRECT plans.</p>
        </section>

        <section>
          <div className="bg-emerald-50 rounded-3xl p-8 border border-emerald-100">
            <h3 className="flex items-center gap-3 text-xl font-bold text-emerald-900 mb-6">
              <CheckCircle2 className="w-6 h-6 text-emerald-600" /> Starter Portfolios
            </h3>
            
            <div className="space-y-6">
              <div>
                <h4 className="font-bold text-surface-900 mb-3">The "Keep It Simple" Portfolio (Moderate Risk)</h4>
                <div className="flex items-center justify-between p-3 bg-white rounded-xl shadow-sm border border-emerald-50/50 text-sm">
                  <span className="font-semibold text-surface-700">Nifty 50 Index Fund (Direct Growth)</span>
                  <span className="font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg">100%</span>
                </div>
                <p className="text-xs text-surface-500 mt-2 ml-2">Perfect for absolute beginners. Requires zero tracking.</p>
              </div>

              <div>
                <h4 className="font-bold text-surface-900 mb-3">The Core & Satellite Portfolio (Aggressive Risk)</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 bg-white rounded-xl shadow-sm border border-emerald-50/50 text-sm">
                    <span className="font-semibold text-surface-700">Flexi Cap Fund (Core Stability)</span>
                    <span className="font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg">60%</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white rounded-xl shadow-sm border border-emerald-50/50 text-sm">
                    <span className="font-semibold text-surface-700">Mid Cap Fund (Growth Booster)</span>
                    <span className="font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg">40%</span>
                  </div>
                </div>
                <p className="text-xs text-surface-500 mt-2 ml-2">Great for 20s/30s investors looking for wealth acceleration over 10+ years.</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    )
  },
  {
    id: 'financial-roadmap',
    title: 'Financial Roadmap',
    duration: '15 min read',
    description: 'The ultimate step-by-step masterplan from your first salary to comfortable retirement.',
    icon: Map,
    color: 'text-indigo-600',
    bg: 'bg-indigo-50',
    content: (
      <div className="space-y-12">
        <section>
          <p className="text-surface-600 leading-relaxed text-lg">
            Personal finance is exactly that: personal. However, there is a proven sequence of operations that guarantees financial security. Think of this as building a house. You cannot build the roof (investments) without a solid foundation (protection). Follow these phases in exact order.
          </p>
        </section>

        <section>
          <div className="relative border-l-4 border-indigo-200 pl-6 space-y-12 py-4">
            
            {/* Phase 1 */}
            <div className="relative">
              <div className="absolute -left-[43px] w-10 h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center font-black text-lg shadow-lg border-4 border-white">1</div>
              <h2 className="text-2xl font-bold text-surface-900 mb-3">Phase 1: The Fortress (Protection)</h2>
              <p className="text-surface-600 leading-relaxed mb-5">
                Do not invest a single rupee in mutual funds or stocks until you have completed these three steps. This is your shield against life's curveballs.
              </p>
              
              <div className="space-y-4">
                <div className="p-5 bg-white border border-surface-200 rounded-2xl shadow-sm">
                  <h4 className="font-bold text-surface-900 mb-2 flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-indigo-500"/> Health Insurance</h4>
                  <p className="text-sm text-surface-600 mb-2">Buy a base personal health policy of ₹5L to ₹10L. <strong>Do not rely solely on corporate insurance.</strong> If you lose your job and get sick simultaneously, you will go bankrupt.</p>
                  <p className="text-xs text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-lg inline-block font-medium">Action: Buy before age 30 to lock in cheap premiums and bypass waiting periods.</p>
                </div>
                
                <div className="p-5 bg-white border border-surface-200 rounded-2xl shadow-sm">
                  <h4 className="font-bold text-surface-900 mb-2 flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-indigo-500"/> Term Life Insurance</h4>
                  <p className="text-sm text-surface-600 mb-2">If you have financial dependents (aging parents, spouse, kids), buy a pure term insurance policy covering 15x-20x your annual income. Strictly avoid Endowment, ULIPs, or money-back policies.</p>
                  <p className="text-xs text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-lg inline-block font-medium">Action: Cover yourself till age 60 only. You don't need insurance after retirement.</p>
                </div>

                <div className="p-5 bg-white border border-surface-200 rounded-2xl shadow-sm">
                  <h4 className="font-bold text-surface-900 mb-2 flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-indigo-500"/> Emergency Fund</h4>
                  <p className="text-sm text-surface-600 mb-2">Calculate your absolute bare minimum monthly expenses (Rent + Groceries + EMIs + Utilities). Multiply by 6. Park this exact amount in an FD or Liquid Mutual Fund.</p>
                  <p className="text-xs text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-lg inline-block font-medium">Action: Keep it highly liquid. Never touch it for vacations or gadgets.</p>
                </div>
              </div>
            </div>

            {/* Phase 2 */}
            <div className="relative">
              <div className="absolute -left-[43px] w-10 h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center font-black text-lg shadow-lg border-4 border-white">2</div>
              <h2 className="text-2xl font-bold text-surface-900 mb-3">Phase 2: Wealth Accumulation (20s & 30s)</h2>
              <p className="text-surface-600 leading-relaxed mb-5">
                With your fortress built, every extra rupee can now be aggressively deployed to generate wealth. Time is on your side.
              </p>
              
              <ul className="list-none space-y-4">
                <li className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-surface-100 flex items-center justify-center font-bold text-surface-600 shrink-0">A</div>
                  <div>
                    <h4 className="font-bold text-surface-900">Kill High-Interest Debt</h4>
                    <p className="text-sm text-surface-600">Pay off credit card debt or personal loans (anything &gt; 12% interest). There is no investment that gives a guaranteed, risk-free 36% return like paying off credit card debt does.</p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-surface-100 flex items-center justify-center font-bold text-surface-600 shrink-0">B</div>
                  <div>
                    <h4 className="font-bold text-surface-900">Automate your SIPs</h4>
                    <p className="text-sm text-surface-600">Set your SIP deduction date for the 2nd of the month, right after salary hits. "Pay yourself first." Start with a 70% Equity / 30% Debt split. Increase your SIP amount by 10% every year when you get an appraisal (Step-up SIP).</p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-surface-100 flex items-center justify-center font-bold text-surface-600 shrink-0">C</div>
                  <div>
                    <h4 className="font-bold text-surface-900">Tax Optimization</h4>
                    <p className="text-sm text-surface-600">Max out Section 80C (₹1.5L) using ELSS mutual funds. They have the shortest lock-in (3 years) and historically the highest returns. If applicable, use NPS for an extra ₹50,000 deduction under 80CCD(1B).</p>
                  </div>
                </li>
              </ul>
            </div>

            {/* Phase 3 */}
            <div className="relative">
              <div className="absolute -left-[43px] w-10 h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center font-black text-lg shadow-lg border-4 border-white">3</div>
              <h2 className="text-2xl font-bold text-surface-900 mb-3">Phase 3: Milestones & Preservation (40s+)</h2>
              <p className="text-surface-600 leading-relaxed mb-5">
                As you approach major life goals, you must protect your accumulated wealth from market crashes.
              </p>
              
              <div className="bg-surface-50 p-6 rounded-2xl border border-surface-200">
                <h4 className="font-bold text-surface-900 mb-2">The Glide Path Strategy</h4>
                <p className="text-sm text-surface-600 mb-4">
                  If your child needs college fees in 3 years, you cannot leave that money in Small Cap funds. A market crash could wipe out half the college fund. 
                </p>
                <p className="text-sm text-surface-600">
                  <strong>Action:</strong> 3 years before any major goal (buying a house, college, retirement), start moving the required amount from Equity funds into safe Debt funds or FDs. You secure the profits and guarantee the capital is available when needed.
                </p>
              </div>
            </div>

          </div>
        </section>
        
        <section>
          <div className="bg-indigo-900 text-white rounded-3xl p-8 shadow-xl">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><Zap className="text-yellow-400"/> The Ultimate Golden Rule</h3>
            <p className="text-indigo-100 leading-relaxed text-lg italic">
              "Personal finance is 20% knowledge and 80% behavior. The best portfolio isn't the mathematically perfect one; it's the one you can stick with when the stock market is crashing."
            </p>
          </div>
        </section>
      </div>
    )
  }
];

export default function BeginnerGuides() {
  usePageTracking('beginner-guides');
  const [activeGuide, setActiveGuide] = useState(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  // Handle scroll progress in reading mode
  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    const progress = (scrollTop / (scrollHeight - clientHeight)) * 100;
    setScrollProgress(progress);
  };

  // Lock body scroll when modal is open
  useEffect(() => {
    if (activeGuide) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [activeGuide]);

  return (
    <div className="space-y-12 pb-24">
      <div className="max-w-3xl">
        <h1 className="text-4xl font-black text-surface-900 tracking-tight">
          Beginner Guides
        </h1>
        <p className="text-lg text-surface-600 mt-4 leading-relaxed">
          New to investing? Don't worry, we've got you covered. Our curated guides break down complex financial concepts into simple, actionable steps.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {guides.map((guide, idx) => (
          <motion.div
            key={guide.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.1 }}
            className="group bg-white rounded-[2.5rem] p-8 border border-surface-100 shadow-sm hover:shadow-xl hover:shadow-primary-900/5 transition-all cursor-pointer flex flex-col"
            onClick={() => {
              setActiveGuide(guide);
              setScrollProgress(0);
            }}
          >
            <div className={`w-14 h-14 rounded-2xl ${guide.bg} ${guide.color} flex items-center justify-center mb-6`}>
              <guide.icon className="w-8 h-8" />
            </div>
            
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[10px] font-black px-2 py-0.5 bg-surface-100 text-surface-500 rounded-full uppercase tracking-wider">
                {guide.duration}
              </span>
            </div>

            <h3 className="text-2xl font-bold text-surface-900 mb-3">{guide.title}</h3>
            <p className="text-surface-500 mb-8 leading-relaxed flex-1">{guide.description}</p>
            
            <button className="flex items-center gap-3 text-sm font-black text-primary-600 group-hover:gap-4 transition-all mt-auto">
              START READING <ArrowRight className="w-5 h-5" />
            </button>
          </motion.div>
        ))}
      </div>

      {/* Reading Mode Overlay */}
      <AnimatePresence>
        {activeGuide && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.98 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[100] bg-surface-50 flex flex-col"
          >
            {/* Header */}
            <div className="h-[72px] border-b border-surface-200 flex items-center justify-between px-4 lg:px-8 shrink-0 bg-white shadow-sm z-10">
              <button 
                onClick={() => setActiveGuide(null)}
                className="flex items-center gap-2 text-surface-600 hover:text-surface-900 font-bold transition-colors bg-surface-100 hover:bg-surface-200 px-4 py-2 rounded-xl"
              >
                <ChevronLeft className="w-5 h-5" /> Back to Beginner Guides
              </button>
              
              <div className="flex items-center gap-4">
                <button className="p-2.5 text-surface-500 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all">
                  <Share2 className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => setActiveGuide(null)}
                  className="p-2.5 text-surface-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="h-1 bg-surface-200 shrink-0 relative z-10">
              <div 
                className="h-full bg-primary-600 transition-all duration-150 ease-out"
                style={{ width: `${scrollProgress}%` }}
              />
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto bg-surface-50" onScroll={handleScroll}>
              <div className="max-w-3xl mx-auto px-6 py-12 lg:py-20">
                <div className="bg-white rounded-[3rem] p-8 md:p-12 shadow-sm border border-surface-100">
                  <div className="flex flex-col md:flex-row md:items-center gap-6 mb-12">
                    <div className={`w-20 h-20 rounded-3xl ${activeGuide.bg} ${activeGuide.color} flex items-center justify-center shrink-0 shadow-sm border border-surface-50`}>
                      <activeGuide.icon className="w-10 h-10" />
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-sm font-bold text-primary-600 bg-primary-50 px-3 py-1 rounded-full uppercase tracking-wide">
                          {activeGuide.duration}
                        </span>
                        <span className="text-surface-400 text-sm font-bold uppercase tracking-wider">FinovaWealth Guide</span>
                      </div>
                      <h1 className="text-4xl lg:text-5xl font-black text-surface-900 leading-tight">
                        {activeGuide.title}
                      </h1>
                    </div>
                  </div>

                  <div className="prose-container">
                    {activeGuide.content}
                  </div>

                  <div className="mt-16 pt-8 border-t border-surface-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-surface-600 font-bold text-lg">Was this guide helpful?</p>
                    <div className="flex gap-3">
                      <button className="bg-surface-100 hover:bg-emerald-100 hover:text-emerald-700 font-bold py-3 px-6 rounded-xl transition-colors">Yes, thanks!</button>
                      <button className="bg-surface-100 hover:bg-surface-200 font-bold py-3 px-6 rounded-xl transition-colors">Not really</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
