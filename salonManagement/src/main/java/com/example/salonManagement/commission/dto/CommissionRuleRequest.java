package com.example.salonManagement.commission.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.Map;

public record CommissionRuleRequest(
        Long userId,
        Long serviceId,

        @NotBlank(message = "Rule type is required")
        String ruleType,

        @NotNull(message = "Configuration cannot be null")
        Map<String, Object> config
) {}