package com.example.salonManagement.appointment;

import com.example.salonManagement.common.ApiResponse;
import com.example.salonManagement.appointment.dto.AppointmentRequest;
import com.example.salonManagement.appointment.dto.AppointmentResponse;
import com.example.salonManagement.appointment.dto.AddonRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class AppointmentController {

    private final AppointmentService appointmentService;

    // POST /api/appointments (Create booking)
    @PostMapping("/appointments")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('OWNER', 'MANAGER', 'FRONT_DESK')")
    public ApiResponse<AppointmentResponse> createAppointment(
            @Valid @RequestBody AppointmentRequest request,
            Principal principal) {
        
        String creatorEmail = principal != null ? principal.getName() : null;
        AppointmentResponse response = appointmentService.createAppointment(request, creatorEmail);
        return ApiResponse.ok(response);
    }

    // GET /api/appointments?date=&staffId=
    @GetMapping("/appointments")
    @PreAuthorize("hasAnyRole('OWNER', 'MANAGER', 'FRONT_DESK', 'THERAPIST')")
    public ApiResponse<List<AppointmentResponse>> getAppointments(
            @RequestParam(value = "date", required = false) 
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(value = "staffId", required = false) Long staffId) {
        
        List<AppointmentResponse> response = appointmentService.getAppointments(date, staffId);
        return ApiResponse.ok(response);
    }

    // PATCH /api/appointments/{id}/status (Update status workflow)
    @PatchMapping("/appointments/{id}/status")
    @PreAuthorize("hasAnyRole('OWNER', 'MANAGER', 'FRONT_DESK')")
    public ApiResponse<AppointmentResponse> updateStatus(
            @PathVariable Long id,
            @RequestParam("status") String status) {
        
        AppointmentResponse response = appointmentService.updateStatus(id, status);
        return ApiResponse.ok(response);
    }

    // PATCH /api/appointment-services/{id}/start
    @PatchMapping("/appointment-services/{id}/start")
    @PreAuthorize("hasAnyRole('OWNER', 'MANAGER', 'THERAPIST')")
    public ApiResponse<AppointmentResponse> startServiceItem(@PathVariable Long id) {
        AppointmentResponse response = appointmentService.startServiceItem(id);
        return ApiResponse.ok(response);
    }

    // PATCH /api/appointment-services/{id}/complete
    @PatchMapping("/appointment-services/{id}/complete")
    @PreAuthorize("hasAnyRole('OWNER', 'MANAGER', 'THERAPIST')")
    public ApiResponse<AppointmentResponse> completeServiceItem(@PathVariable Long id) {
        AppointmentResponse response = appointmentService.completeServiceItem(id);
        return ApiResponse.ok(response);
    }

    // POST /api/appointments/{id}/addons
    @PostMapping("/appointments/{id}/addons")
    @PreAuthorize("hasAnyRole('OWNER', 'MANAGER', 'THERAPIST')")
    public ApiResponse<AppointmentResponse> addAddon(
            @PathVariable Long id,
            @Valid @RequestBody AddonRequest request,
            Principal principal) {
        
        String stylistEmail = principal != null ? principal.getName() : null;
        AppointmentResponse response = appointmentService.addAddon(id, request, stylistEmail);
        return ApiResponse.ok(response);
    }
}
