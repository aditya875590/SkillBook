package com.skillbook.user;

import com.skillbook.common.ApiResponse;
import com.skillbook.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import javax.imageio.ImageIO;
import java.io.*;
import java.net.URI;
import java.security.Principal;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class MediaController {
    private final UserRepository users;

    @GetMapping("/people/{id}/photo")
    public ResponseEntity<byte[]> photo(@PathVariable UUID id) {
        var user = users.findById(id).orElseThrow(() -> new ResourceNotFoundException("Person not found"));
        if (user.getPhoto() == null) return ResponseEntity.noContent().build();
        return ResponseEntity.ok().contentType(MediaType.IMAGE_JPEG).body(user.getPhoto());
    }

    @Transactional
    @PutMapping("/account/photo")
    public ApiResponse<Void> photo(Principal p, @RequestParam MultipartFile image) throws IOException {
        if (image.isEmpty() || image.getSize() > 750_000) throw new IllegalArgumentException("Choose a JPEG under 750 KB");
        try (var input = ImageIO.createImageInputStream(image.getInputStream())) {
            var readers = ImageIO.getImageReaders(input);
            if (!readers.hasNext()) throw new IllegalArgumentException("Choose a JPEG photo");
            var reader = readers.next();
            try {
                reader.setInput(input);
                if (!reader.getFormatName().equalsIgnoreCase("JPEG") || reader.getWidth(0) > 1500 || reader.getHeight(0) > 1500)
                    throw new IllegalArgumentException("Choose a JPEG up to 1500 × 1500");
                var output = new ByteArrayOutputStream();
                ImageIO.write(reader.read(0), "jpeg", output);
                users.findByEmail(p.getName()).orElseThrow().setPhoto(output.toByteArray());
            } finally { reader.dispose(); }
        }
        return ApiResponse.ok(null);
    }

    public record Video(String url) {}
    @Transactional
    @PreAuthorize("hasRole('TUTOR')")
    @PutMapping("/account/intro-video")
    public ApiResponse<Void> video(Principal p, @RequestBody Video video) {
        String url = video.url() == null ? "" : video.url().strip();
        if (!url.isEmpty()) https(url);
        users.findByEmail(p.getName()).orElseThrow().setIntroVideo(url.isEmpty() ? null : url);
        return ApiResponse.ok(null);
    }

    public static URI https(String url) {
        if (url == null || url.length() > 2048) throw new IllegalArgumentException("Enter an HTTPS URL");
        var uri = URI.create(url);
        if (!"https".equalsIgnoreCase(uri.getScheme()) || uri.getHost() == null || uri.getUserInfo() != null)
            throw new IllegalArgumentException("Enter an HTTPS URL");
        return uri;
    }
}
