package com.example.salonManagement.inventory.dto;

import com.example.salonManagement.inventory.ServiceConsumption;

import java.math.BigDecimal;
import java.time.ZonedDateTime;

public record ServiceConsumptionResponse(
        Long id,
        Long serviceId,
        Long productId,
        String productSku,
        String productName,
        BigDecimal quantityUsed,
        ZonedDateTime createdAt,
        ZonedDateTime updatedAt
) {
    public static ServiceConsumptionResponse from(ServiceConsumption consumption) {
        return new ServiceConsumptionResponse(
                consumption.getId(),
                consumption.getServiceId(),
                consumption.getProduct() != null ? consumption.getProduct().getId() : null,
                consumption.getProduct() != null ? consumption.getProduct().getSku() : null,
                consumption.getProduct() != null ? consumption.getProduct().getName() : null,
                consumption.getQuantityUsed(),
                consumption.getCreatedAt(),
                consumption.getUpdatedAt()
        );
    }
}
