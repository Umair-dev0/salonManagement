package com.example.salonManagement.staff.dto;

import com.example.salonManagement.staff.Attendance;
import java.time.LocalDate;
import java.time.OffsetDateTime;

public record AttendanceResponse(
        Long id,
        Long userId,
        String userName,
        LocalDate workDate,
        OffsetDateTime checkIn,
        OffsetDateTime checkOut,
        Double workingHours
) {
    public static AttendanceResponse fromEntity(Attendance attendance, Double workingHours) {
        return new AttendanceResponse(
                attendance.getId(),
                attendance.getUser().getId(),
                attendance.getUser().getFullName(),
                attendance.getWorkDate(),
                attendance.getCheckIn(),
                attendance.getCheckOut(),
                workingHours
        );
    }
}