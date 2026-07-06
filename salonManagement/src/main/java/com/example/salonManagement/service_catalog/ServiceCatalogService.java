package com.example.salonManagement.service_catalog;

import com.example.salonManagement.common.exception.NotFoundException;
import com.example.salonManagement.common.exception.ConflictException;
import com.example.salonManagement.service_catalog.dto.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ServiceCatalogService {

    private final ServiceCategoryRepository categoryRepository;
    private final ServiceRepository serviceRepository;
    private final ServicePackageRepository packageRepository;

    // ==========================================
    // 1. CATEGORY METHODS (Category Tree & CRUD)
    // ==========================================

    @Transactional(readOnly = true)
    public List<CategoryResponse> getCategoryTree() {
        // Sirf root-level categories load karenge (jin ka parent null hai),
        // aur CategoryResponse.from() method automatically nested sub-categories map karega.
        List<ServiceCategory> rootCategories = categoryRepository.findByParentIsNull();
        return rootCategories.stream()
                .map(CategoryResponse::from)
                .collect(Collectors.toList());
    }

    @Transactional
    public CategoryResponse createCategory(CategoryRequest request) {
        ServiceCategory category = new ServiceCategory();
        category.setName(request.name());

        if (request.parentId() != null) {
            ServiceCategory parent = categoryRepository.findById(request.parentId())
                    .orElseThrow(() -> new NotFoundException("Parent Category not found with id: " + request.parentId()));
            category.setParent(parent);
        }

        ServiceCategory saved = categoryRepository.save(category);
        return CategoryResponse.from(saved);
    }

    @Transactional
    public CategoryResponse updateCategory(Long id, CategoryRequest request) {
        ServiceCategory category = categoryRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Category not found with id: " + id));

        category.setName(request.name());

        if (request.parentId() != null) {
            // Self-parent check to prevent cycle
            if (request.parentId().equals(id)) {
                throw new ConflictException("Category cannot be its own parent.");
            }
            ServiceCategory parent = categoryRepository.findById(request.parentId())
                    .orElseThrow(() -> new NotFoundException("Parent Category not found with id: " + request.parentId()));
            category.setParent(parent);
        } else {
            category.setParent(null);
        }

        ServiceCategory updated = categoryRepository.save(category);
        return CategoryResponse.from(updated);
    }

    @Transactional
    public void deleteCategory(Long id) {
        if (!categoryRepository.existsById(id)) {
            throw new NotFoundException("Category not found with id: " + id);
        }
        categoryRepository.deleteById(id);
    }

    // ==========================================
    // 2. SERVICE METHODS (CRUD & Deactivation)
    // ==========================================

    @Transactional(readOnly = true)
    public List<ServiceResponse> getAllServices() {
        return serviceRepository.findAll().stream()
                .map(ServiceResponse::from)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ServiceResponse> getActiveServices() {
        return serviceRepository.findByActiveTrue().stream()
                .map(ServiceResponse::from)
                .collect(Collectors.toList());
    }

    @Transactional
    public ServiceResponse createService(ServiceRequest request) {
        ServiceCategory category = categoryRepository.findById(request.categoryId())
                .orElseThrow(() -> new NotFoundException("Category not found with id: " + request.categoryId()));

        com.example.salonManagement.service_catalog.Service service = new com.example.salonManagement.service_catalog.Service();
        service.setCategory(category);
        service.setName(request.name());
        service.setDescription(request.description());
        service.setBasePrice(request.basePrice());
        service.setMemberPrice(request.memberPrice());
        service.setWeekendPrice(request.weekendPrice());
        service.setDurationMinutes(request.durationMinutes());
        service.setGstPercent(request.gstPercent());
        
        if (request.active() != null) {
            service.setActive(request.active());
        }

        com.example.salonManagement.service_catalog.Service saved = serviceRepository.save(service);
        return ServiceResponse.from(saved);
    }

    @Transactional
    public ServiceResponse updateService(Long id, ServiceRequest request) {
        com.example.salonManagement.service_catalog.Service service = serviceRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Service not found with id: " + id));

        ServiceCategory category = categoryRepository.findById(request.categoryId())
                .orElseThrow(() -> new NotFoundException("Category not found with id: " + request.categoryId()));

        service.setCategory(category);
        service.setName(request.name());
        service.setDescription(request.description());
        service.setBasePrice(request.basePrice());
        service.setMemberPrice(request.memberPrice());
        service.setWeekendPrice(request.weekendPrice());
        service.setDurationMinutes(request.durationMinutes());
        service.setGstPercent(request.gstPercent());
        
        if (request.active() != null) {
            service.setActive(request.active());
        }

        com.example.salonManagement.service_catalog.Service updated = serviceRepository.save(service);
        return ServiceResponse.from(updated);
    }

    @Transactional
    public void deactivateService(Long id) {
        com.example.salonManagement.service_catalog.Service service = serviceRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Service not found with id: " + id));
        
        // Soft delete (Setting is_active = false)
        service.setActive(false);
        serviceRepository.save(service);
    }

    // ==========================================
    // 3. COMBO PACKAGE METHODS (CRUD)
    // ==========================================

    @Transactional(readOnly = true)
    public List<PackageResponse> getAllPackages() {
        return packageRepository.findAll().stream()
                .map(PackageResponse::from)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<PackageResponse> getActivePackages() {
        return packageRepository.findByActiveTrue().stream()
                .map(PackageResponse::from)
                .collect(Collectors.toList());
    }

    @Transactional
    public PackageResponse createPackage(PackageRequest request) {
        ServicePackage servicePackage = new ServicePackage();
        servicePackage.setName(request.name());
        servicePackage.setPackagePrice(request.packagePrice());
        servicePackage.setGstPercent(request.gstPercent());
        
        if (request.active() != null) {
            servicePackage.setActive(request.active());
        }

        // Link services
        List<PackageItem> items = request.serviceIds().stream()
                .map(serviceId -> {
                    com.example.salonManagement.service_catalog.Service s = serviceRepository.findById(serviceId)
                            .orElseThrow(() -> new NotFoundException("Service not found with id: " + serviceId));
                    PackageItem item = new PackageItem();
                    item.setServicePackage(servicePackage);
                    item.setService(s);
                    return item;
                }).collect(Collectors.toList());

        servicePackage.setItems(items);

        ServicePackage saved = packageRepository.save(servicePackage);
        return PackageResponse.from(saved);
    }

    @Transactional
    public PackageResponse updatePackage(Long id, PackageRequest request) {
        ServicePackage servicePackage = packageRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Package not found with id: " + id));

        servicePackage.setName(request.name());
        servicePackage.setPackagePrice(request.packagePrice());
        servicePackage.setGstPercent(request.gstPercent());
        
        if (request.active() != null) {
            servicePackage.setActive(request.active());
        }

        // Clear existing items and rebuild to update links
        servicePackage.getItems().clear();
        
        List<PackageItem> newItems = request.serviceIds().stream()
                .map(serviceId -> {
                    com.example.salonManagement.service_catalog.Service s = serviceRepository.findById(serviceId)
                            .orElseThrow(() -> new NotFoundException("Service not found with id: " + serviceId));
                    PackageItem item = new PackageItem();
                    item.setServicePackage(servicePackage);
                    item.setService(s);
                    return item;
                }).collect(Collectors.toList());

        servicePackage.getItems().addAll(newItems);

        ServicePackage updated = packageRepository.save(servicePackage);
        return PackageResponse.from(updated);
    }

    @Transactional
    public void deactivatePackage(Long id) {
        ServicePackage servicePackage = packageRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Package not found with id: " + id));
        
        servicePackage.setActive(false);
        packageRepository.save(servicePackage);
    }
}
