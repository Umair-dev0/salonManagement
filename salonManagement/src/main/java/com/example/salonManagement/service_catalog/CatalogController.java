package com.example.salonManagement.service_catalog;

// Ye import check kar lena ki aapke structure ke hisaab se sahi ho
import com.example.salonManagement.common.ApiResponse;
import com.example.salonManagement.service_catalog.dto.ServiceRequest;
import com.example.salonManagement.service_catalog.dto.ServiceResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/services")
@RequiredArgsConstructor
public class CatalogController {

    private final CatalogService catalogService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED) // 201 Created for new resource
    @PreAuthorize("hasAnyRole('OWNER', 'MANAGER')")
    public ApiResponse<ServiceResponse> createService(@Valid @RequestBody ServiceRequest req) {
        // Assuming your ApiResponse class has a success/ok method
        return ApiResponse.ok(catalogService.createService(req));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('OWNER', 'MANAGER', 'FRONT_DESK', 'THERAPIST')")
    public ApiResponse<List<ServiceResponse>> getAllServices() {
        return ApiResponse.ok(catalogService.getAllActiveServices());
    }
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('OWNER')")
    public ApiResponse<ServiceResponse> updateService(
            @PathVariable Long id,
            @Valid @RequestBody ServiceRequest req) {
        return ApiResponse.ok(catalogService.updateService(id, req));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('OWNER')")
    public ApiResponse<Void> deleteService(@PathVariable Long id) {
        catalogService.deleteService(id);
        // Returning a standard success envelope even with 204 No Content
        return ApiResponse.ok(null);
    }
}