package com.example.salonManagement.service_catalog.dto;

import com.example.salonManagement.service_catalog.ServicePackage;
import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

public record PackageResponse(
        Long id,
        String name,
        BigDecimal packagePrice,
        BigDecimal gstPercent,
        boolean active,
        List<ServiceResponse> services
) {
    public static PackageResponse from(ServicePackage servicePackage) {
        return new PackageResponse(
                servicePackage.getId(),
                servicePackage.getName(),
                servicePackage.getPackagePrice(),
                servicePackage.getGstPercent(),
                servicePackage.isActive(),
                servicePackage.getItems() != null 
                    ? servicePackage.getItems().stream()
                        .map(item -> ServiceResponse.from(item.getService()))
                        .collect(Collectors.toList())
                    : Collections.emptyList()
        );
    }
}
