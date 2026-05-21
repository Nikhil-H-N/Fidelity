import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Calendar,
  CheckCircle2,
  FileText,
  ShieldCheck,
  User,
  Wallet,
} from 'lucide-react';
import { useFormTracking, usePageTracking } from '../hooks/useTracking';
import { queueEvent } from '../api/eventService';
import { calculateFormCompletion, getFilledFields, validateEmail, validatePAN, validatePhone } from '../utils/tracker';
import { formatCurrency } from '../utils/formatters';

const requiredFields = ['fullName', 'email', 'phone', 'pan', 'amount', 'incomeRange', 'riskProfile', 'nominee'];

const productCopy = {
  'term-life': {
    title: 'Term Life Insurance',
    category: 'Insurance',
    minimum: 500,
    summary: 'Secure a high-cover protection plan with digital onboarding.',
  },
  'elss-tax-saver': {
    title: 'ELSS Tax Saver Fund',
    category: 'Tax Saving',
    minimum: 500,
    summary: 'Start a tax-efficient equity investment under Section 80C.',
  },
  default: {
    title: 'FinovaWealth Plan',
    category: 'Investment',
    minimum: 5000,
    summary: 'Complete your application and let the engine personalize the next step.',
  },
};

const initialForm = {
  fullName: '',
  email: '',
  phone: '',
  pan: '',
  amount: '',
  incomeRange: '',
  riskProfile: '',
  nominee: '',
  communication: 'email',
};

