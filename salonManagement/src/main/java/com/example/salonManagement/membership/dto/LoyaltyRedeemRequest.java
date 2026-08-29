package com.example.salonManagement.membership.dto;

public record LoyaltyRedeemRequest(
        Long invoiceId,
        Integer points
) {}
