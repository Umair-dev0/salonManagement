package com.example.salonManagement.commission.dto;

import com.example.salonManagement.commission.CommissionRule;

import java.util.Map;

public record CommissionRuleResponse(
        Long id,
        Long userId,
        Long serviceId,
        String ruleType,
        Map<String, Object> config,
        boolean active
) {
    // Entity se Response DTO me convert karne ke liye helper method
    public static CommissionRuleResponse from(CommissionRule rule) {
        return new CommissionRuleResponse(
                rule.getId(),
                rule.getUserId(),
                rule.getServiceId(),
                rule.getRuleType(),
                rule.getConfig(),
                rule.isActive()
        );
    }
}
