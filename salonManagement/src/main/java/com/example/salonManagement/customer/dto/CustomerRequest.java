package com.example.salonManagement.customer.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record CustomerRequest(
        @NotBlank @Size(max = 150) String fullName,
        @NotBlank @Pattern(regexp = "\\d{10,12}", message = "Mobile must be 10 to 12 digits") String mobile,
        @Email @Size(max = 150) String email,
        @Size(max = 10) String gender,
        LocalDate dateOfBirth,
        LocalDate anniversary,
        Long preferredStylistId,
        String allergies,
        String notes
) {}
