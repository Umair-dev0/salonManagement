package com.example.salonManagement.commission;

import com.example.salonManagement.commission.dto.CommissionRuleRequest;
import com.example.salonManagement.commission.dto.CommissionRuleResponse;
import com.example.salonManagement.common.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/commission-rules")
@RequiredArgsConstructor
public class CommissionRuleController {

    private final CommissionRuleService service;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('OWNER', 'MANAGER')")
    public ApiResponse<CommissionRuleResponse> createRule(@Valid @RequestBody CommissionRuleRequest request) {
        // Validation check pass hone par Service layer ko call jayegi
        CommissionRuleResponse response = service.createRule(request);
        return ApiResponse.ok(response);
    }

    @GetMapping("/user/{userId}")
    @ResponseStatus(HttpStatus.OK)
    @PreAuthorize("hasAnyRole('OWNER', 'MANAGER', 'FRONT_DESK')")
    public ApiResponse<List<CommissionRuleResponse>> getRulesByUser(@PathVariable Long userId) {
        List<CommissionRuleResponse> response = service.getRulesByUserId(userId);
        return ApiResponse.ok(response);
    }
}
