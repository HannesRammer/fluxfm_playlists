let fluxAdvanced = {
    idFluxPlaylistsLeft:  "fluxplaylistsLeft",
classPlayListsWrapper:  "playlistswrapper",
classPlaylist:  "playlist",
classPlayedTime: "playedTime",
classPLItem: "plitem",
    classActivePlaylistL : "active_playlist_l_short",
    classActivePlaylistR : "active_playlist_r_short",
    stationDivider: 0,
    loadPlaylist: function () {
        let lists = document.querySelectorAll("#channelsscroller a");
//let channels = document.querySelectorAll("#channelsscroller li a");
        for (let i = 0; i < lists.length; i++) {
            let attr = lists[i].getAttribute("rel");
            if (attr !== "alternative" &&
                attr !== "passportapproved" &&
                attr !== "60er" &&
                attr !== "event06" &&
                attr !== "ChillHop" &&
                attr !== "chillout" &&
                attr !== "dubradio" &&
                attr !== "yogasounds" &&
                attr !== "rastaradio" &&
                attr !== "riot"
            ) {


                let channelsscroller = document.querySelectorAll("#channelsscroller a")[i];
                fluxAdvanced.playerStations.push(channelsscroller);


                let name = fluxAdvanced.getConvertedStreamName(channelsscroller.rel);
                fluxAdvanced.locList.push(name);

            }
        }
        console.log("playlists loaded");
    },
    playerStations: [],
    //locList: ["fluxfm", "fluxkompensator", "clubsandwich", "ohrspiel", "feierstarter", "xjazz", "electronicbeats", "fluxforward", "fluxlounge", "electroflux"],
    //let locList = ["live", "fluxkompensator", "clubsandwich", "ohrspiel", "feierstarter", "xjazz", "electronicbeats", "fluxforward", "fluxlounge", "electroflux"];
    //locList: ["berlin", "fluxkompensator", "clubsandwich", "ohrspiel", "feierstarter", "xjazz", "electronicbeats", "fluxforward", "fluxlounge", "electroflux"],
    locList: [],
    //prevent playlist updates from adding a song multiple times
    alreadyAddedToPlaylist: [],
    playlistDivs: [],
    //Like dislike
    likes: [],
    dislikes: [],
    hidden_stations: [],
    alertme: function () {
        alert(1);
    },
    prefix: function () {
        let isSecure = document.location.href.indexOf("https://") > -1;
        let prefix = "http";
        if (isSecure) {
            prefix += "s";
        }
        return prefix;
    },
    getConvertedStreamName: function (name) {

        if (name === "fluxfm") {
            name = "berlin";
        }
        if (name === "soundofberlin") {
            name = "berlinsound";
        }
        if (name === "elektroflux") {
            name = "electroflux";
        }
        return name;
    },
    revertConvertedStreamName: function (name) {

        if (name === "berlin") {
            name = "fluxfm";
        }
        if (name === "berlinsound") {
            name = "soundofberlin";
        }
        if (name === "electroflux") {
            name = "elektroflux";
        }
        return name;
    },
    // Create the XHR object.
    createCORSRequest: function (method, url) {
        let request = new XMLHttpRequest();
        if ("withCredentials" in request) {
            request.open(method, url, true);
        } else if (typeof XDomainRequest != "undefined") {
            request = new XDomainRequest();
            request.open(method, url);
        } else {
            request = null;
        }
        return request;
    },
    // Make the actual CORS request.
    makeCorsRequest: function (requestUrl) {
        //let url = 'http://updates.html5rocks.com';
        let request = fluxAdvanced.createCORSRequest("GET", requestUrl);
        if (!request) {
            throw new Error('CORS not supported');
        }
        if (request) {
            request.withCredentials = true;
            request.setRequestHeader('Access-Control-Allow-Origin', '*');
            request.setRequestHeader('Content-Type', 'application/json');
            request.setRequestHeader('X-Custom-Header', 'fluxplaylists');
            request.onerror = function () {
                alert('Woops, there was an error making the request.');
            };
            request.onreadystatechange = function () {
                if (request.readyState === 4 && request.status === 200) {
                    let data = JSON.parse(request.responseText);
                    let playlistName = requestUrl.split("loc=")[1];
                    let id = "playlist_" + playlistName;
                    let playlistTag = $("#" + id);

                    let listItemsList = document.createElement("ul");
                    if (data.status === "ok") {

                        for (let i = 0; i < data.tracks.length; i++) {
                            let listItem = document.createElement("li");
                            let item = data.tracks[i];
                            listItem.setAttribute("playlistid", item.id);
                            listItem.innerHTML = `<div class="${fluxAdvanced.classPLItem}">
                               <span class="time">${item.time}</span>
                               <span class="artist">${item.artist}</span> 
                               <span class="track">${item.title}</span>
                               <br>
                                <!--TODO add like dislike button-->
                            <div class="buttons">   <span class="hide_station_button hide_station_text"><i class="far fa-eye-slash"></i></span>
                            <span class="like_button liked_text"><i class="far fa-heart"></i></span>
                            <span class="dislike_button disliked_text"><i class="far fa-thumbs-down"></i></span>
                            </div></div>
                            
                            `;
                            listItem.className = fluxAdvanced.classPlaylist+" ";

                            listItemsList.appendChild(listItem);
                        }

                        let plitems = $(listItemsList).find("."+fluxAdvanced.classPLItem);
                        let time = "00:00:00";
                        let date = "2018-07-15";
                        let playlistTrackId = "";
                        if (data.tracks.length > 0) {
                            time = data.tracks[0].time + ":00";
                            date = data.tracks[0].date;
                            playlistTrackId = data.tracks[0].id;
                        }

                        let dateString = Date.parse(date + " " + time);
                        let current = Date.now();
                        let difference = parseInt(current) - parseInt(dateString);
                        let seconds = parseInt(difference / 1000);
                        let playedTime = $.format.date(difference, 'mm:ss');

                        if (fluxAdvanced.alreadyAddedToPlaylist.indexOf(playlistTrackId) === -1) {

                            playlistTag.scrollTop = 0;
                            if (data.tracks.length === 1) {
                                seconds = 0;
                            }
                            let meterDiv = playlistTag.parent().find("meter")[0];
                            if (meterDiv != null) {
                                meterDiv.value = seconds || 0;
                                meterDiv.max = 300;
                            }

                            let plitems = $(listItemsList.querySelectorAll("."+fluxAdvanced.classPLItem));
                            $(plitems.find(".hide_station_button")).click(function (event) {
                                event.stopImmediatePropagation();
                                event.preventDefault();
                                console.log("hideStation");
                                let parent = this.parentElement.parentElement;
                                let wrapper_div = $(parent.parentElement.parentElement.parentElement)[0];
                                $(wrapper_div).toggleClass("hidden");
                                fluxAdvanced.hide_station($(wrapper_div).attr('rel'));
                            });
                            $(plitems.find(".dislike_button")).click(function (event) {

                                event.stopImmediatePropagation();
                                event.preventDefault();
                                console.log("dislike");
                                let parent = this.parentElement.parentElement;
                                $(parent.parentElement).toggleClass("disliked");
                                $(parent.parentElement).removeClass("liked");
                                fluxAdvanced.dislike(parent.children[1].innerText + "-" + parent.children[2].innerText);
                            });
                            $(plitems.find(".like_button")).click(function (event) {

                                event.stopImmediatePropagation();
                                event.preventDefault();
                                console.log("like");
                                let parent = this.parentElement.parentElement;
                                $(parent.parentElement).toggleClass("liked");
                                $(parent.parentElement).removeClass("disliked");
                                fluxAdvanced.like(parent.children[1].innerText + "-" + parent.children[2].innerText);
                            });
                            playlistTag.prepend($(listItemsList).children());
                            let wrapper_div = playlistTag.parent();
                            if (wrapper_div[0].className.indexOf("active_playlist") ===-1) {
                                let movable_playlist_div = wrapper_div.parent();
                                let playlistswrapper_div = movable_playlist_div.parent();
                                playlistswrapper_div.prepend(movable_playlist_div);
                            }
                            fluxAdvanced.alreadyAddedToPlaylist.push(playlistTrackId);
                        }
                        let station = $(plitems[0]).parent().parent().parent();
                        let stationName = station.attr('rel');
                        if (fluxAdvanced.hidden_stations.indexOf(stationName) > -1) {
                            station.toggleClass("hidden");
                        }
                        for (let i = 0; i < plitems.length; i++) {
                            let item = $(plitems[i]);
                            let artist = item.children(".artist")[0].innerText;
                            let track = item.children(".track")[0].innerText;
                            let fullTrack = artist + "-" + track;


                            if (fluxAdvanced.likes.indexOf(fullTrack) > -1) {
                                item.parent().addClass("liked");
                            }
                            if (fluxAdvanced.dislikes.indexOf(fullTrack) > -1) {
                                item.parent().addClass("disliked");
                            }


                        }

                    }
                    //let text = request.responseText;
                    //console.log('Response from CORS request to ' + "flux" + ': ' + text);
                }
            };
            request.send();
        }
    },

    store: function () {
        chrome.storage.sync.set({'likes': fluxAdvanced.likes}, function () {
            // Notify that we saved.
            console.log('likes updated');
        });
        chrome.storage.sync.set({'dislikes': fluxAdvanced.dislikes}, function () {
            // Notify that we saved.
            console.log('dislikes updated');
        });
        chrome.storage.sync.set({'hidden_stations': fluxAdvanced.hidden_stations}, function () {
            // Notify that we saved.
            console.log('hidden stations updated');
        });
    },
    load: function () {
        chrome.storage.sync.get('likes', function (value) {
            if (value.likes === undefined) {
                fluxAdvanced.likes = [];
            } else {
                fluxAdvanced.likes = value.likes;
            }
            console.log('likes loaded');
        });
        chrome.storage.sync.get('dislikes', function (value) {
            if (value.dislikes === undefined) {
                fluxAdvanced.dislikes = [];
            } else {
                fluxAdvanced.dislikes = value.dislikes;
            }
            console.log('dislikes loaded');
        });
        chrome.storage.sync.get('hidden_stations', function (value) {
            if (value.hidden_stations === undefined) {
                fluxAdvanced.hidden_stations = [];
            } else {
                fluxAdvanced.hidden_stations = value.hidden_stations;
            }
            console.log('hidden stations loaded');
        });

    },
    updatePlaylists: function (number) {

        //"http://www.fluxfm.de/fluxfm-playlist/api.php?act=list&cuttime=1&limit=1&loc=berlin"
        //let hashList = ["fluxfm", "fluxkompensator", "clubsandwich", "ohrspiel", "feierstarter"];
        //let locList = ["berlin", "fluxkompensator", "clubsandwich", "ohrspiel", "feierstarter"];
        for (let i = 0; i < fluxAdvanced.locList.length; i++) {
            setTimeout(function () {
            }, 30);
            let stream = fluxAdvanced.prefix() + "://www.fluxfm.de/fluxfm-playlist/api.php?act=list&cuttime=1&limit=" + number + "&loc=" + fluxAdvanced.getConvertedStreamName(fluxAdvanced.locList[i]);
            let url = encodeURI(stream);
            //console.log(url);
            fluxAdvanced.makeCorsRequest(url);
        }
    },
    createPlaylistDiv: function (i) {
        let classname = "wrapper";
        if (fluxAdvanced.isActive(i) === "true") {
            if (i < fluxAdvanced.stationDivider) {
                classname += " "+fluxAdvanced.classActivePlaylistL;
            } else {
                classname += " "+fluxAdvanced.classActivePlaylistR
            }
        }
        let v = 0;
        let max = 300;
        let div = document.createElement("div");
        //  debugger;
        let stationName = fluxAdvanced.getPlaylistName(fluxAdvanced.locList[i]);
        div.innerHTML = `<div class="${classname}" id="playlistWrapper${(i)}" rel="${stationName}" >
            <meter max="300" min="0" value="240" high="270" low="215" optimum="1802" 
            style="position: absolute;z-index: 1;width: 100%;height: 4px;"></meter>
              <div class="${fluxAdvanced.classPlayedTime}"></div>
              <ul class="stationLink" id="playlist_${stationName}" style="padding:0;" rel="${stationName}"></ul>
              
                        <div class="station" rel="${stationName}" >${fluxAdvanced.revertConvertedStreamName(fluxAdvanced.locList[i])}</div>
                        <!--div style="width:15px;height:15px;background:red;position:absolute;right:0;top:0;z-index:9999;" onclick="alertme()">hide<div>
                        <div style="width:15px;height:15px;background:red;" onclick="function(){alert(1);}">show<div-->
          </div>`;


        return div;
    },

    isActive: function (i) {
        let loc = document.location.toLocaleString();
        let hasHash = loc.indexOf("#") > -1;
        let value = "false";
        if (hasHash) {
            if (loc.indexOf("#" + fluxAdvanced.getPlaylistName(fluxAdvanced.locList[i - 1])) > -1) {
                value = "true";
            } else {
                value = "false";
            }
        } else {
            if (i === 1) {
                value = "true";
            }
        }
        return value;
    },
    setAudioqualityToHigh: function () {
        let quality = document.querySelector("#quality a");
        if (quality.innerText === "64") {
            quality.click();
            quality.click();
        } else if (quality.innerText === "128") {
            quality.click();
        }
    },
    initiateView: function () {
        if($("body").width() > 1400){
        fluxAdvanced.idFluxPlaylistsLeft = "fluxplaylistsLeft";
            fluxAdvanced.classPlayListsWrapper = "playlistswrapper";
            fluxAdvanced.classPlaylist = "playlist";
            fluxAdvanced.classPlayedTime ="playedTime";
            fluxAdvanced.classPLItem ="plitem";
            fluxAdvanced.classActivePlaylistL = "active_playlist_l";
            fluxAdvanced.classActivePlaylistR = "active_playlist_r";
        }else{
            fluxAdvanced.idFluxPlaylistsLeft = "fluxplaylistsLeft_short";
            fluxAdvanced.classPlayListsWrapper = "playlistswrapper_short";
            fluxAdvanced.classPlaylist = "playlist_short";
            fluxAdvanced.classPlayedTime ="playedTime_short";
            fluxAdvanced.classPLItem ="plitem_short";
            fluxAdvanced.classActivePlaylistL = "active_playlist_l_short";
            fluxAdvanced.classActivePlaylistR = "active_playlist_r_short";
            window.resizeTo(1300, 768);
        }

        fluxAdvanced.load();

        let length = fluxAdvanced.playerStations.length;
        fluxAdvanced.stationDivider = parseInt(length / 2);

        let plLeft = document.createElement("div");
        let plRight = document.createElement("div");
        plLeft.className = fluxAdvanced.classPlayListsWrapper;
        plLeft.id = fluxAdvanced.idFluxPlaylistsLeft;
        plRight.className = fluxAdvanced.classPlayListsWrapper;
        plRight.id = "fluxplaylistsRight";


        let contentLeft = document.querySelector("#"+fluxAdvanced.idFluxPlaylistsLeft) || plLeft;
        let contentRight = document.querySelector("fluxplaylistsRight") || plRight;
        let middel = $("#covercontainer");
        middel.prepend(contentLeft);
        middel.prepend(contentRight);
        for (let i = 0; i < fluxAdvanced.stationDivider; i++) {
            let plDiv = fluxAdvanced.createPlaylistDiv(i);
            $(contentLeft).append(plDiv);

        }
        for (let i = fluxAdvanced.stationDivider; i < length; i++) {
            let plDiv = fluxAdvanced.createPlaylistDiv(i);
            $(contentRight).append(plDiv);

        }


        let stationPlaylist = $(".stationLink");
//            let stationPlaylist = $(".wrapper");
        stationPlaylist.click(fluxAdvanced.updateActivePlaylist);
        let stations = $(fluxAdvanced.playerStations);
//$(".station").click(fluxAdvanced.updateActivePlaylist);
        stations.click(fluxAdvanced.updateActivePlaylist);
        /*
          let prev = $("#controls-prev");
          prev.click(fluxAdvanced.updateActivePlaylist);
          let next = $("#controls-next");
          next.click(fluxAdvanced.updateActivePlaylist);
          */

        /*stations.hover(function () {
            $(".boxShadow").removeClass("boxShadow");

            let name = fluxAdvanced.getPlaylistName($(this).text());
            let wrapper = $("#playlist_" + name).parent();
            wrapper.addClass("boxShadow");

        }, function () {
            $(".boxShadow").removeClass("boxShadow");
        });*/
        //debugger;
        /*setTimeout(function(){
        let contentDiv = $(document.createElement("div"));
        contentDiv.addClass("listContent");
        let likes = fluxAdvanced.likes;
        let text = likes.join("\n");

        $(contentDiv)[0].innerText=text;
        $("#Wrapper").append(contentDiv);
        },2000);*/
    },

    getPlaylistName: function (text) {

        return text;
        //return text.toLowerCase().replace(" ", "");
    },
    updateActivePlaylistPrev: function () {
        updateActivePlaylist("prev")
    },
    updateActivePlaylistNext: function () {
        updateActivePlaylist("next")
    },
    updateActivePlaylist: function () {
        fluxAdvanced.updateActivePlaylistWithName(this.getAttribute("rel"));
    },


    updateActivePlaylistWithName: function (stationName) {
        console.log("updateActivePlaylistWithNameStart");

        let $l = $("."+fluxAdvanced.classActivePlaylistL);
        let $r = $("."+fluxAdvanced.classActivePlaylistR);
        let oldActivePlaylistWrapper = $l[0] || $r[0];
        if (oldActivePlaylistWrapper !== undefined) {
            let oldActiveId = parseInt(oldActivePlaylistWrapper.id.split("playlistWrapper")[1]);

            if (oldActivePlaylistWrapper) {
                oldActiveId = oldActivePlaylistWrapper.id.split("playlistWrapper")[1];
            }
        }

        fluxAdvanced.getConvertedStreamName(stationName);
        let newActiveName = stationName;
        /*if(way="prev"){
          newActiveName = fluxAdvanced.getPlaylistName(fluxAdvanced.locList[oldActiveId - 1]);
        }
        if(way="next"){
          newActiveName = fluxAdvanced.getPlaylistName(fluxAdvanced.locList[oldActiveId + 1]);
        }
        */
        //let newActiveName = this.rel && fluxAdvanced.getPlaylistName(this.rel)
        let newActivePlaylistWrapper = $("#playlist_" + newActiveName).parent();
        let newActiveId = 1;
        if (newActivePlaylistWrapper[0]) {
            newActiveId = newActivePlaylistWrapper[0].id.split("playlistWrapper")[1];
        }

        //oldActivePlaylistWrapper.removeClass("active_playlist_l");
        //oldActivePlaylistWrapper.removeClass("active_playlist_r");
        $l.removeClass(fluxAdvanced.classActivePlaylistL);
        $r.removeClass(fluxAdvanced.classActivePlaylistR);

        if (newActiveId < fluxAdvanced.stationDivider) {
            newActivePlaylistWrapper.addClass(fluxAdvanced.classActivePlaylistL);
        } else {
            newActivePlaylistWrapper.addClass(fluxAdvanced.classActivePlaylistR);
        }
        console.log("changed active playlist to " + newActiveName);
        /*  for (let i = 0; i < fluxAdvanced.locList.length; i++) {
              let div = $("#playlistWrapper" + (i + 1));

              //div.removeClass("playlistWrapper" + oldActiveId + "_" + (i + 1));
              //div.addClass("playlistWrapper" + newActiveId + "_" + (i + 1));
          }
        */
        document.location = fluxAdvanced.prefix() + "://www.fluxfm.de/stream/#" + fluxAdvanced.revertConvertedStreamName(newActivePlaylistWrapper[0].getAttribute('rel')) + "/play";

        console.log("updateActivePlaylistWithNameEnd");
    },

    checkCurrentTitle: function () {

        console.log("check current title");
        let id = fluxAdvanced.getNextPossiblePlaylist();
        if (id !== fluxAdvanced.getActivePlaylistId()) {
            console.log("auto change station");
            let stations = fluxAdvanced.playerStations;
            $(stations[id]).click();
        }
    },

    getNextPossiblePlaylist: function () {
        let looingForNext = true;
        let id = fluxAdvanced.getActivePlaylistId();
        if (id > -1) {
            while (looingForNext) {
                if (!fluxAdvanced.checkTitleFromPlaylistIsDisliked(id)) {
                    looingForNext = false;
                } else {
                    id = id + 1;
                }
            }

        } else {

        }
        return id;
    },

    like: function (title) {
        let dislikes = fluxAdvanced.dislikes;
        let likes = fluxAdvanced.likes;

        console.log("like - " + title);
        if (fluxAdvanced.isLiked(title)) {
            let indexD = likes.indexOf(title);
            likes.splice(indexD, 1);
        } else {
            likes.push(title);
            if (fluxAdvanced.isDisliked(title)) {
                let index = dislikes.indexOf(title);
                dislikes.splice(index, 1);
            }
        }
        fluxAdvanced.store();
    },

    dislike: function (title) {
        let dislikes = fluxAdvanced.dislikes;
        let likes = fluxAdvanced.likes;
        console.log("dislike - " + title);
        if (fluxAdvanced.isDisliked(title)) {
            let indexD = dislikes.indexOf(title);
            dislikes.splice(indexD, 1);
        } else {
            dislikes.push(title);
            if (fluxAdvanced.isLiked(title)) {
                let index = likes.indexOf(title);
                likes.splice(index, 1);
            }
        }
        fluxAdvanced.store();
        fluxAdvanced.checkCurrentTitle();
    },

    hide_station: function (station) {
        let hidden_stations = fluxAdvanced.hidden_stations;
        console.log("hide station - " + station);
        if (fluxAdvanced.isHidden(station)) {
            let indexD = hidden_stations.indexOf(station);
            hidden_stations.splice(indexD, 1);
        } else {
            hidden_stations.push(station);
        }
        fluxAdvanced.store();
    },

    checkTitleFromPlaylistIsLiked: function (id) {
        let title = fluxAdvanced.getArtistFromPlaylist(id) + "-" + fluxAdvanced.getTitleFromPlaylist(id);
        return fluxAdvanced.isLiked(title);
    },
    checkTitleFromPlaylistIsDisliked: function (id) {
        let title = fluxAdvanced.getArtistFromPlaylist(id) + "-" + fluxAdvanced.getTitleFromPlaylist(id);
        return fluxAdvanced.isDisliked(title);
    },
    isHidden: function (title) {
        return (fluxAdvanced.hidden_stations.indexOf(title) > -1);
    },
    isDisliked: function (title) {
        return (fluxAdvanced.dislikes.indexOf(title) > -1);
    },
    isLiked: function (title) {
        return (fluxAdvanced.likes.indexOf(title) > -1);
    },
    getActivePlaylistId: function () {
        let div = document.querySelector("."+fluxAdvanced.classActivePlaylistL) || document.querySelector("."+fluxAdvanced.classActivePlaylistR);

        let divId = null;
        if (div === null || div === undefined) {
            divId = 0;
        } else {
            divId = parseInt(div.id.split("playlistWrapper")[1]);
        }
        return divId;
    },
    getPlaylistWithId: function (id) {
        return $("#playlist_" + fluxAdvanced.getPlaylistName(fluxAdvanced.locList[id]));
    },

    getCurrentArtist: function () {
        return fluxAdvanced.getArtistFromPlaylist(fluxAdvanced.getActivePlaylistId());
    },
    getArtistFromPlaylist(id) {
        let list = $(fluxAdvanced.getPlaylistWithId(id));
        let string = "";
        if (list.children().length > 0) {
            let artist = list.find(".plitem").find(".artist")[0];
            if (artist !== null && artist !== undefined) {
                string = artist.innerText;
            } else {
                string = "Kein Artist gefunden!";
            }

        } else {
            string = "Kein Artist gefunden!";
        }
        return string;
    },
    getCurrentTitle: function () {
        return fluxAdvanced.getTitleFromPlaylist(fluxAdvanced.getActivePlaylistId());
    },

    getTitleFromPlaylist: function (id) {
        let list = $(fluxAdvanced.getPlaylistWithId(id));
        let string = "";
        if (list.children().length > 0) {
            let track = list.find(".plitem").find(".track")[0];
            if (track !== null && track !== undefined) {
                string = track.innerText;
            } else {
                string = "Kein Track gefunden!";
            }

        } else {
            string = "Kein Track gefunden!";
        }
        return string;
    },

    addCss: function (css) {
        let head = document.getElementsByTagName('head')[0];
        let s = document.createElement('style');
        s.setAttribute('type', 'text/css');
        if (s.styleSheet) {   // IE
            s.styleSheet.cssText = css;
        } else {                // the world
            s.appendChild(document.createTextNode(css));
        }
        head.appendChild(s);
    },

    addStyle: function () {
        let head = document.getElementsByTagName('head')[0];
        let s = document.createElement('script');
        s.setAttribute('src', 'https://kit.fontawesome.com/a076d05399.js');
        // the world


        head.appendChild(s);
    },


    countTime: function () {
        let list = $('meter');
        for (let i = 0; i < list.length; i++) {
            let item = list[i];
            let newValue = parseInt(item.getAttribute("value")) + 1;
            item.setAttribute("value", newValue.toString());
            let passedTime = $.format.date(newValue * 1000, 'mm:ss');
            $(item).parent().find("."+fluxAdvanced.classPlayedTime)[0].innerText = passedTime;
            item.setAttribute("value", newValue.toString());
        }

    },
    /*#fluxplaylistsLeft*/


    getPlaylistIdByName: function (name) {
        let stations = fluxAdvanced.playerStations;
        let index = null;
        let length = stations.length;
        for (let i = 0; i < length; i++) {
            let loopName = fluxAdvanced.getPlaylistName(stations[i].innerText);
            if (name === loopName) {
                index = i;
            }
        }
        return index;
    }
};

