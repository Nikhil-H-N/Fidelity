import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { useMemo } from 'react';
import { 
  CheckCircle2, ArrowRight, Download, 
  Share2, Calendar, FileText, 
  TrendingUp, ShieldCheck
} from 'lucide-react';
import { usePageTracking } from '../hooks/useTracking';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function Confirmation() {
  usePageTracking('confirmation');
  const navigate = useNavigate();
  const location = useLocation();
  const applicationNumber = useMemo(() => `FW-${Math.random().toString(36).substr(2, 9).toUpperCase()}`, []);
  
  const { product = 'Investment Plan', amount = 0, applicationData = {} } = location.state || {};

  const handleExportPDF = () => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(22);
    doc.setTextColor(30, 41, 59);
    doc.text('FinovaWealth', 14, 20);
    
    doc.setFontSize(14);
    doc.setTextColor(59, 130, 246);
    doc.text('Application Receipt', 14, 28);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`Generated on ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`, 14, 34);
    
    // Details
    doc.setDrawColor(226, 232, 240);
    doc.line(14, 40, 196, 40);

    const details = [
      ['Application ID', applicationNumber],
      ['Applicant Name', applicationData.fullName || 'N/A'],
      ['Email Address', applicationData.email || 'N/A'],
      ['Phone Number', applicationData.phone || 'N/A'],
      ['PAN Number', applicationData.pan || 'N/A'],
      ['Selected Product', product],
      ['Investment Amount', `Rs. ${new Intl.NumberFormat('en-IN').format(amount)}`],
      ['Risk Profile', applicationData.riskProfile || 'N/A'],
      ['Nominee Name', applicationData.nominee || 'N/A'],
      ['Status', 'Processing'],
    ];

    autoTable(doc, {
      startY: 45,
      body: details,
      theme: 'grid',
      styles: { fontSize: 10, cellPadding: 6 },
      columnStyles: {
        0: { fontStyle: 'bold', fillColor: [248, 250, 252], textColor: [71, 85, 105], cellWidth: 70 },
        1: { textColor: [15, 23, 42] }
      }
    });

    // Next Steps
    const finalY = doc.lastAutoTable.finalY || 150;
    doc.setFontSize(12);
    doc.setTextColor(30, 41, 59);
    doc.text('Next Steps:', 14, finalY + 15);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text('1. Our team will verify your documents within 24 hours.', 14, finalY + 23);
    doc.text('2. Units will be allocated to your portfolio at the current NAV.', 14, finalY + 29);
    doc.text('3. You can track your investment growth live on your Dashboard.', 14, finalY + 35);
    
    // Footer
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text('SECURE TRANSACTION BY FINOVAWEALTH', doc.internal.pageSize.getWidth() / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
    
    doc.save(`FinovaWealth_Application_${applicationNumber}.pdf`);
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center py-12">
      <div className="max-w-2xl w-full text-center space-y-10">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', damping: 12, stiffness: 200 }}
          className="w-24 h-24 bg-emerald-500 rounded-[2rem] mx-auto flex items-center justify-center text-white shadow-2xl shadow-emerald-500/20"
        >
          <CheckCircle2 className="w-12 h-12" />
        </motion.div>

        <div className="space-y-4">
          <h1 className="text-4xl font-black text-surface-900 tracking-tight">
            Application Received!
          </h1>
          <p className="text-lg text-surface-600 leading-relaxed">
            Your investment application has been successfully submitted and is being processed by our partner AMC.
          </p>
        </div>

        <div className="bg-white rounded-[2.5rem] border border-surface-100 shadow-xl p-10 space-y-8">
          <div className="grid grid-cols-2 gap-8 text-left">
            <div>
              <p className="text-[10px] font-black text-surface-400 uppercase tracking-widest mb-1">Application ID</p>
              <p className="font-mono font-bold text-surface-900">{applicationNumber}</p>
            </div>
            <div>
              <p className="text-[10px] font-black text-surface-400 uppercase tracking-widest mb-1">Status</p>
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Processing
              </span>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-left text-sm font-black text-surface-500 uppercase tracking-widest flex items-center gap-2">
              <Calendar className="w-4 h-4" /> Next Steps
            </h4>
            <div className="space-y-4">
              {[
                { title: 'Verification', desc: 'Our team will verify your documents within 24 hours.' },
                { title: 'Fund Allocation', desc: 'Units will be allocated to your portfolio at the current NAV.' },
                { title: 'Portfolio Update', desc: 'Track your growth live on the Dashboard.' }
              ].map((step, idx) => (
                <div key={step.title} className="flex gap-4 text-left">
                  <div className="w-6 h-6 rounded-full bg-surface-50 text-surface-400 flex items-center justify-center text-xs font-black shrink-0">
                    {idx + 1}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-surface-900">{step.title}</p>
                    <p className="text-xs text-surface-500">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-4 pt-4">
            <button onClick={handleExportPDF} className="flex-1 py-4 bg-surface-900 hover:bg-primary-600 text-white font-black rounded-2xl transition-all flex items-center justify-center gap-2">
              <Download className="w-4 h-4" /> Application PDF
            </button>
            <button className="flex-1 py-4 bg-surface-50 hover:bg-surface-100 text-surface-900 font-black rounded-2xl transition-all flex items-center justify-center gap-2">
              <Share2 className="w-4 h-4" /> Share Progress
            </button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-center gap-8">
          <button 
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-primary-600 font-black text-sm group"
          >
            GO TO DASHBOARD <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
          <div className="w-px h-4 bg-surface-200 hidden md:block" />
          <p className="text-xs font-bold text-surface-400 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" /> SECURE TRANSACTION BY FINOVAWEALTH
          </p>
        </div>
      </div>
    </div>
  );
}
