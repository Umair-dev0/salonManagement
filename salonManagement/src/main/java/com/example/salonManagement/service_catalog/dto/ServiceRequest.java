package com.example.salonManagement.service_catalog.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

public record ServiceRequest(
        @NotNull(message = "Category ID is required") Long categoryId,

        @NotBlank(message = "Service name is required")
        @Size(max = 150) String name,

        String description,

        @NotNull(message = "Base price is required") BigDecimal basePrice,

        BigDecimal memberPrice,
        BigDecimal weekendPrice,

        @NotNull(message = "Duration is required") Integer durationMinutes,

        @NotNull(message = "GST percent is required") BigDecimal gstPercent
) {}