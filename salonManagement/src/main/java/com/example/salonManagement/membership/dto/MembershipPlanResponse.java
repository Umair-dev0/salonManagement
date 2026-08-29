package com.example.salonManagement.membership.dto;

import com.example.salonManagement.membership.MembershipPlan;

import java.math.BigDecimal;

public record MembershipPlanResponse(
        Long id,
        String name,
        String tier,
        BigDecimal price,
        BigDecimal discountPercent,
        BigDecimal walletValue,
        Integer validityDays,
        boolean active
) {
    public static MembershipPlanResponse from(MembershipPlan plan) {
        return new MembershipPlanResponse(
                plan.getId(),
                plan.getName(),
                plan.getTier(),
                plan.getPrice(),
                plan.getDiscountPercent(),
                plan.getWalletValue(),
                plan.getValidityDays(),
                plan.isActive()
        );
    }
}
