package com.example.salonManagement.inventory.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record ServiceConsumptionRequest(
        @NotNull(message = "Service ID is required")
        Long serviceId,

        @NotNull(message = "Product ID is required")
        Long productId,

        @NotNull(message = "Quantity used is required")
        @DecimalMin(value = "0.0001", message = "Quantity used must be greater than zero")
        BigDecimal quantityUsed
) {}
