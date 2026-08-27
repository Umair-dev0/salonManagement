package com.example.salonManagement.inventory.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record ProductRequest(
        @NotBlank(message = "SKU is required")
        @Size(max = 50, message = "SKU cannot exceed 50 characters")
        String sku,

        @NotBlank(message = "Product name is required")
        @Size(max = 150, message = "Product name cannot exceed 150 characters")
        String name,

        @Size(max = 100, message = "Brand name cannot exceed 100 characters")
        String brand,

        @Size(max = 100, message = "Category name cannot exceed 100 characters")
        String category,

        @NotNull(message = "Purchase price is required")
        @DecimalMin(value = "0.0", inclusive = true, message = "Purchase price cannot be negative")
        BigDecimal purchasePrice,

        @NotNull(message = "MRP is required")
        @DecimalMin(value = "0.0", inclusive = true, message = "MRP cannot be negative")
        BigDecimal mrp,

        @NotNull(message = "Sale price is required")
        @DecimalMin(value = "0.0", inclusive = true, message = "Sale price cannot be negative")
        BigDecimal salePrice,

        @NotNull(message = "GST percent is required")
        @DecimalMin(value = "0.0", inclusive = true, message = "GST percent cannot be negative")
        @DecimalMax(value = "100.0", message = "GST percent cannot exceed 100%")
        BigDecimal gstPercent,

        @DecimalMin(value = "0.0", inclusive = true, message = "Initial stock cannot be negative")
        BigDecimal initialStock,

        @NotNull(message = "Reorder level is required")
        @DecimalMin(value = "0.0", inclusive = true, message = "Reorder level cannot be negative")
        BigDecimal reorderLevel,

        Boolean active
) {}
