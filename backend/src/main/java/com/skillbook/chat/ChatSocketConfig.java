package com.skillbook.chat;

import com.skillbook.auth.JwtService;
import com.skillbook.exception.ResourceNotFoundException;
import io.jsonwebtoken.JwtException;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.*;
import org.springframework.http.server.*;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.config.annotation.*;
import org.springframework.web.socket.server.HandshakeInterceptor;
import java.util.Map;
import java.util.UUID;

@Configuration
@EnableWebSocket
@RequiredArgsConstructor
class ChatSocketConfig implements WebSocketConfigurer, HandshakeInterceptor {
    private final ChatSocket socket;
    private final JwtService jwt;
    private final ChatService chat;

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(socket, "/live/bookings/*").addInterceptors(this)
                .setAllowedOriginPatterns("http://localhost:[*]", "http://127.0.0.1:[*]");
    }

    @Override
    public boolean beforeHandshake(ServerHttpRequest request, ServerHttpResponse response,
                                   WebSocketHandler handler, Map<String,Object> attributes) {
        try {
            var token = request.getHeaders().getValuesAsList("Sec-WebSocket-Protocol").stream()
                    .filter(p -> p.startsWith("bearer.")).map(p->p.substring(7)).findFirst()
                    .orElseGet(()->request instanceof ServletServerHttpRequest r
                            ? com.skillbook.auth.BrowserSession.token(r.getServletRequest()) : null);
            var claims = jwt.parseToken(token);
            String path = request.getURI().getPath();
            var room = UUID.fromString(path.substring(path.lastIndexOf('/') + 1));
            chat.participant(room, claims.getSubject());
            attributes.put("room", room);
            attributes.put("expiry", claims.getExpiration().getTime());
            return true;
        } catch (JwtException | IllegalArgumentException ex) {
            response.setStatusCode(HttpStatus.UNAUTHORIZED);
        } catch (ResourceNotFoundException ex) {
            response.setStatusCode(HttpStatus.NOT_FOUND);
        }
        return false;
    }

    @Override
    public void afterHandshake(ServerHttpRequest req, ServerHttpResponse res, WebSocketHandler handler, Exception ex) {}
}
