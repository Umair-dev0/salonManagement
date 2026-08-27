package com.example.salonManagement.billing;

import com.example.salonManagement.billing.dto.InvoiceResponse;
import com.example.salonManagement.billing.dto.PaymentRequest;
import com.example.salonManagement.common.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/invoices")
@RequiredArgsConstructor
public class InvoiceController {

    private final InvoiceService invoiceService;

    // POST /api/invoices/from-appointment/{id} (Create draft invoice)
    @PostMapping("/from-appointment/{appointmentId}")
    @PreAuthorize("hasAnyRole('OWNER', 'MANAGER', 'FRONT_DESK')")
    public ApiResponse<InvoiceResponse> createDraftInvoice(
            @PathVariable Long appointmentId,
            Principal principal) {
        
        String email = principal != null ? principal.getName() : null;
        InvoiceResponse response = invoiceService.createDraftFromAppointment(appointmentId, email);
        return ApiResponse.ok(response);
    }

    // GET /api/invoices/{id} (Retrieve single invoice)
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('OWNER', 'MANAGER', 'FRONT_DESK')")
    public ApiResponse<InvoiceResponse> getInvoice(@PathVariable Long id) {
        InvoiceResponse response = invoiceService.getInvoiceById(id);
        return ApiResponse.ok(response);
    }

    // POST /api/invoices/{id}/payments (Process payments, supports split checkout)
    @PostMapping("/{id}/payments")
    @PreAuthorize("hasAnyRole('OWNER', 'MANAGER', 'FRONT_DESK')")
    public ApiResponse<InvoiceResponse> recordPayments(
            @PathVariable Long id,
            @Valid @RequestBody List<PaymentRequest> payments) {
        
        InvoiceResponse response = invoiceService.recordPayments(id, payments);
        return ApiResponse.ok(response);
    }
}
