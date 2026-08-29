package com.example.salonManagement.membership.dto;

import java.math.BigDecimal;

public record MembershipPlanRequest(
        String name,
        String tier,
        BigDecimal price,
        BigDecimal discountPercent,
        BigDecimal walletValue,
        Integer validityDays
) {}
