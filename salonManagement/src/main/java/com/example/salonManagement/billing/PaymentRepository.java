package com.example.salonManagement.billing;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {

    List<Payment> findAllByInvoiceId(Long invoiceId);

    List<Payment> findAllByPaidAtBetween(java.time.ZonedDateTime start, java.time.ZonedDateTime end);
}

