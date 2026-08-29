import React, { useState, useEffect } from 'react';
import { X, Search, ShoppingBag, Plus, Minus, Trash2, CreditCard, DollarSign, Printer, CheckCircle, AlertTriangle, User, UserPlus } from 'lucide-react';
import { getCustomers } from '../../api/customers';
import { getProducts } from '../../api/inventory';
import { createDirectSaleInvoice } from '../../api/billing';
import { formatMoney } from '../../utils/formatMoney';

export default function DirectSaleModal({ isOpen, onClose, onSuccess }) {
    if (!isOpen) return null;

    // Steps: 'POS' (Cart & Billing) | 'SUCCESS' (Printable Receipt)
    const [step, setStep] = useState('POS');

    // Customer Selection State
    const [customerMode, setCustomerMode] = useState('EXISTING'); // 'EXISTING' or 'WALKIN'
    const [customerSearch, setCustomerSearch] = useState('');
    const [customerResults, setCustomerResults] = useState([]);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [walkInName, setWalkInName] = useState('');
    const [walkInMobile, setWalkInMobile] = useState('');

    // Product Search State
    const [productSearch, setProductSearch] = useState('');
    const [products, setProducts] = useState([]);
    const [isLoadingProducts, setIsLoadingProducts] = useState(false);

    // Cart State: items = [{ product, quantity, unitPrice, lineTotal }]
    const [cart, setCart] = useState([]);
    const [stockWarning, setStockWarning] = useState('');

    // Payment State
    const [payments, setPayments] = useState([]);
    const [paymentMode, setPaymentMode] = useState('CASH');
    const [paymentAmount, setPaymentAmount] = useState('');
    const [referenceNo, setReferenceNo] = useState('');
    const [discountAmount, setDiscountAmount] = useState('0');

    // Finalized Invoice Output State
    const [completedInvoice, setCompletedInvoice] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            loadInitialProducts();
        }
    }, [isOpen]);

    const loadInitialProducts = async () => {
        setIsLoadingProducts(true);
        try {
            const data = await getProducts({ size: 100 });
            setProducts(data?.content || data || []);
        } catch (err) {
            console.error("Failed to load products:", err);
        } finally {
            setIsLoadingProducts(false);
        }
    };

    // Handle Customer Search
    useEffect(() => {
        if (!customerSearch.trim() || customerMode !== 'EXISTING') {
            setCustomerResults([]);
            return;
        }

        const timer = setTimeout(async () => {
            try {
                const res = await getCustomers({ search: customerSearch.trim(), size: 5 });
                setCustomerResults(res?.content || res || []);
            } catch (err) {
                console.error("Failed customer search:", err);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [customerSearch, customerMode]);

    // Filter products locally by search term
    const filteredProducts = products.filter(p => {
        if (!productSearch.trim()) return true;
        const q = productSearch.toLowerCase().trim();
        return (
            p.name?.toLowerCase().includes(q) ||
            p.brand?.toLowerCase().includes(q) ||
            p.sku?.toLowerCase().includes(q)
        );
    });

    // Add item to cart
    const handleAddToCart = (product) => {
        setStockWarning('');

        if (!product.currentStock || product.currentStock <= 0) {
            setStockWarning(`"${product.name}" is currently OUT OF STOCK!`);
            return;
        }

        const existing = cart.find(item => item.product.id === product.id);
        const currentQty = existing ? existing.quantity : 0;

        if (currentQty + 1 > product.currentStock) {
            setStockWarning(`Cannot add more! Available stock for "${product.name}" is ${product.currentStock} units.`);
            return;
        }

        if (existing) {
            setCart(cart.map(item => {
                if (item.product.id === product.id) {
                    const newQty = item.quantity + 1;
                    const lineTotal = product.salePrice * newQty;
                    return { ...item, quantity: newQty, lineTotal };
                }
                return item;
            }));
        } else {
            setCart([...cart, {
                product,
                quantity: 1,
                unitPrice: product.salePrice,
                lineTotal: product.salePrice
            }]);
        }
    };

    // Update item quantity in cart
    const handleUpdateQuantity = (productId, delta) => {
        setStockWarning('');
        setCart(cart.map(item => {
            if (item.product.id === productId) {
                const newQty = item.quantity + delta;
                if (newQty <= 0) return null;

                if (newQty > item.product.currentStock) {
                    setStockWarning(`Cannot exceed stock limit (${item.product.currentStock} available) for "${item.product.name}"!`);
                    return item;
                }

                const lineTotal = item.unitPrice * newQty;
                return { ...item, quantity: newQty, lineTotal };
            }
            return item;
        }).filter(Boolean));
    };

    // Remove item from cart
    const handleRemoveFromCart = (productId) => {
        setCart(cart.filter(item => item.product.id !== productId));
    };

    // Calculations
    const calculateSubtotal = () => cart.reduce((sum, item) => sum + item.lineTotal, 0);

    const calculateTax = () => {
        return cart.reduce((sum, item) => {
            const gstPercent = item.product.gstPercent || 18;
            const itemTax = (item.lineTotal * gstPercent) / 100;
            return sum + itemTax;
        }, 0);
    };

    const subtotal = calculateSubtotal();
    const taxAmount = calculateTax();
    const discountVal = parseFloat(discountAmount) || 0;
    const grandTotal = Math.max(0, subtotal + taxAmount - discountVal);

    const totalPaymentsAdded = payments.reduce((sum, p) => sum + p.amount, 0);
    const outstanding = Math.max(0, grandTotal - totalPaymentsAdded);

    // Auto-fill payment input with remaining amount when payments change or total updates
    useEffect(() => {
        if (outstanding > 0) {
            setPaymentAmount(outstanding.toFixed(2));
        } else {
            setPaymentAmount('');
        }
    }, [grandTotal, totalPaymentsAdded]);

    // Add payment entry
    const handleAddPayment = () => {
        if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
            alert("Please enter a valid payment amount!");
            return;
        }
        const amt = parseFloat(paymentAmount);
        if (amt > outstanding + 0.01) {
            alert("Payment amount cannot exceed the remaining balance!");
            return;
        }

        const newPayment = {
            id: Date.now(),
            paymentMode,
            amount: amt,
            referenceNo
        };

        setPayments([...payments, newPayment]);
        setReferenceNo('');
    };

    // Remove payment entry
    const handleRemovePayment = (id) => {
        setPayments(payments.filter(p => p.id !== id));
    };

    // Complete Direct Retail Sale Checkout
    const handleCompleteSale = async () => {
        if (cart.length === 0) {
            alert("Please add at least one retail product to cart!");
            return;
        }

        if (outstanding > 0.05) {
            alert("Please collect the full grand total before completing sale!");
            return;
        }

        setIsSubmitting(true);
        try {
            const payload = {
                customerId: customerMode === 'EXISTING' ? selectedCustomer?.id : null,
                walkInCustomerName: customerMode === 'WALKIN' ? (walkInName || 'Walk-in Customer') : null,
                walkInCustomerMobile: customerMode === 'WALKIN' ? walkInMobile : null,
                items: cart.map(item => ({
                    productId: item.product.id,
                    quantity: item.quantity
                })),
                payments: payments.map(p => ({
                    paymentMode: p.paymentMode,
                    amount: p.amount,
                    referenceNo: p.referenceNo
                })),
                discountAmount: discountVal
            };

            const response = await createDirectSaleInvoice(payload);
            setCompletedInvoice(response);
            setStep('SUCCESS');

            if (onSuccess) {
                onSuccess(response);
            }
        } catch (err) {
            const msg = err.response?.data?.message || "Failed to complete direct retail sale!";
            setStockWarning(msg);
            alert(msg);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
        }}>
            <div style={{
                backgroundColor: '#ffffff',
                borderRadius: '16px',
                width: '100%',
                maxWidth: '1100px',
                maxHeight: '90vh',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                overflow: 'hidden',
                border: '1px solid var(--border-color, #e2e8f0)'
            }}>
                {/* Modal Header */}
                <div style={{
                    padding: '16px 24px',
                    borderBottom: '1px solid #e2e8f0',
                    display: 'flex',
                    justify: 'space-between',
                    alignItems: 'center',
                    backgroundColor: '#fffbeb'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                            padding: '8px',
                            backgroundColor: '#fef3c7',
                            color: '#b4833e',
                            borderRadius: '10px'
                        }}>
                            <ShoppingBag size={22} />
                        </div>
                        <div>
                            <h2 style={{
                                margin: 0,
                                fontSize: '18px',
                                fontFamily: 'var(--font-serif, Georgia, serif)',
                                color: '#78350f',
                                fontWeight: '700'
                            }}>
                                Direct Retail Product Sale
                            </h2>
                            <span style={{ fontSize: '12px', color: '#92400e' }}>
                                Front Desk POS • Real-time Inventory Deduction & Loyalty Reward
                            </span>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#64748b',
                            padding: '6px',
                            borderRadius: '8px',
                            transition: 'all 0.2s'
                        }}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Stock Warning Banner */}
                {stockWarning && (
                    <div style={{
                        backgroundColor: '#fef2f2',
                        borderLeft: '4px solid #ef4444',
                        padding: '10px 20px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        color: '#991b1b',
                        fontSize: '13px',
                        fontWeight: '500'
                    }}>
                        <AlertTriangle size={16} />
                        <span>{stockWarning}</span>
                    </div>
                )}

                {step === 'POS' ? (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1.2fr 1fr',
                        flex: 1,
                        overflow: 'hidden'
                    }}>
                        {/* Left Side: Customer & Product Catalog */}
                        <div style={{
                            padding: '20px',
                            borderRight: '1px solid #e2e8f0',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '16px',
                            overflowY: 'auto',
                            backgroundColor: '#f8fafc'
                        }}>
                            {/* 1. Customer Selector Section */}
                            <div style={{
                                backgroundColor: '#ffffff',
                                borderRadius: '12px',
                                padding: '16px',
                                border: '1px solid #e2e8f0'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                    <h3 style={{ margin: 0, fontSize: '14px', color: '#334155', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <User size={16} color="#b4833e" /> Select Customer
                                    </h3>
                                    <div style={{ display: 'flex', gap: '6px' }}>
                                        <button
                                            type="button"
                                            onClick={() => { setCustomerMode('EXISTING'); setSelectedCustomer(null); }}
                                            style={{
                                                padding: '4px 10px',
                                                fontSize: '11px',
                                                borderRadius: '6px',
                                                fontWeight: '600',
                                                border: 'none',
                                                cursor: 'pointer',
                                                backgroundColor: customerMode === 'EXISTING' ? '#fef3c7' : '#f1f5f9',
                                                color: customerMode === 'EXISTING' ? '#92400e' : '#64748b'
                                            }}
                                        >
                                            Existing Client
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => { setCustomerMode('WALKIN'); setSelectedCustomer(null); }}
                                            style={{
                                                padding: '4px 10px',
                                                fontSize: '11px',
                                                borderRadius: '6px',
                                                fontWeight: '600',
                                                border: 'none',
                                                cursor: 'pointer',
                                                backgroundColor: customerMode === 'WALKIN' ? '#fef3c7' : '#f1f5f9',
                                                color: customerMode === 'WALKIN' ? '#92400e' : '#64748b'
                                            }}
                                        >
                                            Walk-in / New
                                        </button>
                                    </div>
                                </div>

                                {customerMode === 'EXISTING' ? (
                                    selectedCustomer ? (
                                        <div style={{
                                            padding: '10px 14px',
                                            backgroundColor: '#fef3c7',
                                            borderRadius: '8px',
                                            border: '1px solid #fde68a',
                                            display: 'flex',
                                            justify: 'space-between',
                                            alignItems: 'center'
                                        }}>
                                            <div>
                                                <div style={{ fontWeight: '700', fontSize: '13px', color: '#78350f' }}>{selectedCustomer.fullName}</div>
                                                <div style={{ fontSize: '11px', color: '#92400e' }}>Mobile: {selectedCustomer.mobile} | Loyalty Points: {selectedCustomer.loyaltyPoints || 0}</div>
                                            </div>
                                            <button
                                                onClick={() => setSelectedCustomer(null)}
                                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#b4833e', fontSize: '12px', fontWeight: 'bold' }}
                                            >
                                                Change
                                            </button>
                                        </div>
                                    ) : (
                                        <div style={{ position: 'relative' }}>
                                            <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: '#94a3b8' }} />
                                            <input
                                                type="text"
                                                placeholder="Search client by mobile or name..."
                                                value={customerSearch}
                                                onChange={e => setCustomerSearch(e.target.value)}
                                                style={{
                                                    width: '100%',
                                                    padding: '8px 10px 8px 32px',
                                                    fontSize: '12px',
                                                    borderRadius: '8px',
                                                    border: '1px solid #cbd5e1',
                                                    boxSizing: 'border-box'
                                                }}
                                            />
                                            {customerResults.length > 0 && (
                                                <div style={{
                                                    position: 'absolute',
                                                    top: '100%',
                                                    left: 0,
                                                    right: 0,
                                                    backgroundColor: '#ffffff',
                                                    border: '1px solid #e2e8f0',
                                                    borderRadius: '8px',
                                                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                                    zIndex: 10,
                                                    maxHeight: '150px',
                                                    overflowY: 'auto',
                                                    marginTop: '4px'
                                                }}>
                                                    {customerResults.map(cust => (
                                                        <div
                                                            key={cust.id}
                                                            onClick={() => { setSelectedCustomer(cust); setCustomerSearch(''); setCustomerResults([]); }}
                                                            style={{
                                                                padding: '8px 12px',
                                                                borderBottom: '1px solid #f1f5f9',
                                                                cursor: 'pointer',
                                                                fontSize: '12px',
                                                                transition: 'background-color 0.2s'
                                                            }}
                                                            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#fef3c7'}
                                                            onMouseLeave={e => e.currentTarget.style.backgroundColor = '#ffffff'}
                                                        >
                                                            <div style={{ fontWeight: '600', color: '#1e293b' }}>{cust.fullName}</div>
                                                            <div style={{ fontSize: '10px', color: '#64748b' }}>{cust.mobile}</div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )
                                ) : (
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                        <input
                                            type="text"
                                            placeholder="Walk-in Customer Name"
                                            value={walkInName}
                                            onChange={e => setWalkInName(e.target.value)}
                                            style={{ padding: '8px 10px', fontSize: '12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                                        />
                                        <input
                                            type="text"
                                            placeholder="Mobile Number (Optional)"
                                            value={walkInMobile}
                                            onChange={e => setWalkInMobile(e.target.value)}
                                            style={{ padding: '8px 10px', fontSize: '12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                                        />
                                    </div>
                                )}
                            </div>

                            {/* 2. Product Catalog Search & Grid */}
                            <div style={{
                                backgroundColor: '#ffffff',
                                borderRadius: '12px',
                                padding: '16px',
                                border: '1px solid #e2e8f0',
                                flex: 1,
                                display: 'flex',
                                flexDirection: 'column'
                            }}>
                                <div style={{ marginBottom: '12px' }}>
                                    <h3 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#334155', fontWeight: '700' }}>
                                        Inventory Products Catalog
                                    </h3>
                                    <div style={{ position: 'relative' }}>
                                        <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: '#94a3b8' }} />
                                        <input
                                            type="text"
                                            placeholder="Search product by name, brand, or SKU..."
                                            value={productSearch}
                                            onChange={e => setProductSearch(e.target.value)}
                                            style={{
                                                width: '100%',
                                                padding: '8px 10px 8px 32px',
                                                fontSize: '12px',
                                                borderRadius: '8px',
                                                border: '1px solid #cbd5e1',
                                                boxSizing: 'border-box'
                                            }}
                                        />
                                    </div>
                                </div>

                                <div style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '8px',
                                    overflowY: 'auto',
                                    maxHeight: '300px',
                                    paddingRight: '4px'
                                }}>
                                    {isLoadingProducts ? (
                                        <div style={{ textAlign: 'center', padding: '20px', color: '#64748b', fontSize: '12px' }}>
                                            Loading inventory...
                                        </div>
                                    ) : filteredProducts.length === 0 ? (
                                        <div style={{ textAlign: 'center', padding: '20px', color: '#94a3b8', fontSize: '12px' }}>
                                            No active products found.
                                        </div>
                                    ) : (
                                        filteredProducts.map(p => {
                                            const isOutOfStock = !p.currentStock || p.currentStock <= 0;
                                            return (
                                                <div
                                                    key={p.id}
                                                    style={{
                                                        padding: '10px 12px',
                                                        borderRadius: '8px',
                                                        border: '1px solid #e2e8f0',
                                                        backgroundColor: isOutOfStock ? '#fdf2f2' : '#ffffff',
                                                        display: 'flex',
                                                        justify: 'space-between',
                                                        alignItems: 'center',
                                                        transition: 'all 0.2s'
                                                    }}
                                                >
                                                    <div>
                                                        <div style={{ fontWeight: '600', fontSize: '13px', color: '#1e293b' }}>
                                                            {p.name}
                                                        </div>
                                                        <div style={{ fontSize: '11px', color: '#64748b', display: 'flex', gap: '8px', marginTop: '2px' }}>
                                                            <span>Brand: {p.brand || 'N/A'}</span>
                                                            <span>SKU: {p.sku}</span>
                                                        </div>
                                                    </div>

                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                        <div style={{ textAlign: 'right' }}>
                                                            <div style={{ fontWeight: '700', fontSize: '13px', color: '#0f172a' }}>
                                                                {formatMoney(p.salePrice)}
                                                            </div>
                                                            <span style={{
                                                                display: 'inline-block',
                                                                fontSize: '10px',
                                                                fontWeight: '700',
                                                                padding: '2px 6px',
                                                                borderRadius: '4px',
                                                                marginTop: '2px',
                                                                backgroundColor: isOutOfStock ? '#fee2e2' : p.currentStock <= p.reorderLevel ? '#fef3c7' : '#dcfce7',
                                                                color: isOutOfStock ? '#991b1b' : p.currentStock <= p.reorderLevel ? '#92400e' : '#166534'
                                                            }}>
                                                                {isOutOfStock ? 'Out of Stock' : `In Stock: ${p.currentStock}`}
                                                            </span>
                                                        </div>

                                                        <button
                                                            type="button"
                                                            disabled={isOutOfStock}
                                                            onClick={() => handleAddToCart(p)}
                                                            style={{
                                                                padding: '6px 12px',
                                                                fontSize: '12px',
                                                                fontWeight: '600',
                                                                borderRadius: '6px',
                                                                border: 'none',
                                                                cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                                                                backgroundColor: isOutOfStock ? '#e2e8f0' : '#b4833e',
                                                                color: isOutOfStock ? '#94a3b8' : '#ffffff',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '4px'
                                                            }}
                                                        >
                                                            <Plus size={14} /> Add
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Right Side: Cart, Summary & Checkout */}
                        <div style={{
                            padding: '20px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '16px',
                            overflowY: 'auto',
                            backgroundColor: '#ffffff'
                        }}>
                            {/* Cart Line Items */}
                            <div style={{ flex: 1, minHeight: '180px' }}>
                                <h3 style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#334155', fontWeight: '700' }}>
                                    Selected Items Cart ({cart.length})
                                </h3>

                                {cart.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8', fontSize: '13px' }}>
                                        Cart is empty. Select products from catalog on left.
                                    </div>
                                ) : (
                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                                        <thead>
                                            <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', textAlign: 'left' }}>
                                                <th style={{ padding: '6px 0' }}>Product</th>
                                                <th style={{ padding: '6px 0', textAlign: 'center' }}>Qty</th>
                                                <th style={{ padding: '6px 0', textAlign: 'right' }}>Price</th>
                                                <th style={{ padding: '6px 0', textAlign: 'right' }}>Total</th>
                                                <th style={{ padding: '6px 0', textAlign: 'center' }}></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {cart.map(item => (
                                                <tr key={item.product.id} style={{ borderBottom: '1px dotted #e2e8f0' }}>
                                                    <td style={{ padding: '8px 0', fontWeight: '500', color: '#1e293b' }}>
                                                        {item.product.name}
                                                    </td>
                                                    <td style={{ padding: '8px 0', textAlign: 'center' }}>
                                                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleUpdateQuantity(item.product.id, -1)}
                                                                style={{ background: '#f1f5f9', border: 'none', borderRadius: '4px', cursor: 'pointer', padding: '2px 4px' }}
                                                            >
                                                                <Minus size={10} />
                                                            </button>
                                                            <span style={{ fontWeight: '700', width: '20px', textAlign: 'center' }}>{item.quantity}</span>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleUpdateQuantity(item.product.id, 1)}
                                                                style={{ background: '#f1f5f9', border: 'none', borderRadius: '4px', cursor: 'pointer', padding: '2px 4px' }}
                                                            >
                                                                <Plus size={10} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '8px 0', textAlign: 'right' }}>
                                                        {formatMoney(item.unitPrice)}
                                                    </td>
                                                    <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: '700' }}>
                                                        {formatMoney(item.lineTotal)}
                                                    </td>
                                                    <td style={{ padding: '8px 0', textAlign: 'center' }}>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRemoveFromCart(item.product.id)}
                                                            style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                                                        >
                                                            <Trash2 size={13} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>

                            {/* Summary Box */}
                            <div style={{
                                backgroundColor: '#f8fafc',
                                padding: '12px 16px',
                                borderRadius: '10px',
                                border: '1px solid #e2e8f0',
                                fontSize: '13px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '6px'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
                                    <span>Subtotal:</span>
                                    <span>{formatMoney(subtotal)}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
                                    <span>Tax (18% GST):</span>
                                    <span>{formatMoney(taxAmount)}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ color: '#64748b' }}>Discount Amount:</span>
                                    <input
                                        type="number"
                                        value={discountAmount}
                                        onChange={e => setDiscountAmount(e.target.value)}
                                        style={{ width: '80px', padding: '2px 6px', fontSize: '12px', textAlign: 'right', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                                    />
                                </div>
                                <div style={{
                                    display: 'flex',
                                    justify: 'space-between',
                                    fontWeight: '800',
                                    fontSize: '15px',
                                    color: '#78350f',
                                    borderTop: '1px solid #cbd5e1',
                                    paddingTop: '6px',
                                    marginTop: '4px'
                                }}>
                                    <span>Grand Total:</span>
                                    <span>{formatMoney(grandTotal)}</span>
                                </div>
                            </div>

                            {/* Payment Section */}
                            <div style={{
                                borderTop: '2px dashed #e2e8f0',
                                paddingTop: '12px'
                            }}>
                                <h4 style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#334155', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <CreditCard size={14} color="#b4833e" /> Collect Payments (Outstanding: {formatMoney(outstanding)})
                                </h4>

                                {payments.length > 0 && (
                                    <div style={{ marginBottom: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        {payments.map(p => (
                                            <div key={p.id} style={{
                                                display: 'flex',
                                                justify: 'space-between',
                                                alignItems: 'center',
                                                padding: '4px 8px',
                                                backgroundColor: '#fef3c7',
                                                borderRadius: '4px',
                                                fontSize: '11px'
                                            }}>
                                                <span>{p.paymentMode} {p.referenceNo ? `(Ref: ${p.referenceNo})` : ''}</span>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    <span style={{ fontWeight: '700' }}>{formatMoney(p.amount)}</span>
                                                    <button type="button" onClick={() => handleRemovePayment(p.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}>
                                                        <Trash2 size={11} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {outstanding > 0 && (
                                    <div style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
                                        <select
                                            value={paymentMode}
                                            onChange={e => setPaymentMode(e.target.value)}
                                            style={{ padding: '6px', fontSize: '11px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                                        >
                                            <option value="CASH">Cash</option>
                                            <option value="CARD">Card</option>
                                            <option value="UPI">UPI</option>
                                            <option value="NET_BANKING">Net Banking</option>
                                        </select>
                                        <input
                                            type="number"
                                            placeholder="Amount"
                                            value={paymentAmount}
                                            onChange={e => setPaymentAmount(e.target.value)}
                                            style={{ flex: 1, padding: '6px', fontSize: '11px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                                        />
                                        <input
                                            type="text"
                                            placeholder="Ref (Optional)"
                                            value={referenceNo}
                                            onChange={e => setReferenceNo(e.target.value)}
                                            style={{ flex: 1, padding: '6px', fontSize: '11px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                                        />
                                        <button
                                            type="button"
                                            onClick={handleAddPayment}
                                            style={{
                                                padding: '6px 10px',
                                                fontSize: '11px',
                                                fontWeight: '600',
                                                backgroundColor: '#f1f5f9',
                                                border: '1px solid #cbd5e1',
                                                borderRadius: '6px',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            + Add
                                        </button>
                                    </div>
                                )}

                                <button
                                    type="button"
                                    disabled={isSubmitting || cart.length === 0 || outstanding > 0.05}
                                    onClick={handleCompleteSale}
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        fontSize: '14px',
                                        fontWeight: '700',
                                        borderRadius: '8px',
                                        border: 'none',
                                        backgroundColor: (cart.length > 0 && outstanding <= 0.05) ? '#b4833e' : '#cbd5e1',
                                        color: (cart.length > 0 && outstanding <= 0.05) ? '#ffffff' : '#64748b',
                                        cursor: (cart.length > 0 && outstanding <= 0.05) ? 'pointer' : 'not-allowed',
                                        display: 'flex',
                                        justify: 'center',
                                        alignItems: 'center',
                                        gap: '8px',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    {isSubmitting ? 'Processing Sale...' : outstanding <= 0.05 ? 'Complete Sale & Generate Receipt' : `Collect Remaining ${formatMoney(outstanding)}`}
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* Step: SUCCESS (Printable Receipt Modal) */
                    <div style={{ padding: '30px', overflowY: 'auto' }}>
                        <div style={{
                            backgroundColor: '#fffbeb',
                            border: '1px solid #fde68a',
                            borderRadius: '12px',
                            padding: '24px',
                            maxWidth: '650px',
                            margin: '0 auto'
                        }}>
                            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                                <CheckCircle size={48} color="#b4833e" style={{ margin: '0 auto 10px auto' }} />
                                <h2 style={{ fontFamily: 'var(--font-serif)', color: '#78350f', margin: 0 }}>
                                    LUXEMANAGE SALON
                                </h2>
                                <p style={{ fontSize: '12px', color: '#92400e', margin: '4px 0 0 0' }}>
                                    Retail Sale Invoice Receipt
                                </p>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', borderBottom: '1px solid #fde68a', paddingBottom: '12px', marginBottom: '16px' }}>
                                <div>
                                    <strong>Invoice No:</strong> {completedInvoice?.invoiceNumber}<br />
                                    <strong>Customer:</strong> {completedInvoice?.customerName} ({completedInvoice?.customerMobile})
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <strong>Date:</strong> {completedInvoice?.createdAt ? new Date(completedInvoice.createdAt).toLocaleString() : new Date().toLocaleString()}<br />
                                    <strong>Status:</strong> <span style={{ color: '#166534', fontWeight: 'bold' }}>{completedInvoice?.paymentStatus}</span>
                                </div>
                            </div>

                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', marginBottom: '16px' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid #fde68a', textAlign: 'left', color: '#78350f' }}>
                                        <th style={{ padding: '6px 0' }}>Item</th>
                                        <th style={{ padding: '6px 0', textAlign: 'center' }}>Qty</th>
                                        <th style={{ padding: '6px 0', textAlign: 'right' }}>Unit Price</th>
                                        <th style={{ padding: '6px 0', textAlign: 'right' }}>Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {completedInvoice?.items?.map(item => (
                                        <tr key={item.id} style={{ borderBottom: '1px dotted #fde68a' }}>
                                            <td style={{ padding: '8px 0', fontWeight: '500' }}>{item.name}</td>
                                            <td style={{ padding: '8px 0', textAlign: 'center' }}>{item.quantity}</td>
                                            <td style={{ padding: '8px 0', textAlign: 'right' }}>{formatMoney(item.unitPrice)}</td>
                                            <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: '700' }}>{formatMoney(item.lineTotal)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #fde68a', paddingTop: '10px', fontSize: '13px' }}>
                                <div style={{ width: '220px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span>Subtotal:</span>
                                        <span>{formatMoney(completedInvoice?.subtotal)}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span>Tax (GST):</span>
                                        <span>{formatMoney(completedInvoice?.taxAmount)}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '800', fontSize: '15px', color: '#78350f', borderTop: '1px solid #fde68a', paddingTop: '4px' }}>
                                        <span>Grand Total:</span>
                                        <span>{formatMoney(completedInvoice?.totalAmount)}</span>
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '24px' }}>
                                <button
                                    type="button"
                                    onClick={() => window.print()}
                                    style={{
                                        padding: '10px 20px',
                                        fontSize: '13px',
                                        fontWeight: '700',
                                        borderRadius: '8px',
                                        backgroundColor: '#b4833e',
                                        color: '#ffffff',
                                        border: 'none',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px'
                                    }}
                                >
                                    <Printer size={16} /> Print Invoice
                                </button>
                                <button
                                    type="button"
                                    onClick={onClose}
                                    style={{
                                        padding: '10px 20px',
                                        fontSize: '13px',
                                        fontWeight: '600',
                                        borderRadius: '8px',
                                        backgroundColor: '#f1f5f9',
                                        color: '#475569',
                                        border: '1px solid #cbd5e1',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Close POS
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
