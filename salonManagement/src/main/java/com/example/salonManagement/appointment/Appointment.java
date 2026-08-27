package com.example.salonManagement.appointment;

import com.example.salonManagement.common.BaseEntity;
import com.example.salonManagement.customer.Customer;
import com.example.salonManagement.user.User;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "appointments")
@Getter
@Setter
public class Appointment extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @Column(name = "appointment_date", nullable = false)
    private LocalDate appointmentDate;

    @Column(name = "start_time", nullable = false)
    private LocalTime startTime;

    @Column(name = "end_time", nullable = false)
    private LocalTime endTime;

    @Column(nullable = false, length = 20)
    private String status = "CONFIRMED"; // BOOKED, CONFIRMED, CHECKED_IN, IN_SERVICE, COMPLETED, BILLED, CANCELLED

    @Column(nullable = false, length = 15)
    private String source = "FRONT_DESK"; // WALK_IN, ONLINE, FRONT_DESK

    @Column(columnDefinition = "TEXT")
    private String notes;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;

    @OneToMany(mappedBy = "appointment", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<AppointmentServiceEntity> services = new ArrayList<>();
}
