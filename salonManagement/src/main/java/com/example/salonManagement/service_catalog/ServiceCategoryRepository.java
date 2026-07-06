package com.example.salonManagement.service_catalog;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ServiceCategoryRepository extends JpaRepository<ServiceCategory, Long> {
    
    // Sirf top-level categories fetch karne ke liye (jin ka parent null hai)
    List<ServiceCategory> findByParentIsNull();
}
