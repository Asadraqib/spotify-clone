console.log("Let's write JavaScript");

let currentSong;
let songs = [];
let currentIndex = 0;
let currentFolder = "";

const play = document.querySelector(".play");
const prev = document.querySelector(".prev");
const next = document.querySelector(".next");

async function getsongs(folder) {
    let audioFiles = await fetch(`http://127.0.0.1:3000/songs/${folder}`);
    let response = await audioFiles.text();

    let div = document.createElement("div");
    div.innerHTML = response;

    let as = div.getElementsByTagName("a");
    let songs = [];

    for (let i = 0; i < as.length; i++) {
        if (as[i].href.endsWith(".mp3")) {
            songs.push(as[i].href);
        }
    }

    return songs;
}

function secondsToMinutesSeconds(seconds) {
    if (isNaN(seconds)) return "00:00";
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function updatePlayIcon(isPlaying) {
    if (isPlaying) {
        play.innerHTML = `
            <circle cx="12" cy="12" r="11" fill="#1DB954"/>
            <rect x="9" y="8" width="2.5" height="8" fill="black"/>
            <rect x="13" y="8" width="2.5" height="8" fill="black"/>
        `;
    } else {
        play.innerHTML = `
            <circle cx="12" cy="12" r="11" fill="#1DB954"/>
            <polygon points="10,8 17,12 10,16" fill="black"/>
        `;
    }
}

function playMusic(track, meta = null) {
    currentIndex = songs.indexOf(track);

    if (currentSong) {
        currentSong.pause();
    }

    currentSong = new Audio(track);
    currentSong.play();

    let songName = decodeURIComponent(track).split(/[/\\]/).pop().replace(".mp3", "");

    // Use passed-in metadata if available, otherwise fall back to old behavior
    let displayTitle = meta?.title || songName;
    let displayArtist = meta?.artist || "Artist";
    let coverUrl = meta?.coverUrl || `http://127.0.0.1:3000/songs/${currentFolder}/cover.jpg`;

    document.querySelector(".song-info").innerHTML = `
        <img src="${coverUrl}" 
             alt="cover" class="now-playing-cover">
        <span class="current-song">${displayTitle}</span>
    `;

    updatePlayIcon(true);

    currentSong.addEventListener("timeupdate", () => {
        document.querySelector(".songtime").innerHTML =
            secondsToMinutesSeconds(currentSong.currentTime);
        document.querySelector(".songduration").innerHTML =
            secondsToMinutesSeconds(currentSong.duration);

        if (!isNaN(currentSong.duration)) {
            document.querySelector(".circle").style.left =
                (currentSong.currentTime / currentSong.duration) * 100 + "%";
        }
    });

    currentSong.addEventListener("ended", () => {
        currentIndex++;
        if (currentIndex < songs.length) {
            playMusic(songs[currentIndex]);
        }
    });
}

async function displayAlbums() {
    let album__container = document.querySelector(".album__container");

    let audioFiles = await fetch(`http://127.0.0.1:3000/songs/`);
    let response = await audioFiles.text();

    let div = document.createElement("div");
    div.innerHTML = response;

    let anchors = div.getElementsByTagName("a");

    Array.from(anchors).forEach(async e => {
        if (e.href.includes("%5Csongs")) {
            let decoded = decodeURIComponent(e.href);
            let folder = decoded.split("\\").pop();

            let as = await fetch(`http://127.0.0.1:3000/songs/${folder}/info.json`);
            let data = await as.json();

            let albumDiv = document.createElement("div");
            albumDiv.dataset.folder = folder;
            albumDiv.classList.add("album");
            albumDiv.innerHTML = `
                <img src="http://127.0.0.1:3000/songs/${folder}/cover.jpg" alt="">
                <p>${data.title}</p>
                <span>${data.description}</span>
            `;

            // ✅ albumDiv listener INSIDE displayAlbums, saves currentFolder
            albumDiv.addEventListener("click", async () => {
                currentFolder = folder;
                songs = await getsongs(folder);
                displayPlaylist();
            });

            album__container.appendChild(albumDiv);
        }
    });
}

function displayPlaylist() {
    let songlist = document.querySelector(".playlist");
    songlist.innerHTML = "";

    for (const song of songs) {
        let songName = decodeURIComponent(song).split(/[/\\]/).pop().replace(".mp3", "");

        let item = document.createElement("div");
        item.classList.add("playlist1");
        item.innerHTML = `
    <div class="playlist-svg-box">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#1DB954">
            <path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3z"/>
        </svg>
    </div>
    <div class="playlist1__title">
        <p>${songName}</p>
        <span>Artist</span>
    </div>
`;

        item.addEventListener("click", () => {
            playMusic(song);
        });

        songlist.appendChild(item);
    }
}

async function displayCategoryMusic(category, containerId) {
    let container = document.getElementById(containerId);
    container.innerHTML = "";

    let folderPath = `songs2/${category}`;

    try {
        // 1. Fetch the directory listing to find mp3 files
        let response = await fetch(`http://127.0.0.1:3000/${folderPath}/`);
        let html = await response.text();

        let div = document.createElement("div");
        div.innerHTML = html;

        let anchors = div.getElementsByTagName("a");
        let trackFiles = [];

        for (let i = 0; i < anchors.length; i++) {
            let href = anchors[i].href;
            if (href.endsWith(".mp3")) {
                trackFiles.push(href);
            }
        }

        if (trackFiles.length === 0) {
            container.innerHTML = `<p style="color:#a0a0a0;padding:10px;">No tracks found in ${category}</p>`;
            return;
        }

        // 2. Fetch the SINGLE category JSON (e.g. info.json) ONCE
        let metaMap = {};
        try {
            let metaRes = await fetch(`http://127.0.0.1:3000/${folderPath}/info.json`);
            if (metaRes.ok) {
                let data = await metaRes.json();
                // Build a lookup: filename -> { title, artist, cover }
                if (Array.isArray(data.tracks)) {
                    data.tracks.forEach(t => {
                        metaMap[t.file] = t;
                    });
                }
            }
        } catch (e) {
            console.warn(`No info.json for ${category}`, e);
        }

        // 3. Build cards using the lookup
        for (const trackUrl of trackFiles) {
            let fileName = decodeURIComponent(trackUrl)
                .split(/[/\\]/)
                .pop(); // keep ".mp3" so it matches metaMap keys like "track1.mp3"

            let meta = metaMap[fileName] || {
                title: fileName.replace(".mp3", ""),
                artist: "Unknown Artist",
                cover: "cover.jpg"
            };

            let card = document.createElement("div");
            card.classList.add("music__card");
            card.innerHTML = `
                <img src="http://127.0.0.1:3000/${folderPath}/${meta.cover}" alt="${meta.title}">
                <p>${meta.title}</p>
                <span>${meta.artist}</span>
            `;

            card.addEventListener("click", () => {
                songs = trackFiles;
                currentFolder = folderPath;
                playMusic(trackUrl);
                displayPlaylist();
            });

            container.appendChild(card);
        }

    } catch (err) {
        console.error(`Failed to load ${category}:`, err);
        container.innerHTML = `<p style="color:#a0a0a0;padding:10px;">Could not load ${category}</p>`;
    }
}

async function loadAllCategories() {
    await displayCategoryMusic("lofi", "lofi");
    await displayCategoryMusic("rock", "rock");
    await displayCategoryMusic("podcast", "podcast");
}

async function main() {
    displayAlbums();
    displayPlaylist();
    loadAllCategories();
}

play.addEventListener("click", () => {
    if (!currentSong) return;
    if (currentSong.paused) {
        currentSong.play();
        updatePlayIcon(true);
    } else {
        currentSong.pause();
        updatePlayIcon(false);
    }
});

prev.addEventListener("click", () => {
    if (currentIndex > 0) {
        currentIndex--;
        playMusic(songs[currentIndex]);
    }
});

next.addEventListener("click", () => {
    if (currentIndex < songs.length - 1) {
        currentIndex++;
        playMusic(songs[currentIndex]);
    }
});

const seekbar = document.querySelector(".seekbar");
const circle = document.querySelector(".circle");

let isDragging = false;

function updateSeekPosition(clientX) {
    if (!currentSong || isNaN(currentSong.duration)) return;

    const rect = seekbar.getBoundingClientRect();
    let percent = (clientX - rect.left) / rect.width;
    percent = Math.max(0, Math.min(1, percent));
    circle.style.left = percent * 100 + "%";
    return percent;
}

seekbar.addEventListener("click", (e) => {
    const percent = updateSeekPosition(e.clientX);
    if (percent !== undefined) {
        currentSong.currentTime = percent * currentSong.duration;
    }
});

circle.addEventListener("mousedown", () => {
    isDragging = true;
});

document.addEventListener("mousemove", (e) => {
    if (!isDragging) return;
    updateSeekPosition(e.clientX);
});

document.addEventListener("mouseup", (e) => {
    if (!isDragging || !currentSong) return;
    const percent = updateSeekPosition(e.clientX);
    if (percent !== undefined) {
        currentSong.currentTime = percent * currentSong.duration;
    }
    isDragging = false;
});

main();
