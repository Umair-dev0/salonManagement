package com.example.salonManagement.membership;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface LoyaltyTransactionRepository extends JpaRepository<LoyaltyTransaction, Long> {

    List<LoyaltyTransaction> findByCustomerIdOrderByCreatedAtDesc(Long customerId);

    @Query("SELECT COALESCE(SUM(lt.points), 0) FROM LoyaltyTransaction lt WHERE lt.customer.id = :customerId AND lt.txnType = :txnType")
    Integer sumPointsByCustomerIdAndTxnType(@Param("customerId") Long customerId, @Param("txnType") String txnType);
}
