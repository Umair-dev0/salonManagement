package com.example.salonManagement.marketing.dto;

import com.example.salonManagement.marketing.Coupon;

import java.math.BigDecimal;
import java.time.ZonedDateTime;

public record CouponResponse(
        Long id,
        String code,
        String discountType,
        BigDecimal value,
        BigDecimal minBillAmount,
        BigDecimal maxDiscount,
        Integer maxUses,
        Integer usedCount,
        ZonedDateTime validFrom,
        ZonedDateTime validTo,
        boolean active
) {
    public static CouponResponse from(Coupon coupon) {
        return new CouponResponse(
                coupon.getId(),
                coupon.getCode(),
                coupon.getDiscountType(),
                coupon.getValue(),
                coupon.getMinBillAmount(),
                coupon.getMaxDiscount(),
                coupon.getMaxUses(),
                coupon.getUsedCount(),
                coupon.getValidFrom(),
                coupon.getValidTo(),
                coupon.isActive()
        );
    }
}
