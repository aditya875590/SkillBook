package com.skillbook.chat;

import com.skillbook.auth.*;
import com.skillbook.availability.AvailabilitySlot;
import com.skillbook.booking.*;
import com.skillbook.exception.ResourceNotFoundException;
import com.skillbook.user.User;
import org.junit.jupiter.api.Test;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.http.server.*;
import org.springframework.mock.web.*;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class ChatAccessTest {
    final UUID room = UUID.randomUUID();
    final BookingRepository bookings = mock(BookingRepository.class);
    final ChatRepository messages = mock(ChatRepository.class);
    final ChatService chat = new ChatService(bookings, messages, mock(ApplicationEventPublisher.class));

    ChatAccessTest() {
        var student = mock(User.class);
        when(student.getEmail()).thenReturn("student@example.org");
        var tutor = mock(User.class);
        when(tutor.getEmail()).thenReturn("tutor@example.org");
        when(tutor.getId()).thenReturn(UUID.randomUUID());
        var slot = new AvailabilitySlot();
        slot.setTutor(tutor);
        var booking = new Booking();
        booking.setSlot(slot);
        booking.setStudent(student);
        when(bookings.findById(room)).thenReturn(Optional.of(booking));
    }

    @Test void outsiderCannotReadOrWrite() {
        assertThrows(ResourceNotFoundException.class, () -> chat.history(room, "other@example.org"));
        assertThrows(ResourceNotFoundException.class, () -> chat.send(room, "other@example.org", "hello"));
        verifyNoInteractions(messages);
    }

    @Test void browserUpgradeChecksTokenAndRoomMembership() {
        var jwt = new JwtService(new JwtProperties("0123456789012345678901234567890123456789", 60000L));
        var handler = new ChatSocket();
        var config = new ChatSocketConfig(handler, jwt, chat);
        for (String email : List.of("student@example.org", "tutor@example.org", "other@example.org")) {
            var request = new MockHttpServletRequest("GET", "/api/live/bookings/" + room);
            request.addHeader("Sec-WebSocket-Protocol", "skillbook.chat, bearer." + jwt.generateToken(email, "USER"));
            var attrs = new HashMap<String,Object>();
            boolean allowed = config.beforeHandshake(new ServletServerHttpRequest(request),
                    new ServletServerHttpResponse(new MockHttpServletResponse()), handler, attrs);
            assertEquals(!email.startsWith("other"), allowed);
            if (allowed) assertEquals(room, attrs.get("room"));
        }
    }
}
