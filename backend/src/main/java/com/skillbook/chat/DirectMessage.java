package com.skillbook.chat;

import com.skillbook.common.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import java.util.UUID;

@Entity @Table(name="direct_messages") @Getter @NoArgsConstructor
class DirectMessage extends BaseEntity {
    @Column(nullable=false) private UUID senderId;
    @Column(nullable=false) private UUID recipientId;
    @Column(nullable=false,length=2000) private String body;
    DirectMessage(UUID sender, UUID recipient, String body) {
        this.senderId=sender; this.recipientId=recipient; this.body=body;
    }
}
