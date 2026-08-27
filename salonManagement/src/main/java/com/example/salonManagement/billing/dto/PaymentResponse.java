package com.example.salonManagement.billing.dto;

import com.example.salonManagement.billing.Payment;

import java.math.BigDecimal;
import java.time.ZonedDateTime;

public record PaymentResponse(
        Long id,
        String paymentMode,
        BigDecimal amount,
        String referenceNo,
        ZonedDateTime paidAt
) {
    public static PaymentResponse from(Payment payment) {
        return new PaymentResponse(
                payment.getId(),
                payment.getPaymentMode(),
                payment.getAmount(),
                payment.getReferenceNo(),
                payment.getPaidAt()
        );
    }
}
