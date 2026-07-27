package com.example.salonManagement.staff;

import com.example.salonManagement.common.ApiResponse;
import com.example.salonManagement.staff.dto.AttendanceResponse;
import com.example.salonManagement.staff.dto.CheckInRequest;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/attendance")
public class AttendanceController {

    private final AttendanceService attendanceService;

    public AttendanceController(AttendanceService attendanceService) {
        this.attendanceService = attendanceService;
    }

    @PostMapping("/check-in")
    public ApiResponse<AttendanceResponse> checkIn(@Valid @RequestBody CheckInRequest request) {
        return ApiResponse.ok(attendanceService.checkIn(request.userId()));
    }

    @PostMapping("/check-out")
    public ApiResponse<AttendanceResponse> checkOut(@Valid @RequestBody CheckInRequest request) {
        return ApiResponse.ok(attendanceService.checkOut(request.userId()));
    }
}