package com.skillbook.chat;

import com.skillbook.common.ApiResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.security.Principal;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/bookings/{id}/messages")
@RequiredArgsConstructor
class ChatController {
    private final ChatService chat;
    record Draft(@NotBlank @Size(max = 2000) String body) {}

    @GetMapping
    ApiResponse<List<ChatService.Entry>> history(@PathVariable UUID id, Principal user) {
        return ApiResponse.ok(chat.history(id, user.getName()));
    }

    @PostMapping
    ApiResponse<ChatService.Entry> send(@PathVariable UUID id, Principal user, @Valid @RequestBody Draft draft) {
        return ApiResponse.ok(chat.send(id, user.getName(), draft.body()));
    }
}
