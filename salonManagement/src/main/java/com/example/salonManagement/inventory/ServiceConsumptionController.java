package com.example.salonManagement.inventory;

import com.example.salonManagement.common.ApiResponse;
import com.example.salonManagement.inventory.dto.ServiceConsumptionRequest;
import com.example.salonManagement.inventory.dto.ServiceConsumptionResponse;
import com.example.salonManagement.inventory.dto.StockMovementResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/service-consumptions")
@RequiredArgsConstructor
public class ServiceConsumptionController {

    private final InventoryService inventoryService;

    @PostMapping
    @PreAuthorize("hasAnyRole('OWNER', 'MANAGER')")
    public ApiResponse<ServiceConsumptionResponse> createServiceConsumption(
            @Valid @RequestBody ServiceConsumptionRequest request) {
        return ApiResponse.ok(inventoryService.createServiceConsumption(request));
    }

    @GetMapping("/service/{serviceId}")
    @PreAuthorize("hasAnyRole('OWNER', 'MANAGER', 'FRONT_DESK')")
    public ApiResponse<List<ServiceConsumptionResponse>> getServiceConsumptions(@PathVariable Long serviceId) {
        return ApiResponse.ok(inventoryService.getServiceConsumptions(serviceId));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('OWNER', 'MANAGER')")
    public ApiResponse<Void> deleteServiceConsumption(@PathVariable Long id) {
        inventoryService.deleteServiceConsumption(id);
        return new ApiResponse<>(true, null, "Service consumption mapping deleted successfully", null);
    }

    @PostMapping("/service/{serviceId}/consume")
    @PreAuthorize("hasAnyRole('OWNER', 'MANAGER', 'FRONT_DESK')")
    public ApiResponse<List<StockMovementResponse>> consumeStockForService(@PathVariable Long serviceId) {
        return ApiResponse.ok(inventoryService.consumeStockForService(serviceId));
    }
}
