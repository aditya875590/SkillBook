package com.skillbook;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.test.context.ActiveProfiles;
import java.io.File;
import static org.junit.jupiter.api.Assertions.assertEquals;

/** Optional browser suite against a random-port API and the disposable H2 test profile. */
@SpringBootTest(webEnvironment=SpringBootTest.WebEnvironment.RANDOM_PORT,
        properties="spring.datasource.url=jdbc:h2:mem:browser_suite;DB_CLOSE_DELAY=-1;MODE=PostgreSQL")
@ActiveProfiles("test")
@EnabledIfEnvironmentVariable(named="SKILLBOOK_BROWSER_TEST",matches="1")
class ConnectedLessonBrowserTest {
    @LocalServerPort int port;
    @Test void connectAndBook() throws Exception {
        var pb = new ProcessBuilder("npx","--no-install","playwright","test")
                .directory(new File("../frontend")).redirectErrorStream(true);
        pb.environment().put("SKILLBOOK_TEST_API","http://localhost:"+port+"/api");
        var process=pb.start();
        String output=new String(process.getInputStream().readAllBytes(),java.nio.charset.StandardCharsets.UTF_8);
        assertEquals(0,process.waitFor(),output);
    }
}
