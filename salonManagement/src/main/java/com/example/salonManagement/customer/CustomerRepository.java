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
}
