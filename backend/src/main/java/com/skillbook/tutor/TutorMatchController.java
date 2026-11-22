package com.skillbook.tutor;

import com.skillbook.common.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import java.security.Principal;
import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class TutorMatchController {
    private final JdbcClient db;
    public record Match(UUID id, String name, int matched, int wanted) {}

    @GetMapping("/students/matches")
    @PreAuthorize("hasRole('STUDENT')")
    public ApiResponse<List<Match>> matches(Principal principal) {
        return ApiResponse.ok(db.sql("""
            select t.id, t.name, count(*) matched,
                (select count(*) from skill_wanted w2 where w2.student_id=s.id) wanted
            from users s join skill_wanted w on w.student_id=s.id
            join skill_offered o on o.skill_id=w.skill_id join users t on t.id=o.tutor_id
            join tutor_profiles tp on tp.user_id=t.id
            where s.email=:email group by s.id,t.id,t.name,tp.rating
            order by matched desc,tp.rating desc,t.name,t.id limit 5
            """).param("email", principal.getName()).query(Match.class).list());
    }
}
