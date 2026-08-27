package com.example.salonManagement.inventory.dto;

import com.example.salonManagement.inventory.Product;

import java.math.BigDecimal;
import java.time.ZonedDateTime;

public record ProductResponse(
        Long id,
        String sku,
        String name,
        String brand,
        String category,
        BigDecimal purchasePrice,
        BigDecimal mrp,
        BigDecimal salePrice,
        BigDecimal gstPercent,
        BigDecimal currentStock,
        BigDecimal reorderLevel,
        boolean isLowStock,
        boolean active,
        ZonedDateTime createdAt,
        ZonedDateTime updatedAt
) {
    public static ProductResponse from(Product product) {
        boolean lowStock = product.getCurrentStock() != null 
                && product.getReorderLevel() != null 
                && product.getCurrentStock().compareTo(product.getReorderLevel()) <= 0;

        return new ProductResponse(
                product.getId(),
                product.getSku(),
                product.getName(),
                product.getBrand(),
                product.getCategory(),
                product.getPurchasePrice(),
                product.getMrp(),
                product.getSalePrice(),
                product.getGstPercent(),
                product.getCurrentStock(),
                product.getReorderLevel(),
                lowStock,
                product.isActive(),
                product.getCreatedAt(),
                product.getUpdatedAt()
        );
    }
}