export default function ApplicationForm() {
  const { productId = 'default' } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const completed = useRef(false);
  const startedAt = useRef(Date.now());
  const formRef = useRef(initialForm);
  const completionRef = useRef(0);
  const { trackFormStart, trackFormComplete, trackFormValidationError } = useFormTracking('checkout_application');
  const product = productCopy[productId] || productCopy.default;

  usePageTracking(`checkout-${productId}`);

  const completion = useMemo(() => calculateFormCompletion(form, requiredFields), [form]);

  useEffect(() => {
    formRef.current = form;
    completionRef.current = completion;
  }, [form, completion]);

  useEffect(() => {
    queueEvent({
      eventType: 'form_progress',
      page: '/checkout',
      formType: 'checkout_application',
      metadata: {
        productId,
        progress: completion,
        filledFields: getFilledFields(form),
      },
    });
  }, [completion]);

  useEffect(() => {
    startedAt.current = Date.now();
    trackFormStart();
    queueEvent({
      eventType: 'checkout_start',
      page: '/checkout',
      formType: 'checkout_application',
      metadata: {
        productId,
        productName: product.title,
        completion,
      },
    });

    return () => {
      if (!completed.current && completionRef.current > 0) {
        queueEvent({
          eventType: 'checkout_abandon',
          page: '/checkout',
          formType: 'checkout_application',
          duration: Math.round((Date.now() - startedAt.current) / 1000),
          metadata: {
            productId,
            productName: product.title,
            completion: completionRef.current,
            filledFields: getFilledFields(formRef.current),
          },
        });
      }
    };
  }, []);

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    queueEvent({
      eventType: 'field_change',
      page: '/checkout',
      formType: 'checkout_application',
      fieldName: field,
      metadata: { field, productId },
    });
  };

  const validate = () => {
    const nextErrors = {};
    if (!form.fullName.trim()) nextErrors.fullName = 'Full name is required';
    if (!validateEmail(form.email)) nextErrors.email = 'Enter a valid email';
    if (!validatePhone(form.phone)) nextErrors.phone = 'Enter a valid phone number';
    if (!validatePAN(form.pan)) nextErrors.pan = 'Enter a valid PAN';
    if (Number(form.amount) < product.minimum) nextErrors.amount = `Minimum amount is ${formatCurrency(product.minimum)}`;
    if (!form.incomeRange) nextErrors.incomeRange = 'Select income range';
    if (!form.riskProfile) nextErrors.riskProfile = 'Select risk profile';
    if (!form.nominee.trim()) nextErrors.nominee = 'Nominee name is required';

    Object.entries(nextErrors).forEach(([field, message]) => {
      trackFormValidationError(field, message);
    });

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!validate()) return;

    completed.current = true;
    trackFormComplete();
    queueEvent({
      eventType: 'checkout_complete',
      page: '/checkout',
      formType: 'checkout_application',
      duration: Math.round((Date.now() - startedAt.current) / 1000),
      metadata: {
        productId,
        productName: product.title,
        amount: Number(form.amount),
        communication: form.communication,
        completion: 100,
      },
    });

    navigate('/confirmation', {
      state: {
        product: product.title,
        amount: Number(form.amount),
        applicationData: form
      },
    });
  };

  const FieldError = ({ name }) => (
    errors[name] ? <p className="text-xs font-semibold text-red-600 mt-1">{errors[name]}</p> : null
  );

  return (
    <div className="space-y-8 pb-24">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 text-sm font-bold text-surface-500 hover:text-primary-600 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div className="max-w-3xl mx-auto">
        <div className="space-y-6">
          <div>
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-50 text-primary-600 text-xs font-black uppercase tracking-widest">
              <FileText className="w-3.5 h-3.5" /> Application
            </span>
            <h1 className="text-3xl sm:text-4xl font-black text-surface-900 tracking-tight mt-4">{product.title}</h1>
            <p className="text-lg text-surface-600 mt-3">{product.summary}</p>
          </div>

          <form onSubmit={handleSubmit} className="bg-white border border-surface-100 rounded-2xl shadow-sm p-6 sm:p-8 space-y-8">
            <section className="space-y-4">
              <div className="flex items-center gap-2 text-surface-900 font-bold">
                <User className="w-5 h-5 text-primary-600" /> Applicant Details
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-xs font-bold text-surface-500 uppercase tracking-wider">Full Name</span>
                  <input className="input-field mt-2" value={form.fullName} onChange={(e) => updateField('fullName', e.target.value)} />
                  <FieldError name="fullName" />
                </label>
                <label className="block">
                  <span className="text-xs font-bold text-surface-500 uppercase tracking-wider">Email</span>
                  <input className="input-field mt-2" value={form.email} onChange={(e) => updateField('email', e.target.value)} />
                  <FieldError name="email" />
                </label>
                <label className="block">
                  <span className="text-xs font-bold text-surface-500 uppercase tracking-wider">Phone</span>
                  <input className="input-field mt-2" value={form.phone} onChange={(e) => updateField('phone', e.target.value)} />
                  <FieldError name="phone" />
                </label>
                <label className="block">
                  <span className="text-xs font-bold text-surface-500 uppercase tracking-wider">PAN</span>
                  <input className="input-field mt-2 uppercase" value={form.pan} onChange={(e) => updateField('pan', e.target.value.toUpperCase())} />
                  <FieldError name="pan" />
                </label>
              </div>
            </section>

            <section className="space-y-4">
              <div className="flex items-center gap-2 text-surface-900 font-bold">
                <Wallet className="w-5 h-5 text-primary-600" /> Suitability
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-xs font-bold text-surface-500 uppercase tracking-wider">Investment Amount</span>
                  <input
                    type="number"
                    min={product.minimum}
                    className="input-field mt-2"
                    value={form.amount}
                    onChange={(e) => updateField('amount', e.target.value === '' ? '' : Number(e.target.value))}
                  />
                  <FieldError name="amount" />
                </label>
                <label className="block">
                  <span className="text-xs font-bold text-surface-500 uppercase tracking-wider">Income Range</span>
                  <select className="input-field mt-2" value={form.incomeRange} onChange={(e) => updateField('incomeRange', e.target.value)}>
                    <option value="">Select range</option>
                    <option value="under-5l">Under 5L</option>
                    <option value="5l-15l">5L - 15L</option>
                    <option value="15l-50l">15L - 50L</option>
                    <option value="50l-plus">50L+</option>
                  </select>
                  <FieldError name="incomeRange" />
                </label>
                <label className="block">
                  <span className="text-xs font-bold text-surface-500 uppercase tracking-wider">Risk Profile</span>
                  <select className="input-field mt-2" value={form.riskProfile} onChange={(e) => updateField('riskProfile', e.target.value)}>
                    <option value="">Select profile</option>
                    <option value="conservative">Conservative</option>
                    <option value="moderate">Moderate</option>
                    <option value="aggressive">Aggressive</option>
                  </select>
                  <FieldError name="riskProfile" />
                </label>
                <label className="block">
                  <span className="text-xs font-bold text-surface-500 uppercase tracking-wider">Nominee</span>
                  <input className="input-field mt-2" value={form.nominee} onChange={(e) => updateField('nominee', e.target.value)} />
                  <FieldError name="nominee" />
                </label>
              </div>
            </section>

            <section className="space-y-4">
              <div className="flex items-center gap-2 text-surface-900 font-bold">
                <Calendar className="w-5 h-5 text-primary-600" /> Re-engagement Preference
              </div>
              <div className="grid sm:grid-cols-3 gap-3">
                {['email', 'sms', 'in_app'].map((channel) => (
                  <button
                    type="button"
                    key={channel}
                    onClick={() => updateField('communication', channel)}
                    className={`py-3 px-4 rounded-xl border text-sm font-bold transition-colors ${form.communication === channel ? 'bg-primary-600 border-primary-600 text-white' : 'bg-white border-surface-200 text-surface-600 hover:border-primary-200'}`}
                  >
                    {channel.replace('_', ' ').toUpperCase()}
                  </button>
                ))}
              </div>
            </section>

            <button className="w-full btn-primary py-4 gap-2">
              Submit Application <ArrowRight className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
