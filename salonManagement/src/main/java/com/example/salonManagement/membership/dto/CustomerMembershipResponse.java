package com.example.salonManagement.membership.dto;

import com.example.salonManagement.membership.CustomerMembership;

import java.math.BigDecimal;
import java.time.ZonedDateTime;

public record CustomerMembershipResponse(
        Long id,
        Long customerId,
        String customerName,
        String customerMobile,
        Long planId,
        String planName,
        String tier,
        BigDecimal discountPercent,
        ZonedDateTime startDate,
        ZonedDateTime expiryDate,
        BigDecimal walletBalance,
        String status
) {
    public static CustomerMembershipResponse from(CustomerMembership cm) {
        return new CustomerMembershipResponse(
                cm.getId(),
                cm.getCustomer().getId(),
                cm.getCustomer().getFullName(),
                cm.getCustomer().getMobile(),
                cm.getPlan().getId(),
                cm.getPlan().getName(),
                cm.getPlan().getTier(),
                cm.getPlan().getDiscountPercent(),
                cm.getStartDate(),
                cm.getExpiryDate(),
                cm.getWalletBalance(),
                cm.getStatus()
        );
    }
}
