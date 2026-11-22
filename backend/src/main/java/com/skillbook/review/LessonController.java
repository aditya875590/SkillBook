package com.skillbook.review;

import com.skillbook.booking.*;
import com.skillbook.common.ApiResponse;
import com.skillbook.exception.ResourceNotFoundException;
import com.skillbook.user.MediaController;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import java.math.*;
import java.security.Principal;
import java.util.*;

@RestController @RequiredArgsConstructor
class LessonController {
    private final BookingRepository bookings;
    private final ReviewRepository reviews;
    private final com.skillbook.tutor.TutorProfileRepository tutors;
    record Meeting(String url) {}
    record Rating(@Min(1) @Max(5) int stars,@NotBlank @Size(max=1200) String comment) {}

    @PutMapping("/bookings/{id}/meeting") @Transactional @PreAuthorize("hasRole('TUTOR')")
    public ApiResponse<Void> meeting(Principal p,@PathVariable UUID id,@RequestBody Meeting request) {
        var b=bookings.findById(id).orElseThrow(() -> new ResourceNotFoundException("Booking not found"));
        if (!b.getSlot().getTutor().getEmail().equals(p.getName())) throw new ResourceNotFoundException("Booking not found");
        if (b.getStatus()!=BookingStatus.CONFIRMED) throw new IllegalStateException("Lesson is no longer scheduled");
        var uri=MediaController.https(request.url());
        String host=uri.getHost().toLowerCase(Locale.ROOT);
        if (!(host.equals("zoom.us") || host.endsWith(".zoom.us") || host.equals("meet.google.com")) || uri.getPath().length()<2)
            throw new IllegalArgumentException("Use a Zoom or Google Meet meeting link");
        b.setMeetingUrl(uri.toString());
        return ApiResponse.ok(null);
    }

    @PostMapping("/bookings/{id}/review") @Transactional @PreAuthorize("hasRole('STUDENT')")
    public ApiResponse<Void> review(Principal p,@PathVariable UUID id,@RequestBody @Valid Rating r) {
        var b=bookings.findById(id).orElseThrow(() -> new ResourceNotFoundException("Booking not found"));
        if (!b.getStudent().getEmail().equals(p.getName())) throw new ResourceNotFoundException("Booking not found");
        if (b.getStatus()!=BookingStatus.COMPLETED) throw new IllegalStateException("Review the lesson after completion");
        var tutor=b.getSlot().getTutor().getId();
        var profile=tutors.lockTutor(tutor);
        if (reviews.existsByBookingId(id)) throw new IllegalStateException("You have already reviewed this lesson");
        reviews.saveAndFlush(new LessonReview(id,tutor,r.stars(),r.comment().strip()));
        profile.setRating(BigDecimal.valueOf(reviews.average(tutor)).setScale(2,RoundingMode.HALF_UP));
        return ApiResponse.ok(null);
    }

    @GetMapping("/tutors/{id}/reviews")
    public ApiResponse<List<ReviewRepository.PublicReview>> reviews(@PathVariable UUID id) {
        return ApiResponse.ok(reviews.findTop50ByTutorIdOrderByCreatedAtDesc(id));
    }
}
