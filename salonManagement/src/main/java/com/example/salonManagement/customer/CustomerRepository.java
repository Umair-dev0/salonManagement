package com.example.salonManagement.customer;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CustomerRepository extends JpaRepository<Customer, Long> {

    Optional<Customer> findByMobile(String mobile);

    Optional<Customer> findByEmail(String email);

    Page<Customer> findByFullNameContainingIgnoreCase(String q, Pageable pageable);

    Page<Customer> findByFullNameContainingIgnoreCaseOrMobileContaining(String fullName, String mobile, Pageable pageable);

    Page<Customer> findAllByActiveTrue(Pageable pageable);

    long countByActiveTrue();

    @org.springframework.data.jpa.repository.Query("SELECT COUNT(DISTINCT a.id) FROM Appointment a WHERE a.customer.id = :customerId AND a.status IN ('BILLED', 'COMPLETED')")
    Integer countVisitsByCustomerId(@org.springframework.data.repository.query.Param("customerId") Long customerId);

    @org.springframework.data.jpa.repository.Query("SELECT COALESCE(SUM(i.totalAmount), 0.00) FROM Invoice i WHERE i.customer.id = :customerId AND i.paymentStatus = 'PAID'")
    java.math.BigDecimal sumSpentByCustomerId(@org.springframework.data.repository.query.Param("customerId") Long customerId);
}


