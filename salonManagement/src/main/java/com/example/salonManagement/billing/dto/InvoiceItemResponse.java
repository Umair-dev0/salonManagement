package com.example.salonManagement.billing.dto;

import com.example.salonManagement.billing.InvoiceItem;

import java.math.BigDecimal;

public record InvoiceItemResponse(
        Long id,
        String itemType,
        Long referenceId,
        String name,
        BigDecimal quantity,
        BigDecimal unitPrice,
        BigDecimal taxPercent,
        BigDecimal lineTotal
) {
    public static InvoiceItemResponse from(InvoiceItem item) {
        return new InvoiceItemResponse(
                item.getId(),
                item.getItemType(),
                item.getReferenceId(),
                item.getName(),
                item.getQuantity(),
                item.getUnitPrice(),
                item.getTaxPercent(),
                item.getLineTotal()
        );
    }
}
