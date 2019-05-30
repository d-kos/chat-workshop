package org.workshop.chat.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import org.workshop.chat.model.Message;

import java.util.HashSet;

@Controller
public class ChatController {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @MessageMapping("/sendMessage")
    @SendTo("/topic/public")
    public Message sendMessage(@Payload Message chatMessage) {
        return chatMessage;
    }

    @MessageMapping("/sendPrivateMessage")
    public void sendPrivateMessage(@Payload Message chatMessage) {
        messagingTemplate.convertAndSend("/topic/private/" + chatMessage.getPrivateRoomKey(), chatMessage);
    }

    @GetMapping("/generateKey")
    @ResponseBody
    public Integer generateKey(@RequestParam String from, @RequestParam String to) {
        HashSet<String> keys = new HashSet<>();
        keys.add(from);
        keys.add(to);

        return keys.hashCode();
    }
}
