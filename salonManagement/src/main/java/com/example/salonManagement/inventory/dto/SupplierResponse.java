package com.example.salonManagement.inventory.dto;

import com.example.salonManagement.inventory.Supplier;

import java.time.ZonedDateTime;

public record SupplierResponse(
        Long id,
        String name,
        String contactPerson,
        String phone,
        String email,
        String address,
        boolean active,
        ZonedDateTime createdAt,
        ZonedDateTime updatedAt
) {
    public static SupplierResponse from(Supplier supplier) {
        return new SupplierResponse(
                supplier.getId(),
                supplier.getName(),
                supplier.getContactPerson(),
                supplier.getPhone(),
                supplier.getEmail(),
                supplier.getAddress(),
                supplier.isActive(),
                supplier.getCreatedAt(),
                supplier.getUpdatedAt()
        );
    }
}
