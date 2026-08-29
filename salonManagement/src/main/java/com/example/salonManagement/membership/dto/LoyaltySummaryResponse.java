package com.example.salonManagement.membership.dto;

public record LoyaltySummaryResponse(
        Integer totalEarned,
        Integer totalRedeemed,
        Integer activeBalance
) {}
