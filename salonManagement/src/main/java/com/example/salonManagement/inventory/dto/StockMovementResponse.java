package com.example.salonManagement.inventory.dto;

import com.example.salonManagement.inventory.MovementType;
import com.example.salonManagement.inventory.StockMovement;

import java.math.BigDecimal;
import java.time.ZonedDateTime;

public record StockMovementResponse(
        Long id,
        Long productId,
        String productSku,
        String productName,
        MovementType movementType,
        BigDecimal quantity,
        String reference,
        String reason,
        ZonedDateTime createdAt
) {
    public static StockMovementResponse from(StockMovement movement) {
        return new StockMovementResponse(
                movement.getId(),
                movement.getProduct() != null ? movement.getProduct().getId() : null,
                movement.getProduct() != null ? movement.getProduct().getSku() : null,
                movement.getProduct() != null ? movement.getProduct().getName() : null,
                movement.getMovementType(),
                movement.getQuantity(),
                movement.getReference(),
                movement.getReason(),
                movement.getCreatedAt()
        );
    }
}
