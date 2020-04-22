/*player.js*/
$(document).ready(function(){

    if (location.search == "?widget") {
        $("#pltitle").hide();
        $('#playlist').hide();
        //$('#news').hide();
    }

    var channels = [];
    var qualities = {
        'aac64web': '64',
        'mp3128web': '128',
        'mp3320web': '320'
    }
    var quality = 'mp3128web';

    var playlist = '/fluxfm-playlist/api.php?act=list';
    //var playlist = 'playlist.json?';

    var chanIsSliding = false;
    var chanIsAnimating = false;
    var playlistInterval;

    // load templates
    $('#channelTamplate').template('TplChannel');
    $('#playlistTemplate').template('TplPlaylist');
    //$('#newsTemplate').template('TplNews');

    // initialize jPlayer
    $("#jPlayer").jPlayer({
        swfPath: "./",
        solution: "html, flash",
        supplied: "mp3",
        volume: 0.6
    });

    // load channel list
    $.getJSON('https://fluxmusic.io/api/streams/').done(function(data){

        for(var i = 0; i < data.streams.length; i++) {
            if(data.streams[i].stats.webplayer_id == ""
                || data.streams[i].stats.loc == ""
                || data.streams[i].title == ""
                || data.streams[i].images['128x128'] == ""
                || data.streams[i].sources['mp3128web'] == ""
                || data.streams[i].program == "") {
                continue;
            };
            channels.push({
                name: data.streams[i].stats.webplayer_id,
                internal: data.streams[i].stats.loc,
                title: data.streams[i].title,
                cover: data.streams[i].images['128x128'],
                streams: data.streams[i].sources,
                program: data.streams[i].program.replace('http:', 'https:')
            });
        }

        // show channel list
        $.tmpl("TplChannel", channels).appendTo("#channelsscroller ul");

        // click a channel logo to show channel infos and play
        $('#channelsscroller a').click(function(e){
            var channel = $(this).attr('rel');
            if (location.hash == '#' + channel + '/play') {
                switchChannel(channel);
            }
        });

        // click the channel logo to hide it
        $('#chaninfo-cover').click(function(e){
            hideChanInfo();
        });

        // slide channel list sideways using arrow buttons

        $('#chanleft').click(function(e){
            e.preventDefault();
            chanslide('left');
        });
        $('#chanright').click(function(e){
            e.preventDefault();
            chanslide('right');
        });

        // click play/stop button
        $('#controls-play').click(function(event) {
            event.preventDefault();
            var hash = '#' + $("#channels").find("a.active").attr('rel');
            if ($('#controls-play').hasClass("stop")) {
                location.hash = hash + '/play';
                if (navigator.userAgent.match(/mobile/i)) {
                    play(true);
                }
            } else {
                location.hash = hash;
                if (navigator.userAgent.match(/mobile/i)) {
                    play(false);
                }
            }
        });

        // click previous/next button to switch to other channel
        $('#controls-prev').click(function(e){
            e.preventDefault();
            nextChannel('prev');
        });
        $('#controls-next').click(function(e){
            e.preventDefault();
            nextChannel('next');
        });

        // set volume control, initial 60%
        volumeSlider($('#volume'), 60, function(value) {
            $("#jPlayer").jPlayer('volume', value / 100);
        });

        // toggle stream quality on click
        $('#quality a').click(function(e){
            e.preventDefault();
            var el = $(this);
            var value = el.attr('rel');
            var keys = Object.keys(qualities);
            var pos = keys.indexOf(value);
            var newpos = 1; // default = 128
            if (pos >= 0) {
                newpos = (pos + 1) % keys.length;
            }
            setQuality(keys[newpos]);
            if(location.hash.length > 1 && /\/play$/.test(location.hash)) {
                play(true);
            }
        });

        // read quality setting from user cookie
        var keyvalue = document.cookie.match('(^|;) ?streamquality=([^;]*)(;|$)');
        if (keyvalue && qualities[keyvalue[2]] != undefined) {
            setQuality(keyvalue[2]);
        }

        // setup news feed
        //loadRSSfeed('/feed/');

        // initialize player and choose channel
        initPlayer();
        restartPlaylist();

        // listen for hash tag; channel switching and play/stop works this way!
        $(window).on('hashchange', initPlayer);

    })
        .fail(function(){

        });



    // slide channel list sideways using scrollLeft
    function chanslide(direction) {
        if (chanIsSliding) {
            return;
        }
        chanIsSliding = true;
        var chanlist = $('#channelsscroller');
        var left = chanlist.scrollLeft();
        // reached the end? (need to check it in Firefox)
        //if (direction == 'right' && (channels.length - 3) * 90 <= left) {
        //	chanIsSliding = false;
        //	return;
        //}
        var remainder = left % 90;
        if (direction == 'left') {
            if (remainder > 0) {
                left = left - remainder;
            } else {
                left -= 90;
            }
        } else {
            if (remainder > 0) {
                left = left + 90 - remainder;
            } else {
                left += 90;
            }
        }
        chanlist.animate({
            scrollLeft: left
        }, 100, 'swing', function(){
            chanIsSliding = false;
        });
    }

    // if a channel isn't in view, scroll to it
    function scrollToChannel(channel, callback) {
        if (chanIsSliding) {
            return;
        }
        chanIsSliding = true;
        var chanlist = $('#channelsscroller');
        var chan = $('#channels').find('[rel="'+channel+'"]');
        var left = chan.offset().left - chanlist.offset().left;
        var right = chan.offset().left - chanlist.offset().left + 90 - chanlist.width();
        var scrollleft = 0;
        if (left <= 0) {
            // logo ist nicht sichtbar, sichtbar machen
            scrollleft = chanlist.scrollLeft() + left;
        } else if (right > 0) {
            scrollleft = chanlist.scrollLeft() + right;
        }
        if (left <= 0 || right > 0) {
            chanlist.animate({
                scrollLeft: scrollleft
            }, 100, 'swing', function(){
                callback();
                chanIsSliding = false;
            });
        } else if(callback != undefined) {
            callback();
            chanIsSliding = false;
        }
    }

    // hide channel info
    function hideChanInfo(callback) {
        var left = $('#chaninfo-cover').attr('data-left');
        var cover = $('#chaninfo-cover img').attr('src');
        if (left == 0) {
            $('#chaninfo').hide();
            $('#chanselector').show();
        } else {
            var logo = $('#chanlogo')
                .attr('src', cover)
                .css('left', 0)
                .show();
            $('#chaninfo').fadeOut(100);
            logo.animate({
                left: (left-25)+'px'
            }, 200, 'swing', function(){
                $('#chanselector').fadeIn(100, function(){
                    logo.hide();
                    if (callback != undefined) {
                        callback();
                    }
                });
            });
        }
    }

    // switch to another channel; includes animations
    function switchChannel(channel, callback) {
        if (chanIsAnimating) {
            return;
        }
        chanIsAnimating = true;
        var chan = $('#channelsscroller a.active');
        var chaninfo = $('#chaninfo');
        if (chan.attr('rel') == channel && chaninfo.is(':visible')) {
            if (callback != undefined) {
                callback();
            }
            chanIsAnimating = false;
            return;
        }
        var chanselector = $('#chanselector');

        if (chaninfo.is(':visible')) {
            hideChanInfo(function(){
                scrollToChannel(channel, function(){
                    setChannelActive(channel);
                    showChanInfo(channel, function(){
                        if (callback != undefined) {
                            callback();
                        }
                        chanIsAnimating = false;
                    });
                });
            });
        } else {
            scrollToChannel(channel, function(){
                setChannelActive(channel);
                showChanInfo(channel, function(){
                    if (callback != undefined) {
                        callback();
                    }
                    chanIsAnimating = false;
                });
            });
        }
    }

    // sets a channel active
    function setChannelActive(channel) {
        $('#channelsscroller a.active').removeClass('active');
        $('#channels').find('[rel="'+channel+'"]').addClass('active');
    }

    // shows channel infos
    function showChanInfo(channel, callback) {
        var chaninfo = getChanInfo(channel);
        var chan = $('#channels').find('[rel="'+channel+'"]');
        var posLeft = chan.prop('offsetLeft') - $('#channelsscroller').scrollLeft();

        setChanInfo(chaninfo, posLeft + 25);

        var logo = $('#chanlogo');
        logo
            .attr('src', chaninfo.cover.replace('http:', 'https:'))
            .css('left', (posLeft) + 'px')
            .show();

        $('#chanselector').fadeOut(100, function(){
            $(this).hide();
        });
        logo.animate({
            left: 0
        }, 200, 'swing', function(){
            $('#chaninfo').fadeIn(100, function(){
                logo.hide();
                if (callback != undefined) {
                    callback();
                }
            });
        });
    }

    // switches to previous or next channel
    function nextChannel(direction) {
        if (chanIsAnimating) {
            return;
        }
        var el = $('#channels').find('a.active').parent();
        if (direction == 'prev') {
            el = el.prev();
        } else {
            el = el.next();
        }
        el = el.find('a');
        if (el.length == 0) {
            return;
        }
        var channel = el.attr('rel');
        var hash = '#' + channel;
        if (/\/play$/.test(location.hash)) {
            hash += '/play';
            if (navigator.userAgent.match(/mobile/i)) {
                setTimeout(function(){
                    play(true);
                }, 310);
            }
        }
        location.hash = hash;
    }

    // start or stop playback
    function play(play) {
        if (play === undefined) {
            if($("#controls-play").hasClass("stop")) {
                play = true;
            } else {
                play = false;
            }
        }
        if (play) {
            var channel = $('#channelsscroller a.active').attr('rel');
            var chaninfo = getChanInfo(channel);
            var media = { mp3: chaninfo.streams[quality].replace('http:', 'https:') };
            //if (/aac/i.test(chaninfo.streams[quality])) {
            //	media = { mp3: chaninfo.streams[quality] };
            //}

            $("#jPlayer")
                .jPlayer("setMedia", media)
                .jPlayer('play');
            $("#controls-play")
                .removeClass('stop')
                .addClass('play')
                .find('img')
                .attr('src', 'images/stop.png');
        } else {
            $("#jPlayer").jPlayer('clearMedia');
            $("#controls-play")
                .removeClass('play')
                .addClass('stop')
                .find('img')
                .attr('src', 'images/play.png');
        }
    }

    function setQuality(value) {
        //var channel = $('#channelsscroller a.active').attr('rel');
        //if (typeof channel !== 'string') {
        //	return;
        //}
        //var chaninfo = getChanInfo(channel);
        //if (chaninfo.streams[value] == undefined) {
        //	return;
        //}
        if (qualities[value] == undefined) {
            return;
        }
        quality = value;

        $('#quality a')
            .attr('rel', value)
            .text(qualities[value]);

        // set quality setting cookie
        var expires = new Date();
        expires.setTime(expires.getTime() + (1 * 24 * 60 * 60 * 1000));
        document.cookie = 'streamquality=' + quality + ';path=/stream/;expires=' + expires.toUTCString();
    }

    // setup channel; fired on every hash change
    function initPlayer() {
        if(location.hash.length > 1) {
            var params = location.hash.substring(1).split("/");
            if (getChanInfo(params[0]) == false) {
                setChannelActive(channels[0].name);
                setStation(channels[0].name);
                play(false);
                return;
            }
            switchChannel(params[0], function(){
                setStation(params[0]);
                if (params.length > 1 && params[1] == 'play') {
                    play(true);
                } else {
                    play(false);
                }
            });
        } else {
            setChannelActive(channels[0].name);
            setStation(channels[0].name);
            play(false);
        }
    }

    // gets channel info
    function getChanInfo(channel) {
        for(var i = 0; i < channels.length; i++) {
            if (channels[i].name == channel) {
                return channels[i];
            }
        }
        return false;
    }

    // sets channel info dialog
    function setChanInfo(chaninfo, pos) {

        $('#chaninfo-cover img').attr('src', chaninfo.cover.replace('http:', 'https:'));
        $('#chaninfo-cover').attr('data-left', pos);

        /*$.getJSON(chaninfo.program.replace("http:","https:")).done(function(data){
            var found = false;
            for(var i = 0; i < data.program.length; i++) {
                if (data.program[i].start_timestamp < data.now_timestamp && data.program[i].end_timestamp > data.now_timestamp) {
                    found = true;
                    $('#chaninfo-time')
                        .text(data.program[i].start_time + "-" + data.program[i].end_time)
                        .attr("title", data.program[i].start_time + "-" + data.program[i].end_time);
                    $('#chaninfo-title')
                        .text(data.program[i].title)
                        .attr("title", data.program[i].title);
                    $('#chaninfo-desc')
                        .text(data.program[i].excerpt)
                        .attr("title", data.program[i].excerpt);
                    break;
                }
            }
            if (!found) {
                $('#chaninfo-time')
                    .text("")
                    .attr("title", "");
                $('#chaninfo-title')
                    .text("")
                    .attr("title", "");
                $('#chaninfo-desc')
                    .text("")
                    .attr("title", "");
            }
        });*/

    }

    // stream and update playlist
    function setStation(station) {
        var chaninfo = getChanInfo(station);
        //$('#jPlayer').jPlayer('setMedia', {
        //	mp3: chaninfo.streams[quality]
        //});
        $('#pltitle').text(chaninfo.title + " - Zuletzt gespielt");
        restartPlaylist();
    }

    function restartPlaylist() {
        clearInterval(playlistInterval);
        updatePlaylist();
        playlistInterval = setInterval(updatePlaylist, 30000);
    }
    // loads playlist data
    // white: http://ecx.images-amazon.com/images/I/61E6K8MIqOL._SL320_.jpg
    function updatePlaylist() {
        var channel = $('#channelsscroller a.active').attr('rel');
        if (typeof channel !== 'string') {
            return;
        }
        var chaninfo = getChanInfo(channel);
        $.ajax({
            dataType: 'json',
            url: playlist + '&loc=' + chaninfo.internal + '&cuttime=1&limit=4',
            success: function(data) {
                if (data.status != "ok") {
                    return;
                }
                $('#track-artist').text(data.tracks[0].artist);
                $('#track-title').text(data.tracks[0].title);
                $('#track-album').text(data.tracks[0].album);
                if (data.tracks[0].coverurl == "" || data.tracks[0].coverurl == null) {
                    $('#cover').attr('src', "images/cover.png");
                } else {
                        $('#cover').attr('src', data.tracks[0].coverurl.replace(/SL75_\.jpg$/, 'SL320_.jpg'));


                }
                $("#plist").html("");
                $.tmpl("TplPlaylist", data.tracks).appendTo("#pllist");
            }
        });
    }

    // setup volume slider
    function volumeSlider(slider, defaultValue, onDrag) {

        var dragger = slider.children();
        var draggerWidth = 4;
        var down = false;
        var rangeWidth, rangeLeft;

        dragger.css('width', draggerWidth + 'px');
        dragger.css('left', (-draggerWidth + slider.width() * defaultValue / 100) + 'px');
        dragger.css('margin-left', (draggerWidth / 2) + 'px');

        slider.mousedown(function(e) {
            e.preventDefault();
            rangeWidth = this.offsetWidth;
            rangeLeft = this.offsetLeft;
            down = true;
            updateDragger(e);
        });

        $(document).mousemove(function(e) {
            updateDragger(e);
        });

        $(document).mouseup(function() {
            down = false;
        });

        function updateDragger(e) {
            if (down && e.pageX >= rangeLeft && e.pageX <= (rangeLeft + rangeWidth)) {
                dragger.css('left', e.pageX - rangeLeft - draggerWidth + 'px');
                if (typeof onDrag == "function") {
                    onDrag(Math.round(((e.pageX - rangeLeft) / rangeWidth) * 100));
                }
            }
        }

    }

    // RSS feed
    /*
    function loadRSSfeed(rssurl) {
        $.get(rssurl, function(data) {
            var $xml = $(data);
            var items = [];
            var i = 0;
            $xml.find("item").each(function() {
                if (i++<5) {
                    return;
                }
                var $this = $(this);
                var item = {
                    title: $this.find("title").text(),
                    link: $this.find("link").text(),
                    contentSnippet: $this.find("description").text().replace(/<img.*?>/, ''),
                    //pubDate: $this.find("pubDate").text(),
                    //author: $this.find("author").text()
                };
                items.push(item);
            });
            $.tmpl("TplNews", items).prependTo("#newslist");
        });
    }
    */

});
