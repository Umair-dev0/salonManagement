package com.example.salonManagement.billing.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;

import java.math.BigDecimal;
import java.util.List;

public record DirectSaleRequest(
        Long customerId,
        String walkInCustomerName,
        String walkInCustomerMobile,

        @NotEmpty(message = "Sale items cannot be empty")
        @Valid
        List<DirectSaleItemRequest> items,

        @NotEmpty(message = "Payments cannot be empty")
        @Valid
        List<PaymentRequest> payments,

        BigDecimal discountAmount
) {}
