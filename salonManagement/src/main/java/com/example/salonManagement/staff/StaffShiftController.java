package com.example.salonManagement.staff;

import com.example.salonManagement.common.ApiResponse;
import com.example.salonManagement.staff.dto.StaffShiftRequest;
import com.example.salonManagement.staff.dto.StaffShiftResponse;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/staff-shifts")
public class StaffShiftController {

    private final StaffShiftService staffShiftService;

    public StaffShiftController(StaffShiftService staffShiftService) {
        this.staffShiftService = staffShiftService;
    }

    @PostMapping
    public ApiResponse<StaffShiftResponse> assignShift(@Valid @RequestBody StaffShiftRequest request) {
        return ApiResponse.ok(staffShiftService.assignShift(request));
    }

    @GetMapping("/user/{userId}")
    public ApiResponse<List<StaffShiftResponse>> getShiftsByUserId(@PathVariable Long userId) {
        return ApiResponse.ok(staffShiftService.getShiftsByUserId(userId));
    }
}