package com.example.salonManagement.inventory.dto;

import com.example.salonManagement.inventory.MovementType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record StockMovementRequest(
        @NotNull(message = "Movement type is required")
        MovementType movementType,

        @NotNull(message = "Quantity is required")
        @DecimalMin(value = "0.0001", message = "Quantity must be greater than zero")
        BigDecimal quantity,

        @Size(max = 100, message = "Reference cannot exceed 100 characters")
        String reference,

        @Size(max = 150, message = "Reason cannot exceed 150 characters")
        String reason
) {}
