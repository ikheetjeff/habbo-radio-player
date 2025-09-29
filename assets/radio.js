$(document).ready(() => {

   // Player
   let stationName = "MagicFM";
   let stationUrl = "https://stream.magic-hotel.nl/listen/magicfm/radio.mp3";
   let azuracastName = "magicfm";
   let azuracastSocket = "wss://stream.magic-hotel.nl/api/live/nowplaying/websocket";
   let radio = document.getElementById("radio_player");

   if (radio.paused) {
      $('.knop').toggleClass("play pause");
   }

   $('.knop').click(function () {
      if (radio.paused) {
         if (radio.readyState === 0) {
            radio.src = stationUrl + "?nocache=" + new Date().getTime();
         }

         radio.load();
         radio.play(); 
         radio.volume = 0.3;
      } else {
         if(radio.volume == 0.0) {
            radio.volume = 0.3;
         }else{
            radio.volume = 0.0;
         }
      }

      $(this).toggleClass("play pause");
   });

   $('.plus').click(() => {
      radio.volume += 0.05;
   });

   $('.min').click(() => {
      radio.volume -= 0.05;
   });

   $( "#player" ).draggable({ axis: "x", containment: "#area_player", scroll: false, handle: ".handle" });
   $(".o-c").click(function(){$("#player").toggleClass("minimize");});

   // Azuracast Nowplaying Websocket
   let socket = new WebSocket(azuracastSocket);

   socket.onopen = function(e) {
      socket.send(JSON.stringify({
         "subs": {
            ["station:" + azuracastName]: {"recover": true}
         }
      }));
   };

   let nowplaying = {};
   let currentTime = 0;

   function handleSseData(ssePayload, useTime = true) {
      const jsonData = ssePayload.data;

      if (useTime && 'current_time' in jsonData) {
         currentTime = jsonData.current_time;
      }

      nowplaying = jsonData.np;

      $(".streamerr").html((nowplaying.live.is_live) ? nowplaying.live.streamer_name : stationName);
      $(".listner").html(nowplaying.listeners.total);
      $(".nowPlaying").html(nowplaying.now_playing.song.text);
   }

   socket.onmessage = function(e) {
      const jsonData = JSON.parse(e.data);

      if ('connect' in jsonData) {
         const connectData = jsonData.connect;

         if ('data' in connectData) {
            connectData.data.forEach((initialRow) => handleSseData(initialRow));
         } else {
            if ('time' in connectData) {
               currentTime = Math.floor(connectData.time / 1000);
            }

            for (const subName in connectData.subs) {
               const sub = connectData.subs[subName];
               if ('publications' in sub && sub.publications.length > 0) {
                  sub.publications.forEach((initialRow) => handleSseData(initialRow, false));
               }
            }
         }
      } else if ('pub' in jsonData) {
         handleSseData(jsonData.pub);
      }
   };
});