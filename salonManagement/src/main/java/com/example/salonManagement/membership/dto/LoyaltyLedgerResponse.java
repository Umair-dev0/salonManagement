package com.example.salonManagement.membership.dto;

import com.example.salonManagement.membership.LoyaltyTransaction;

import java.time.ZonedDateTime;

public record LoyaltyLedgerResponse(
        Long id,
        Long customerId,
        String customerName,
        String txnType,
        Integer points,
        Long invoiceId,
        String invoiceNumber,
        String notes,
        ZonedDateTime createdAt
) {
    public static LoyaltyLedgerResponse from(LoyaltyTransaction txn) {
        return new LoyaltyLedgerResponse(
                txn.getId(),
                txn.getCustomer().getId(),
                txn.getCustomer().getFullName(),
                txn.getTxnType(),
                txn.getPoints(),
                txn.getInvoice() != null ? txn.getInvoice().getId() : null,
                txn.getInvoice() != null ? txn.getInvoice().getInvoiceNumber() : null,
                txn.getNotes(),
                txn.getCreatedAt()
        );
    }
}
