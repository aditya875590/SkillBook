package com.skillbook.review;
import com.skillbook.common.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import java.util.UUID;

@Entity @Table(name="lesson_reviews") @Getter @NoArgsConstructor
class LessonReview extends BaseEntity {
    @Column(nullable=false,unique=true) private UUID bookingId;
    @Column(nullable=false) private UUID tutorId;
    private int stars;
    @Column(length=1200) private String comment;
    LessonReview(UUID booking, UUID tutor, int stars,String comment) {
        this.bookingId=booking; this.tutorId=tutor; this.stars=stars; this.comment=comment;
    }
}
