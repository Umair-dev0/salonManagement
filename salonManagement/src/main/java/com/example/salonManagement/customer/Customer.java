package com.example.salonManagement.customer;

import com.example.salonManagement.common.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Entity
@Table(name = "customers")
@Getter
@Setter
public class Customer extends BaseEntity {

    @Column(name = "full_name", nullable = false, length = 150)
    private String fullName;

    @Column(unique = true, nullable = false, length = 20)
    private String mobile;

    @Column(length = 150)
    private String email;

    @Column(length = 10)
    private String gender; // MALE, FEMALE, OTHER

    @Column(name = "date_of_birth")
    private LocalDate dateOfBirth;

    @Column(name = "anniversary")
    private LocalDate anniversary;

    @Column(name = "preferred_stylist_id")
    private Long preferredStylistId;

    @Column(columnDefinition = "TEXT")
    private String allergies;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "loyalty_points", nullable = false)
    private Integer loyaltyPoints = 0;

    @Column(name = "is_active", nullable = false)
    private boolean active = true;
}
