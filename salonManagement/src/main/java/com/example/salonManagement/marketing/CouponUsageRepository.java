package com.example.salonManagement.marketing;

import org.springframework.data.jpa.repository.JpaRepository;

public interface CouponUsageRepository extends JpaRepository<CouponUsage, Long> {
    long countByCouponIdAndCustomerId(Long couponId, Long customerId);
}
