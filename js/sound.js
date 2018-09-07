// setup
const numOfChannels = 6;
const audiochannels = [];
for (let a = 0; a < numOfChannels; a++) {
  audiochannels[a] = [];
  audiochannels[a].channel = new Audio();
  audiochannels[a].finished = -1;
}

let soundOn = true;

function toggleSound(bool) {
  soundOn = bool;

  if (!soundOn) {
    // worldMusic.pause();
  } else {
    // worldMusic.play();
  }
}

function playSound(id, vol) {
  if (!soundOn) {
    return;
  }
  let volume = 1;
  if (vol != undefined) {
    volume = vol;
  }

  for (let a = 0; a < numOfChannels; a++) {
    const thistime = new Date();
    if (audiochannels[a].finished < thistime.getTime()) { // is this channel finished?
      audiochannels[a].finished = thistime.getTime() + id.duration * 1000;
      audiochannels[a].channel.src = id.src;
      audiochannels[a].channel.load();
      audiochannels[a].channel.volume = volume;
      // audiochannels[a].channel.play();
      break;
    }
  }
}

// sounds
// const blasterSound = new Audio('../sound/blaster.ogg');
const explodeSound = new Audio('../sound/explode.ogg');

window.explodeSound = explodeSound;

const worldMusic = new Audio('../sound/music.ogg');
worldMusic.volume = 0.1;
worldMusic.loop = true;
// worldMusic.play();
