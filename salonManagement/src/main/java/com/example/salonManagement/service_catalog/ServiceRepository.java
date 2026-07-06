package com.example.salonManagement.service_catalog;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ServiceRepository extends JpaRepository<Service, Long> {
    
    // Active services list karne ke liye
    List<Service> findByActiveTrue();
    
    // Kisi particular category ki active services list karne ke liye
    List<Service> findByCategoryIdAndActiveTrue(Long categoryId);

    // Kisi particular category ki saari services list karne ke liye
    List<Service> findByCategoryId(Long categoryId);
}
