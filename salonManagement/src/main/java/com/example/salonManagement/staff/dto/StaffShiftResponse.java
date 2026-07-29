package com.example.salonManagement.staff.dto;

import com.example.salonManagement.staff.StaffShift;
import java.time.LocalTime;

public record StaffShiftResponse(
        Long id,
        Long userId,
        String userName,
        Short dayOfWeek,
        LocalTime startTime,
        LocalTime endTime
) {
    public static StaffShiftResponse fromEntity(StaffShift shift) {
        return new StaffShiftResponse(
                shift.getId(),
                shift.getUser().getId(),
                shift.getUser().getFullName(),
                shift.getDayOfWeek(),
                shift.getStartTime(),
                shift.getEndTime()
        );
    }
}