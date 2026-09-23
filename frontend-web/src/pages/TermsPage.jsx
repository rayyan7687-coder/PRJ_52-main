import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, FileText, CheckCircle } from 'lucide-react';

export const TermsPage = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 text-slate-200 space-y-8">
      <Link to="/register" className="inline-flex items-center space-x-2 text-emerald-400 hover:text-emerald-300 font-semibold text-sm">
        <ArrowLeft className="h-4 w-4" />
        <span>Back to Registration</span>
      </Link>

      <div className="border-b border-slate-800 pb-6 space-y-3">
        <div className="inline-flex items-center space-x-2 bg-emerald-950 border border-emerald-800 text-emerald-400 px-3 py-1 rounded-full text-xs font-bold uppercase">
          <FileText className="h-4 w-4" />
          <span>Legal Agreement</span>
        </div>
        <h1 className="text-3xl font-black text-white">Terms & Conditions</h1>
        <p className="text-slate-400 text-sm">Last updated: {new Date().toLocaleDateString()}</p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 sm:p-8 space-y-6 shadow-2xl">
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-emerald-400" />
            <span>1. Platform Usage & Account Responsibilities</span>
          </h2>
          <p className="text-slate-300 leading-relaxed text-sm">
            BuildLoop is a circularity marketplace connecting demolition sites, contractors, builders, and recyclers for construction material recovery. All registered users are responsible for maintaining the security of their accounts and providing true, verified business and personal details.
          </p>
        </section>

        <section className="bg-red-950/40 border border-red-900/60 rounded-lg p-5 space-y-3">
          <h2 className="text-lg font-extrabold text-red-200 flex items-center space-x-2">
            <ShieldAlert className="h-5 w-5 text-red-400 shrink-0" />
            <span>2. Strict Anti-Fraud Policy & Illegal Activity Prohibition</span>
          </h2>
          <p className="text-red-100 text-sm leading-relaxed">
            Users must ensure all material descriptions, quantities, material grades, photographs, and pricing are accurate and non-misleading.
          </p>
          <div className="bg-red-950/80 p-4 rounded border border-red-800/80 text-xs text-red-200 font-medium space-y-1">
            <strong className="text-red-100 uppercase tracking-wide block">Mandatory Enforcement Notice:</strong>
            Detection of fraudulent activity, fake material descriptions, unauthorized representation of demolition sites, counterfeit listings, or illegal waste dumping will result in an <strong>immediate, permanent account ban</strong> and account block. Suspected violations will be reported to law enforcement authorities in accordance with standard statutory environmental and consumer protection laws.
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-emerald-400" />
            <span>3. Material Quality & Demolition Site Pickups</span>
          </h2>
          <p className="text-slate-300 leading-relaxed text-sm">
            Contractors and recyclers picking up materials are required to inspect materials at the site prior to loading. Sellers must ensure site pickup locations provided are accessible and safe for transport vehicles.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-emerald-400" />
            <span>4. Privacy & Moderation</span>
          </h2>
          <p className="text-slate-300 leading-relaxed text-sm">
            BuildLoop administrators monitor reports and listings to preserve platform security. Blocked users can contact the administration team at <span className="text-emerald-400 font-mono">admin@buildloop.com</span> for review or inquiries.
          </p>
        </section>
      </div>
    </div>
  );
};
export default TermsPage;
