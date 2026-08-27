import React, { useState, useEffect } from 'react';
import { CreditCard, Search, FileText, CheckCircle, RefreshCw, Printer, AlertCircle, Plus, Trash2, DollarSign, Award } from 'lucide-react';
import { getAppointments } from '../../api/appointments';
import { createDraftInvoice, getInvoice, recordPayments } from '../../api/billing';

export default function BillingPOSPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [appointments, setAppointments] = useState([]);
    
    // Selection & billing workspace state
    const [selectedAppt, setSelectedAppt] = useState(null);
    const [invoiceData, setInvoiceData] = useState(null);
    const [paymentList, setPaymentList] = useState([]);
    
    // Add payment entry form state
    const [paymentMode, setPaymentMode] = useState('CASH');
    const [paymentAmount, setPaymentAmount] = useState('');
    const [referenceNo, setReferenceNo] = useState('');
    
    // Search query for sessions list
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        loadSessions();
    }, []);

    const loadSessions = async () => {
        setIsLoading(true);
        try {
            // Load all appointments of today
            const todayStr = new Date().toISOString().split('T')[0];
            const data = await getAppointments({ date: todayStr });
            // Filter sessions: only show IN_SERVICE, COMPLETED, or BILLED
            const billable = (data || []).filter(a => 
                a.status === 'IN_SERVICE' || a.status === 'COMPLETED' || a.status === 'BILLED'
            );
            setAppointments(billable);
        } catch (err) {
            console.error("Failed to load billable sessions:", err);
        } finally {
            setIsLoading(false);
        }
    };

    // Selecting a session
    const handleSelectSession = async (appt) => {
        setSelectedAppt(appt);
        setInvoiceData(null);
        setPaymentList([]);
        setPaymentAmount('');
        setReferenceNo('');

        if (appt.status === 'BILLED') {
            // Retrieve invoice from backend since it already exists
            try {
                // Find invoice linked to this appointment
                const invoice = await createDraftInvoice(appt.id); // Also retrieves if exists
                setInvoiceData(invoice);
            } catch (err) {
                console.error("Failed to fetch billed invoice:", err);
            }
        }
    };

    // Generate draft bill
    const handleGenerateDraft = async () => {
        if (!selectedAppt) return;
        setIsLoading(true);
        try {
            const data = await createDraftInvoice(selectedAppt.id);
            setInvoiceData(data);
            // Prefill payment amount with outstanding balance
            setPaymentAmount(data.totalAmount);
        } catch (err) {
            alert(err.response?.data?.message || "Failed to generate draft bill. Make sure therapist has finished/started services!");
        } finally {
            setIsLoading(false);
        }
    };

    // Add split payment entry locally
    const handleAddPaymentEntry = () => {
        if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
            alert("Please enter a valid amount!");
            return;
        }

        const amt = parseFloat(paymentAmount);
        const outstanding = getOutstandingBalance();

        if (amt > outstanding) {
            alert("Payment amount cannot exceed the outstanding balance!");
            return;
        }

        const newEntry = {
            id: Date.now(),
            paymentMode: paymentMode,
            amount: amt,
            referenceNo: referenceNo || ''
        };

        setPaymentList([...paymentList, newEntry]);
        // Reset inputs, prefill remaining outstanding
        const remaining = outstanding - amt;
        setPaymentAmount(remaining > 0 ? remaining.toFixed(2) : '');
        setReferenceNo('');
    };

    // Remove local split payment entry
    const handleRemovePaymentEntry = (id) => {
        const filtered = paymentList.filter(p => p.id !== id);
        setPaymentList(filtered);
        
        // Re-calculate prefill
        const outstanding = invoiceData.totalAmount - filtered.reduce((sum, p) => sum + p.amount, 0);
        setPaymentAmount(outstanding.toFixed(2));
    };

    // Get outstanding balance calculation
    const getOutstandingBalance = () => {
        if (!invoiceData) return 0;
        const total = invoiceData.totalAmount;
        
        // Sum backend recorded payments
        const backendPaid = invoiceData.payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
        
        // Sum frontend local split payments
        const localPaid = paymentList.reduce((sum, p) => sum + p.amount, 0);
        
        return total - backendPaid - localPaid;
    };

    // Finalize checkout
    const handleFinalizeCheckout = async () => {
        if (!invoiceData) return;
        const outstanding = getOutstandingBalance();
        
        if (paymentList.length === 0) {
            alert("Please add at least one payment entry before checking out!");
            return;
        }

        if (outstanding > 0.05) { // Small epsilon check
            alert("Please collect the full outstanding amount to mark this invoice as PAID!");
            return;
        }

        setIsLoading(true);
        try {
            // Record payments to backend
            const payload = paymentList.map(p => ({
                paymentMode: p.paymentMode,
                amount: p.amount,
                referenceNo: p.referenceNo
            }));

            const updatedInvoice = await recordPayments(invoiceData.id, payload);
            
            // Format simulation popup message
            const pointsEarned = Math.floor(updatedInvoice.totalAmount / 100);
            const smsSimulation = `[SMS SIMULATION SENT to ${updatedInvoice.customerMobile}]:\n"Hi ${updatedInvoice.customerName}, thank you for choosing LuxeManage! Your payment is complete. Total amount: Rs ${updatedInvoice.totalAmount.toFixed(2)}. You earned ${pointsEarned} loyalty points today. See you next time!"`;
            
            alert(`Payment finalized successfully!\nInvoice status is now: PAID\n\n${smsSimulation}`);
            
            setInvoiceData(updatedInvoice);
            setPaymentList([]);
            loadSessions();
        } catch (err) {
            alert(err.response?.data?.message || "Failed to finalize checkout!");
        } finally {
            setIsLoading(false);
        }
    };

    // Filtering active sessions
    const getFilteredAppointments = () => {
        return appointments.filter(appt => {
            const q = searchQuery.toLowerCase().trim();
            return !q ||
                appt.customerName?.toLowerCase().includes(q) ||
                appt.customerMobile?.includes(q) ||
                appt.status?.toLowerCase().includes(q);
        });
    };

    const filteredSessions = getFilteredAppointments();
    const outstandingVal = getOutstandingBalance();

    return (
        <div className="crm-container">
            <div className="crm-header">
                <div className="greeting">
                    <h1>Billing & POS System</h1>
                    <p>Collect split payments, calculate GST-compliant invoices, and reward loyalty points.</p>
                </div>
                <button className="secondary-btn" onClick={loadSessions} style={{ padding: '10px' }}>
                    <RefreshCw size={15} /> Refresh List
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px', alignItems: 'start', marginTop: '16px' }}>
                
                {/* Left Column: List of today's billable appointments */}
                <div className="stat-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <h3 style={{ fontSize: '16px', color: 'var(--primary-gold-dark)', margin: 0, fontWeight: 'bold' }}>
                        Active & Completed Sessions (Today)
                    </h3>
                    
                    <div className="crm-search-wrapper" style={{ margin: 0 }}>
                        <Search size={14} className="crm-search-icon" />
                        <input
                            type="text"
                            className="crm-search-input"
                            placeholder="Filter client..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            style={{ fontSize: '13px', paddingLeft: '32px' }}
                        />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '500px', overflowY: 'auto' }}>
                        {filteredSessions.length === 0 ? (
                            <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px', padding: '20px 0' }}>
                                No active or completed sessions found.
                            </p>
                        ) : (
                            filteredSessions.map(appt => (
                                <div
                                    key={appt.id}
                                    onClick={() => handleSelectSession(appt)}
                                    style={{
                                        padding: '12px',
                                        borderRadius: '8px',
                                        backgroundColor: selectedAppt?.id === appt.id ? 'var(--primary-gold-light)' : 'var(--bg-main)',
                                        border: selectedAppt?.id === appt.id ? '1px solid var(--primary-gold)' : '1px solid var(--border-color)',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontWeight: '600', fontSize: '13px', color: 'var(--text-main)' }}>
                                            {appt.customerName}
                                        </span>
                                        <span style={{
                                            fontSize: '10px',
                                            padding: '2px 6px',
                                            borderRadius: '4px',
                                            fontWeight: 'bold',
                                            backgroundColor: appt.status === 'BILLED' ? 'rgba(74,124,89,0.1)' : 'rgba(197,160,89,0.1)',
                                            color: appt.status === 'BILLED' ? '#4a7c59' : 'var(--primary-gold-dark)'
                                        }}>
                                            {appt.status}
                                        </span>
                                    </div>
                                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', display: 'flex', justifyContent: 'space-between' }}>
                                        <span>Mobile: {appt.customerMobile}</span>
                                        <span>{appt.startTime.slice(0, 5)}</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Right Column: POS Draft Invoice and Checkout Workspace */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {isLoading ? (
                        <div className="stat-card" style={{ padding: '40px', textAlign: 'center' }}>
                            <div className="crm-spinner" style={{ margin: '0 auto 12px auto' }} />
                            <p>Processing request...</p>
                        </div>
                    ) : !selectedAppt ? (
                        <div className="stat-card" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
                            <FileText size={48} style={{ margin: '0 auto 12px auto', opacity: 0.5 }} />
                            <h3>Select a session on the left to begin billing</h3>
                            <p>Generate draft bills, view service listings, and apply split payment checkout.</p>
                        </div>
                    ) : !invoiceData ? (
                        <div className="stat-card" style={{ padding: '40px', textAlign: 'center' }}>
                            <AlertCircle size={36} color="var(--primary-gold-dark)" style={{ margin: '0 auto 12px auto' }} />
                            <h3>Draft Invoice Required</h3>
                            <p style={{ marginBottom: '20px' }}>
                                Appointment for <strong>{selectedAppt.customerName}</strong> requires a draft invoice breakdown before collecting checkout payments.
                            </p>
                            <button className="primary-btn" onClick={handleGenerateDraft} style={{ margin: '0 auto' }}>
                                Generate Draft Bill
                            </button>
                        </div>
                    ) : (
                        /* GST Invoice Display Workspace */
                        <div className="stat-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            
                            {/* GST Invoice Header Representation */}
                            <div style={{ borderBottom: '2px solid var(--border-color)', paddingBottom: '16px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div>
                                        <h2 style={{ fontFamily: 'var(--font-serif)', color: 'var(--primary-gold-dark)', margin: 0 }}>
                                            LUXEMANAGE SALON
                                        </h2>
                                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                            GSTIN: 27AAAAA1111A1Z1 | SAC Codes Applied
                                        </span>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <h3 style={{ margin: 0, fontSize: '18px', color: 'var(--text-main)' }}>
                                            {invoiceData.invoiceNumber || 'DRAFT INVOICE'}
                                        </h3>
                                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                            Date: {new Date(invoiceData.createdAt).toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', fontSize: '12px' }}>
                                    <div>
                                        <strong>Billed To:</strong> {invoiceData.customerName} ({invoiceData.customerMobile})
                                    </div>
                                    <div>
                                        <strong>Status:</strong> <span style={{
                                            fontWeight: 'bold',
                                            color: invoiceData.paymentStatus === 'PAID' ? '#4a7c59' : '#c5a059'
                                        }}>{invoiceData.paymentStatus}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Line Items Table */}
                            <div>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                                            <th style={{ textAlign: 'left', padding: '8px 0' }}>Item Description</th>
                                            <th style={{ textAlign: 'center', padding: '8px 0' }}>Qty</th>
                                            <th style={{ textAlign: 'right', padding: '8px 0' }}>Unit Price</th>
                                            <th style={{ textAlign: 'center', padding: '8px 0' }}>Tax %</th>
                                            <th style={{ textAlign: 'right', padding: '8px 0' }}>Total Cost</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {invoiceData.items.map(item => (
                                            <tr key={item.id} style={{ borderBottom: '1px dotted var(--border-color)' }}>
                                                <td style={{ padding: '10px 0', fontWeight: '500' }}>
                                                    {item.name}
                                                    {item.itemType === 'ADDON' && (
                                                        <span style={{ fontSize: '9px', backgroundColor: 'rgba(197, 160, 89, 0.15)', color: 'var(--primary-gold-dark)', padding: '1px 4px', borderRadius: '3px', marginLeft: '6px', fontWeight: 'bold' }}>
                                                            ADDON
                                                        </span>
                                                    )}
                                                </td>
                                                <td style={{ textAlign: 'center', padding: '10px 0' }}>{item.quantity}</td>
                                                <td style={{ textAlign: 'right', padding: '10px 0' }}>Rs {item.unitPrice.toFixed(2)}</td>
                                                <td style={{ textAlign: 'center', padding: '10px 0' }}>{item.taxPercent}%</td>
                                                <td style={{ textAlign: 'right', padding: '10px 0', fontWeight: 'bold' }}>Rs {item.lineTotal.toFixed(2)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Total Calculations summary */}
                            <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                                <div style={{ width: '250px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span>Subtotal:</span>
                                        <span>Rs {invoiceData.subtotal.toFixed(2)}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span>Tax (CGST + SGST):</span>
                                        <span>Rs {invoiceData.taxAmount.toFixed(2)}</span>
                                    </div>
                                    {invoiceData.discountAmount > 0 && (
                                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#4a7c59' }}>
                                            <span>Discounts applied:</span>
                                            <span>- Rs {invoiceData.discountAmount.toFixed(2)}</span>
                                        </div>
                                    )}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px', fontWeight: 'bold', borderTop: '1px solid var(--border-color)', paddingTop: '6px', color: 'var(--text-main)' }}>
                                        <span>Grand Total:</span>
                                        <span>Rs {invoiceData.totalAmount.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Recorded Payments display */}
                            {invoiceData.payments && invoiceData.payments.length > 0 && (
                                <div style={{ backgroundColor: 'var(--bg-main)', padding: '12px', borderRadius: '6px' }}>
                                    <h4 style={{ margin: '0 0 8px 0', fontSize: '12px', fontWeight: 'bold', color: 'var(--text-muted)' }}>
                                        Payments Collected (Backend):
                                    </h4>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px' }}>
                                        {invoiceData.payments.map(p => (
                                            <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <span>• {p.paymentMode} {p.referenceNo ? `(Ref: ${p.referenceNo})` : ''}</span>
                                                <span style={{ fontWeight: '600' }}>Rs {p.amount.toFixed(2)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Check out form: split payment collecting logic */}
                            {invoiceData.paymentStatus !== 'PAID' && (
                                <div style={{ borderTop: '2px dashed var(--border-color)', paddingTop: '16px' }}>
                                    <h3 style={{ fontSize: '14px', margin: '0 0 12px 0', color: 'var(--primary-gold-dark)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <CreditCard size={16} /> Collect Payment (Outstanding: Rs {outstandingVal.toFixed(2)})
                                    </h3>

                                    {/* Local payment stack display (split checkout entries) */}
                                    {paymentList.length > 0 && (
                                        <div style={{ marginBottom: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                            {paymentList.map(p => (
                                                <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', padding: '6px 10px', backgroundColor: 'rgba(197,160,89,0.08)', borderRadius: '4px' }}>
                                                    <span>{p.paymentMode} {p.referenceNo ? `(${p.referenceNo})` : ''}</span>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                        <span style={{ fontWeight: 'bold' }}>Rs {p.amount.toFixed(2)}</span>
                                                        <button type="button" onClick={() => handleRemovePaymentEntry(p.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#c35555' }}>
                                                            <Trash2 size={12} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Form layout */}
                                    {outstandingVal > 0 && (
                                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
                                            <div style={{ flex: 1, minWidth: '110px' }}>
                                                <select
                                                    className="form-control"
                                                    value={paymentMode}
                                                    onChange={e => setPaymentMode(e.target.value)}
                                                    style={{ padding: '6px 10px', fontSize: '12px' }}
                                                >
                                                    <option value="CASH">Cash</option>
                                                    <option value="CARD">Card</option>
                                                    <option value="UPI">UPI (QR/App)</option>
                                                    <option value="NET_BANKING">Net Banking</option>
                                                    <option value="WALLET">Wallet</option>
                                                </select>
                                            </div>

                                            <div style={{ flex: 1.5, minWidth: '130px', position: 'relative' }}>
                                                <DollarSign size={12} style={{ position: 'absolute', left: '8px', top: '10px', color: 'var(--text-muted)' }} />
                                                <input
                                                    type="number"
                                                    className="form-control"
                                                    placeholder="Amount"
                                                    value={paymentAmount}
                                                    onChange={e => setPaymentAmount(e.target.value)}
                                                    style={{ padding: '6px 10px 6px 22px', fontSize: '12px' }}
                                                />
                                            </div>

                                            <div style={{ flex: 1.5, minWidth: '130px' }}>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    placeholder="Txn Ref (Optional)"
                                                    value={referenceNo}
                                                    onChange={e => setReferenceNo(e.target.value)}
                                                    style={{ padding: '6px 10px', fontSize: '12px' }}
                                                />
                                            </div>

                                            <button
                                                type="button"
                                                className="secondary-btn"
                                                onClick={handleAddPaymentEntry}
                                                style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', padding: '6px 12px' }}
                                            >
                                                <Plus size={12} /> Add Mode
                                            </button>
                                        </div>
                                    )}

                                    {/* Finalize button */}
                                    <button
                                        className="primary-btn"
                                        disabled={outstandingVal > 0.05 && paymentList.length === 0}
                                        onClick={handleFinalizeCheckout}
                                        style={{ width: '100%', justifyContent: 'center' }}
                                    >
                                        {outstandingVal <= 0.05 ? 'Finalize Checkout & Print Invoice' : `Add Split Payments to checkout (Remaining: Rs ${outstandingVal.toFixed(2)})`}
                                    </button>
                                </div>
                            )}

                            {/* Printable Receipt layout */}
                            {invoiceData.paymentStatus === 'PAID' && (
                                <div style={{ borderTop: '2px dashed var(--border-color)', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#4a7c59', fontSize: '13px', fontWeight: 'bold' }}>
                                        <Award size={16} /> Billed (Loyalty Points Credited!)
                                    </div>
                                    <button
                                        className="secondary-btn"
                                        onClick={() => window.print()}
                                        style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
                                    >
                                        <Printer size={14} /> Print Receipt
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
