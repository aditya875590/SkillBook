package com.skillbook.chat;

import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionalEventListener;
import org.springframework.web.socket.*;
import org.springframework.web.socket.handler.TextWebSocketHandler;
import java.io.IOException;
import java.util.List;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

/** Signals a committed change. Message contents are fetched through the authenticated API. */
@Component
class ChatSocket extends TextWebSocketHandler implements SubProtocolCapable {
    private final Set<WebSocketSession> sessions = ConcurrentHashMap.newKeySet();
    @Override public List<String> getSubProtocols() { return List.of("skillbook.chat"); }
    @Override public void afterConnectionEstablished(WebSocketSession session) { sessions.add(session); }
    @Override public void afterConnectionClosed(WebSocketSession session, CloseStatus status) { sessions.remove(session); }

    @TransactionalEventListener
    public void notifyRoom(ChatService.Changed event) {
        for (var session : sessions) {
            if (!event.room().equals(session.getAttributes().get("room"))) continue;
            synchronized (session) {
                try {
                    if (!session.isOpen()) sessions.remove(session);
                    else if ((long) session.getAttributes().get("expiry") <= System.currentTimeMillis())
                        session.close(CloseStatus.POLICY_VIOLATION);
                    else session.sendMessage(new TextMessage("changed"));
                } catch (IOException | IllegalStateException ex) {
                    sessions.remove(session);
                }
            }
        }
    }
}
