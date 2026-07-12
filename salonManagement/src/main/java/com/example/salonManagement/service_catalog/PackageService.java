package com.example.salonManagement.service_catalog;

import com.example.salonManagement.common.exception.NotFoundException;
import com.example.salonManagement.service_catalog.dto.PackageRequest;
import com.example.salonManagement.service_catalog.dto.PackageResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PackageService {

    private final ServicePackageRepository packageRepo;
    private final PackageItemRepository packageItemRepo;
    private final ServiceRepository serviceRepo;

    // Helper method to calculate total duration
    private Integer calculateTotalDuration(List<Long> serviceIds) {
        return serviceRepo.findAllById(serviceIds).stream()
                .mapToInt(com.example.salonManagement.service_catalog.Service::getDurationMinutes)
                .sum();
    }

    @Transactional
    public PackageResponse createPackage(PackageRequest req) {
        // 1. Validate that all requested base services actually exist
        for (Long serviceId : req.serviceIds()) {
            if (!serviceRepo.existsById(serviceId)) {
                throw new NotFoundException("Service not found with ID: " + serviceId);
            }
        } // Loop yahan close hona chahiye tha

        // 2. Save the main Package
        ServicePackage pkg = new ServicePackage();
        pkg.setName(req.name());
        pkg.setPackagePrice(req.packagePrice());
        pkg.setGstPercent(req.gstPercent());
        ServicePackage savedPkg = packageRepo.save(pkg);

        // 3. Save mapping in package_items table
        List<PackageItem> items = new ArrayList<>();
        for (Long serviceId : req.serviceIds()) {
            PackageItem item = new PackageItem();
            item.setPackageId(savedPkg.getId());
            item.setServiceId(serviceId);
            items.add(item);
        }
        packageItemRepo.saveAll(items);

        // 4. Calculate total time and return
        Integer totalTime = calculateTotalDuration(req.serviceIds());
        return PackageResponse.from(savedPkg, req.serviceIds(), totalTime);
    }

    @Transactional(readOnly = true)
    public List<PackageResponse> getAllActivePackages() {
        return packageRepo.findByIsActiveTrue().stream().map(pkg -> {
            List<Long> serviceIds = packageItemRepo.findByPackageId(pkg.getId())
                    .stream()
                    .map(PackageItem::getServiceId)
                    .collect(Collectors.toList());

            Integer totalTime = calculateTotalDuration(serviceIds);
            return PackageResponse.from(pkg, serviceIds, totalTime);
        }).toList();
    }

    // Edit/Update Package
    @Transactional
    public PackageResponse updatePackage(Long id, PackageRequest req) {
        // 1. Find existing package
        ServicePackage existingPkg = packageRepo.findById(id)
                .orElseThrow(() -> new NotFoundException("Package not found with ID: " + id));

        // 2. Validate new service IDs
        for (Long serviceId : req.serviceIds()) {
            if (!serviceRepo.existsById(serviceId)) {
                throw new NotFoundException("Service not found with ID: " + serviceId);
            }
        }

        // 3. Update Package details
        existingPkg.setName(req.name());
        existingPkg.setPackagePrice(req.packagePrice());
        existingPkg.setGstPercent(req.gstPercent());
        ServicePackage updatedPkg = packageRepo.save(existingPkg);

        // 4. Update Mappings (Delete old, insert new)
        packageItemRepo.deleteByPackageId(updatedPkg.getId()); // Remove old connections

        List<PackageItem> newItems = new java.util.ArrayList<>();
        for (Long serviceId : req.serviceIds()) {
            PackageItem item = new PackageItem();
            item.setPackageId(updatedPkg.getId());
            item.setServiceId(serviceId);
            newItems.add(item);
        }
        packageItemRepo.saveAll(newItems);

        Integer totalTime = calculateTotalDuration(req.serviceIds());
        return PackageResponse.from(updatedPkg, req.serviceIds(), totalTime);
    }

    // Soft Delete Package
    @Transactional
    public void deletePackage(Long id) {
        ServicePackage existingPkg = packageRepo.findById(id)
                .orElseThrow(() -> new NotFoundException("Package not found with ID: " + id));

        // Soft delete by setting isActive to false
        existingPkg.setActive(false);
        packageRepo.save(existingPkg);

        // Note: Hum package_items ko delete nahi kar rahe,
        // taaki purane bills aur history safe rahe.
    }

    // Get All Packages (Active + Inactive)
    @Transactional(readOnly = true)
    public List<PackageResponse> getAllPackages() {
        return packageRepo.findAll().stream().map(pkg -> {
            List<Long> serviceIds = packageItemRepo.findByPackageId(pkg.getId())
                    .stream()
                    .map(PackageItem::getServiceId)
                    .collect(Collectors.toList());

            Integer totalTime = calculateTotalDuration(serviceIds);
            return PackageResponse.from(pkg, serviceIds, totalTime);
        }).toList();
    }

    // Restore/Reactivate Soft Deleted Package
    @Transactional
    public PackageResponse restorePackage(Long id) {
        ServicePackage existingPkg = packageRepo.findById(id)
                .orElseThrow(() -> new NotFoundException("Package not found with ID: " + id));

        existingPkg.setActive(true);
        ServicePackage savedPkg = packageRepo.save(existingPkg);

        List<Long> serviceIds = packageItemRepo.findByPackageId(savedPkg.getId())
                .stream()
                .map(PackageItem::getServiceId)
                .collect(Collectors.toList());

        Integer totalTime = calculateTotalDuration(serviceIds);
        return PackageResponse.from(savedPkg, serviceIds, totalTime);
    }
}