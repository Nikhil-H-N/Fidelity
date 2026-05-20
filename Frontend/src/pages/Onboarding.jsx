import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, ArrowLeft, User, Target, Shield, TrendingUp, Check } from 'lucide-react';
import { usePageTracking } from '../hooks/useTracking';

const steps = ['Personal Info', 'Investment Profile', 'Goals', 'KYC'];

export default function Onboarding() {
  usePageTracking('onboarding');
  const [step, setStep] = useState(0);

  return (
    <div className="min-h-screen bg-surface-50 flex items-center justify-center p-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center mx-auto mb-4">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-surface-900">Let's set up your account</h1>
          <p className="text-surface-500 mt-1">Step {step + 1} of {steps.length}</p>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                i < step ? 'bg-accent-500 text-white' : i === step ? 'bg-primary-600 text-white' : 'bg-surface-200 text-surface-500'
              }`}>{i < step ? <Check className="w-4 h-4" /> : i + 1}</div>
              {i < steps.length - 1 && <div className={`w-8 h-0.5 ${i < step ? 'bg-accent-500' : 'bg-surface-200'}`} />}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-card p-8 border border-surface-100">
          {step === 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-surface-900">Personal Information</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-surface-700 mb-1.5">Date of Birth</label><input type="date" className="input-field" /></div>
                <div><label className="block text-sm font-medium text-surface-700 mb-1.5">PAN Number</label><input type="text" className="input-field" placeholder="ABCDE1234F" /></div>
                <div className="sm:col-span-2"><label className="block text-sm font-medium text-surface-700 mb-1.5">Address</label><input type="text" className="input-field" placeholder="Your address" /></div>
                <div><label className="block text-sm font-medium text-surface-700 mb-1.5">City</label><input type="text" className="input-field" placeholder="City" /></div>
                <div><label className="block text-sm font-medium text-surface-700 mb-1.5">PIN Code</label><input type="text" className="input-field" placeholder="400001" /></div>
              </div>
            </div>
          )}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-surface-900">Investment Profile</h2>
              <div><label className="block text-sm font-medium text-surface-700 mb-1.5">Annual Income</label>
                <select className="input-field"><option>Below ₹5 Lakhs</option><option>₹5-10 Lakhs</option><option>₹10-25 Lakhs</option><option>₹25-50 Lakhs</option><option>Above ₹50 Lakhs</option></select></div>
              <div><label className="block text-sm font-medium text-surface-700 mb-1.5">Risk Appetite</label>
                <div className="grid grid-cols-3 gap-3">{['Conservative', 'Moderate', 'Aggressive'].map(r => (
                  <button key={r} className="p-3 rounded-xl border border-surface-200 text-sm font-medium hover:border-primary-500 hover:bg-primary-50 transition-colors">{r}</button>
                ))}</div></div>
              <div><label className="block text-sm font-medium text-surface-700 mb-1.5">Investment Experience</label>
                <select className="input-field"><option>Beginner</option><option>1-3 years</option><option>3-5 years</option><option>5+ years</option></select></div>
            </div>
          )}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-surface-900">Your Goals</h2>
              <p className="text-sm text-surface-500">Select the goals you want to plan for</p>
              <div className="grid sm:grid-cols-2 gap-3">
                {['Retirement', 'Buy a Home', 'Child Education', 'Emergency Fund', 'Wealth Creation', 'Tax Saving'].map(g => (
                  <button key={g} className="p-4 rounded-xl border border-surface-200 text-left hover:border-primary-500 hover:bg-primary-50 transition-colors">
                    <p className="font-medium text-surface-900">{g}</p>
                  </button>
                ))}
              </div>
            </div>
          )}
          {step === 3 && (
            <div className="space-y-4 text-center">
              <div className="w-16 h-16 rounded-full bg-accent-50 flex items-center justify-center mx-auto"><Shield className="w-8 h-8 text-accent-600" /></div>
              <h2 className="text-lg font-semibold text-surface-900">KYC Verification</h2>
              <p className="text-sm text-surface-500">Upload your Aadhaar and PAN for instant verification</p>
              <div className="grid sm:grid-cols-2 gap-4 mt-4">
                <div className="p-6 border-2 border-dashed border-surface-300 rounded-xl text-center cursor-pointer hover:border-primary-500 transition-colors">
                  <p className="text-sm font-medium text-surface-700">Upload Aadhaar</p><p className="text-xs text-surface-400 mt-1">JPG, PNG or PDF</p>
                </div>
                <div className="p-6 border-2 border-dashed border-surface-300 rounded-xl text-center cursor-pointer hover:border-primary-500 transition-colors">
                  <p className="text-sm font-medium text-surface-700">Upload PAN</p><p className="text-xs text-surface-400 mt-1">JPG, PNG or PDF</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-between mt-8">
            <button onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0}
              className="btn-secondary py-2.5 px-5 gap-2 disabled:opacity-30"><ArrowLeft className="w-4 h-4" /> Back</button>
            {step < 3 ? (
              <button onClick={() => setStep(step + 1)} className="btn-primary py-2.5 px-5 gap-2">Next <ArrowRight className="w-4 h-4" /></button>
            ) : (
              <Link to="/dashboard" className="btn-primary py-2.5 px-5 gap-2">Complete Setup <Check className="w-4 h-4" /></Link>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
