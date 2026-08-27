package com.example.salonManagement.notification;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class NotificationService {

    public void sendBookingConfirmation(String customerName, String mobile, String date, String time) {
        String msg = String.format("Hi %s, your booking at LuxeManage is confirmed for %s at %s. We look forward to pampering you!",
                customerName, date, time);
        simulateMessageSending(mobile, msg);
    }

    public void sendBookingCancellation(String customerName, String mobile, String date, String time) {
        String msg = String.format("Hi %s, your booking at LuxeManage for %s at %s has been cancelled. We hope to see you again soon!",
                customerName, date, time);
        simulateMessageSending(mobile, msg);
    }

    public void sendCheckInNotification(String customerName, String mobile) {
        String msg = String.format("Hi %s, you have been checked in at LuxeManage. Your stylist has been notified and will be with you shortly. Relax and enjoy our welcome drink!",
                customerName);
        simulateMessageSending(mobile, msg);
    }

    public void sendBillingNotification(String customerName, String mobile, double amount, int pointsEarned) {
        String msg = String.format("Hi %s, thank you for choosing LuxeManage! Your session is complete. Total amount: Rs %.2f. You earned %d loyalty points today. See you next time!",
                customerName, amount, pointsEarned);
        simulateMessageSending(mobile, msg);
    }

    private void simulateMessageSending(String mobile, String message) {
        log.info("====================================================================");
        log.info("[SMS GATEWAY SIMULATION] Sending message to: {}", mobile);
        log.info("[MESSAGE CONTENT]: {}", message);
        log.info("====================================================================");
        
        System.out.println("====================================================================");
        System.out.println("[SMS GATEWAY SIMULATION] Sending message to: " + mobile);
        System.out.println("[MESSAGE CONTENT]: " + message);
        System.out.println("====================================================================");
    }
}
