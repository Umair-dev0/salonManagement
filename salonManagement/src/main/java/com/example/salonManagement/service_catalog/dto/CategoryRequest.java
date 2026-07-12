package com.example.salonManagement.service_catalog.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CategoryRequest(
        @NotBlank(message = "Category name is required")
        @Size(max = 120) String name,

        Long parentId // Nullable for top-level categories
) {}