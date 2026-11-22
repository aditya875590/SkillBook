package com.skillbook.chat;

import com.skillbook.booking.*;
import com.skillbook.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
class ChatService {
    private final BookingRepository bookings;
    private final ChatRepository messages;
    private final ApplicationEventPublisher events;

    record Changed(UUID room) {}
    record Entry(UUID id, UUID senderId, String body, LocalDateTime createdAt) {
        static Entry from(ChatMessage m) {
            return new Entry(m.getId(), m.getSenderId(), m.getBody(), m.getCreatedAt());
        }
    }

    @Transactional(readOnly = true)
    public UUID participant(UUID id, String email) {
        var missing = new ResourceNotFoundException("Booking", "id", id);
        var booking = bookings.findById(id).orElseThrow(() -> missing);
        var student = booking.getStudent();
        if (student.getEmail().equals(email)) return student.getId();
        var tutor = booking.getSlot().getTutor();
        if (tutor.getEmail().equals(email)) return tutor.getId();
        throw missing;
    }

    @Transactional(readOnly = true)
    public List<Entry> history(UUID id, String email) {
        participant(id, email);
        return messages.findTop100ByBookingIdOrderByCreatedAtDescIdDesc(id).reversed()
                .stream().map(Entry::from).toList();
    }

    @Transactional
    public Entry send(UUID id, String email, String body) {
        var sender = participant(id, email);
        var message = messages.saveAndFlush(new ChatMessage(id, sender, body.strip()));
        events.publishEvent(new Changed(id));
        return Entry.from(message);
    }
}
