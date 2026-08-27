package com.example.salonManagement.inventory.dto;

import com.example.salonManagement.inventory.PaymentStatus;
import com.example.salonManagement.inventory.PurchaseOrderStatus;
import jakarta.validation.constraints.NotNull;

public record PurchaseOrderStatusUpdateRequest(
        @NotNull(message = "Purchase order status is required")
        PurchaseOrderStatus status,

        PaymentStatus paymentStatus
) {}
