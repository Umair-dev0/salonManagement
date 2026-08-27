package com.example.salonManagement.inventory.dto;

import com.example.salonManagement.inventory.PaymentStatus;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.util.List;

public record PurchaseOrderRequest(
        @NotNull(message = "Supplier ID is required")
        Long supplierId,

        LocalDate orderDate,

        @NotEmpty(message = "Purchase order must contain at least one line item")
        @Valid
        List<PurchaseOrderItemRequest> items,

        PaymentStatus paymentStatus
) {}
