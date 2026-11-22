package com.skillbook.chat;

import com.skillbook.common.*;
import com.skillbook.user.*;
import com.skillbook.exception.ResourceNotFoundException;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.security.Principal;
import java.util.*;

@RestController @RequestMapping("/inbox") @RequiredArgsConstructor
@PreAuthorize("hasAnyRole('STUDENT','TUTOR')")
class DirectController {
    private final DirectRepository messages;
    private final UserRepository users;

    @GetMapping
    public ApiResponse<List<DirectRepository.Contact>> contacts(Principal p) {
        return ApiResponse.ok(messages.contacts(users.findByEmail(p.getName()).orElseThrow().getId()));
    }
    @GetMapping("/{peer}")
    public ApiResponse<List<DirectMessage>> thread(Principal p,@PathVariable UUID peer) {
        return ApiResponse.ok(messages.thread(users.findByEmail(p.getName()).orElseThrow().getId(),peer,PageRequest.of(0,100)).reversed());
    }
    @PostMapping("/{peer}")
    public ApiResponse<DirectMessage> send(Principal p,@PathVariable UUID peer,@RequestBody @Valid ChatController.Draft draft) {
        var me = users.findByEmail(p.getName()).orElseThrow();
        var recipient = users.findById(peer).orElseThrow(() -> new ResourceNotFoundException("Recipient not found"));
        boolean studentInquiry = me.getRole()==Role.STUDENT && recipient.getRole()==Role.TUTOR;
        boolean tutorReply = me.getRole()==Role.TUTOR && recipient.getRole()==Role.STUDENT
                && !messages.thread(me.getId(),peer,PageRequest.of(0,1)).isEmpty();
        if (!studentInquiry && !tutorReply) throw new IllegalArgumentException("Choose a tutor or reply to an existing student conversation");
        return ApiResponse.ok(messages.save(new DirectMessage(me.getId(),peer,draft.body().strip())));
    }
}
