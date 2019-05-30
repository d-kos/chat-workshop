'use strict';

var usernameForm = document.querySelector('.usernameForm');
var publicMessageArea = document.querySelector('.messageArea');
var usernamePage = document.querySelector('#username-page');
var chatPage = document.querySelector('#chat-page');
var publicMessageForm = document.querySelector('.messageForm');
var publicMessageInput = document.querySelector('#message');
var privateChatPage = document.querySelector('#private-chat-page');
var privateMessageForm = document.querySelector('.private.messageForm');
var privateMessageInput = document.querySelector('#private-message');
var privateMessageArea = document.querySelector('.private.messageArea');

var closeButton = document.querySelector(".close");

var currentUsername = null;
var stompClient = null;
var privateRoomKey = null;
var privateRoomKeyMap = {};

/*
3) Private chat
    - generate room key na bekendu -> rest API naprema websocketima do sad i zašto mora biti room key, pokazati preko browsera direkt na url
    - frontend js get room key
        - napraviti jQuery get metodu da pozove generateKey api
        - u case CHAT zamjeniti prepareMessage sa prepareMessageWithPrivateListener
        - pokazati otvaranje private chat forme i hidanje postojeće public forme
        - pozvati generatePrivateRoomKey u enterPrivate
    - napraviti subscribe na chat
        - na bekendu dodati u Message model String privateRoomKey
        - na frontendu implementirati callback na generatePrivateRoomKey koji će napraviti subscribe na /topic/private
    - implementirati send private message
        - na bekendu u controlleru implementati sendPrivateMessage koji će slati na /topic/private/privateRoomKey
        - pustit da implementaju sendPrivateMessage na frontendu na temelju sendMessage (paziti da promjene publicMessageInput u privateMessageInput)
        - pustit da registriraju submit button na privateMessageForm po uzoru na public
        - pustit da implementaju case PRIVATE u onMessageReceived
    - implementirati send invite na frontendu koji senda po uzoru od sendMessage sa invite typeom INVITE i dodati na subscription callback
    - impl na frontendu accept invite koji će subscribat sa prosljeđenim roomKeyem, sejvat taj key u globalnu var i otvoriti formu za private chat
    - dodati u case INVITE metodu acceptInvite
    - user koji je inicirao private chat vidit će duple poruke pa je potrebno provući kroz generatePrivateRoomKey toUser
    - impl close button koji će pozvati hide Private i registrirati listener na closeButton
    - trenutno nakon closa će se isti user subscribat više puta na isti pa se mo-e dodati mapa gdje se provjerava dal postoji taj privateRoomKey
 */

function connect(event) {
    // selektamo upisani user iz login forme
    currentUsername = document.querySelector('#name').value.trim();

    // provjera dal svima radi
    console.log(currentUsername);

    if (currentUsername) {

        // hide login forme
        usernamePage.classList.add('hidden');

        // prikaz chat forme
        chatPage.classList.remove('hidden');

        // kreiramo stop klijenta za websockete
        var socket = new SockJS('/ws');
        stompClient = Stomp.over(socket);

        stompClient.connect({}, onConnected, onError);
    }

    // prevent default ponašanja submit eventa da ne reloada page
    event.preventDefault();
}

// tu ide implementacija na backendu nakon definirana same metode
function onConnected() {
    // TU IDE NAKON BEKEND API-A I MODELA

    // subscribe na backend - spomenuti websockete vs http
    stompClient.subscribe('/topic/public', onMessageReceived, onError());

    // ide poziv prema loginu
    stompClient.send("/app/login",
        {}, // prazni headeri
        // tu nek probaju sami složiti model prema bekendu - naglasiti da je json prema bekendu
        JSON.stringify({username: currentUsername, type: 'JOIN'})
    );
}

