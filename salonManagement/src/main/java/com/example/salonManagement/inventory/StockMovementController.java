package com.example.salonManagement.inventory;

import com.example.salonManagement.common.ApiResponse;
import com.example.salonManagement.inventory.dto.StockMovementRequest;
import com.example.salonManagement.inventory.dto.StockMovementResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping
@RequiredArgsConstructor
public class StockMovementController {

    private final InventoryService inventoryService;

    @PostMapping("/api/products/{productId}/movements")
    @PreAuthorize("hasAnyRole('OWNER', 'MANAGER')")
    public ApiResponse<StockMovementResponse> recordMovement(
            @PathVariable Long productId,
            @Valid @RequestBody StockMovementRequest request) {
        return ApiResponse.ok(inventoryService.recordMovement(productId, request));
    }

    @GetMapping("/api/products/{productId}/movements")
    @PreAuthorize("hasAnyRole('OWNER', 'MANAGER')")
    public ApiResponse<Page<StockMovementResponse>> getProductMovements(
            @PathVariable Long productId,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size);
        return ApiResponse.ok(inventoryService.getProductMovements(productId, pageable));
    }

    @GetMapping("/api/stock-movements")
    @PreAuthorize("hasAnyRole('OWNER', 'MANAGER')")
    public ApiResponse<Page<StockMovementResponse>> getAllMovements(
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size);
        return ApiResponse.ok(inventoryService.getAllMovements(pageable));
    }
}
