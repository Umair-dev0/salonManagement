package com.example.salonManagement.billing;

import com.example.salonManagement.common.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Entity
@Table(name = "invoice_items")
@Getter
@Setter
public class InvoiceItem extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "invoice_id", nullable = false)
    private Invoice invoice;

    @Column(name = "item_type", nullable = false, length = 15)
    private String itemType; // SERVICE, PRODUCT, PACKAGE, ADDON

    @Column(name = "reference_id", nullable = false)
    private Long referenceId;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal quantity = BigDecimal.ONE;

    @Column(name = "unit_price", nullable = false, precision = 12, scale = 2)
    private BigDecimal unitPrice;

    @Column(name = "tax_percent", nullable = false, precision = 5, scale = 2)
    private BigDecimal taxPercent;

    @Column(name = "line_total", nullable = false, precision = 12, scale = 2)
    private BigDecimal lineTotal;
}
