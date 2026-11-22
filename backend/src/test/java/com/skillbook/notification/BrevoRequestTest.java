package com.skillbook.notification;

import org.junit.jupiter.api.Test;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.*;
import static org.springframework.test.web.client.response.MockRestResponseCreators.*;

class BrevoRequestTest {
    @Test void sendsBookingMailWithVerifiedSenderAndApiKey() {
        var builder=RestClient.builder().baseUrl("https://api.brevo.com/v3");
        var server=MockRestServiceServer.bindTo(builder).build();
        var smtp=mock(JavaMailSender.class);
        var mail=new MailService(smtp,true);
        ReflectionTestUtils.setField(mail,"brevo",builder.build());
        ReflectionTestUtils.setField(mail,"brevoKey","test-only");
        ReflectionTestUtils.setField(mail,"sender","hello@example.org");
        server.expect(requestTo("https://api.brevo.com/v3/smtp/email"))
                .andExpect(header("api-key","test-only"))
                .andExpect(jsonPath("$.sender.email").value("hello@example.org"))
                .andExpect(jsonPath("$.to[0].email").value("student@example.org"))
                .andExpect(jsonPath("$.textContent").value("Lesson booked"))
                .andRespond(withSuccess());
        mail.send("student@example.org","Confirmation","Lesson booked");
        server.verify();
        verifyNoInteractions(smtp);
    }
}
