package com.example.salonManagement.membership.dto;

public record SubscribeMembershipRequest(
        Long customerId,
        Long planId
) {}
