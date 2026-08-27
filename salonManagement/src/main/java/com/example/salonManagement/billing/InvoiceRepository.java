package com.example.salonManagement.billing;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InvoiceRepository extends JpaRepository<Invoice, Long> {

    Optional<Invoice> findByAppointmentId(Long appointmentId);

    List<Invoice> findAllByCustomerIdOrderByCreatedAtDesc(Long customerId);

    List<Invoice> findAllByOrderByCreatedAtDesc();
}
