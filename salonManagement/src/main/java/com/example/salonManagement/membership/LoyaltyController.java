package com.example.salonManagement.membership;

import com.example.salonManagement.membership.dto.LoyaltyLedgerResponse;
import com.example.salonManagement.membership.dto.LoyaltyRedeemRequest;
import com.example.salonManagement.membership.dto.LoyaltySummaryResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class LoyaltyController {

    private final LoyaltyService loyaltyService;

    @PostMapping("/customers/{id}/loyalty/redeem")
    public ResponseEntity<LoyaltyLedgerResponse> redeemPoints(@PathVariable Long id, @RequestBody LoyaltyRedeemRequest request) {
        return ResponseEntity.ok(loyaltyService.redeemPoints(id, request));
    }

    @GetMapping("/customers/{id}/loyalty/ledger")
    public ResponseEntity<List<LoyaltyLedgerResponse>> getCustomerLedger(@PathVariable Long id) {
        return ResponseEntity.ok(loyaltyService.getCustomerLedger(id));
    }

    @GetMapping("/customers/{id}/loyalty/summary")
    public ResponseEntity<LoyaltySummaryResponse> getLoyaltySummary(@PathVariable Long id) {
        return ResponseEntity.ok(loyaltyService.getSummary(id));
    }

    @GetMapping("/loyalty/ledger")
    public ResponseEntity<List<LoyaltyLedgerResponse>> getAllLedger() {
        return ResponseEntity.ok(loyaltyService.getAllLedger());
    }
}
