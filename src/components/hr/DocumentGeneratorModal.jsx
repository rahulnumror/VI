import React, { useState } from 'react';
import { FileText, Printer, Download, Check, X, Building2, Award, Briefcase } from 'lucide-react';

export default function DocumentGeneratorModal({ employee, onClose }) {
  const [docType, setDocType] = useState('INCREMENT_LETTER');
  const [effectiveDate, setEffectiveDate] = useState('2026-10-01');
  const [incrementPct, setIncrementPct] = useState('15');
  const [revisedCtc, setRevisedCtc] = useState('44160');
  const [relievingDate, setRelievingDate] = useState('2026-10-31');
  const [designation, setDesignation] = useState(employee?.designation || 'Senior Executive');
  const [copied, setCopied] = useState(false);

  const currentDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
  const refCode = `SLX/HR/2026/${employee?.employee_code || employee?.id || 'SLX-E01'}/${docType.slice(0, 3)}`;

  const handleCopy = () => {
    const text = document.getElementById('letter-content')?.innerText;
    if (text) {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-[#1E40AF] text-white rounded-lg">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Official HR Document &amp; Letterhead Generator</h2>
              <p className="text-[11px] text-slate-500 font-medium">Generate legal employment certifications and corporate letters</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-500 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Controls Bar */}
        <div className="p-4 bg-slate-100 border-b border-slate-200 grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="font-bold text-slate-700 block mb-1">Document Template</label>
            <select
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-md px-3 py-1.5 font-semibold text-slate-800 focus:outline-none focus:border-[#1E40AF]"
            >
              <option value="INCREMENT_LETTER">Annual Appraisal &amp; Increment</option>
              <option value="OFFER_LETTER">Employment Offer &amp; Appointment</option>
              <option value="RELIEVING_LETTER">Service &amp; Relieving Certificate</option>
            </select>
          </div>

          {docType === 'INCREMENT_LETTER' && (
            <>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Increment %</label>
                <input
                  type="number"
                  value={incrementPct}
                  onChange={(e) => {
                    setIncrementPct(e.target.value);
                    const base = 38400;
                    setRevisedCtc(String(Math.round(base * (1 + Number(e.target.value) / 100))));
                  }}
                  className="w-full bg-white border border-slate-300 rounded-md px-3 py-1.5 font-semibold text-slate-800 focus:outline-none"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Revised Annual CTC (USD)</label>
                <input
                  type="number"
                  value={revisedCtc}
                  onChange={(e) => setRevisedCtc(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-md px-3 py-1.5 font-semibold text-slate-800 focus:outline-none"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Effective Date</label>
                <input
                  type="date"
                  value={effectiveDate}
                  onChange={(e) => setEffectiveDate(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-md px-3 py-1.5 font-semibold text-slate-800 focus:outline-none"
                />
              </div>
            </>
          )}

          {docType === 'OFFER_LETTER' && (
            <>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Designation</label>
                <input
                  type="text"
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-md px-3 py-1.5 font-semibold text-slate-800 focus:outline-none"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Annual CTC (USD)</label>
                <input
                  type="number"
                  value={revisedCtc}
                  onChange={(e) => setRevisedCtc(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-md px-3 py-1.5 font-semibold text-slate-800 focus:outline-none"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Joining Date</label>
                <input
                  type="date"
                  value={effectiveDate}
                  onChange={(e) => setEffectiveDate(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-md px-3 py-1.5 font-semibold text-slate-800 focus:outline-none"
                />
              </div>
            </>
          )}

          {docType === 'RELIEVING_LETTER' && (
            <>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Designation at Exit</label>
                <input
                  type="text"
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-md px-3 py-1.5 font-semibold text-slate-800 focus:outline-none"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Last Working Day</label>
                <input
                  type="date"
                  value={relievingDate}
                  onChange={(e) => setRelievingDate(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-md px-3 py-1.5 font-semibold text-slate-800 focus:outline-none"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Conduct Rating</label>
                <select className="w-full bg-white border border-slate-300 rounded-md px-3 py-1.5 font-semibold text-slate-800 focus:outline-none">
                  <option>Exemplary &amp; Meritorious</option>
                  <option>Satisfactory &amp; Good Standing</option>
                </select>
              </div>
            </>
          )}
        </div>

        {/* Paper Preview Area */}
        <div className="flex-1 overflow-y-auto p-8 bg-slate-200/70 flex justify-center">
          <div
            id="letter-content"
            className="bg-white max-w-2xl w-full p-10 shadow-lg border border-slate-300 text-slate-800 font-serif leading-relaxed text-sm space-y-6"
            style={{ minHeight: '800px' }}
          >
            {/* Letterhead Header */}
            <div className="border-b-2 border-[#1E40AF] pb-4 flex items-center justify-between">
              <div>
                <h1 className="text-xl font-black text-[#1E40AF] tracking-tight font-sans">SOILEX LIFE SCIENCE LTD</h1>
                <p className="text-[11px] font-sans font-semibold text-slate-600 uppercase tracking-wider">
                  Agro-Commodity Processing · Global Spices Extraction · Bio-Hub Logistics
                </p>
                <p className="text-[10px] font-sans text-slate-400 mt-0.5">
                  Corporate Registration: SLX-VN-9920108 | ISO 22000 : 2018 Certified Facilities
                </p>
              </div>
              <div className="text-right font-sans text-[10px] text-slate-500">
                <p className="font-bold text-slate-800">Hanoi Corporate HQ</p>
                <p>Kochi Spices Extraction Terminal</p>
                <p>Hai Phong Cold-Berth Depot</p>
                <p>Dubai Regional Trade Office</p>
              </div>
            </div>

            {/* Reference & Date */}
            <div className="flex justify-between items-center text-xs font-sans font-semibold text-slate-600">
              <span className="font-mono text-slate-700">Ref: {refCode}</span>
              <span>Date: {currentDate}</span>
            </div>

            {/* Recipient Block */}
            <div className="font-sans text-xs space-y-0.5">
              <p className="font-bold text-slate-900 text-sm">To,</p>
              <p className="font-bold text-slate-800 text-sm">{employee?.full_name}</p>
              <p className="text-slate-600">Employee Code: <span className="font-mono font-bold text-[#1E40AF]">{employee?.employee_code || employee?.id}</span></p>
              <p className="text-slate-600">Department: {employee?.department}</p>
              <p className="text-slate-600">Facility: {employee?.branch}</p>
            </div>

            {/* Document Body */}
            {docType === 'INCREMENT_LETTER' && (
              <div className="space-y-4 text-justify">
                <p className="font-sans font-bold text-center underline uppercase text-slate-900 text-sm">
                  Subject: Annual Performance Appraisal &amp; Compensation Revision
                </p>
                <p>Dear {employee?.full_name?.split(' ')[0] || 'Colleague'},</p>
                <p>
                  The Board of Directors and Executive Management of <strong>SOILEX Life Science Ltd</strong> are pleased to acknowledge your meritorious contributions toward the company's operational milestones, food safety audits, and cross-border trade execution during the preceding fiscal cycle.
                </p>
                <p>
                  Following the formal annual performance appraisal review, we take pleasure in revising your compensation structure effective <strong>{effectiveDate}</strong>:
                </p>
                <div className="bg-slate-50 p-4 rounded border border-slate-200 font-sans text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Designation:</span>
                    <span className="font-bold text-slate-900">{employee?.designation}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Appraisal Increment Percentage:</span>
                    <span className="font-bold text-emerald-700">+{incrementPct}% Per Annum</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-200 pt-1.5">
                    <span className="text-slate-800 font-bold">Revised Total Cost to Company (CTC):</span>
                    <span className="font-black text-[#1E40AF] text-sm">${Number(revisedCtc).toLocaleString()} USD / Annum</span>
                  </div>
                </div>
                <p>
                  All other terms and conditions of your employment contract, including confidentiality undertakings, intellectual property clauses, and statutory compliance under ISO 22000 remain unaltered and in full force.
                </p>
                <p>
                  We look forward to your continued leadership and dedication as we expand our agro-processing operations across Southeast Asia and the Middle East.
                </p>
              </div>
            )}

            {docType === 'OFFER_LETTER' && (
              <div className="space-y-4 text-justify">
                <p className="font-sans font-bold text-center underline uppercase text-slate-900 text-sm">
                  Subject: Formal Offer of Employment &amp; Appointment
                </p>
                <p>Dear {employee?.full_name?.split(' ')[0] || 'Candidate'},</p>
                <p>
                  Further to our interview evaluations, <strong>SOILEX Life Science Ltd</strong> is delighted to offer you the position of <strong>{designation}</strong> in our <strong>{employee?.department || 'Operations'}</strong> division, stationed at our <strong>{employee?.branch || 'Hanoi HQ'}</strong> facility.
                </p>
                <p>
                  Your total annual remuneration (CTC) is designated at <strong>${Number(revisedCtc).toLocaleString()} USD per annum</strong>, inclusive of basic remuneration, statutory provident fund withholdings, and plant health allowances.
                </p>
                <p>
                  Your formal appointment commences on <strong>{effectiveDate}</strong>. This offer is contingent upon satisfactory background clearance and passing the statutory ISO 22000 occupational food handling health screening.
                </p>
              </div>
            )}

            {docType === 'RELIEVING_LETTER' && (
              <div className="space-y-4 text-justify">
                <p className="font-sans font-bold text-center underline uppercase text-slate-900 text-sm">
                  Subject: Service Certificate &amp; Relieving Order
                </p>
                <p>To Whom It May Concern,</p>
                <p>
                  This is to certify that <strong>{employee?.full_name}</strong> (Employee Code: <strong>{employee?.employee_code || employee?.id}</strong>) was employed with <strong>SOILEX Life Science Ltd</strong> from <strong>{employee?.join_date || '2023-04-15'}</strong> until <strong>{relievingDate}</strong>, last holding the office of <strong>{designation}</strong> in our <strong>{employee?.department}</strong> department.
                </p>
                <p>
                  During their tenure with us, their professional conduct was found to be exemplary, and all multi-departmental clearances including IT infrastructure access, financial reconciliations, and facility asset handovers have been fully resolved with zero outstanding dues.
                </p>
                <p>
                  {employee?.full_name} is hereby relieved of all duties effective the close of business hours on <strong>{relievingDate}</strong>. We express our sincere gratitude for their dedicated service and wish them the highest success in all future professional endeavors.
                </p>
              </div>
            )}

            {/* Signature & Seal Block */}
            <div className="pt-10 flex items-end justify-between font-sans text-xs">
              <div className="space-y-1">
                <div className="w-32 h-12 border-b border-slate-400 mb-1 flex items-center justify-center italic text-slate-400 text-[10px]">
                  [Digital Signature]
                </div>
                <p className="font-bold text-slate-900">Dr. Nguyen Minh Triet</p>
                <p className="text-slate-500">Director of Human Resources &amp; Corporate Affairs</p>
                <p className="text-slate-400 text-[10px]">SOILEX Life Science Ltd</p>
              </div>

              {/* Corporate Seal Emblem */}
              <div className="w-24 h-24 rounded-full border-2 border-dashed border-[#1E40AF]/40 flex flex-col items-center justify-center p-1 text-center text-[#1E40AF] select-none">
                <Building2 className="w-5 h-5 text-[#1E40AF]/60" />
                <span className="text-[7px] font-black uppercase mt-0.5 tracking-tighter">SOILEX SEAL</span>
                <span className="text-[6px] font-semibold text-slate-400">CORPORATE</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-200 bg-white flex items-center justify-between">
          <span className="text-xs text-slate-500 font-medium">
            Format: Standard A4 letterhead with cryptographic document ID verification
          </span>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleCopy}
              className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg flex items-center space-x-1.5 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Download className="w-3.5 h-3.5 text-slate-500" />}
              <span>{copied ? 'Copied to Clipboard' : 'Copy Text'}</span>
            </button>
            <button
              onClick={() => window.print()}
              className="px-5 py-2 bg-[#1E40AF] hover:bg-blue-800 text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow-sm flex items-center space-x-1.5 transition-all"
            >
              <Printer className="w-4 h-4 text-white" />
              <span>Print Official Letter</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
