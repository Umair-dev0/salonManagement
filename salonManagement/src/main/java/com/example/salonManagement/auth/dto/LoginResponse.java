package com.example.salonManagement.auth.dto;

public record LoginResponse(
        String token,
        Long id,
        String fullName,
        String email,
        String role
) {}
