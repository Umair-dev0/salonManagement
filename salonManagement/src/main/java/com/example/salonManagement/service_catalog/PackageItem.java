package com.example.salonManagement.service_catalog;

import com.example.salonManagement.common.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "package_items")
@Getter @Setter
public class PackageItem extends BaseEntity {

    @Column(name = "package_id", nullable = false)
    private Long packageId;

    @Column(name = "service_id", nullable = false)
    private Long serviceId;
}