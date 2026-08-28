const fs = require('fs');
const file = './src/components/CopoBusinessDashboardView.tsx';
let content = fs.readFileSync(file, 'utf8');

const startTag = "{activeTab === 'billing' && (";
const endTag = "            )}          </div>";

const startIndex = content.indexOf(startTag);
const endIndex = content.indexOf(endTag);

if (startIndex === -1 || endIndex === -1) {
  console.error("Could not find boundaries.");
  process.exit(1);
}

const replacement = `            {activeTab === 'billing' && (
              <div className="space-y-8 animate-in fade-in duration-200 pb-12 max-w-6xl mx-auto">
                
                {/* 10/10 iOS-Style Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
                  <div>
                    <h2 className="text-2xl font-black text-white tracking-tight">Subscription & Billing</h2>
                    <p className="text-sm text-zinc-400 mt-1">Manage your active plans, payment methods, and Creem.io invoices.</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <button
                      onClick={() => setShowPricingModal(true)}
                      className="px-6 py-2.5 bg-white hover:bg-zinc-200 text-black rounded-full text-[13px] font-bold shadow-md transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
                    >
                      Compare All Plans
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
                  {/* Left Column: Active Plan & History (7 cols) */}
                  <div className="lg:col-span-7 space-y-10">
                    
                    {/* SECTION 1: Active Subscription */}
                    <div>
                      <h3 className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest mb-3 px-1 flex items-center gap-2">
                        <CreditCard className="w-3.5 h-3.5" /> Current Plan
                      </h3>
                      
                      <div className="bg-[#111113] rounded-[32px] border border-blue-500/20 overflow-hidden relative shadow-[0_0_40px_rgba(37,99,235,0.05)]">
                        {/* Glow effect */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-[80px] rounded-full pointer-events-none" />
                        
                        <div className="p-8 relative z-10">
                           <div className="flex flex-col sm:flex-row sm:items-start sm:items-center justify-between gap-6 mb-8">
                             <div>
                               <div className="flex items-center gap-2 mb-3">
                                 <span className="px-2.5 py-0.5 rounded-md bg-blue-500/10 text-blue-400 text-[10px] font-bold border border-blue-500/20 uppercase tracking-wider">
                                   Active Subscription
                                 </span>
                                 <span className="px-2.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20 uppercase tracking-wider flex items-center gap-1.5">
                                   <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live
                                 </span>
                               </div>
                               <h4 className="text-3xl font-black text-white tracking-tight">Yoouz Pro <span className="text-blue-400">Business</span></h4>
                               <div className="text-zinc-400 text-[13px] font-semibold mt-2">
                                 $49.00 USD / month
                               </div>
                             </div>
                             
                             <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0">
                               <Sparkles className="w-8 h-8 text-white" />
                             </div>
                           </div>
                           
                           <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-[#000000]/40 rounded-[20px] border border-white/[0.04]">
                             <div>
                               <div className="text-[11px] text-zinc-500 font-bold uppercase tracking-wider mb-1">Next Billing Date</div>
                               <div className="text-[13px] font-semibold text-white">
                                 Renews on <span className="text-blue-400">{renewalDate}</span>
                               </div>
                               <div className="text-[12px] text-zinc-400 font-medium mt-0.5">
                                 via {paymentMethodDisplay}
                               </div>
                             </div>
                             <div className="flex items-center gap-2 shrink-0">
                               <button
                                 onClick={() => {
                                   setCreemPlan('premium');
                                   setShowCreemCheckout(true);
                                 }}
                                 className="px-5 py-2.5 bg-[#1a73e8] hover:bg-[#1557b0] text-white rounded-xl text-[13px] font-bold shadow-md shadow-[#1a73e8]/20 transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
                               >
                                 <Sparkles className="w-4 h-4" /> Upgrade to Premium
                               </button>
                             </div>
                           </div>
                        </div>
                      </div>
                    </div>

                    {/* SECTION 2: Billing History */}
                    <div>
                      <h3 className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest mb-3 px-1 flex items-center gap-2">
                        <Receipt className="w-3.5 h-3.5" /> Billing History
                      </h3>
                      <div className="bg-[#111113] rounded-[24px] border border-white/[0.08] overflow-hidden shadow-sm">
                        <table className="w-full text-left">
                          <thead className="bg-[#18181b] border-b border-white/[0.06]">
                            <tr>
                              <th className="py-3 px-5 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Invoice</th>
                              <th className="py-3 px-5 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Date</th>
                              <th className="py-3 px-5 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Amount</th>
                              <th className="py-3 px-5 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Status</th>
                              <th className="py-3 px-5 text-[10px] font-bold text-zinc-500 uppercase tracking-widest text-right">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/[0.06]">
                            {[
                              { id: 'CREEM-INV-9021', date: 'Aug 1, 2026', amount: '$49.00 USD' },
                              { id: 'CREEM-INV-8419', date: 'Jul 1, 2026', amount: '$49.00 USD' }
                            ].map((invoice) => (
                              <tr key={invoice.id} className="hover:bg-white/[0.02] transition-colors group">
                                <td className="py-4 px-5">
                                  <span className="font-mono text-[11px] text-zinc-300 bg-[#18181b] px-2 py-1 rounded-md border border-white/[0.06]">{invoice.id}</span>
                                </td>
                                <td className="py-4 px-5 text-[13px] font-semibold text-zinc-300">{invoice.date}</td>
                                <td className="py-4 px-5 text-[13px] font-bold text-white">{invoice.amount}</td>
                                <td className="py-4 px-5">
                                  <span className="px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20 uppercase tracking-wider">
                                    Paid
                                  </span>
                                </td>
                                <td className="py-4 px-5 text-right">
                                  <button 
                                    onClick={() => setShowReceiptModal(true)}
                                    className="text-[12px] font-bold text-blue-400 hover:text-blue-300 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer flex items-center justify-end gap-1.5 ml-auto"
                                  >
                                    <Download className="w-3.5 h-3.5" /> Receipt
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                  </div>

                  {/* Right Column: Upgrade / Features (5 cols) */}
                  <div className="lg:col-span-5 relative">
                    <div className="sticky top-24 space-y-6">
                      
                      <div className="bg-[#111113] rounded-[32px] border border-white/[0.08] p-8 relative overflow-hidden shadow-2xl">
                        <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-[#1a73e8]/10 to-transparent pointer-events-none" />
                        
                        <div className="relative z-10">
                          <div className="w-12 h-12 rounded-2xl bg-[#18181b] border border-white/[0.08] flex items-center justify-center mb-6 shadow-inner">
                            <ShieldCheck className="w-5 h-5 text-blue-400" />
                          </div>
                          
                          <h4 className="text-xl font-bold text-white mb-2 tracking-tight">Secure Merchant Billing</h4>
                          <p className="text-[13px] text-zinc-400 leading-relaxed font-medium mb-8">
                            Your subscription and payment methods are securely managed through Creem.io's encrypted merchant infrastructure.
                          </p>

                          <div className="space-y-4">
                            {[
                              'PCI-DSS Compliant Infrastructure',
                              '256-bit AES Encryption',
                              'Automated Monthly Invoicing',
                              'Cancel or modify anytime'
                            ].map((feature, idx) => (
                              <div key={idx} className="flex items-center gap-3">
                                <div className="w-6 h-6 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                                  <Check className="w-3.5 h-3.5 text-blue-400" />
                                </div>
                                <span className="text-[13px] font-semibold text-zinc-300">{feature}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Payment Method Card */}
                      <div className="bg-[#111113] rounded-[24px] border border-white/[0.08] p-5 flex items-center justify-between group cursor-pointer hover:bg-white/[0.02] transition-colors shadow-sm">
                         <div className="flex items-center gap-4">
                           <div className="w-14 h-10 bg-[#18181b] border border-white/[0.06] rounded-lg flex items-center justify-center shadow-inner">
                             <CreditCard className="w-5 h-5 text-zinc-400" />
                           </div>
                           <div>
                             <div className="text-[13px] font-bold text-white mb-0.5">{paymentMethodDisplay}</div>
                             <div className="text-[11px] text-zinc-500 font-bold uppercase tracking-wider">Default Payment Method</div>
                           </div>
                         </div>
                         <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-300 transition-colors" />
                      </div>

                    </div>
                  </div>
                </div>
              </div>
\n`;

const newContent = content.slice(0, startIndex) + replacement + content.slice(endIndex);

fs.writeFileSync(file, newContent);
console.log('Successfully patched billing tab.');
