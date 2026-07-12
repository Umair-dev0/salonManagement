package com.example.salonManagement.service_catalog;

import com.example.salonManagement.common.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;
import java.math.BigDecimal;

@Entity
@Table(name = "service_packages")
@Getter @Setter
public class ServicePackage extends BaseEntity {

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private BigDecimal packagePrice;

    @Column(nullable = false)
    private BigDecimal gstPercent;

    @Column(nullable = false)
    private boolean isActive = true;
}