package com.example.salonManagement.service_catalog.dto;

import com.example.salonManagement.service_catalog.Service;
import java.math.BigDecimal;

public record ServiceResponse(
        Long id,
        Long categoryId,
        String categoryName,
        String name,
        String description,
        BigDecimal basePrice,
        BigDecimal memberPrice,
        BigDecimal weekendPrice,
        Integer durationMinutes,
        BigDecimal gstPercent,
        boolean active
) {
    public static ServiceResponse from(Service service) {
        return new ServiceResponse(
                service.getId(),
                service.getCategory().getId(),
                service.getCategory().getName(),
                service.getName(),
                service.getDescription(),
                service.getBasePrice(),
                service.getMemberPrice(),
                service.getWeekendPrice(),
                service.getDurationMinutes(),
                service.getGstPercent(),
                service.isActive()
        );
    }
}
