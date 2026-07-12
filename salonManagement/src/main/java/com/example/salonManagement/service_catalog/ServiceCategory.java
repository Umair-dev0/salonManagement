package com.example.salonManagement.service_catalog;

import com.example.salonManagement.common.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "service_categories")
@Getter
@Setter
public class ServiceCategory extends BaseEntity{
    @Column(nullable = false)
    private String name;

    @Column(name = "parent_id")
    private Long parentId;
}

