package com.skillbook.review;
import org.springframework.data.jpa.repository.*;
import java.util.*;

interface ReviewRepository extends JpaRepository<LessonReview,UUID> {
    interface PublicReview { int getStars(); String getComment(); }
    List<PublicReview> findTop50ByTutorIdOrderByCreatedAtDesc(UUID tutorId);
    boolean existsByBookingId(UUID bookingId);
    @Query("select avg(r.stars) from LessonReview r where r.tutorId=:id")
    double average(UUID id);
}
