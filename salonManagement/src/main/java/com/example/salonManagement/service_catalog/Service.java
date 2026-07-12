package com.example.salonManagement.service_catalog;

import com.example.salonManagement.common.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.math.BigDecimal;

@Entity
@Table(name = "services")
@Getter
@Setter
public class Service extends BaseEntity{
    @Column(name = "category_id")
    private Long categoryId;

    @Column(nullable = false)
    private String name;

    private String description;

    @Column(nullable = false)
    private BigDecimal basePrice;

    private BigDecimal memberPrice;
    private BigDecimal weekendPrice;

    @Column(nullable = false)
    private Integer durationMinutes;

    @Column(nullable = false)
    private BigDecimal gstPercent = new BigDecimal("18.00");

    @Column(nullable = false)
    private boolean isActive = true;
}
