package com.example.salonManagement.inventory.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record SupplierRequest(
        @NotBlank(message = "Supplier name is required")
        @Size(max = 150, message = "Supplier name cannot exceed 150 characters")
        String name,

        @Size(max = 100, message = "Contact person name cannot exceed 100 characters")
        String contactPerson,

        @Size(max = 20, message = "Phone number cannot exceed 20 characters")
        String phone,

        @Email(message = "Email must be valid")
        @Size(max = 150, message = "Email cannot exceed 150 characters")
        String email,

        String address,

        Boolean active
) {}
