package com.skillbook.chat;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.*;
import java.util.*;

interface DirectRepository extends JpaRepository<DirectMessage,UUID> {
    @Query("select m from DirectMessage m where (m.senderId=:me and m.recipientId=:peer) or (m.senderId=:peer and m.recipientId=:me) order by m.createdAt desc,m.id desc")
    List<DirectMessage> thread(UUID me, UUID peer, Pageable page);

    interface Contact { UUID getId(); String getName(); }
    @Query("""
        select u.id as id,u.name as name from User u, DirectMessage m
        where (m.senderId=:me and m.recipientId=u.id) or (m.recipientId=:me and m.senderId=u.id)
        group by u.id,u.name order by max(m.createdAt) desc
        """)
    List<Contact> contacts(UUID me);
}
