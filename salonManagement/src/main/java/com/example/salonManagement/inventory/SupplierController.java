package com.example.salonManagement.inventory;

import com.example.salonManagement.common.ApiResponse;
import com.example.salonManagement.inventory.dto.SupplierRequest;
import com.example.salonManagement.inventory.dto.SupplierResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/suppliers")
@RequiredArgsConstructor
public class SupplierController {

    private final InventoryService inventoryService;

    @PostMapping
    @PreAuthorize("hasAnyRole('OWNER', 'MANAGER')")
    public ApiResponse<SupplierResponse> createSupplier(@Valid @RequestBody SupplierRequest request) {
        return ApiResponse.ok(inventoryService.createSupplier(request));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('OWNER', 'MANAGER')")
    public ApiResponse<List<SupplierResponse>> getAllSuppliers() {
        return ApiResponse.ok(inventoryService.getAllSuppliers());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('OWNER', 'MANAGER')")
    public ApiResponse<SupplierResponse> getSupplier(@PathVariable Long id) {
        return ApiResponse.ok(inventoryService.getSupplier(id));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('OWNER', 'MANAGER')")
    public ApiResponse<SupplierResponse> updateSupplier(
            @PathVariable Long id,
            @Valid @RequestBody SupplierRequest request) {
        return ApiResponse.ok(inventoryService.updateSupplier(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('OWNER', 'MANAGER')")
    public ApiResponse<Void> deleteSupplier(@PathVariable Long id) {
        inventoryService.softDeleteSupplier(id);
        return new ApiResponse<>(true, null, "Supplier deleted successfully", null);
    }
}
