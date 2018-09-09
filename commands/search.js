CmdUtils.makeSearchCommand({
    name: "google",
    url: "http://www.google.com/search?q=%s",
    _namespace: "Search",
    builtIn: true,
    icon: "res/google.png",
    description: "Searches Google for your words.",
    arguments: [{role: "object", nountype: noun_arb_text, label: "query"}],
    timeout: 1000,
    help: "You can use the keyboard shortcut ctrl + alt + number to open one " +
    "of the Google results shown in the preview.",
    parser: {
        container  : ".rc",
        title      : "h3",
        body       : ".st",
        maxResults : 10,
    },
});

CmdUtils.makeSearchCommand({
    name: "bing",
    url: "http://www.bing.com/search?q=%s",
    defaultUrl: "http://www.bing.com/",
    _namespace: "Search",
    builtIn: true,
    arguments: [{role: "object", nountype: noun_arb_text, label: "query"}],
    timeout: 1000,
    icon: "res/bing.png",
    parser: {
        container: ".b_algo",
        title: "h2 > a",
        body: ".b_caption",
        maxResults: 10,
    },
});

CmdUtils.makeSearchCommand({
    name: "IMDb",
    url: "http://www.imdb.com/find?q=%s",
    defaultUrl: "http://www.imdb.com",
    _namespace: "Search",
    builtIn: true,
    arguments: [{role: "object", nountype: noun_arb_text, label: "query"}],
    timeout: 1000,
    icon: "res/imdb.png",
    parser: {
        container  : ".findResult",
        title      : ".result_text",
        thumbnail  : ".primary_photo",
        maxResults : 8,
    },
});

CmdUtils.makeSearchCommand({
    names: ["YouTube"],
    url: ("http://www.youtube.com/results?search_type=search_videos" +
        "&search=Search&search_sort=relevance&search_query={QUERY}"),
    icon: "res/youtube.png",
    description: ("Searches YouTube for videos matching your words. Previews the top results."),
    _namespace: "Search",
    builtIn: true,
    arguments: [{role: "object", nountype: noun_arb_text, label: "query"}],
    timeout: 1000,
    preview: function(pblock, {object: {text, summary}}) {
        if (!text) return void this.previewDefault(pblock);

        pblock.innerHTML = _("Searches YouTube for " + text + ".", {it: summary.bold()});
        CmdUtils.previewAjax(pblock, {
            url: "https://www.googleapis.com/youtube/v3/search",
            data: {
                part: "snippet", type: "video", q: text,
                key: "AIzaSyD0NFadBBZ8qJmWMmNknyxeI0EmIalWVeI",
            },
            dataType: "json",
            success: function youtube_success(data) {
                pblock.innerHTML = CmdUtils.renderTemplate(
                    `  <p>
                       Found <b>\${numresults}</b> YouTube Videos matching <b>\${query}</b>
                      </p>
                      {for entry in results}
                      <div style="clear: both; font-size: x-small">
                       <a style="font-size: small; font-weight:bold"
                          href="https://www.youtube.com/watch?v=\${entry.id.videoId}">
                       <img style="float:left; margin: 0 10px 5px 0; border: none"
                            src="\${entry.snippet.thumbnails.default.url}" />
                       \${entry.snippet.title}
                       </a>
                       <p>
                          \${entry.snippet.description}
                       </p>
                      </div>
                      {/for}
                    `, {
                        results: data.items,
                        query: summary,
                        numresults: data.pageInfo.totalResults,
                    });
            },
            error: function youtube_error({statusText}) {
                pblock.innerHTML =
                    "<p class=error>" + Utils.escapeHtml(statusText);
            },
        });
    },
});

