import React, { useState, useEffect } from 'react';
import { CreditCard, Search, FileText, CheckCircle, RefreshCw, Printer, AlertCircle, Plus, Trash2, DollarSign, Award, ShoppingBag, Package, Ticket, Gift, Crown } from 'lucide-react';
import { getAppointments } from '../../api/appointments';
import { createDraftInvoice, getInvoice, recordPayments, addProductToInvoice, removeInvoiceItem } from '../../api/billing';
import { getProducts } from '../../api/inventory';
import { getCustomerById } from '../../api/customers';
import { validateCoupon, redeemLoyaltyPoints, getActiveCustomerMembership } from '../../api/membership';
import { formatMoney } from '../../utils/formatMoney';
import DirectSaleModal from './DirectSaleModal';

export default function BillingPOSPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [appointments, setAppointments] = useState([]);
    
    // Selection & billing workspace state
    const [selectedAppt, setSelectedAppt] = useState(null);
    const [invoiceData, setInvoiceData] = useState(null);
    const [paymentList, setPaymentList] = useState([]);
    
    // Direct Sale Modal State
    const [isDirectSaleOpen, setIsDirectSaleOpen] = useState(false);

    // Attach Product to Appointment Bill State
    const [availableProducts, setAvailableProducts] = useState([]);
    const [selectedProductId, setSelectedProductId] = useState('');
    const [productQuantity, setProductQuantity] = useState('1');
    const [attachWarning, setAttachWarning] = useState('');
    const [isAttachingProduct, setIsAttachingProduct] = useState(false);

    // Phase 7 Coupon & Loyalty States
    const [couponInput, setCouponInput] = useState('');
    const [couponMsg, setCouponMsg] = useState(null);
    const [pointsInput, setPointsInput] = useState('');
    const [clientLoyaltyPts, setClientLoyaltyPts] = useState(0);
    const [loyaltyMsg, setLoyaltyMsg] = useState(null);
    const [clientMembership, setClientMembership] = useState(null);

    // Add payment entry form state
    const [paymentMode, setPaymentMode] = useState('CASH');
    const [paymentAmount, setPaymentAmount] = useState('');
    const [referenceNo, setReferenceNo] = useState('');
    
    // Search query for sessions list
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        loadSessions();
        loadInventoryProducts();
    }, []);

    const loadSessions = async () => {
        setIsLoading(true);
        try {
            const todayStr = new Date().toISOString().split('T')[0];
            const data = await getAppointments({ date: todayStr });
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

    const loadInventoryProducts = async () => {
        try {
            const data = await getProducts({ size: 100 });
            setAvailableProducts(data?.content || data || []);
        } catch (err) {
            console.error("Failed to load inventory products:", err);
        }
    };

    const fetchCustomerMembershipAndLoyalty = async (customerId) => {
        if (!customerId) return;
        try {
            const [mem, cust] = await Promise.all([
                getActiveCustomerMembership(customerId),
                getCustomerById(customerId)
            ]);
            setClientMembership(mem);
            setClientLoyaltyPts(cust?.loyaltyPoints || 0);
        } catch (err) {
            console.error("Failed to fetch customer membership details:", err);
        }
    };

    // Selecting a session
    const handleSelectSession = async (appt) => {
        setSelectedAppt(appt);
        setInvoiceData(null);
        setPaymentList([]);
        setPaymentAmount('');
        setReferenceNo('');
        setSelectedProductId('');
        setProductQuantity('1');
        setAttachWarning('');
        setCouponInput('');
        setCouponMsg(null);
        setPointsInput('');
        setLoyaltyMsg(null);
        setClientMembership(null);

        if (appt.customerId) {
            fetchCustomerMembershipAndLoyalty(appt.customerId);
        }

        if (appt.status === 'BILLED') {
            try {
                const invoice = await createDraftInvoice(appt.id);
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
            setPaymentAmount(data.totalAmount);
            if (selectedAppt.customerId) {
                fetchCustomerMembershipAndLoyalty(selectedAppt.customerId);
            }
        } catch (err) {
            alert(err.response?.data?.message || "Failed to generate draft bill. Make sure therapist has finished/started services!");
        } finally {
            setIsLoading(false);
        }
    };

    // Attach Retail Product to Appointment Draft Invoice
    const handleAttachProduct = async () => {
        setAttachWarning('');
        if (!selectedProductId) {
            setAttachWarning('Please select a retail product from inventory!');
            return;
        }

        const product = availableProducts.find(p => p.id === Number(selectedProductId));
        if (!product) return;

        const qty = parseInt(productQuantity) || 1;
        if (qty <= 0) {
            setAttachWarning('Quantity must be at least 1!');
            return;
        }

        if (qty > product.currentStock) {
            setAttachWarning(`Cannot attach ${qty} units! Available stock for "${product.name}" is ${product.currentStock}.`);
            return;
        }

        setIsAttachingProduct(true);
        try {
            const updated = await addProductToInvoice(invoiceData.id, {
                productId: product.id,
                quantity: qty
            });
            setInvoiceData(updated);
            setSelectedProductId('');
            setProductQuantity('1');
            setPaymentAmount((updated.totalAmount - (paymentList.reduce((sum, p) => sum + p.amount, 0))).toFixed(2));
            loadInventoryProducts();
        } catch (err) {
            setAttachWarning(err.response?.data?.message || "Failed to add product to invoice!");
        } finally {
            setIsAttachingProduct(false);
        }
    };

    // Remove item from draft invoice
    const handleRemoveItem = async (itemId) => {
        if (!invoiceData) return;
        try {
            const updated = await removeInvoiceItem(invoiceData.id, itemId);
            setInvoiceData(updated);
            setPaymentAmount((updated.totalAmount - (paymentList.reduce((sum, p) => sum + p.amount, 0))).toFixed(2));
        } catch (err) {
            alert(err.response?.data?.message || "Failed to remove item from invoice!");
        }
    };

    // Phase 7 Coupon Application Handler
    const handleApplyCoupon = async () => {
        if (!couponInput.trim()) {
            setCouponMsg({ type: 'error', text: 'Enter a valid coupon code!' });
            return;
        }
        try {
            const res = await validateCoupon({
                code: couponInput.trim(),
                customerId: selectedAppt?.customerId,
                billAmount: invoiceData.totalAmount
            });

            if (!res.valid) {
                setCouponMsg({ type: 'error', text: res.message });
            } else {
                const newDiscount = (invoiceData.discountAmount || 0) + res.discountAmount;
                const newTotal = Math.max(0, invoiceData.subtotal + invoiceData.taxAmount - newDiscount);
                setInvoiceData({
                    ...invoiceData,
                    discountAmount: newDiscount,
                    totalAmount: newTotal
                });
                setPaymentAmount((newTotal - paymentList.reduce((sum, p) => sum + p.amount, 0)).toFixed(2));
                setCouponMsg({ type: 'success', text: `${res.message} Discount: ${formatMoney(res.discountAmount)}` });
            }
        } catch (err) {
            setCouponMsg({ type: 'error', text: err.response?.data?.message || 'Failed to validate coupon' });
        }
    };

    // Phase 7 Loyalty Point Redemption Handler
    const handleRedeemLoyalty = async () => {
        const pts = parseInt(pointsInput);
        if (!pts || pts <= 0) {
            setLoyaltyMsg({ type: 'error', text: 'Enter valid points to redeem!' });
            return;
        }
        if (pts > clientLoyaltyPts) {
            setLoyaltyMsg({ type: 'error', text: `Maximum available points: ${clientLoyaltyPts}` });
            return;
        }
        try {
            const res = await redeemLoyaltyPoints(selectedAppt.customerId, {
                invoiceId: invoiceData.id,
                points: pts
            });
            
            // Reload updated invoice
            const updatedInv = await getInvoice(invoiceData.id);
            setInvoiceData(updatedInv);
            setPaymentAmount((updatedInv.totalAmount - paymentList.reduce((sum, p) => sum + p.amount, 0)).toFixed(2));
            setClientLoyaltyPts(prev => Math.max(0, prev - pts));
            setLoyaltyMsg({ type: 'success', text: `Redeemed ${pts} pts (₹${pts} discount applied!)` });
            setPointsInput('');
        } catch (err) {
            setLoyaltyMsg({ type: 'error', text: err.response?.data?.message || 'Failed to redeem loyalty points' });
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

        if (amt > outstanding + 0.01) {
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
        const remaining = outstanding - amt;
        setPaymentAmount(remaining > 0 ? remaining.toFixed(2) : '');
        setReferenceNo('');
    };

    // Remove local split payment entry
    const handleRemovePaymentEntry = (id) => {
        const filtered = paymentList.filter(p => p.id !== id);
        setPaymentList(filtered);
        
        const outstanding = invoiceData.totalAmount - filtered.reduce((sum, p) => sum + p.amount, 0);
        setPaymentAmount(outstanding.toFixed(2));
    };

    // Get outstanding balance calculation
    const getOutstandingBalance = () => {
        if (!invoiceData) return 0;
        const total = invoiceData.totalAmount;
        const backendPaid = invoiceData.payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
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

        if (outstanding > 0.05) {
            alert("Please collect the full outstanding amount to mark this invoice as PAID!");
            return;
        }

        setIsLoading(true);
        try {
            const payload = paymentList.map(p => ({
                paymentMode: p.paymentMode,
                amount: p.amount,
                referenceNo: p.referenceNo
            }));

            const updatedInvoice = await recordPayments(invoiceData.id, payload);
            
            const pointsEarned = Math.floor(updatedInvoice.totalAmount / 100);
            const smsSimulation = `[SMS SIMULATION SENT to ${updatedInvoice.customerMobile}]:\n"Hi ${updatedInvoice.customerName}, thank you for choosing LuxeManage! Your payment is complete. Total amount: ${formatMoney(updatedInvoice.totalAmount)}. You earned ${pointsEarned} loyalty points today. See you next time!"`;
            
            alert(`Payment finalized successfully!\nInvoice status is now: PAID\n\n${smsSimulation}`);
            
            setInvoiceData(updatedInvoice);
            setPaymentList([]);
            loadSessions();
            loadInventoryProducts();
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

    const selectedProductObj = availableProducts.find(p => p.id === Number(selectedProductId));

    return (
        <div className="crm-container">
            {/* Header with Direct Retail Sale Action Button */}
            <div className="crm-header">
                <div className="greeting">
                    <h1>Billing & POS System</h1>
                    <p>Collect split payments, sell retail products, calculate GST invoices, and reward loyalty points.</p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                        className="primary-btn"
                        onClick={() => setIsDirectSaleOpen(true)}
                        style={{
                            padding: '10px 16px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            backgroundColor: '#b4833e',
                            color: '#ffffff',
                            fontWeight: '600'
                        }}
                    >
                        <ShoppingBag size={18} /> + Direct Retail Sale
                    </button>

                    <button className="secondary-btn" onClick={() => { loadSessions(); loadInventoryProducts(); }} style={{ padding: '10px' }}>
                        <RefreshCw size={15} /> Refresh List
                    </button>
                </div>
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
                            <p>Generate draft bills, attach retail products, and apply split payment checkout.</p>
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
                            
                            {/* Phase 7 Active Membership VIP Banner */}
                            {clientMembership && clientMembership.status === 'ACTIVE' && (
                                <div style={{
                                    backgroundColor: '#fffdfa',
                                    border: '1px solid #fde68a',
                                    borderRadius: '8px',
                                    padding: '10px 14px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px'
                                }}>
                                    <Crown size={18} color="#b4833e" />
                                    <span style={{ fontSize: '12px', color: '#78350f', fontWeight: 'bold' }}>
                                        VIP Member Tier: {clientMembership.tier} ({clientMembership.discountPercent}% Member Discount active)
                                    </span>
                                </div>
                            )}

                            {/* GST Invoice Header Representation */}
                            <div style={{ borderBottom: '2px solid var(--border-color)', paddingBottom: '16px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div>
                                        <h2 style={{ fontFamily: 'var(--font-serif)', color: 'var(--primary-gold-dark)', margin: 0 }}>
                                            LUXEMANAGE SALON
                                        </h2>
                                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                            GSTIN: 27AAAAA1111A1Z1 | SAC Codes & Product GST Applied
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
                                            {invoiceData.paymentStatus !== 'PAID' && (
                                                <th style={{ textAlign: 'center', padding: '8px 0' }}>Action</th>
                                            )}
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
                                                    {item.itemType === 'PRODUCT' && (
                                                        <span style={{ fontSize: '9px', backgroundColor: '#fef3c7', color: '#92400e', padding: '1px 6px', borderRadius: '3px', marginLeft: '6px', fontWeight: 'bold', border: '1px solid #fde68a' }}>
                                                            RETAIL PRODUCT
                                                        </span>
                                                    )}
                                                </td>
                                                <td style={{ textAlign: 'center', padding: '10px 0' }}>{item.quantity}</td>
                                                <td style={{ textAlign: 'right', padding: '10px 0' }}>{formatMoney(item.unitPrice)}</td>
                                                <td style={{ textAlign: 'center', padding: '10px 0' }}>{item.taxPercent}%</td>
                                                <td style={{ textAlign: 'right', padding: '10px 0', fontWeight: 'bold' }}>{formatMoney(item.quantity * item.unitPrice)}</td>
                                                {invoiceData.paymentStatus !== 'PAID' && (
                                                    <td style={{ textAlign: 'center', padding: '10px 0' }}>
                                                        {item.itemType === 'PRODUCT' && (
                                                            <button
                                                                type="button"
                                                                onClick={() => handleRemoveItem(item.id)}
                                                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}
                                                            >
                                                                <Trash2 size={13} />
                                                            </button>
                                                        )}
                                                    </td>
                                                )}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Section: + Add Retail Product to Appointment Bill */}
                            {invoiceData.paymentStatus !== 'PAID' && (
                                <div style={{
                                    backgroundColor: '#fffbeb',
                                    borderRadius: '8px',
                                    border: '1px solid #fde68a',
                                    padding: '14px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '10px'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <h4 style={{ margin: 0, fontSize: '13px', color: '#78350f', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <Package size={16} color="#b4833e" /> + Add Retail Product to Bill
                                        </h4>
                                        {selectedProductObj && (
                                            <span style={{
                                                fontSize: '11px',
                                                fontWeight: 'bold',
                                                padding: '2px 8px',
                                                borderRadius: '4px',
                                                backgroundColor: selectedProductObj.currentStock > 0 ? '#dcfce7' : '#fee2e2',
                                                color: selectedProductObj.currentStock > 0 ? '#166534' : '#991b1b'
                                            }}>
                                                {selectedProductObj.currentStock > 0 ? `In Stock: ${selectedProductObj.currentStock}` : 'Out of Stock'}
                                            </span>
                                        )}
                                    </div>

                                    {attachWarning && (
                                        <div style={{ fontSize: '12px', color: '#b91c1c', fontWeight: '500' }}>
                                            • {attachWarning}
                                        </div>
                                    )}

                                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                        <select
                                            value={selectedProductId}
                                            onChange={e => { setSelectedProductId(e.target.value); setAttachWarning(''); }}
                                            style={{
                                                flex: 2,
                                                minWidth: '180px',
                                                padding: '6px 10px',
                                                fontSize: '12px',
                                                borderRadius: '6px',
                                                border: '1px solid #cbd5e1'
                                            }}
                                        >
                                            <option value="">-- Select Retail Product --</option>
                                            {availableProducts.map(p => (
                                                <option key={p.id} value={p.id} disabled={!p.currentStock || p.currentStock <= 0}>
                                                    {p.name} ({p.brand || 'No Brand'}) - {formatMoney(p.salePrice)} [{p.currentStock || 0} in stock]
                                                </option>
                                            ))}
                                        </select>

                                        <input
                                            type="number"
                                            min="1"
                                            value={productQuantity}
                                            onChange={e => setProductQuantity(e.target.value)}
                                            style={{
                                                width: '60px',
                                                padding: '6px 8px',
                                                fontSize: '12px',
                                                borderRadius: '6px',
                                                border: '1px solid #cbd5e1',
                                                textAlign: 'center'
                                            }}
                                        />

                                        <button
                                            type="button"
                                            disabled={isAttachingProduct || !selectedProductId}
                                            onClick={handleAttachProduct}
                                            style={{
                                                padding: '6px 14px',
                                                fontSize: '12px',
                                                fontWeight: '600',
                                                backgroundColor: '#b4833e',
                                                color: '#ffffff',
                                                border: 'none',
                                                borderRadius: '6px',
                                                cursor: isAttachingProduct || !selectedProductId ? 'not-allowed' : 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '4px'
                                            }}
                                        >
                                            <Plus size={14} /> {isAttachingProduct ? 'Adding...' : 'Attach Product'}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Phase 7 Discounts & Rewards Section */}
                            {invoiceData.paymentStatus !== 'PAID' && (
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: '1fr 1fr',
                                    gap: '12px',
                                    backgroundColor: 'var(--bg-main)',
                                    padding: '14px',
                                    borderRadius: '8px',
                                    border: '1px solid var(--border-color)'
                                }}>
                                    {/* Apply Promo Coupon */}
                                    <div>
                                        <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--primary-gold-dark)' }}>
                                            <Ticket size={14} /> Apply Coupon Code
                                        </label>
                                        <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                                            <input
                                                type="text"
                                                className="form-control"
                                                placeholder="e.g. WELCOME10"
                                                value={couponInput}
                                                onChange={e => setCouponInput(e.target.value.toUpperCase())}
                                                style={{ padding: '6px 10px', fontSize: '12px', textTransform: 'uppercase', fontFamily: 'monospace' }}
                                            />
                                            <button
                                                type="button"
                                                className="primary-btn"
                                                onClick={handleApplyCoupon}
                                                style={{ padding: '6px 12px', fontSize: '12px' }}
                                            >
                                                Apply
                                            </button>
                                        </div>
                                        {couponMsg && (
                                            <span style={{ fontSize: '11px', color: couponMsg.type === 'success' ? '#15803d' : '#b91c1c', marginTop: '4px', display: 'block', fontWeight: '500' }}>
                                                {couponMsg.text}
                                            </span>
                                        )}
                                    </div>

                                    {/* Redeem Loyalty Points */}
                                    <div>
                                        <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--primary-gold-dark)' }}>
                                            <Gift size={14} /> Redeem Loyalty Points (Avail: {clientLoyaltyPts} pts)
                                        </label>
                                        <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                                            <input
                                                type="number"
                                                className="form-control"
                                                placeholder="Points to redeem"
                                                value={pointsInput}
                                                onChange={e => setPointsInput(e.target.value)}
                                                max={clientLoyaltyPts}
                                                style={{ padding: '6px 10px', fontSize: '12px' }}
                                            />
                                            <button
                                                type="button"
                                                className="secondary-btn"
                                                onClick={handleRedeemLoyalty}
                                                style={{ padding: '6px 12px', fontSize: '12px' }}
                                            >
                                                Redeem
                                            </button>
                                        </div>
                                        {loyaltyMsg && (
                                            <span style={{ fontSize: '11px', color: loyaltyMsg.type === 'success' ? '#15803d' : '#b91c1c', marginTop: '4px', display: 'block', fontWeight: '500' }}>
                                                {loyaltyMsg.text}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Total Calculations summary */}
                            <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                                <div style={{ width: '250px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span>Subtotal:</span>
                                        <span>{formatMoney(invoiceData.subtotal)}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span>Tax (CGST + SGST):</span>
                                        <span>{formatMoney(invoiceData.taxAmount)}</span>
                                    </div>
                                    {invoiceData.discountAmount > 0 && (
                                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#4a7c59' }}>
                                            <span>Discounts applied:</span>
                                            <span>- {formatMoney(invoiceData.discountAmount)}</span>
                                        </div>
                                    )}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px', fontWeight: 'bold', borderTop: '1px solid var(--border-color)', paddingTop: '6px', color: 'var(--text-main)' }}>
                                        <span>Grand Total:</span>
                                        <span>{formatMoney(invoiceData.totalAmount)}</span>
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
                                                <span style={{ fontWeight: '600' }}>{formatMoney(p.amount)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Check out form: split payment collecting logic */}
                            {invoiceData.paymentStatus !== 'PAID' && (
                                <div style={{ borderTop: '2px dashed var(--border-color)', paddingTop: '16px' }}>
                                    <h3 style={{ fontSize: '14px', margin: '0 0 12px 0', color: 'var(--primary-gold-dark)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <CreditCard size={16} /> Collect Payment (Outstanding: {formatMoney(outstandingVal)})
                                    </h3>

                                    {/* Local payment stack display (split checkout entries) */}
                                    {paymentList.length > 0 && (
                                        <div style={{ marginBottom: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                            {paymentList.map(p => (
                                                <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', padding: '6px 10px', backgroundColor: 'rgba(197,160,89,0.08)', borderRadius: '4px' }}>
                                                    <span>{p.paymentMode} {p.referenceNo ? `(${p.referenceNo})` : ''}</span>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                        <span style={{ fontWeight: 'bold' }}>{formatMoney(p.amount)}</span>
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
                                        {outstandingVal <= 0.05 ? 'Finalize Checkout & Print Invoice' : `Add Split Payments to checkout (Remaining: ${formatMoney(outstandingVal)})`}
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

            {/* Direct Retail Sale POS Modal */}
            <DirectSaleModal
                isOpen={isDirectSaleOpen}
                onClose={() => setIsDirectSaleOpen(false)}
                onSuccess={() => {
                    loadSessions();
                    loadInventoryProducts();
                }}
            />
        </div>
    );
}
