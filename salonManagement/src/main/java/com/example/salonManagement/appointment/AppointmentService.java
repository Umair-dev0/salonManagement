package com.example.salonManagement.appointment;

import com.example.salonManagement.appointment.dto.AppointmentRequest;
import com.example.salonManagement.appointment.dto.AppointmentResponse;
import com.example.salonManagement.appointment.dto.AddonRequest;
import com.example.salonManagement.common.exception.ConflictException;
import com.example.salonManagement.common.exception.NotFoundException;
import com.example.salonManagement.customer.Customer;
import com.example.salonManagement.customer.CustomerRepository;
import com.example.salonManagement.service_catalog.ServiceRepository;
import com.example.salonManagement.user.User;
import com.example.salonManagement.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.example.salonManagement.notification.NotificationService;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final AppointmentServiceRepository appointmentServiceRepository;
    private final CustomerRepository customerRepository;
    private final UserRepository userRepository;
    private final ServiceRepository serviceRepository;
    private final NotificationService notificationService;

    // CREATE APPOINTMENT
    @Transactional
    public AppointmentResponse createAppointment(AppointmentRequest request, String creatorEmail) {
        // 1. Resolve customer profile
        Customer customer;
        if (request.customerId() != null) {
            customer = customerRepository.findById(request.customerId())
                    .orElseThrow(() -> new NotFoundException("Customer not found with id: " + request.customerId()));
        } else {
            // Workflow: look up by mobile number first
            if (request.customerMobile() == null || request.customerMobile().isBlank()) {
                throw new IllegalArgumentException("Customer mobile is required to create a booking");
            }
            customer = customerRepository.findByMobile(request.customerMobile())
                    .orElseGet(() -> {
                        // Auto-create customer profile on first booking / walk-in
                        Customer c = new Customer();
                        c.setFullName(request.customerFullName() != null ? request.customerFullName() : "Walk-in Guest");
                        c.setMobile(request.customerMobile());
                        c.setEmail(request.customerEmail());
                        c.setGender(request.customerGender());
                        c.setDateOfBirth(request.customerDateOfBirth());
                        return customerRepository.save(c);
                    });
        }

        // 2. Resolve creator user
        User createdBy = null;
        if (creatorEmail != null) {
            createdBy = userRepository.findByEmail(creatorEmail).orElse(null);
        }

        // 3. Resolve services and calculate slot length / end time
        List<com.example.salonManagement.service_catalog.Service> targetServices = new ArrayList<>();
        int totalDurationMinutes = 0;
        for (AppointmentRequest.BookedServiceRequest serviceReq : request.services()) {
            com.example.salonManagement.service_catalog.Service s = serviceRepository.findById(serviceReq.serviceId())
                    .orElseThrow(() -> new NotFoundException("Service not found with id: " + serviceReq.serviceId()));
            targetServices.add(s);
            totalDurationMinutes += s.getDurationMinutes();
        }

        LocalTime startTime = request.startTime();
        LocalTime endTime = startTime.plusMinutes(totalDurationMinutes);

        // 4. Overlap Conflict Check: prevent double-booking the same stylist
        for (int i = 0; i < request.services().size(); i++) {
            AppointmentRequest.BookedServiceRequest serviceReq = request.services().get(i);
            User stylist = userRepository.findById(serviceReq.assignedStylistId())
                    .orElseThrow(() -> new NotFoundException("Stylist not found with id: " + serviceReq.assignedStylistId()));

            boolean hasConflict = appointmentRepository.hasOverlappingAppointment(
                    stylist.getId(),
                    request.appointmentDate(),
                    startTime,
                    endTime
            );

            if (hasConflict) {
                throw new ConflictException("Conflict: Stylist " + stylist.getFullName() + " already has an overlapping appointment during this time (" + startTime + " - " + endTime + ")");
            }
        }

        // 5. Create Appointment
        Appointment appointment = new Appointment();
        appointment.setCustomer(customer);
        appointment.setAppointmentDate(request.appointmentDate());
        appointment.setStartTime(startTime);
        appointment.setEndTime(endTime);
        appointment.setStatus("CONFIRMED");
        appointment.setSource(request.source());
        appointment.setNotes(request.notes());
        appointment.setCreatedBy(createdBy);

        Appointment savedAppointment = appointmentRepository.save(appointment);

        // 6. Create Service items
        List<AppointmentServiceEntity> serviceEntities = new ArrayList<>();
        for (int i = 0; i < request.services().size(); i++) {
            AppointmentRequest.BookedServiceRequest serviceReq = request.services().get(i);
            com.example.salonManagement.service_catalog.Service s = targetServices.get(i);
            User stylist = userRepository.findById(serviceReq.assignedStylistId()).orElseThrow();

            AppointmentServiceEntity serviceEntity = new AppointmentServiceEntity();
            serviceEntity.setAppointment(savedAppointment);
            serviceEntity.setService(s);
            serviceEntity.setAssignedStylist(stylist);
            serviceEntity.setPrice(s.getBasePrice()); // Captured at booking time
            serviceEntity.setStatus("PENDING");
            serviceEntity.setAddon(false);

            serviceEntities.add(appointmentServiceRepository.save(serviceEntity));
        }

        savedAppointment.setServices(serviceEntities);

        // SMS Confirmation simulation
        notificationService.sendBookingConfirmation(
                customer.getFullName(),
                customer.getMobile(),
                savedAppointment.getAppointmentDate().toString(),
                savedAppointment.getStartTime().toString()
        );

        return AppointmentResponse.from(savedAppointment);
    }

    @Transactional(readOnly = true)
    public List<AppointmentResponse> getAppointments(LocalDate date, Long stylistId) {
        List<Appointment> list;
        if (date != null) {
            if (stylistId != null) {
                list = appointmentRepository.findAllByAppointmentDateAndStylistId(date, stylistId);
            } else {
                list = appointmentRepository.findAllByAppointmentDate(date);
            }
        } else {
            if (stylistId != null) {
                list = appointmentRepository.findAllByStylistId(stylistId);
            } else {
                list = appointmentRepository.findAllByOrderByAppointmentDateDescStartTimeDesc();
            }
        }
        return list.stream().map(AppointmentResponse::from).toList();
    }


    // UPDATE STATUS WORKFLOW

    @Transactional
    public AppointmentResponse updateStatus(Long id, String status) {
        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Appointment not found with id: " + id));

        // Validate status transition
        String normalStatus = status.toUpperCase();
        appointment.setStatus(normalStatus);

        // Update child service statuses if transition impacts them
        if ("CANCELLED".equals(normalStatus)) {
            for (AppointmentServiceEntity ase : appointment.getServices()) {
                ase.setStatus("PENDING");
            }
            // Trigger SMS Cancellation simulation
            notificationService.sendBookingCancellation(
                    appointment.getCustomer().getFullName(),
                    appointment.getCustomer().getMobile(),
                    appointment.getAppointmentDate().toString(),
                    appointment.getStartTime().toString()
            );
        } else if ("CHECKED_IN".equals(normalStatus)) {
            // Trigger SMS Check-in simulation
            notificationService.sendCheckInNotification(
                    appointment.getCustomer().getFullName(),
                    appointment.getCustomer().getMobile()
            );
        } else if ("COMPLETED".equals(normalStatus) || "BILLED".equals(normalStatus)) {
            for (AppointmentServiceEntity ase : appointment.getServices()) {
                ase.setStatus("COMPLETED");
                if (ase.getCompletedAt() == null) {
                    ase.setCompletedAt(ZonedDateTime.now());
                }
            }
            
            // Calculate simulated bill & loyalty points
            double totalBill = appointment.getServices().stream().mapToDouble(s -> s.getPrice().doubleValue()).sum();
            int loyaltyPoints = (int) (totalBill / 100);
            
            // Trigger SMS Billing simulation
            notificationService.sendBillingNotification(
                    appointment.getCustomer().getFullName(),
                    appointment.getCustomer().getMobile(),
                    totalBill,
                    loyaltyPoints
            );
        }

        Appointment updated = appointmentRepository.save(appointment);
        return AppointmentResponse.from(updated);
    }


    // STYLIST ACTIONS: START/COMPLETE SERVICE

    @Transactional
    public AppointmentResponse startServiceItem(Long serviceItemId) {
        AppointmentServiceEntity ase = appointmentServiceRepository.findById(serviceItemId)
                .orElseThrow(() -> new NotFoundException("Appointment service item not found with id: " + serviceItemId));

        ase.setStatus("STARTED");
        ase.setStartedAt(ZonedDateTime.now());
        appointmentServiceRepository.save(ase);

        // Cascade status to parent appointment (moves to IN_SERVICE)
        Appointment appointment = ase.getAppointment();
        appointment.setStatus("IN_SERVICE");
        appointmentRepository.save(appointment);

        return AppointmentResponse.from(appointment);
    }

    @Transactional
    public AppointmentResponse completeServiceItem(Long serviceItemId) {
        AppointmentServiceEntity ase = appointmentServiceRepository.findById(serviceItemId)
                .orElseThrow(() -> new NotFoundException("Appointment service item not found with id: " + serviceItemId));

        ase.setStatus("COMPLETED");
        ase.setCompletedAt(ZonedDateTime.now());
        appointmentServiceRepository.save(ase);

        // Check if all services in this appointment are completed
        Appointment appointment = ase.getAppointment();
        boolean allCompleted = true;
        for (AppointmentServiceEntity item : appointment.getServices()) {
            if (!"COMPLETED".equals(item.getStatus())) {
                allCompleted = false;
                break;
            }
        }

        if (allCompleted) {
            appointment.setStatus("COMPLETED");
            appointmentRepository.save(appointment);
            
            // Calculate simulated bill & loyalty points
            double totalBill = appointment.getServices().stream().mapToDouble(s -> s.getPrice().doubleValue()).sum();
            int loyaltyPoints = (int) (totalBill / 100);
            
            // Trigger SMS Billing simulation
            notificationService.sendBillingNotification(
                    appointment.getCustomer().getFullName(),
                    appointment.getCustomer().getMobile(),
                    totalBill,
                    loyaltyPoints
            );
        }

        return AppointmentResponse.from(appointment);
    }

    @Transactional
    public AppointmentResponse addAddon(Long appointmentId, AddonRequest request, String stylistEmail) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new NotFoundException("Appointment not found with id: " + appointmentId));

        com.example.salonManagement.service_catalog.Service service = serviceRepository.findById(request.serviceId())
                .orElseThrow(() -> new NotFoundException("Service not found with id: " + request.serviceId()));

        User stylist = userRepository.findByEmail(stylistEmail)
                .orElseThrow(() -> new NotFoundException("Stylist not found with email: " + stylistEmail));

        AppointmentServiceEntity addonEntity = new AppointmentServiceEntity();
        addonEntity.setAppointment(appointment);
        addonEntity.setService(service);
        addonEntity.setAssignedStylist(stylist);
        addonEntity.setPrice(service.getBasePrice());
        addonEntity.setStatus("PENDING");
        addonEntity.setAddon(true);

        appointmentServiceRepository.save(addonEntity);
        
        // Reload appointment services
        appointment.getServices().add(addonEntity);
        
        // Re-calculate end time of appointment since an extra service has been added
        LocalTime newEndTime = appointment.getEndTime().plusMinutes(service.getDurationMinutes());
        appointment.setEndTime(newEndTime);
        appointmentRepository.save(appointment);

        return AppointmentResponse.from(appointment);
    }
}