CmdUtils.makeSearchCommand({
    name: "images",
    arguments: [{role: "object", nountype: noun_arb_text, label: "query"}],
    _namespace: "Search",
    builtIn: true,
    timeout: 1000,
    author: {name: "Federico Parodi", email: "getimages@jimmy2k.it"},
    contributor: "satyr",
    homepage: "http://www.jimmy2k.it/getimagescommand",
    license: "MPL",
    icon: "res/google.png",
    description: "Browse pictures from Google Images.",
    url: "https://www.google.com/search?tbm=isch&q={QUERY}",
    preview: function gi_preview(pblock, {object: {text: q}}) {
        if (!q) return void this.previewDefault(pblock)

        pblock.innerHTML = "..."
        var data    = {q, start: 0, tbm: "isch"}
            , starts  = []
            , options = {
            data,
            url: "https://www.google.com/search",
            headers: {"User-Agent": "DoCoMo/2.0"},
            error: xhr => {
                pblock.innerHTML =
                    `<em class=error>${xhr.status} ${xhr.statusText}</em>`
            },
            success: (html, status, xhr) => {
                var doc = xhr.responseXML
                // <a><img>
                var images = doc.querySelectorAll(".image")
                    , info //= doc.querySelector("#topbar + div:not([id])")

                var i = 0
                for (let a of images) {
                    a.id        = i
                    a.href      = Utils.urlToParams(a.href).imgurl
                    a.accessKey = String.fromCharCode("A".charCodeAt() + i)
                    let img = a.children[0]
                    img.removeAttribute("height")
                    img.removeAttribute("style")
                    ++i
                }
                pblock.innerHTML = CmdUtils.renderTemplate(
                   `<style>
                    .navi, .thumbs {text-align: center}
                    .prev, .next {position: absolute}
                    .navi {font-weight: bold}
                    .prev {left:  0}
                    .next {right: 0}
                    .thumbs a {
                      display: inline-block; vertical-align: top; position: relative;
                      margin: 0 1px 2px; padding: 0;
                    }
                    .thumbs a::after {
                      content: attr(accesskey);
                      position: absolute; top: 0; left: 0;
                      padding: 0 4px 2px 3px; border-bottom-right-radius: 6px;
                      opacity: 0.5; color: #fff; background-color: #000;
                      font:bold medium monospace;
                    }
                    </style>
                    <div class="navi">
                      \${range}
                      <input type="button" class="prev" value="&lt;" accesskey="&lt;"/>
                      <input type="button" class="next" value="&gt;" accesskey="&gt;"/>
                    </div>
                    <!--div class="info">${info}</div-->
                    <div class="thumbs">{for a in images}\${a.outerHTML}{/for}</div>
                    `, {
                        images,
                        info: info ? info.outerHTML : '',
                        range: images.length
                            ? `${data.start + 1} ~ ${data.start + images.length}`
                            : 'x',
                    })

                if (!data.start)
                    pblock.querySelector(".prev").disabled = true
                if (!doc.querySelector("#navbar > b"))
                    pblock.querySelector(".next").disabled = true
                pblock.querySelector(".navi").addEventListener("click", e => {
                    var b = e.target
                    if (b.type !== "button") return
                    e.preventDefault()
                    b.disabled = true
                    if (b.value === "<")
                        data.start = starts.pop() || 0
                    else {
                        starts.push(data.start)
                        data.start += images.length
                    }
                    CmdUtils.previewAjax(pblock, options)
                })
            },
        }
        CmdUtils.previewAjax(pblock, options)
    }
});

const ARTICLE_ERROR = _("Error retrieving summary");

