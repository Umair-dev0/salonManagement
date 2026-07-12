package com.example.salonManagement.service_catalog.dto;

import com.example.salonManagement.service_catalog.Service;
import java.math.BigDecimal;

public record ServiceResponse(
        Long id,
        Long categoryId,
        String name,
        String description,
        BigDecimal basePrice,
        BigDecimal memberPrice,
        BigDecimal weekendPrice,
        Integer durationMinutes,
        BigDecimal gstPercent,
        boolean isActive
) {
    public static ServiceResponse from(Service s) {
        return new ServiceResponse(
                s.getId(), s.getCategoryId(), s.getName(),
                s.getDescription(), s.getBasePrice(),
                s.getMemberPrice(), s.getWeekendPrice(),
                s.getDurationMinutes(), s.getGstPercent(), s.isActive()
        );
    }
}