$(document).ready(function () {
    console.log("start");
    setTimeout(1000);

    fluxAdvanced.loadPlaylist();

    fluxAdvanced.initiateView();
    fluxAdvanced.setAudioqualityToHigh();

    fluxAdvanced.updatePlaylists(4);

    setInterval(function () {
        fluxAdvanced.updatePlaylists(1);
        fluxAdvanced.checkCurrentTitle();
    }, 25000);
    setInterval(function () {
        fluxAdvanced.countTime();
    }, 1000);


});
console.log("start2");
fluxAdvanced.addStyle();
fluxAdvanced.addCss(`   .playlist{
   white-space: initial;

   }
   .playlistswrapper{
        position: absolute;
    width: 783px;
    height: 794px;
    top: -95px;
   }


#fluxplaylistsLeft_short {
    left: -490px;
}

.playlistswrapper_short {
    position: absolute;
    width: 495px;
    height: 794px;
    top: -95px;
}
li.playlist_short:first-child {
    font-size: 16px;
    box-sizing: border-box;
    height: 180px;
    display: table-cell;
    vertical-align: middle;
    text-align: center;
}

.playedTime_short {
    text-align: center;
    position: absolute;
    z-index: 2;
    left: 112px;
    color: yellow;
    top: 125px !important;
    font-size: 15px;
    width: 40px;
    height: 20px;
}

.plitem_short {
    box-sizing: border-box;
    padding: 5px;
    position: relative;
    top: -30px;
}

.active_playlist_l_short {
    left: 570px;
    top: 510px;
    position: absolute !important;
}

.active_playlist_r_short {
    left: -250px;
    top: 510px;
    position: absolute !important;
}

.listContent{
     position:absolute;
     top:20px;
     left:30px;
     width:400px;
     height:400px;

}

   ul#Playlist {
      visibility: hidden;
   }
   #fluxplaylistsLeft{
         left: -770px;
   }
   #fluxplaylistsLeft .wrapper{

   }
   #fluxplaylistsRight{
     left: 330px;

   }
   #fluxplaylistsRight .wrapper{


   }
  .active_playlist_l {
    left: 805px;
    top: 510px;
    position: absolute !important;
}

   .active_playlist_r{
     left: -295px;
    top: 510px;
    position: absolute !important;
   }
   .wrapper {
      height: 150px;
    border: 2px solid #00000000;
    transition: boxShadow 0.5s, top 2s, left 2s;
    box-shadow: none;
    float: left;
    width: 32%;
    position: relative;
    overflow: hidden;
  }
  .wrapper ul {
    text-align: left;
    list-style: none;
    font-size: 11px;
    overflow-y: auto;
    overflow-x: hidden;
    height: 150px;
    margin: 0;
}
  .station {
    text-align: center;
    color: yellow;
    font-size: 15px;
    position: absolute;
    z-index: 2;
    height: 4px;
    top: 125px;
    left: 5px;
}

.playedTime {
    text-align: center;
    position: absolute;
    z-index: 2;
    left: 190px;
    color: yellow;
    top: 125px !important;
    font-size: 15px;
    width: 40px;
    height: 20px;
}
.wrapper ul {
    cursor: pointer;

}
.wrapper ul li {
    margin: 0px;
    color: #fff;
     position: relative;
}
  .boxShadow{
    box-shadow : 0px 0px 18px #2daebf;
  }
  .wrapper ul li:nth-child(odd) {
    background-color: #595959;
  }
  li.playlist {
      width: 308px;
      max-width: 308px;
      box-sizing: border-box;
  }
  li.playlist:first-child {
    font-size: 20px;
    box-sizing: border-box;
    height: 150px;
    display: table-cell;
    vertical-align: middle;
    text-align: center;
}
  li.playlist:first-child .plitem span {
      position: relative;
      text-align: center;
      vertical-align: middle;
  }
  /*if playlist 1 3 5 7 9 is active*/
   .playlistWrapper1_1,
   .playlistWrapper3_3,
   .playlistWrapper5_5,
   .playlistWrapper7_7,
   .playlistWrapper9_9{
       top: 240px !important;
      left: 330px !important;
   }
   /*if playlist 2 4 6 8 10 is active*/
   .playlistWrapper2_2,
   .playlistWrapper4_4,
   .playlistWrapper6_6,
   .playlistWrapper8_8,
   .playlistWrapper10_10{
       top: 240px !important;
      left: -325px !important;
   }
   .liked{
     background: #008000ad  !important;
   }
   .disliked{
     background: #ff000057  !important;
   }
  .hidden{
     display:none;
   }
   .liked_text:hover{
     color:green !important;
   }
   .disliked_text:hover{
     color:red !important;
   }
   .hide_station_text:hover{
     color:gray !important;
   }
   .like_button{
   top:10px;
   left:70px;
   }
   .dislike_button{
   top:10px;
   left:70px;
   }
   .hide_station_button{
   top:10px;
   left:70px;
   }
   .colcontainer {
    text-align: center;
    margin-top: 6px;
    margin-left: 300px;
}
span.artist {
   
}
span.track {
    text-shadow: 0px 1px 1px #a7828e;
    color: #FFEB3B;
}
.time {
    
}
.plitem {
    box-sizing: border-box;
    padding: 5px;
}

 li..plitem:first-child {
    height: 150px;
    
}
/*optimal value*/
/* Chrome, Safari */
meter::-webkit-meter-optimum-value {
  background: linear-gradient(to bottom, #ee5f5b, #bd362f );
}
/* Firefox */
meter::-moz-meter-bar {
  background: linear-gradient(to bottom, #ee5f5b, #bd362f );
}

/*sub optimal value*/

/* Chrome, Safari */
meter::-webkit-meter-suboptimum-value {
  background-color: orange;
}
/* Firefox */
meter::-moz-meter-sub-optimum {
  background-color: orange;
}

meter::-webkit-meter-bar {
    background: #FFF;
}


meter::-webkit-meter-optimum-value {
    background: linear-gradient(to bottom, #ee5f5b, #bd362f );
}

meter::-webkit-meter-even-less-good-value {
    background: linear-gradient(to bottom, #62c462, #51a351);
}

/* Chrome, Safari */
meter::-webkit-meter-even-less-good-value {
  background-color: red;
}
/* Firefox */
meter::-moz-meter-sub-sub-optimum {
  background-color: red;
}
`);
