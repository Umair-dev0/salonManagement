package com.example.salonManagement.membership;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.ZonedDateTime;
import java.util.List;
import java.util.Optional;

public interface CustomerMembershipRepository extends JpaRepository<CustomerMembership, Long> {
    
    @Query("SELECT cm FROM CustomerMembership cm WHERE cm.customer.id = :customerId AND cm.status = 'ACTIVE' AND cm.expiryDate > :now ORDER BY cm.expiryDate DESC")
    Optional<CustomerMembership> findActiveMembershipByCustomerId(@Param("customerId") Long customerId, @Param("now") ZonedDateTime now);

    List<CustomerMembership> findByCustomerId(Long customerId);
}
