package com.skillbook.auth;

import com.skillbook.auth.dto.AuthResponse;
import com.skillbook.common.ApiResponse;
import jakarta.servlet.http.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseCookie;
import org.springframework.web.bind.annotation.*;
import java.time.Duration;

/** Browser clients opt in with a non-simple request header; CLI clients still receive Bearer tokens. */
@RestController
public class BrowserSession {
    public static final String HEADER="X-SkillBook-Session";
    private static final String NAME="skillbook_session";
    @Value("${SESSION_COOKIE_SECURE:false}") boolean secure;

    public static String token(HttpServletRequest req) {
        var cookies=req.getCookies();
        if(cookies!=null) for(var c:cookies) if(NAME.equals(c.getName()))return c.getValue();
        return null;
    }
    private void cookie(HttpServletRequest req,HttpServletResponse res,String value,long ageMs) {
        res.addHeader("Set-Cookie", ResponseCookie.from(NAME,value).httpOnly(true).sameSite("Strict")
                .secure(secure || req.isSecure()).path(req.getContextPath().isEmpty()?"/":req.getContextPath())
                .maxAge(Duration.ofMillis(ageMs)).build().toString());
    }
    public AuthResponse issue(AuthResponse auth,HttpServletRequest req,HttpServletResponse res) {
        if(!"cookie".equals(req.getHeader(HEADER))) return auth;
        cookie(req,res,auth.token(),auth.expiresIn());
        return new AuthResponse(null,"Cookie",auth.expiresIn(),auth.user());
    }
    @PostMapping("/auth/logout")
    public ApiResponse<Void> end(HttpServletRequest req,HttpServletResponse res) {
        if(!"cookie".equals(req.getHeader(HEADER))) throw new IllegalArgumentException("Session header required");
        cookie(req,res,"",0);
        return ApiResponse.ok(null);
    }
}
