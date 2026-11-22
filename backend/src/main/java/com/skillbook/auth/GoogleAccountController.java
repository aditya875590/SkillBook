package com.skillbook.auth;

import com.skillbook.auth.dto.AuthResponse;
import com.skillbook.common.*;
import com.skillbook.user.*;
import jakarta.validation.constraints.*;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jwt.*;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import java.security.Principal;
import java.util.*;

@RestController
class GoogleAccountController {
    private final String clientId;
    private final JwtDecoder decoder;
    private final UserRepository users;
    private final AuthService auth;
    private final PasswordEncoder passwords;
    private final BrowserSession sessions;
    GoogleAccountController(@Value("${GOOGLE_CLIENT_ID:}") String clientId,UserRepository users,AuthService auth,PasswordEncoder passwords,JwtDecoder decoder,BrowserSession sessions) {
        this.clientId=clientId; this.users=users; this.auth=auth; this.passwords=passwords;
        this.decoder=decoder;
        this.sessions=sessions;
    }
    record Credential(@NotBlank @Size(max=10000) String credential, Role role) {}
    @GetMapping("/auth/google")
    public ApiResponse<String> configuration() { return ApiResponse.ok(clientId); }
    private Jwt verify(String credential) {
        if (clientId.isBlank()) throw new IllegalStateException("Google sign-in is not configured");
        try {
            var token=decoder.decode(credential);
            String issuer=token.getClaimAsString("iss");
            if (!("https://accounts.google.com".equals(issuer) || "accounts.google.com".equals(issuer))
                    || token.getAudience()==null || !token.getAudience().contains(clientId) || token.getExpiresAt()==null
                    || token.getSubject()==null || token.getClaimAsString("email")==null
                    || !Boolean.TRUE.equals(token.getClaimAsBoolean("email_verified")))
                throw new BadCredentialsException("Google credential rejected");
            return token;
        } catch (JwtException ex) { throw new BadCredentialsException("Google credential rejected"); }
    }
    @PostMapping("/auth/google") @Transactional
    public ApiResponse<AuthResponse> signIn(@Valid @RequestBody Credential request,jakarta.servlet.http.HttpServletRequest http,jakarta.servlet.http.HttpServletResponse output) {
        var token=verify(request.credential());
        var email=token.getClaimAsString("email").toLowerCase(Locale.ROOT);
        var user=users.findByGoogleSubject(token.getSubject()).orElseGet(() -> {
            if (users.existsByEmail(email)) throw new IllegalStateException("Sign in with your password and connect Google in Account first");
            if (request.role()==Role.ADMIN) throw new IllegalArgumentException("Choose student or tutor");
            var u=new User(); u.setEmail(email); u.setGoogleSubject(token.getSubject());
            var name=Optional.ofNullable(token.getClaimAsString("name")).filter(s->!s.isBlank()).orElse(email);
            u.setName(name.substring(0,Math.min(100,name.length())));
            u.setRole(request.role()==Role.TUTOR ? Role.TUTOR : Role.STUDENT);
            u.setPasswordHash(passwords.encode(UUID.randomUUID().toString()));
            return users.save(u);
        });
        return ApiResponse.ok(sessions.issue(auth.buildAuthResponse(user),http,output));
    }
    @PostMapping("/account/google") @Transactional
    public ApiResponse<Void> connect(Principal p,@Valid @RequestBody Credential request) {
        var token=verify(request.credential());
        if (!p.getName().equalsIgnoreCase(token.getClaimAsString("email"))) throw new IllegalArgumentException("Choose the Google account with your SkillBook email");
        users.findByEmail(p.getName()).orElseThrow().setGoogleSubject(token.getSubject());
        return ApiResponse.ok(null);
    }
}
