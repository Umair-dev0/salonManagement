package com.example.salonManagement.service_catalog;

import com.example.salonManagement.service_catalog.dto.CategoryRequest;
import com.example.salonManagement.service_catalog.dto.CategoryResponse;
import com.example.salonManagement.service_catalog.dto.ServiceRequest;
import com.example.salonManagement.service_catalog.dto.ServiceResponse;
import com.example.salonManagement.common.exception.NotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CatalogService {

    private final ServiceRepository serviceRepo;
    private final ServiceCategoryRepository categoryRepo;

    @Transactional
    public ServiceResponse createService(ServiceRequest req) {
        // Validate category exists using your custom NotFoundException
        categoryRepo.findById(req.categoryId())
                .orElseThrow(() -> new NotFoundException("Category not found with ID: " + req.categoryId()));


        com.example.salonManagement.service_catalog.Service s = new com.example.salonManagement.service_catalog.Service();
        s.setCategoryId(req.categoryId());
        s.setName(req.name());
        s.setDescription(req.description());
        s.setBasePrice(req.basePrice());
        s.setMemberPrice(req.memberPrice());
        s.setWeekendPrice(req.weekendPrice());
        s.setDurationMinutes(req.durationMinutes());
        s.setGstPercent(req.gstPercent());

        return ServiceResponse.from(serviceRepo.save(s));
    }
    // Edit/Update Service
    @Transactional
    public ServiceResponse updateService(Long id, ServiceRequest req) {
        // Find existing service
        com.example.salonManagement.service_catalog.Service existingService = serviceRepo.findById(id)
                .orElseThrow(() -> new NotFoundException("Service not found with ID: " + id));

        // Validate if the new category exists
        categoryRepo.findById(req.categoryId())
                .orElseThrow(() -> new NotFoundException("Category not found with ID: " + req.categoryId()));

        // Update fields
        existingService.setCategoryId(req.categoryId());
        existingService.setName(req.name());
        existingService.setDescription(req.description());
        existingService.setBasePrice(req.basePrice());
        existingService.setMemberPrice(req.memberPrice());
        existingService.setWeekendPrice(req.weekendPrice());
        existingService.setDurationMinutes(req.durationMinutes());
        existingService.setGstPercent(req.gstPercent());

        return ServiceResponse.from(serviceRepo.save(existingService));
    }

    // Soft Delete Service
    @Transactional
    public void deleteService(Long id) {
        com.example.salonManagement.service_catalog.Service existingService = serviceRepo.findById(id)
                .orElseThrow(() -> new NotFoundException("Service not found with ID: " + id));

        // Soft delete by setting isActive to false
        existingService.setActive(false);
        serviceRepo.save(existingService);
    }

    @Transactional(readOnly = true)
    public List<ServiceResponse> getAllActiveServices() {
        return serviceRepo.findByIsActiveTrue().stream()
                .map(ServiceResponse::from)

                .toList();
    }

    // Apni CatalogService.java class me in methods ko add karein:

    @Transactional
    public CategoryResponse createCategory(CategoryRequest req) {
        // Check if parent category exists (if parentId is provided)
        if (req.parentId() != null) {
            categoryRepo.findById(req.parentId())
                    .orElseThrow(() -> new NotFoundException("Parent category not found with ID: " + req.parentId()));
        }

        ServiceCategory category = new ServiceCategory();
        category.setName(req.name());
        category.setParentId(req.parentId());

        return CategoryResponse.from(categoryRepo.save(category));
    }


    @Transactional(readOnly = true)
    public List<CategoryResponse> getCategoryTree() {
        List<ServiceCategory> allCategories = categoryRepo.findAll();

        // Convert entities to DTOs
        java.util.Map<Long, CategoryResponse> dtoMap = new java.util.HashMap<>();
        for (ServiceCategory cat : allCategories) {
            dtoMap.put(cat.getId(), CategoryResponse.from(cat));
        }

        // Build the Tree
        List<CategoryResponse> rootCategories = new java.util.ArrayList<>();

        for (CategoryResponse dto : dtoMap.values()) {
            if (dto.parentId() == null) {
                // It's a root category
                rootCategories.add(dto);
            } else {
                // It's a sub-category, add to its parent's subCategories list
                CategoryResponse parent = dtoMap.get(dto.parentId());
                if (parent != null) {
                    parent.subCategories().add(dto);
                }
            }
        }

        return rootCategories;
    }
}