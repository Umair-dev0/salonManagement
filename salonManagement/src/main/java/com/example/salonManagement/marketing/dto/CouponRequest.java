package com.example.salonManagement.marketing.dto;

import java.math.BigDecimal;
import java.time.ZonedDateTime;

public record CouponRequest(
        String code,
        String discountType,
        BigDecimal value,
        BigDecimal minBillAmount,
        BigDecimal maxDiscount,
        Integer maxUses,
        ZonedDateTime validFrom,
        ZonedDateTime validTo
) {}
