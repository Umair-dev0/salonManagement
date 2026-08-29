package com.example.salonManagement.dashboard.dto;

import java.math.BigDecimal;

public record PaymentModeBreakdown(
        String paymentMode,
        BigDecimal amount,
        long count,
        BigDecimal percentage
) {}
