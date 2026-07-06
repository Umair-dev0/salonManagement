package com.example.salonManagement.service_catalog.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CategoryRequest(
        @NotBlank(message = "Category name cannot be blank")
        @Size(max = 120, message = "Category name cannot exceed 120 characters")
        String name,
        
        Long parentId
) {}
