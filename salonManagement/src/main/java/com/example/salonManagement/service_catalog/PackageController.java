package com.example.salonManagement.service_catalog;

import com.example.salonManagement.common.ApiResponse;
import com.example.salonManagement.service_catalog.dto.PackageRequest;
import com.example.salonManagement.service_catalog.dto.PackageResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/packages")
@RequiredArgsConstructor
public class PackageController {

    private final PackageService packageService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('OWNER')")
    public ApiResponse<PackageResponse> createPackage(@Valid @RequestBody PackageRequest req) {
        return ApiResponse.ok(packageService.createPackage(req));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('OWNER', 'MANAGER')")
    public ApiResponse<PackageResponse> updatePackage(
            @PathVariable Long id,
            @Valid @RequestBody PackageRequest req) {
        return ApiResponse.ok(packageService.updatePackage(id, req));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasAnyRole('OWNER')")
    public ApiResponse<Void> deletePackage(@PathVariable Long id) {
        packageService.deletePackage(id);
        return ApiResponse.ok(null);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('OWNER', 'MANAGER', 'FRONT_DESK', 'THERAPIST')")
    public ApiResponse<List<PackageResponse>> getAllPackages(
            @RequestParam(required = false, defaultValue = "false") boolean all) {
        if (all) {
            return ApiResponse.ok(packageService.getAllPackages());
        }
        return ApiResponse.ok(packageService.getAllActivePackages());
    }

    @PatchMapping("/{id}/restore")
    @PreAuthorize("hasAnyRole('OWNER')")
    public ApiResponse<PackageResponse> restorePackage(@PathVariable Long id) {
        return ApiResponse.ok(packageService.restorePackage(id));
    }
}