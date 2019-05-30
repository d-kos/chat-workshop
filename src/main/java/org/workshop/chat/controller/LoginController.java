package org.workshop.chat.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessageSendingOperations;
import org.springframework.stereotype.Controller;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;
import org.workshop.chat.ActiveUsers;
import org.workshop.chat.model.Message;


@Controller
public class LoginController {

    @Autowired
    private ActiveUsers activeUsers;

    @Autowired
    private SimpMessageSendingOperations messagingTemplate;


    @MessageMapping("/login")
    @SendTo("/topic/public")
    public Message login(@Payload Message login, @Header("simpSessionId") String sessionId) {
        activeUsers.put(sessionId, login.getUsername());

        return login;
    }

    @EventListener
    public void handleWebSocketDisconnectListener(SessionDisconnectEvent event) {
        String username = activeUsers.getUsername(event.getSessionId());
        activeUsers.remove(event.getSessionId());
        notifyUserDisconnected(username);
    }

    private void notifyUserDisconnected(String username) {
        Message message = new Message();
        message.setType("LEAVE");
        message.setUsername(username);

        messagingTemplate.convertAndSend("/topic/public", message);
    }

}
