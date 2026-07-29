package com.example.salonManagement.commission;

import com.example.salonManagement.commission.dto.CommissionRuleRequest;
import com.example.salonManagement.commission.dto.CommissionRuleResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Map;
import java.util.Optional;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CommissionRuleService {

    private final CommissionRuleRepository repository;

    // Naya rule banani ki API ka logic
    @Transactional
    public CommissionRuleResponse createRule(CommissionRuleRequest req) {
        CommissionRule rule = new CommissionRule();
        rule.setUserId(req.userId());
        rule.setServiceId(req.serviceId());
        rule.setRuleType(req.ruleType());
        rule.setConfig(req.config());

        CommissionRule savedRule = repository.save(rule);
        return CommissionRuleResponse.from(savedRule);
    }

    // Saare active rules nikalne ke liye
    public List<CommissionRuleResponse> getRulesByUserId(Long userId) {
        List<CommissionRule> rules = repository.findByUserIdAndActiveTrue(userId);
        return rules.stream()
                .map(CommissionRuleResponse::from)
                .collect(Collectors.toList());
    }

    /*
     * IMPORTANT: Yeh method tab trigger hoga jab Front Desk bill generate karega.
     * Isko abhi humne placeholder ki tarah chhod diya hai.
     */
    public void calculateCommission(Long stylistId, Long invoiceId, double billAmount, Long specificServiceId) {
        // (Iska actual save karne ka logic aage Invoice processing ke sath aayega)
    }

    /*
     * THE MAIN COMMISSION ENGINE LOGIC
     * Yeh method kisi bhi bill item ka data lega aur correct commission nikal kar dega.
     */
    public BigDecimal calculateCommissionForService(
            BigDecimal itemPrice,
            Long serviceId,
            BigDecimal currentMonthlyRevenue,
            List<CommissionRule> activeRules) {

        BigDecimal finalCommission = BigDecimal.ZERO;

        // PRIORITY 1: SERVICE_SPECIFIC check karna (Sabse high priority)
        Optional<CommissionRule> specificRule = activeRules.stream()
                .filter(rule -> "SERVICE_SPECIFIC".equals(rule.getRuleType()) && serviceId.equals(rule.getServiceId()))
                .findFirst();

        if (specificRule.isPresent()) {
            Map<String, Object> config = specificRule.get().getConfig();
            BigDecimal percentage = new BigDecimal(config.getOrDefault("percentage", "0").toString());
            // Formula: (itemPrice * percentage) / 100
            finalCommission = itemPrice.multiply(percentage).divide(new BigDecimal("100"));

            // Agar specific rule mil gaya, toh general base rules ignore ho jayenge
            return finalCommission;
        }

        // PRIORITY 2: General Base Rules (FLAT_PERCENT ya TIERED)
        Optional<CommissionRule> flatRule = activeRules.stream()
                .filter(rule -> "FLAT_PERCENT".equals(rule.getRuleType()))
                .findFirst();

        if (flatRule.isPresent()) {
            Map<String, Object> config = flatRule.get().getConfig();
            BigDecimal percentage = new BigDecimal(config.getOrDefault("percentage", "0").toString());
            finalCommission = itemPrice.multiply(percentage).divide(new BigDecimal("100"));
        } else {
            // Agar Flat nahi hai, toh check karo kya TIERED rule hai
            Optional<CommissionRule> tieredRule = activeRules.stream()
                    .filter(rule -> "TIERED".equals(rule.getRuleType()))
                    .findFirst();

            if (tieredRule.isPresent()) {
                Map<String, Object> config = tieredRule.get().getConfig();
                BigDecimal threshold = new BigDecimal(config.getOrDefault("thresholdAmount", "50000").toString());

                BigDecimal percentage;
                // Agar monthly revenue threshold cross kar gaya hai (e.g., > 50k)
                if (currentMonthlyRevenue.compareTo(threshold) >= 0) {
                    percentage = new BigDecimal(config.getOrDefault("highPercentage", "12").toString());
                } else {
                    percentage = new BigDecimal(config.getOrDefault("lowPercentage", "8").toString());
                }
                finalCommission = itemPrice.multiply(percentage).divide(new BigDecimal("100"));
            }
        }

        // PRIORITY 3: TARGET Bonus (Yeh base commission ke upar add hota hai agar target hit ho)
        Optional<CommissionRule> targetRule = activeRules.stream()
                .filter(rule -> "TARGET".equals(rule.getRuleType()))
                .findFirst();

        if (targetRule.isPresent()) {
            Map<String, Object> config = targetRule.get().getConfig();
            BigDecimal targetAmount = new BigDecimal(config.getOrDefault("targetAmount", "100000").toString());

            // Check agar is bill ke baad target cross ho raha hai
            BigDecimal updatedRevenue = currentMonthlyRevenue.add(itemPrice);
            if (currentMonthlyRevenue.compareTo(targetAmount) < 0 && updatedRevenue.compareTo(targetAmount) >= 0) {
                BigDecimal bonus = new BigDecimal(config.getOrDefault("bonusAmount", "0").toString());
                finalCommission = finalCommission.add(bonus);
            }
        }

        return finalCommission;
    }
}