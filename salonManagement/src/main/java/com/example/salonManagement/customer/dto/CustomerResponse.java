package com.example.salonManagement.customer.dto;

import com.example.salonManagement.customer.Customer;

import java.time.LocalDate;
import java.time.ZonedDateTime;

public record CustomerResponse(
        Long id,
        String fullName,
        String mobile,
        String email,
        String gender,
        LocalDate dateOfBirth,
        LocalDate anniversary,
        Long preferredStylistId,
        String allergies,
        String notes,
        Integer loyaltyPoints,
        boolean active,
        ZonedDateTime createdAt
) {
    public static CustomerResponse from(Customer customer) {
        return new CustomerResponse(
                customer.getId(),
                customer.getFullName(),
                customer.getMobile(),
                customer.getEmail(),
                customer.getGender(),
                customer.getDateOfBirth(),
                customer.getAnniversary(),
                customer.getPreferredStylistId(),
                customer.getAllergies(),
                customer.getNotes(),
                customer.getLoyaltyPoints(),
                customer.isActive(),
                customer.getCreatedAt()
        );
    }
}
