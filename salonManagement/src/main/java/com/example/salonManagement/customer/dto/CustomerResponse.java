package com.example.salonManagement.customer.dto;

import com.example.salonManagement.customer.Customer;

import java.math.BigDecimal;
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
        Integer totalVisits,
        BigDecimal totalSpent,
        boolean active,
        ZonedDateTime createdAt
) {
    public static CustomerResponse from(Customer customer) {
        return from(customer, 0, BigDecimal.ZERO, customer.getLoyaltyPoints() != null ? customer.getLoyaltyPoints() : 0);
    }

    public static CustomerResponse from(Customer customer, Integer totalVisits, BigDecimal totalSpent, Integer activeLoyaltyPoints) {
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
                activeLoyaltyPoints != null ? activeLoyaltyPoints : (customer.getLoyaltyPoints() != null ? customer.getLoyaltyPoints() : 0),
                totalVisits != null ? totalVisits : 0,
                totalSpent != null ? totalSpent : BigDecimal.ZERO,
                customer.isActive(),
                customer.getCreatedAt()
        );
    }
}
