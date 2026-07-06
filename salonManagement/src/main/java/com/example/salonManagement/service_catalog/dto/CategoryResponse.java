package com.example.salonManagement.service_catalog.dto;

import com.example.salonManagement.service_catalog.ServiceCategory;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

public record CategoryResponse(
        Long id,
        String name,
        Long parentId,
        String parentName,
        List<CategoryResponse> subCategories
) {
    public static CategoryResponse from(ServiceCategory category) {
        return new CategoryResponse(
                category.getId(),
                category.getName(),
                category.getParent() != null ? category.getParent().getId() : null,
                category.getParent() != null ? category.getParent().getName() : null,
                category.getSubCategories() != null 
                    ? category.getSubCategories().stream().map(CategoryResponse::from).collect(Collectors.toList())
                    : Collections.emptyList()
        );
    }
}
