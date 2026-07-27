package com.example.salonManagement.staff;

import com.example.salonManagement.staff.dto.StaffShiftRequest;
import com.example.salonManagement.staff.dto.StaffShiftResponse;
import com.example.salonManagement.user.User;
import com.example.salonManagement.user.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class StaffShiftService {

    private final StaffShiftRepository staffShiftRepository;
    private final UserRepository userRepository;

    public StaffShiftService(StaffShiftRepository staffShiftRepository, UserRepository userRepository) {
        this.staffShiftRepository = staffShiftRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public StaffShiftResponse assignShift(StaffShiftRequest request) {
        User user = userRepository.findById(request.userId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        StaffShift shift = new StaffShift();
        shift.setUser(user);
        shift.setDayOfWeek(request.dayOfWeek());
        shift.setStartTime(request.startTime());
        shift.setEndTime(request.endTime());

        StaffShift saved = staffShiftRepository.save(shift);
        return StaffShiftResponse.fromEntity(saved);
    }

    public List<StaffShiftResponse> getShiftsByUserId(Long userId) {
        return staffShiftRepository.findByUserId(userId)
                .stream()
                .map(StaffShiftResponse::fromEntity)
                .toList();
    }
}