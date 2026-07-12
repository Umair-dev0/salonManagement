package com.example.salonManagement.service_catalog;

import com.example.salonManagement.common.ApiResponse;
import com.example.salonManagement.service_catalog.dto.CategoryRequest;
import com.example.salonManagement.service_catalog.dto.CategoryResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/service-categories")
@RequiredArgsConstructor
public class ServiceCategoryController {

    private final CatalogService catalogService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('OWNER', 'MANAGER')") // Sirf admin/manager bana sakte hain
    public ApiResponse<CategoryResponse> createCategory(@Valid @RequestBody CategoryRequest req) {
        return ApiResponse.ok(catalogService.createCategory(req));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('OWNER', 'MANAGER', 'FRONT_DESK', 'THERAPIST')") // Sab log dekh sakte hain
    public ApiResponse<List<CategoryResponse>> getCategoryTree() {
        return ApiResponse.ok(catalogService.getCategoryTree());
    }
}