function onMessageReceived(payload) {
    var message = JSON.parse(payload.body);
    var messageElement = document.createElement('li');

    switch (message.type) {
        case 'JOIN':
            addEventMessage('joined!', message, messageElement);
            appendTextElement(message.content, messageElement);
            appendMsgElement(publicMessageArea, messageElement);
            break;
        case 'CHAT':
            prepareMessageWithPrivateListener(message.username, messageElement);
            appendTextElement(message.content, messageElement);
            appendMsgElement(publicMessageArea, messageElement);
            break;
        case 'PRIVATE':
            prepareMessage(message.username, messageElement);
            appendTextElement(message.content, messageElement);
            // paziti da appendMsgElement dodaje u privateMessageArea
            appendMsgElement(privateMessageArea, messageElement);
            break;
        case 'LEAVE':
            addEventMessage('left!', message, messageElement);
            appendTextElement(message.content, messageElement);
            appendMsgElement(publicMessageArea, messageElement);
            break;
        case 'INVITE':
            // dodati u zadnjem koraku username
            acceptInvite(message.username, message.privateRoomKey);
            break;
        default:
            console.log("Not implemented!")
    }
}

function sendMessage(event) {
    // uzme poruku sa message inputa
    var messageContent = publicMessageInput.value.trim();

    if (messageContent && stompClient) {
        var chatMessage = {
            username: currentUsername,
            content: publicMessageInput.value,
            type: 'CHAT'
        };

        stompClient.send("/app/sendMessage", {}, JSON.stringify(chatMessage));
        // napravi clear message inputa
        publicMessageInput.value = '';
    }
    event.preventDefault();
}

function sendPrivateMessage(event) {
    // uzme poruku sa message inputa
    // pazit da bude privateMessageInput u cijeloj metodi
    var messageContent = privateMessageInput.value.trim();

    if (messageContent && stompClient) {
        var chatMessage = {
            username: currentUsername,
            content: privateMessageInput.value,
            privateRoomKey: privateRoomKey, // dat im hint da ne zaborave ovo dodati
            type: 'PRIVATE'
        };

        stompClient.send("/app/sendPrivateMessage", {}, JSON.stringify(chatMessage));
        // napravi clear message inputa
        privateMessageInput.value = '';
    }
    event.preventDefault();
}

function showPrivate() {
    privateChatPage.classList.remove("hidden");
    chatPage.classList.add("hidden");
}

function hidePrivate() {
    privateChatPage.classList.add("hidden");
    chatPage.classList.remove("hidden");
}

function enterPrivate(withUsername) {
    showPrivate();

    generatePrivateRoomKey(currentUsername, withUsername, subscription);
}

function subscription(toUser) {

    if (!privateRoomKeyMap[privateRoomKey]) {
        stompClient.subscribe('/topic/private/' + privateRoomKey, onMessageReceived, onError());
        privateRoomKeyMap[privateRoomKey] = true;
    }

    sendInvite(toUser);
}

function sendInvite(toUser) {
    var invite = {
        username: toUser,
        type: 'INVITE',
        privateRoomKey: privateRoomKey // dat im hint da ne zaborave ovo dodati
    };
    stompClient.send("/app/sendMessage", {}, JSON.stringify(invite));
}

function acceptInvite(toUser, roomKey) {
    if (currentUsername !== toUser) {
        return;
    }

    showPrivate();

    if (!privateRoomKeyMap[roomKey]) {
        stompClient.subscribe('/topic/private/' + roomKey, onMessageReceived, onError());
        privateRoomKeyMap[roomKey] = true;
    }

    privateRoomKey = roomKey;
}

function generatePrivateRoomKey(fromUser, toUser, subscription) {
    var url = 'http://localhost:8080/generateKey?from=' + fromUser + '&to=' + toUser;
    $.get(url, function (generatedKey) {
        privateRoomKey = generatedKey;
        subscription(toUser);
    });
}

usernameForm.addEventListener('submit', connect, true);
publicMessageForm.addEventListener('submit', sendMessage, true);
privateMessageForm.addEventListener('submit', sendPrivateMessage, true);
closeButton.addEventListener('click', hidePrivate, true);


