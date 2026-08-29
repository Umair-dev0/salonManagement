import api from './axiosClient';

// ==========================================
// MEMBERSHIP PLANS
// ==========================================

export const getMembershipPlans = async () => {
    const response = await api.get('/membership-plans');
    return response.data;
};

export const createMembershipPlan = async (payload) => {
    const response = await api.post('/membership-plans', payload);
    return response.data;
};

export const updateMembershipPlan = async (id, payload) => {
    const response = await api.put(`/membership-plans/${id}`, payload);
    return response.data;
};

export const deleteMembershipPlan = async (id) => {
    const response = await api.delete(`/membership-plans/${id}`);
    return response.data;
};

// ==========================================
// CUSTOMER MEMBERSHIPS (SUBSCRIPTIONS)
// ==========================================

export const getCustomerMemberships = async () => {
    const response = await api.get('/customer-memberships');
    return response.data;
};

export const subscribeCustomerPlan = async (payload) => {
    const response = await api.post('/customer-memberships/subscribe', payload);
    return response.data;
};

export const getActiveCustomerMembership = async (customerId) => {
    try {
        const response = await api.get(`/customer-memberships/customer/${customerId}`);
        return response.data;
    } catch {
        return null;
    }
};

// ==========================================
// COUPONS & PROMO CODES
// ==========================================

export const getCoupons = async () => {
    const response = await api.get('/coupons');
    return response.data;
};

export const createCoupon = async (payload) => {
    const response = await api.post('/coupons', payload);
    return response.data;
};

export const updateCoupon = async (id, payload) => {
    const response = await api.put(`/coupons/${id}`, payload);
    return response.data;
};

export const deleteCoupon = async (id) => {
    const response = await api.delete(`/coupons/${id}`);
    return response.data;
};

export const validateCoupon = async (payload) => {
    const response = await api.post('/coupons/validate', payload);
    return response.data;
};

// ==========================================
// LOYALTY POINTS & LEDGER
// ==========================================

export const getAllLoyaltyLedger = async () => {
    const response = await api.get('/loyalty/ledger');
    return response.data;
};

export const getCustomerLoyaltyLedger = async (customerId) => {
    const response = await api.get(`/customers/${customerId}/loyalty/ledger`);
    return response.data;
};

export const redeemLoyaltyPoints = async (customerId, payload) => {
    const response = await api.post(`/customers/${customerId}/loyalty/redeem`, payload);
    return response.data;
};
