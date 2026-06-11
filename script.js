console.log("Let's write JavaScript");

let currentSong;

async function getsongs() {
    let audioFiles = await fetch("http://127.0.0.1:3000/songs/");
    let response = await audioFiles.text();

    let div = document.createElement("div");
    div.innerHTML = response;

    let as = div.getElementsByTagName("a");
    let songs = [];

    for (let i = 0; i < as.length; i++) {
        const element = as[i];

        if (element.href.endsWith(".mp3")) {
            songs.push(element.href);
        }
    }

    return songs;
}

const playMusic = (track) => {
    if (currentSong) {
        currentSong.pause();
    }

    currentSong = new Audio(track);
    currentSong.play();

    console.log("Playing:", track);
};

async function main() {
    let songs = await getsongs();

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

    // Play first song automatically (optional)
    playMusic(songs[0]);

    // Add click events
    Array.from(
        document.getElementsByClassName("playlist1")
    ).forEach((e, index) => {
        e.addEventListener("click", () => {
            playMusic(songs[index]);
        });
    });
}

main();
