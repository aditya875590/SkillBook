package com.skillbook.auth;

import com.skillbook.common.Role;
import com.skillbook.user.*;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jwt.*;
import java.time.Instant;
import java.util.List;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class GoogleAccountTest {
    final JwtDecoder decoder=mock(JwtDecoder.class);
    final UserRepository users=mock(UserRepository.class);
    final GoogleAccountController google=new GoogleAccountController("web-id",users,mock(AuthService.class),mock(PasswordEncoder.class),decoder,new BrowserSession());
    final GoogleAccountController.Credential credential=new GoogleAccountController.Credential("signed",Role.STUDENT);
    void signed(String audience,boolean verified) {
        when(decoder.decode("signed")).thenReturn(Jwt.withTokenValue("signed").header("alg","RS256")
                .issuer("https://accounts.google.com").subject("123").audience(List.of(audience))
                .expiresAt(Instant.now().plusSeconds(3600)).claim("email","someone@example.org")
                .claim("email_verified",verified).build());
    }
    @Test void wrongAudienceIsRejected(){signed("other-client",true);assertThrows(BadCredentialsException.class,()->google.signIn(credential,null,null));verifyNoInteractions(users);}
    @Test void unverifiedEmailIsRejected(){signed("web-id",false);assertThrows(BadCredentialsException.class,()->google.signIn(credential,null,null));verifyNoInteractions(users);}
    @Test void passwordAccountRequiresExplicitLink(){signed("web-id",true);when(users.existsByEmail("someone@example.org")).thenReturn(true);
        assertThrows(IllegalStateException.class,()->google.signIn(credential,null,null));verify(users,never()).save(any());}
}
