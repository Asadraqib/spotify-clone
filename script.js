console.log("Let's write JavaScript");

let currentSong;
let songs = [];
let currentIndex = 0;

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

function playMusic(track) {
    currentIndex = songs.indexOf(track);

    if (currentSong) {
        currentSong.pause();
    }

    currentSong = new Audio(track);
    currentSong.play();

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

            let as = await fetch(
                `http://127.0.0.1:3000/songs/${folder}/info.json`
            );

            let data = await as.json();

            album__container.innerHTML += `
                <div data-folder="${folder}" class="album">
                    <img src="http://127.0.0.1:3000/songs/${folder}/cover.jpg" alt="">
                    <p>${data.title}</p>
                    <span>${data.description}</span>
                </div>
            `;
        }
    });

    Array.from(document.getElementsByClassName("album")).forEach(e=>{
        e.addEventListener("click", async item=>{
            songs = await getsongs(item.currentTarget.dataset.folder);
        })
    })
}

async function main() {
    songs = await getsongs("arijit");
    displayAlbums();
    let songlist = document.querySelector(".playlist");

    for (const song of songs) {
        let songName = decodeURIComponent(song).split(/[/\\]/).pop();

        songlist.innerHTML += `
            <div class="playlist1">
                <button class="second__type"></button>
                <div class="playlist1__title">
                    <p>${songName}</p>
                    <span>Artist</span>
                </div>
            </div>
        `;
    }

    Array.from(document.getElementsByClassName("playlist1"))
        .forEach((e, index) => {
            e.addEventListener("click", () => {
                playMusic(songs[index]);
            });
        });
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

// Click on seekbar
seekbar.addEventListener("click", (e) => {
    const percent = updateSeekPosition(e.clientX);

    if (percent !== undefined) {
        currentSong.currentTime = percent * currentSong.duration;
    }
});

// Start dragging (mouse)
circle.addEventListener("mousedown", () => {
    isDragging = true;
});

// Dragging (mouse)
document.addEventListener("mousemove", (e) => {
    if (!isDragging) return;

    updateSeekPosition(e.clientX);
});

// Stop dragging (mouse)
document.addEventListener("mouseup", (e) => {
    if (!isDragging || !currentSong) return;

    const percent = updateSeekPosition(e.clientX);

    if (percent !== undefined) {
        currentSong.currentTime = percent * currentSong.duration;
    }

    isDragging = false;
});

main();
