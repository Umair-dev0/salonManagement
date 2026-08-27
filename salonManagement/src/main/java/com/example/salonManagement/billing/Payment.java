package com.example.salonManagement.billing;

import com.example.salonManagement.common.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.ZonedDateTime;

@Entity
@Table(name = "payments")
@Getter
@Setter
public class Payment extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "invoice_id", nullable = false)
    private Invoice invoice;

    @Column(name = "payment_mode", nullable = false, length = 15)
    private String paymentMode; // CASH, UPI, CARD, NET_BANKING, WALLET

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;

    @Column(name = "reference_no", length = 100)
    private String referenceNo;

    @Column(name = "paid_at", nullable = false)
    private ZonedDateTime paidAt = ZonedDateTime.now();
}
