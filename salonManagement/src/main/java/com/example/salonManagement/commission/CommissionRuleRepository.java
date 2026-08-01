package com.example.salonManagement.commission;


import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CommissionRuleRepository extends JpaRepository<CommissionRule, Long> {

    // Kisi specific stylist ke active rules nikalne ke liye query
    List<CommissionRule> findByUserIdAndActiveTrue(Long userId);

    // Global rules nikalne ke liye (jahan userId null ho)
    List<CommissionRule> findByUserIdIsNullAndActiveTrue();
}