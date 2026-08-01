package com.example.salonManagement.commission;

import com.example.salonManagement.common.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.util.Map;

@Entity
@Table(name = "commission_rules")
@Getter
@Setter
public class CommissionRule extends BaseEntity{
    @Column(name = "user_id")
    private Long userId; // Nullable agar rule pure salon ke liye global hai

    @Column(name = "service_id")
    private Long serviceId; // Nullable agar service-specific nahi hai

    @Column(name = "rule_type", length = 20)
    private String ruleType; // FLAT_PERCENT / TIERED / TARGET / SERVICE_SPECIFIC

    // PostgreSQL ke JSONB column ko handle karne ke liye Hibernate 6 ka best tarika
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private Map<String, Object> config;

    @Column(name = "is_active")
    private boolean active = true;
}
