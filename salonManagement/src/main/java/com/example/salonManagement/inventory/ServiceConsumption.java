package com.example.salonManagement.inventory;

import com.example.salonManagement.common.BaseEntity;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Entity
@Table(name = "service_consumption")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ServiceConsumption extends BaseEntity {

    @Column(name = "service_id", nullable = false)
    private Long serviceId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(name = "quantity_used", nullable = false, precision = 12, scale = 2)
    private BigDecimal quantityUsed;
}
