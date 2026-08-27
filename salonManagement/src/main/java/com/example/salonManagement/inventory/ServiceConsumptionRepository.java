package com.example.salonManagement.inventory;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ServiceConsumptionRepository extends JpaRepository<ServiceConsumption, Long> {

    List<ServiceConsumption> findByServiceId(Long serviceId);

    boolean existsByServiceIdAndProductId(Long serviceId, Long productId);

    Optional<ServiceConsumption> findByServiceIdAndProductId(Long serviceId, Long productId);
}
