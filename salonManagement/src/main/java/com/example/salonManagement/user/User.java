package com.example.salonManagement.user;

import com.example.salonManagement.common.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Entity
@Table(name = "users")
@Getter
@Setter

public class User extends BaseEntity {

        @Column(name = "full_name", nullable = false, length = 150)
        private String fullName;

        @Column(nullable = false, unique = true, length = 150)
        private String email;

        @Column(unique = true, length = 20)
        private String phone;

        @Column(name = "password_hash", nullable = false)
        private String passwordHash;

        @Column(nullable = false, length = 20)
        private String role;

        @Column(length = 120)
        private String specialization;

        @Column(name = "joining_date")
        private LocalDate joiningDate;

        @Column(name = "is_active", nullable = false)
        private boolean active = true;
    }
