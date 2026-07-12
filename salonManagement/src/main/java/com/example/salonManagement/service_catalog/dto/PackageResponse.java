package com.example.salonManagement.service_catalog.dto;

import com.example.salonManagement.service_catalog.ServicePackage;
import java.math.BigDecimal;
import java.util.List;

public record PackageResponse(
        Long id,
        String name,
        BigDecimal packagePrice,
        BigDecimal gstPercent,
        boolean isActive,
        Integer totalDurationMinutes,
        List<Long> serviceIds // List of attached base services
) {
    public static PackageResponse from(ServicePackage pkg, List<Long> serviceIds, Integer totalDurationMinutes) {
        return new PackageResponse(
                pkg.getId(),
                pkg.getName(),
                pkg.getPackagePrice(),
                pkg.getGstPercent(),
                pkg.isActive(),
                totalDurationMinutes,
                serviceIds
        );
    }
}