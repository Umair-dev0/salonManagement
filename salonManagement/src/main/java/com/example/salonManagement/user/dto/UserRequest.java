package com.example.salonManagement.user.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UserRequest(
        @NotBlank @Size(max = 150) String fullName,
        @NotBlank @Email String email,
        @Size(max = 20) String phone,
        @NotBlank String password,
        @NotBlank String role,
        String specialization
) {}