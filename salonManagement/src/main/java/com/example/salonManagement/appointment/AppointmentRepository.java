package com.example.salonManagement.appointment;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Repository
public interface AppointmentRepository extends JpaRepository<Appointment, Long> {

    List<Appointment> findAllByAppointmentDate(LocalDate date);

    List<Appointment> findAllByCustomerIdOrderByAppointmentDateDesc(Long customerId);

    List<Appointment> findAllByOrderByAppointmentDateDescStartTimeDesc();

    @Query("SELECT DISTINCT a FROM Appointment a JOIN a.services s WHERE s.assignedStylist.id = :stylistId ORDER BY a.appointmentDate DESC, a.startTime DESC")
    List<Appointment> findAllByStylistId(@Param("stylistId") Long stylistId);

    @Query("SELECT DISTINCT a FROM Appointment a JOIN a.services s WHERE a.appointmentDate = :date AND s.assignedStylist.id = :stylistId")
    List<Appointment> findAllByAppointmentDateAndStylistId(@Param("date") LocalDate date, @Param("stylistId") Long stylistId);

    // Overlap conflict check for new appointment
    @Query("SELECT COUNT(a) > 0 FROM Appointment a JOIN a.services s WHERE " +
           "a.appointmentDate = :date AND " +
           "s.assignedStylist.id = :stylistId AND " +
           "a.status <> 'CANCELLED' AND " +
           "a.startTime < :endTime AND " +
           "a.endTime > :startTime")
    boolean hasOverlappingAppointment(
            @Param("stylistId") Long stylistId,
            @Param("date") LocalDate date,
            @Param("startTime") LocalTime startTime,
            @Param("endTime") LocalTime endTime);

    // Overlap conflict check for updating existing appointment
    @Query("SELECT COUNT(a) > 0 FROM Appointment a JOIN a.services s WHERE " +
           "a.appointmentDate = :date AND " +
           "s.assignedStylist.id = :stylistId AND " +
           "a.status <> 'CANCELLED' AND " +
           "a.id <> :excludeId AND " +
           "a.startTime < :endTime AND " +
           "a.endTime > :startTime")
    boolean hasOverlappingAppointmentExclude(
            @Param("stylistId") Long stylistId,
            @Param("date") LocalDate date,
            @Param("startTime") LocalTime startTime,
            @Param("endTime") LocalTime endTime,
            @Param("excludeId") Long excludeId);
}