function fetchWikipediaArticle(previewBlock, articleTitle, langCode) {
    var apiUrl = "http://" + langCode + ".wikipedia.org/w/api.php";
    var apiParams = {
        format: "json",
        action: "parse",
        page: articleTitle
    };

    CmdUtils.previewAjax(previewBlock, {
        type: "GET",
        url: apiUrl,
        data: apiParams,
        dataType: "json",
        error: function() {
            previewBlock.innerHTML = "<p class='error'>" + ARTICLE_ERROR + "</p>";
        },
        success: function(responseData) {
            //remove relative <img>s beforehand to suppress
            //the "No chrome package registered for ..." message
            var parse = jQuery(("<div>" + responseData.parse.text["*"])
                .replace(/<img src="\/[^>]+>/g, ""));
            //take only the text from summary because links won't work either way
            var articleSummary = parse.find("p:first").text();
            //remove citations [3], [citation needed], etc.
            articleSummary = articleSummary.replace(/\[.+?\]/g, "");
            //TODO: also remove audio links (.audiolink & .audiolinkinfo)
            //TODO: remove "may refer to" summaries
            var articleImageSrc = (parse.find(".infobox img").attr("src") ||
                parse.find(".thumbimage") .attr("src") || "");
            previewBlock.innerHTML =
                (articleImageSrc &&
                    '<img src="'+ H(articleImageSrc) +'" class="thumbnail"/>') +
                H(articleSummary);
        }
    });
}

CmdUtils.CreateCommand({
    names: ["wikipedia"],
    argument: [
        {role: "object", nountype: noun_arb_text, label: "search term"},
        {role: "format", nountype: noun_type_lang_wikipedia}],
    _namespace: "Search",
    builtIn: true,
    timeout: 1000,
    homepage: "http://theunfocused.net/moz/ubiquity/verbs/",
    author: {name: "Blair McBride", email: "blair@theunfocused.net"},
    contributors: ["Viktor Pyatkovka"],
    license: "MPL",
    icon: "res/wikipedia.ico",
    description: "Searches Wikipedia for your words, in a given language.",
    preview: function wikipedia_preview(previewBlock, args) {
        var searchText = Utils.trim(args.object.text);
        if (!searchText) {
            previewBlock.innerHTML = _("Searches Wikipedia in ${lang}.",
                {lang: args.format.html || "English"});
            return;
        }
        var previewData = {query: args.object.html};
        previewBlock.innerHTML = _("Searching Wikipedia for <b>" + args.object.text + "</b> ...",
            previewData);
        var apiParams = {
            format: "json",
            action: "query",
            list: "search",
            srlimit: 5, // is this a good limit?
            srwhat: "text",
            srsearch: searchText
        };

        function onerror() {
            previewBlock.innerHTML =
                "<p class='error'>" + _("Error searching Wikipedia") + "</p>";
        }



        var langCode = "en";
        if (args.format && args.format.data)
            lancCode = args.format.data;

        var apiUrl = "http://" + langCode + ".wikipedia.org/w/api.php";

        CmdUtils.previewAjax(previewBlock, {
            type: "GET",
            url: apiUrl,
            data: apiParams,
            dataType: "json",
            error: onerror,
            success: function wikipedia_success(searchResponse) {
                if (!("query" in searchResponse && "search" in searchResponse.query)) {
                    onerror();
                    return;
                }

                function generateWikipediaLink(title) {
                    return "http://" + langCode + ".wikipedia.org/wiki/" +
                        title.replace(/ /g, "_")
                }

                (previewData.results = searchResponse.query.search)
                    .forEach(function genKey(o, i) { o.key = i + 1 });
                previewData._MODIFIERS = {wikilink: generateWikipediaLink};
                previewData.foundMessage =
                    _("Wikipedia articles found matching <b>" + args.object.text + "</b>:", previewData);
                previewData.retrievingArticleSummary =
                    _("Retreiving article summary...");
                previewData.noArticlesFound = _("No articles found.");


                previewBlock.innerHTML = CmdUtils.renderTemplate(
                    `<style>
                    .wikipedia { margin: 0 }
                    .title { clear: left; margin-top: 0.4em }
                    .title a { font-weight: bold }
                    .key:after {content: ":"}
                    .summary { margin: 0.2em 0 0 1em; font-size: smaller }
                    .thumbnail {
                        float: left; max-width: 80px; max-height: 80px; background-color: white;
                        margin-right: 0.2em;
                    }
                    </style>
                    <dl class="wikipedia">
                        \${foundMessage}
                        {for article in results}
                        <dt class="title">
                        <span class="key">\${article.key}</span>
                        <a href="\${article.title|wikilink}" accesskey="\${article.key}"
                        >\${article.title}</a>
                        </dt>
                        <dd class="summary" wikiarticle="\${article.title}">
                        <i>\${retrievingArticleSummary}</i>
                        </dd>
                    {forelse}
                    <p class='error'>\${noArticlesFound}</p>
                    {/for}
                    </dl>`,
                    previewData);

                jQuery("dd", previewBlock).each(function eachDD() {
                    var article = this.getAttribute("wikiarticle");
                    fetchWikipediaArticle(this, article, langCode);
                });
            }
        });
    },
    execute: function wikipedia_execute(args) {
        var lang = args.format.data || "en";
        var searchUrl = "http://" + lang + ".wikipedia.org/wiki/Special:Search";
        var searchParams = {search: args.object.text};
        Utils.openUrlInBrowser(searchUrl + Utils.paramsToString(searchParams));
        CmdUtils.closePopup();
    }
});

CmdUtils.CreateCommand({
    name: "maps",
    _namespace: "Search",
    description: "Shows a location on the map.",
    icon: "res/google.png",
    builtIn: true,
    timeout: 500,
    requirePopup: "https://maps.googleapis.com/maps/api/js?sensor=false",
    argument: [{role: "object", nountype: noun_arb_text, label: "query"}],
    preview: async function mapsPreview(previewBlock, args) {
        var GM = CmdUtils.popupWindow.google.maps;

        // http://jsfiddle.net/user2314737/u9no8te4/
        var text = args.object.text.trim();
        if (text=="") {
            previewBlock.innerHTML = "Show objects or routes on google maps.<p>syntax: <pre>\tmaps [place] [-l]\n\tmaps [start] to [finish] [-l]\n\n -l narrow search to your location</pre>";
            return;
        }
        cc = "";
        if (text.substr(-2)=="-l") {
            var geoIP = await CmdUtils.get("http://freegeoip.net/json/"); // search locally
            var cc = geoIP.country_code || "";
            cc = cc.toLowerCase();
            text = text.slice(0,-2);
        }
        from = text.split(' to ')[0];
        dest = text.split(' to ').slice(1).join();
        var A = await CmdUtils.get("https://nominatim.openstreetmap.org/search.php?q="+encodeURIComponent(from)+"&polygon_geojson=1&viewbox=&format=json&countrycodes="+cc);
        if (!A[0]) return;
        CmdUtils.deblog("A",A[0]);
        previewBlock.innerHTML = '<div id="map-canvas" style="width:540px;height:505px"></div>';

        var pointA = new GM.LatLng(A[0].lat, A[0].lon);
        var myOptions = {
            zoom: 10,
            center: pointA
        };
        var map = new GM.Map(previewBlock.ownerDocument.getElementById('map-canvas'), myOptions);
        var markerA = new GM.Marker({
            position: pointA,
            title: from,
            label: "A",
            map: map
        });

        map.data.addGeoJson(geoJson = {"type": "FeatureCollection", "features": [{ "type": "Feature", "geometry": A[0].geojson, "properties": {} }]});
        if (dest.trim()!='') {
            var B = await CmdUtils.get("https://nominatim.openstreetmap.org/search.php?q="+encodeURIComponent(dest)+"&polygon_geojson=1&viewbox=&format=json");
            if (!B[0]) {
                map.fitBounds( new GM.LatLngBounds( new GM.LatLng(A[0].boundingbox[0],A[0].boundingbox[2]), new GM.LatLng(A[0].boundingbox[1],A[0].boundingbox[3]) ) );
                map.setZoom(map.getZoom()-1);
                return;
            }
            CmdUtils.deblog("B", B[0]);
            var pointB = new GM.LatLng(B[0].lat, B[0].lon);
            // Instantiate a directions service.
            directionsService = new GM.DirectionsService();
            directionsDisplay = new GM.DirectionsRenderer({
                map: map
            });
            this.markerB = new GM.Marker({
                position: pointB,
                title: dest,
                label: "B",
                map: map
            });

            // get route from A to B
            directionsService.route({
                origin: pointA,
                destination: pointB,
                avoidTolls: true,
                avoidHighways: false,
                travelMode: GM.TravelMode.DRIVING
            }, function (response, status) {
                if (status == GM.DirectionsStatus.OK) {
                    directionsDisplay.setDirections(response);
                } else {
                    window.alert('Directions request failed due to ' + status);
                }
            });
        }
    },
    execute: function({object: {text}}) {
        if (text.substr(-2)=="-l") text = text.slice(0,-2);
        CmdUtils.addTab("http://maps.google.com/maps?q="+encodeURIComponent(text));
        CmdUtils.closePopup();
    }
});