package com.example.salonManagement.service_catalog;

import com.example.salonManagement.common.ApiResponse;
import com.example.salonManagement.service_catalog.dto.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class ServiceCatalogController {

    private final ServiceCatalogService serviceCatalogService;

    // ==========================================
    // 1. CATEGORY ENDPOINTS
    // ==========================================

    @GetMapping("/service-categories")
    @PreAuthorize("hasAnyRole('OWNER', 'MANAGER', 'FRONT_DESK', 'THERAPIST')")
    public ApiResponse<List<CategoryResponse>> getCategoryTree() {
        return ApiResponse.ok(serviceCatalogService.getCategoryTree());
    }

    @PostMapping("/service-categories")
    @PreAuthorize("hasAnyRole('OWNER', 'MANAGER')")
    public ApiResponse<CategoryResponse> createCategory(@Valid @RequestBody CategoryRequest request) {
        return ApiResponse.ok(serviceCatalogService.createCategory(request));
    }

    @PutMapping("/service-categories/{id}")
    @PreAuthorize("hasAnyRole('OWNER', 'MANAGER')")
    public ApiResponse<CategoryResponse> updateCategory(
            @PathVariable Long id,
            @Valid @RequestBody CategoryRequest request) {
        return ApiResponse.ok(serviceCatalogService.updateCategory(id, request));
    }

    @DeleteMapping("/service-categories/{id}")
    @PreAuthorize("hasAnyRole('OWNER', 'MANAGER')")
    public ApiResponse<Void> deleteCategory(@PathVariable Long id) {
        serviceCatalogService.deleteCategory(id);
        return new ApiResponse<>(true, null, "Category deleted successfully", null);
    }

    // ==========================================
    // 2. SERVICE ENDPOINTS
    // ==========================================

    @GetMapping("/services")
    @PreAuthorize("hasAnyRole('OWNER', 'MANAGER', 'FRONT_DESK', 'THERAPIST')")
    public ApiResponse<List<ServiceResponse>> getServices(
            @RequestParam(value = "includeInactive", required = false, defaultValue = "false") boolean includeInactive) {
        if (includeInactive) {
            return ApiResponse.ok(serviceCatalogService.getAllServices());
        }
        return ApiResponse.ok(serviceCatalogService.getActiveServices());
    }

    @PostMapping("/services")
    @PreAuthorize("hasAnyRole('OWNER', 'MANAGER')")
    public ApiResponse<ServiceResponse> createService(@Valid @RequestBody ServiceRequest request) {
        return ApiResponse.ok(serviceCatalogService.createService(request));
    }

    @PutMapping("/services/{id}")
    @PreAuthorize("hasAnyRole('OWNER', 'MANAGER')")
    public ApiResponse<ServiceResponse> updateService(
            @PathVariable Long id,
            @Valid @RequestBody ServiceRequest request) {
        return ApiResponse.ok(serviceCatalogService.updateService(id, request));
    }

    @DeleteMapping("/services/{id}")
    @PreAuthorize("hasAnyRole('OWNER', 'MANAGER')")
    public ApiResponse<Void> deactivateService(@PathVariable Long id) {
        serviceCatalogService.deactivateService(id);
        return new ApiResponse<>(true, null, "Service deactivated successfully", null);
    }

    // ==========================================
    // 3. COMBO PACKAGE ENDPOINTS
    // ==========================================

    @GetMapping("/service-packages")
    @PreAuthorize("hasAnyRole('OWNER', 'MANAGER', 'FRONT_DESK', 'THERAPIST')")
    public ApiResponse<List<PackageResponse>> getPackages(
            @RequestParam(value = "includeInactive", required = false, defaultValue = "false") boolean includeInactive) {
        if (includeInactive) {
            return ApiResponse.ok(serviceCatalogService.getAllPackages());
        }
        return ApiResponse.ok(serviceCatalogService.getActivePackages());
    }

    @PostMapping("/service-packages")
    @PreAuthorize("hasAnyRole('OWNER', 'MANAGER')")
    public ApiResponse<PackageResponse> createPackage(@Valid @RequestBody PackageRequest request) {
        return ApiResponse.ok(serviceCatalogService.createPackage(request));
    }

    @PutMapping("/service-packages/{id}")
    @PreAuthorize("hasAnyRole('OWNER', 'MANAGER')")
    public ApiResponse<PackageResponse> updatePackage(
            @PathVariable Long id,
            @Valid @RequestBody PackageRequest request) {
        return ApiResponse.ok(serviceCatalogService.updatePackage(id, request));
    }

    @DeleteMapping("/service-packages/{id}")
    @PreAuthorize("hasAnyRole('OWNER', 'MANAGER')")
    public ApiResponse<Void> deactivatePackage(@PathVariable Long id) {
        serviceCatalogService.deactivatePackage(id);
        return new ApiResponse<>(true, null, "Package deactivated successfully", null);
    }
}
