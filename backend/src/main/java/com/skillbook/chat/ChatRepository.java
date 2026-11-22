package com.skillbook.chat;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

interface ChatRepository extends JpaRepository<ChatMessage, UUID> {
    List<ChatMessage> findTop100ByBookingIdOrderByCreatedAtDescIdDesc(UUID bookingId);
}
