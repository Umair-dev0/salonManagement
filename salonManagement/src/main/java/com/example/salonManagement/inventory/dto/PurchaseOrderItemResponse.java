package com.example.salonManagement.inventory.dto;

import com.example.salonManagement.inventory.PurchaseOrderItem;

import java.math.BigDecimal;

public record PurchaseOrderItemResponse(
        Long id,
        Long productId,
        String productSku,
        String productName,
        BigDecimal quantity,
        BigDecimal unitPrice,
        BigDecimal totalPrice
) {
    public static PurchaseOrderItemResponse from(PurchaseOrderItem item) {
        BigDecimal total = item.getQuantity() != null && item.getUnitPrice() != null
                ? item.getQuantity().multiply(item.getUnitPrice())
                : BigDecimal.ZERO;

        return new PurchaseOrderItemResponse(
                item.getId(),
                item.getProduct() != null ? item.getProduct().getId() : null,
                item.getProduct() != null ? item.getProduct().getSku() : null,
                item.getProduct() != null ? item.getProduct().getName() : null,
                item.getQuantity(),
                item.getUnitPrice(),
                total
        );
    }
}
