package com.example.salonManagement.service_catalog.dto;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.util.List;

public record PackageRequest(
        @NotBlank(message = "Package name is required")
        @Size(max = 150, message = "Package name cannot exceed 150 characters")
        String name,
        
        @NotNull(message = "Package price is required")
        @DecimalMin(value = "0.0", inclusive = false, message = "Package price must be greater than zero")
        BigDecimal packagePrice,
        
        @NotNull(message = "GST percent is required")
        @DecimalMin(value = "0.0", inclusive = true, message = "GST percent cannot be negative")
        BigDecimal gstPercent,
        
        @NotEmpty(message = "Package must contain at least one service")
        List<Long> serviceIds,
        
        Boolean active
) {}
