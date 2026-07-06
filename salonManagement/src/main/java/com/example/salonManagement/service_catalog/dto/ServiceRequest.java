package com.example.salonManagement.service_catalog.dto;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;

public record ServiceRequest(
        @NotNull(message = "Category ID is required")
        Long categoryId,
        
        @NotBlank(message = "Service name is required")
        @Size(max = 150, message = "Service name cannot exceed 150 characters")
        String name,
        
        String description,
        
        @NotNull(message = "Base price is required")
        @DecimalMin(value = "0.0", inclusive = false, message = "Base price must be greater than zero")
        BigDecimal basePrice,
        
        @DecimalMin(value = "0.0", inclusive = true, message = "Member price must be positive")
        BigDecimal memberPrice,
        
        @DecimalMin(value = "0.0", inclusive = true, message = "Weekend price must be positive")
        BigDecimal weekendPrice,
        
        @NotNull(message = "Duration in minutes is required")
        @Min(value = 1, message = "Duration must be at least 1 minute")
        Integer durationMinutes,
        
        @NotNull(message = "GST percent is required")
        @DecimalMin(value = "0.0", inclusive = true, message = "GST percent cannot be negative")
        BigDecimal gstPercent,
        
        Boolean active
) {}
