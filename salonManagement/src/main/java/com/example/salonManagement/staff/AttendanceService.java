package com.example.salonManagement.staff;

import com.example.salonManagement.staff.dto.AttendanceResponse;
import com.example.salonManagement.user.User;
import com.example.salonManagement.user.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;

@Service
public class AttendanceService {

    private final AttendanceRepository attendanceRepository;
    private final UserRepository userRepository;

    public AttendanceService(AttendanceRepository attendanceRepository, UserRepository userRepository) {
        this.attendanceRepository = attendanceRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public AttendanceResponse checkIn(Long userId) {
        LocalDate today = LocalDate.now(ZoneOffset.UTC);

        attendanceRepository.findByUserIdAndWorkDate(userId, today)
                .ifPresent(a -> {
                    throw new RuntimeException("User already checked in for today");
                });

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Attendance attendance = new Attendance();
        attendance.setUser(user);
        attendance.setWorkDate(today);
        attendance.setCheckIn(OffsetDateTime.now(ZoneOffset.UTC));

        Attendance saved = attendanceRepository.save(attendance);
        return AttendanceResponse.fromEntity(saved, 0.0);
    }

    @Transactional
    public AttendanceResponse checkOut(Long userId) {
        LocalDate today = LocalDate.now(ZoneOffset.UTC);

        Attendance attendance = attendanceRepository.findByUserIdAndWorkDate(userId, today)
                .orElseThrow(() -> new RuntimeException("No check-in record found for today"));

        if (attendance.getCheckOut() != null) {
            throw new RuntimeException("User already checked out today");
        }

        attendance.setCheckOut(OffsetDateTime.now(ZoneOffset.UTC));
        Attendance updated = attendanceRepository.save(attendance);

        double workingHours = calculateHours(updated.getCheckIn(), updated.getCheckOut());
        return AttendanceResponse.fromEntity(updated, workingHours);
    }

    private double calculateHours(OffsetDateTime start, OffsetDateTime end) {
        if (start == null || end == null) return 0.0;
        long minutes = Duration.between(start, end).toMinutes();
        return Math.round((minutes / 60.0) * 100.0) / 100.0; // Round to 2 decimal places
    }
}