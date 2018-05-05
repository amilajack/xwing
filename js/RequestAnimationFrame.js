/**
 * Provides requestAnimationFrame in a cross browser way.
 * @author greggman / http://greggman.com/
 */

if ( !window.requestAnimationFrame ) {

	window.requestAnimationFrame = ( (() => window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    window.oRequestAnimationFrame ||
    window.msRequestAnimationFrame ||
    ((
        /* function FrameRequestCallback */ callback,
        /* DOMElement Element */ element
    ) => {

        window.setTimeout( callback, 1000 / 60 );

    })) )();

}
