package com.example.salonManagement.inventory;

import com.example.salonManagement.common.ApiResponse;
import com.example.salonManagement.inventory.dto.PurchaseOrderRequest;
import com.example.salonManagement.inventory.dto.PurchaseOrderResponse;
import com.example.salonManagement.inventory.dto.PurchaseOrderStatusUpdateRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/purchase-orders")
@RequiredArgsConstructor
public class PurchaseOrderController {

    private final InventoryService inventoryService;

    @PostMapping
    @PreAuthorize("hasAnyRole('OWNER', 'MANAGER')")
    public ApiResponse<PurchaseOrderResponse> createPurchaseOrder(@Valid @RequestBody PurchaseOrderRequest request) {
        return ApiResponse.ok(inventoryService.createPurchaseOrder(request));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('OWNER', 'MANAGER')")
    public ApiResponse<Page<PurchaseOrderResponse>> getPurchaseOrders(
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size);
        return ApiResponse.ok(inventoryService.getPurchaseOrders(pageable));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('OWNER', 'MANAGER')")
    public ApiResponse<PurchaseOrderResponse> getPurchaseOrder(@PathVariable Long id) {
        return ApiResponse.ok(inventoryService.getPurchaseOrder(id));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('OWNER', 'MANAGER')")
    public ApiResponse<PurchaseOrderResponse> updatePurchaseOrderStatus(
            @PathVariable Long id,
            @Valid @RequestBody PurchaseOrderStatusUpdateRequest request) {
        return ApiResponse.ok(inventoryService.updatePurchaseOrderStatus(id, request));
    }
}
