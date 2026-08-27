package com.example.salonManagement.billing.dto;

import com.example.salonManagement.billing.Invoice;

import java.math.BigDecimal;
import java.time.ZonedDateTime;
import java.util.List;

public record InvoiceResponse(
        Long id,
        String invoiceNumber,
        Long appointmentId,
        Long customerId,
        String customerName,
        String customerMobile,
        BigDecimal subtotal,
        BigDecimal discountAmount,
        BigDecimal taxAmount,
        BigDecimal totalAmount,
        String paymentStatus,
        List<InvoiceItemResponse> items,
        List<PaymentResponse> payments,
        ZonedDateTime createdAt
) {
    public static InvoiceResponse from(Invoice invoice) {
        return new InvoiceResponse(
                invoice.getId(),
                invoice.getInvoiceNumber(),
                invoice.getAppointment() != null ? invoice.getAppointment().getId() : null,
                invoice.getCustomer().getId(),
                invoice.getCustomer().getFullName(),
                invoice.getCustomer().getMobile(),
                invoice.getSubtotal(),
                invoice.getDiscountAmount(),
                invoice.getTaxAmount(),
                invoice.getTotalAmount(),
                invoice.getPaymentStatus(),
                invoice.getItems() != null ? invoice.getItems().stream().map(InvoiceItemResponse::from).toList() : List.of(),
                invoice.getPayments() != null ? invoice.getPayments().stream().map(PaymentResponse::from).toList() : List.of(),
                invoice.getCreatedAt()
        );
    }
}
