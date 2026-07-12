package com.example.salonManagement.service_catalog;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface PackageItemRepository extends JpaRepository<PackageItem, Long> {
    List<PackageItem> findByPackageId(Long packageId);

void deleteByPackageId(Long packageId);
}
