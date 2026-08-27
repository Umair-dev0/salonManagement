package com.example.salonManagement.inventory.dto;

import com.example.salonManagement.inventory.PaymentStatus;
import com.example.salonManagement.inventory.PurchaseOrder;
import com.example.salonManagement.inventory.PurchaseOrderStatus;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZonedDateTime;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

public record PurchaseOrderResponse(
        Long id,
        Long supplierId,
        String supplierName,
        LocalDate orderDate,
        PurchaseOrderStatus status,
        BigDecimal totalAmount,
        PaymentStatus paymentStatus,
        List<PurchaseOrderItemResponse> items,
        ZonedDateTime createdAt,
        ZonedDateTime updatedAt
) {
    public static PurchaseOrderResponse from(PurchaseOrder order) {
        List<PurchaseOrderItemResponse> itemResponses = order.getItems() != null
                ? order.getItems().stream().map(PurchaseOrderItemResponse::from).collect(Collectors.toList())
                : Collections.emptyList();

        return new PurchaseOrderResponse(
                order.getId(),
                order.getSupplier() != null ? order.getSupplier().getId() : null,
                order.getSupplier() != null ? order.getSupplier().getName() : null,
                order.getOrderDate(),
                order.getStatus(),
                order.getTotalAmount(),
                order.getPaymentStatus(),
                itemResponses,
                order.getCreatedAt(),
                order.getUpdatedAt()
        );
    }
}
