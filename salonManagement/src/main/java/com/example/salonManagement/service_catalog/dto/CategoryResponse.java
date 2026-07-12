package com.example.salonManagement.service_catalog.dto;

import com.example.salonManagement.service_catalog.ServiceCategory;
import java.util.ArrayList;
import java.util.List;

public record CategoryResponse(
        Long id,
        String name,
        Long parentId,
        List<CategoryResponse> subCategories
) {
    public static CategoryResponse from(ServiceCategory category) {
        return new CategoryResponse(
                category.getId(),
                category.getName(),
                category.getParentId(),
                new ArrayList<>() // Initialize empty list for sub-categories
        );
    }
}