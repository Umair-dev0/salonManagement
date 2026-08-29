package com.example.salonManagement.dashboard;

import com.example.salonManagement.common.ApiResponse;
import com.example.salonManagement.dashboard.dto.DashboardStatsResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/stats")
    @PreAuthorize("hasAnyRole('OWNER', 'MANAGER')")
    public ApiResponse<DashboardStatsResponse> getExecutiveDashboardStats() {
        DashboardStatsResponse stats = dashboardService.getExecutiveDashboardStats();
        return ApiResponse.ok(stats);
    }
}
