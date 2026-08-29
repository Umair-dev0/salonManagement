package com.example.salonManagement.marketing.dto;

import java.math.BigDecimal;

public record CouponValidationResponse(
        boolean valid,
        String message,
        String discountType,
        BigDecimal value,
        BigDecimal discountAmount,
        Long couponId,
        String code
) {}
