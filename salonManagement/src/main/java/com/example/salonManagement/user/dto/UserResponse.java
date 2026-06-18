package com.example.salonManagement.user.dto;

import com.example.salonManagement.user.User;
import java.time.LocalDate;

public record UserResponse(
        Long id,
        String fullName,
        String email,
        String phone,
        String role,
        String specialization,
        LocalDate joiningDate,
        boolean active
) {
    // Ye shortcut method Entity ko Response DTO mein convert karega
    public static UserResponse from(User user) {
        return new UserResponse(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getPhone(),
                user.getRole(),
                user.getSpecialization(),
                user.getJoiningDate(),
                user.isActive()
        );
    }
}