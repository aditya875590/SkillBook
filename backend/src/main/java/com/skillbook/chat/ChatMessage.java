package com.skillbook.chat;

import com.skillbook.common.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import java.util.UUID;

@Entity
@Table(name = "chat_messages")
@Getter
@NoArgsConstructor
class ChatMessage extends BaseEntity {
    @Column(nullable = false)
    private UUID bookingId;
    @Column(nullable = false)
    private UUID senderId;
    @Column(nullable = false, length = 2000)
    private String body;

    ChatMessage(UUID bookingId, UUID senderId, String body) {
        this.bookingId = bookingId;
        this.senderId = senderId;
        this.body = body;
    }
}
