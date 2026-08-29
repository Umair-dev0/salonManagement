package com.example.salonManagement.inventory;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {

    boolean existsBySku(String sku);

    boolean existsBySkuAndIdNot(String sku, Long id);

    Optional<Product> findByIdAndIsActiveTrue(Long id);

    @Query("SELECT p FROM Product p WHERE p.isActive = true AND p.currentStock <= p.reorderLevel")
    java.util.List<Product> findLowStockProducts();


    @Query("SELECT p FROM Product p WHERE p.isActive = true " +
           "AND (:category IS NULL OR :category = '' OR LOWER(p.category) = LOWER(:category)) " +
           "AND (:lowStock IS NULL OR :lowStock = false OR p.currentStock <= p.reorderLevel) " +
           "AND (:search IS NULL OR :search = '' OR LOWER(p.name) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "     OR LOWER(p.sku) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "     OR LOWER(p.brand) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Product> searchProducts(
            @Param("category") String category,
            @Param("lowStock") Boolean lowStock,
            @Param("search") String search,
            Pageable pageable
    );
}
