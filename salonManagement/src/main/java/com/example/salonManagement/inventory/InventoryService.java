package com.example.salonManagement.inventory;

import com.example.salonManagement.common.exception.ConflictException;
import com.example.salonManagement.common.exception.InsufficientStockException;
import com.example.salonManagement.common.exception.NotFoundException;
import com.example.salonManagement.inventory.dto.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class InventoryService {

    private final ProductRepository productRepository;
    private final StockMovementRepository stockMovementRepository;
    private final SupplierRepository supplierRepository;
    private final PurchaseOrderRepository purchaseOrderRepository;
    private final ServiceConsumptionRepository serviceConsumptionRepository;

    // =========================================================================
    // 1. PRODUCT MANAGEMENT
    // =========================================================================

    @Transactional
    public ProductResponse createProduct(ProductRequest request) {
        if (productRepository.existsBySku(request.sku())) {
            throw new ConflictException("Product with SKU '" + request.sku() + "' already exists");
        }

        Product product = new Product();
        product.setSku(request.sku().trim());
        product.setName(request.name().trim());
        product.setBrand(request.brand() != null ? request.brand().trim() : null);
        product.setCategory(request.category() != null ? request.category().trim() : null);
        product.setPurchasePrice(request.purchasePrice());
        product.setMrp(request.mrp());
        product.setSalePrice(request.salePrice());
        product.setGstPercent(request.gstPercent() != null ? request.gstPercent() : new BigDecimal("18.00"));
        product.setReorderLevel(request.reorderLevel());
        product.setActive(request.active() != null ? request.active() : true);
        product.setCurrentStock(BigDecimal.ZERO);

        product = productRepository.save(product);

        // Audit-first stock initialization
        if (request.initialStock() != null && request.initialStock().compareTo(BigDecimal.ZERO) > 0) {
            recordInternalMovement(product, MovementType.PURCHASE, request.initialStock(), "INIT", "Initial stock setup");
        }

        return ProductResponse.from(product);
    }

    @Transactional
    public ProductResponse updateProduct(Long id, ProductRequest request) {
        Product product = productRepository.findByIdAndIsActiveTrue(id)
                .orElseThrow(() -> new NotFoundException("Product not found with id: " + id));

        if (productRepository.existsBySkuAndIdNot(request.sku(), id)) {
            throw new ConflictException("Product with SKU '" + request.sku() + "' already exists");
        }

        product.setSku(request.sku().trim());
        product.setName(request.name().trim());
        product.setBrand(request.brand() != null ? request.brand().trim() : null);
        product.setCategory(request.category() != null ? request.category().trim() : null);
        product.setPurchasePrice(request.purchasePrice());
        product.setMrp(request.mrp());
        product.setSalePrice(request.salePrice());
        if (request.gstPercent() != null) {
            product.setGstPercent(request.gstPercent());
        }
        product.setReorderLevel(request.reorderLevel());
        if (request.active() != null) {
            product.setActive(request.active());
        }

        product = productRepository.save(product);
        return ProductResponse.from(product);
    }

    @Transactional(readOnly = true)
    public ProductResponse getProduct(Long id) {
        Product product = productRepository.findByIdAndIsActiveTrue(id)
                .orElseThrow(() -> new NotFoundException("Product not found with id: " + id));
        return ProductResponse.from(product);
    }

    @Transactional(readOnly = true)
    public Page<ProductResponse> getProducts(String category, Boolean lowStock, String search, Pageable pageable) {
        Page<Product> products = productRepository.searchProducts(category, lowStock, search, pageable);
        return products.map(ProductResponse::from);
    }

    @Transactional
    public void softDeleteProduct(Long id) {
        Product product = productRepository.findByIdAndIsActiveTrue(id)
                .orElseThrow(() -> new NotFoundException("Product not found with id: " + id));
        product.setActive(false);
        productRepository.save(product);
    }

    // =========================================================================
    // 2. STOCK MOVEMENT MANAGEMENT
    // =========================================================================

    @Transactional
    public StockMovementResponse recordMovement(Long productId, StockMovementRequest request) {
        Product product = productRepository.findByIdAndIsActiveTrue(productId)
                .orElseThrow(() -> new NotFoundException("Product not found with id: " + productId));

        // Validate mandatory reason for WASTAGE and ADJUSTMENT
        if ((request.movementType() == MovementType.WASTAGE || request.movementType() == MovementType.ADJUSTMENT)
                && (request.reason() == null || request.reason().trim().isEmpty())) {
            throw new IllegalArgumentException("Reason is mandatory for " + request.movementType() + " stock movements");
        }

        // Determine stock delta sign
        BigDecimal inputQty = request.quantity();
        BigDecimal delta;
        switch (request.movementType()) {
            case PURCHASE:
                delta = inputQty.abs();
                break;
            case SALE:
            case CONSUMPTION:
            case WASTAGE:
                delta = inputQty.abs().negate();
                break;
            case ADJUSTMENT:
                // For adjustment, if input is signed use it, or if positive assume delta as passed
                delta = inputQty;
                break;
            default:
                delta = inputQty;
        }

        StockMovement movement = recordInternalMovement(product, request.movementType(), delta, request.reference(), request.reason());
        return StockMovementResponse.from(movement);
    }

    @Transactional(readOnly = true)
    public Page<StockMovementResponse> getProductMovements(Long productId, Pageable pageable) {
        if (!productRepository.existsById(productId)) {
            throw new NotFoundException("Product not found with id: " + productId);
        }
        Page<StockMovement> movements = stockMovementRepository.findByProductIdOrderByCreatedAtDesc(productId, pageable);
        return movements.map(StockMovementResponse::from);
    }

    @Transactional(readOnly = true)
    public Page<StockMovementResponse> getAllMovements(Pageable pageable) {
        Page<StockMovement> movements = stockMovementRepository.findAllByOrderByCreatedAtDesc(pageable);
        return movements.map(StockMovementResponse::from);
    }

    @Transactional
    public StockMovement recordSaleMovement(Long productId, BigDecimal quantity, String reference, String reason) {
        Product product = productRepository.findByIdAndIsActiveTrue(productId)
                .orElseThrow(() -> new NotFoundException("Product not found with id: " + productId));
        BigDecimal delta = quantity.abs().negate();
        return recordInternalMovement(product, MovementType.SALE, delta, reference, reason);
    }


    // Internal transactional method for atomic stock update and audit logging
    private StockMovement recordInternalMovement(Product product, MovementType type, BigDecimal quantityDelta, String reference, String reason) {
        BigDecimal newStock = product.getCurrentStock().add(quantityDelta);

        // Negative Stock Guard
        if (newStock.compareTo(BigDecimal.ZERO) < 0) {
            throw new InsufficientStockException("Insufficient stock for product '" + product.getName() + "' (SKU: " + product.getSku() + "). Current stock: " + product.getCurrentStock() + ", attempted change: " + quantityDelta);
        }

        product.setCurrentStock(newStock);
        productRepository.save(product);

        StockMovement movement = new StockMovement();
        movement.setProduct(product);
        movement.setMovementType(type);
        movement.setQuantity(quantityDelta);
        movement.setReference(reference != null ? reference.trim() : null);
        movement.setReason(reason != null ? reason.trim() : null);

        return stockMovementRepository.save(movement);
    }

    // =========================================================================
    // 3. SUPPLIER MANAGEMENT
    // =========================================================================

    @Transactional
    public SupplierResponse createSupplier(SupplierRequest request) {
        Supplier supplier = new Supplier();
        supplier.setName(request.name().trim());
        supplier.setContactPerson(request.contactPerson() != null ? request.contactPerson().trim() : null);
        supplier.setPhone(request.phone() != null ? request.phone().trim() : null);
        supplier.setEmail(request.email() != null ? request.email().trim() : null);
        supplier.setAddress(request.address() != null ? request.address().trim() : null);
        supplier.setActive(request.active() != null ? request.active() : true);

        supplier = supplierRepository.save(supplier);
        return SupplierResponse.from(supplier);
    }

    @Transactional
    public SupplierResponse updateSupplier(Long id, SupplierRequest request) {
        Supplier supplier = supplierRepository.findByIdAndIsActiveTrue(id)
                .orElseThrow(() -> new NotFoundException("Supplier not found with id: " + id));

        supplier.setName(request.name().trim());
        supplier.setContactPerson(request.contactPerson() != null ? request.contactPerson().trim() : null);
        supplier.setPhone(request.phone() != null ? request.phone().trim() : null);
        supplier.setEmail(request.email() != null ? request.email().trim() : null);
        supplier.setAddress(request.address() != null ? request.address().trim() : null);
        if (request.active() != null) {
            supplier.setActive(request.active());
        }

        supplier = supplierRepository.save(supplier);
        return SupplierResponse.from(supplier);
    }

    @Transactional(readOnly = true)
    public SupplierResponse getSupplier(Long id) {
        Supplier supplier = supplierRepository.findByIdAndIsActiveTrue(id)
                .orElseThrow(() -> new NotFoundException("Supplier not found with id: " + id));
        return SupplierResponse.from(supplier);
    }

    @Transactional(readOnly = true)
    public List<SupplierResponse> getAllSuppliers() {
        return supplierRepository.findByIsActiveTrue().stream()
                .map(SupplierResponse::from)
                .collect(Collectors.toList());
    }

    @Transactional
    public void softDeleteSupplier(Long id) {
        Supplier supplier = supplierRepository.findByIdAndIsActiveTrue(id)
                .orElseThrow(() -> new NotFoundException("Supplier not found with id: " + id));
        supplier.setActive(false);
        supplierRepository.save(supplier);
    }

    // =========================================================================
    // 4. PURCHASE ORDER MANAGEMENT
    // =========================================================================

    @Transactional
    public PurchaseOrderResponse createPurchaseOrder(PurchaseOrderRequest request) {
        Supplier supplier = supplierRepository.findByIdAndIsActiveTrue(request.supplierId())
                .orElseThrow(() -> new NotFoundException("Supplier not found with id: " + request.supplierId()));

        PurchaseOrder order = new PurchaseOrder();
        order.setSupplier(supplier);
        order.setOrderDate(request.orderDate() != null ? request.orderDate() : LocalDate.now());
        order.setStatus(PurchaseOrderStatus.DRAFT);
        order.setPaymentStatus(request.paymentStatus() != null ? request.paymentStatus() : PaymentStatus.PENDING);

        BigDecimal totalAmount = BigDecimal.ZERO;

        for (PurchaseOrderItemRequest itemReq : request.items()) {
            Product product = productRepository.findByIdAndIsActiveTrue(itemReq.productId())
                    .orElseThrow(() -> new NotFoundException("Product not found with id: " + itemReq.productId()));

            PurchaseOrderItem item = new PurchaseOrderItem();
            item.setProduct(product);
            item.setQuantity(itemReq.quantity());
            item.setUnitPrice(itemReq.unitPrice());

            order.addItem(item);

            BigDecimal itemTotal = itemReq.quantity().multiply(itemReq.unitPrice());
            totalAmount = totalAmount.add(itemTotal);
        }

        order.setTotalAmount(totalAmount);
        order = purchaseOrderRepository.save(order);

        return PurchaseOrderResponse.from(order);
    }

    @Transactional(readOnly = true)
    public PurchaseOrderResponse getPurchaseOrder(Long id) {
        PurchaseOrder order = purchaseOrderRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Purchase Order not found with id: " + id));
        return PurchaseOrderResponse.from(order);
    }

    @Transactional(readOnly = true)
    public Page<PurchaseOrderResponse> getPurchaseOrders(Pageable pageable) {
        return purchaseOrderRepository.findAllByOrderByCreatedAtDesc(pageable)
                .map(PurchaseOrderResponse::from);
    }

    @Transactional
    public PurchaseOrderResponse updatePurchaseOrderStatus(Long id, PurchaseOrderStatusUpdateRequest request) {
        PurchaseOrder order = purchaseOrderRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Purchase Order not found with id: " + id));

        if (request.paymentStatus() != null) {
            order.setPaymentStatus(request.paymentStatus());
        }

        PurchaseOrderStatus newStatus = request.status();

        if (newStatus != null && newStatus != order.getStatus()) {
            if (newStatus == PurchaseOrderStatus.RECEIVED) {
                if (order.getStatus() == PurchaseOrderStatus.RECEIVED) {
                    throw new ConflictException("Purchase Order #" + id + " has already been received");
                }
                if (order.getStatus() == PurchaseOrderStatus.CANCELLED) {
                    throw new ConflictException("Cannot receive a cancelled Purchase Order #" + id);
                }

                // Automatic receiving logic: generate PURCHASE stock movements for all line items
                for (PurchaseOrderItem item : order.getItems()) {
                    recordInternalMovement(
                            item.getProduct(),
                            MovementType.PURCHASE,
                            item.getQuantity(),
                            "PO-" + order.getId(),
                            "Purchase Order #" + order.getId() + " Received"
                    );
                }
            }
            order.setStatus(newStatus);
        }

        order = purchaseOrderRepository.save(order);
        return PurchaseOrderResponse.from(order);
    }

    // =========================================================================
    // 5. SERVICE CONSUMPTION HOOK & MANAGEMENT
    // =========================================================================

    @Transactional
    public ServiceConsumptionResponse createServiceConsumption(ServiceConsumptionRequest request) {
        Product product = productRepository.findByIdAndIsActiveTrue(request.productId())
                .orElseThrow(() -> new NotFoundException("Product not found with id: " + request.productId()));

        if (serviceConsumptionRepository.existsByServiceIdAndProductId(request.serviceId(), request.productId())) {
            throw new ConflictException("Product ID " + request.productId() + " is already mapped to Service ID " + request.serviceId());
        }

        ServiceConsumption consumption = new ServiceConsumption();
        consumption.setServiceId(request.serviceId());
        consumption.setProduct(product);
        consumption.setQuantityUsed(request.quantityUsed());

        consumption = serviceConsumptionRepository.save(consumption);
        return ServiceConsumptionResponse.from(consumption);
    }

    @Transactional(readOnly = true)
    public List<ServiceConsumptionResponse> getServiceConsumptions(Long serviceId) {
        return serviceConsumptionRepository.findByServiceId(serviceId).stream()
                .map(ServiceConsumptionResponse::from)
                .collect(Collectors.toList());
    }

    @Transactional
    public void deleteServiceConsumption(Long id) {
        ServiceConsumption consumption = serviceConsumptionRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Service Consumption mapping not found with id: " + id));
        serviceConsumptionRepository.delete(consumption);
    }

    /**
     * Service Consumption Hook: Auto-reduces mapped consumable products when a service is executed.
     */
    @Transactional
    public List<StockMovementResponse> consumeStockForService(Long serviceId) {
        List<ServiceConsumption> mappings = serviceConsumptionRepository.findByServiceId(serviceId);
        if (mappings.isEmpty()) {
            return List.of();
        }

        List<StockMovementResponse> responses = new ArrayList<>();
        for (ServiceConsumption mapping : mappings) {
            BigDecimal delta = mapping.getQuantityUsed().negate();
            StockMovement movement = recordInternalMovement(
                    mapping.getProduct(),
                    MovementType.CONSUMPTION,
                    delta,
                    "SERVICE_EXECUTION_" + serviceId,
                    "Automated consumption for service ID: " + serviceId
            );
            responses.add(StockMovementResponse.from(movement));
        }

        return responses;
    }
}
