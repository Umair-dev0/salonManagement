package com.example.salonManagement.marketing.dto;

import java.math.BigDecimal;

public record CouponValidateRequest(
        String code,
        Long customerId,
        BigDecimal billAmount
) {}
