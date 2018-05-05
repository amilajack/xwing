// setup
const numOfChannels = 6;
const audiochannels = [];
for (a=0;a<numOfChannels ;a++) {
	audiochannels[a] = new Array();
	if (Audio != undefined) {
		audiochannels[a]["channel"] = new Audio();
	}
	audiochannels[a]["finished"] = -1;
}

let soundOn = true;
if (Audio == undefined) {
	soundOn = false;
}

function toggleSound (bool) {
	soundOn = bool;

	if (Audio == undefined) {
		soundOn = false;
	}

	if (!soundOn) {
		worldMusic.pause();
	} else {
		worldMusic.play();
	}
}

function playSound (id, vol) {
	if (!soundOn || Audio == undefined) {
		return;
	}
	let volume = 1;
	if (vol != undefined) {
		volume = vol;
	}

	for (a=0;a<numOfChannels;a++) {
		thistime = new Date();
		if (audiochannels[a]["finished"] < thistime.getTime()) {   // is this channel finished?
			audiochannels[a]["finished"] = thistime.getTime() + id.duration*1000;
			audiochannels[a]["channel"].src = id.src;
			audiochannels[a]["channel"].load();
			audiochannels[a]["channel"].volume = volume;
			audiochannels[a]["channel"].play();
			break;
		}
	}
}

if (Audio != undefined) {
	// sounds
	const blasterSound = new Audio("../snd/blaster.ogg");
	const explodeSound = new Audio("../snd/explode.ogg");

	var worldMusic = new Audio("../snd/music.ogg");
	worldMusic.volume = 0.1;
	worldMusic.loop = true;
	worldMusic.play();
}