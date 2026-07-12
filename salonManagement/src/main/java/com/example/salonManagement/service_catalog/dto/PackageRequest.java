package com.example.salonManagement.service_catalog.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.List;

public record PackageRequest(
        @NotBlank(message = "Package name is required") String name,
        @NotNull(message = "Package price is required") BigDecimal packagePrice,
        @NotNull(message = "GST percent is required") BigDecimal gstPercent,
        @NotEmpty(message = "At least one service ID must be provided") List<Long> serviceIds
) {}