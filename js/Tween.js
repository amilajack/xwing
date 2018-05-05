/**
 * @author sole / http://soledadpenades.com
 * @author mr.doob / http://mrdoob.com
 * @author Robert Eisele / http://www.xarg.org
 * @author Philippe / http://philippe.elsass.me
 * @author Robert Penner / http://www.robertpenner.com/easing_terms_of_use.html
 */

const TWEEN = TWEEN || ( function() {
    let i;
    let n;
    let time;
    const tweens = [];

    this.add = tween => {

		tweens.push( tween );

	};

    this.remove = tween => {

		i = tweens.indexOf( tween );

		if ( i !== -1 ) {

			tweens.splice( i, 1 );

		}

	};

    this.update = () => {

		i = 0;
		n = tweens.length;
		time = new Date().getTime();

		while ( i < n ) {

			if ( tweens[ i ].update( time ) ) {

				i++;

			} else {

				tweens.splice( i, 1 );
				n--;

			}

		}

	};

    return this;
} )();

TWEEN.Tween = function ( object ) {
    const _object = object;
    const _valuesStart = {};
    const _valuesDelta = {};
    const _valuesEnd = {};
    let _duration = 1000;
    let _delayTime = 0;
    let _startTime = null;
    let _easingFunction = TWEEN.Easing.Linear.EaseNone;
    let _chainedTween = null;
    let _onUpdateCallback = null;
    let _onCompleteCallback = null;

    this.to = function ( properties, duration ) {

		if( duration !== null ) {

			_duration = duration;

		}

		for ( const property in properties ) {

			// This prevents the engine from interpolating null values
			if ( _object[ property ] === null ) {

				continue;

			}

			// The current values are read when the tween starts;
			// here we only store the final desired values
			_valuesEnd[ property ] = properties[ property ];

		}

		return this;

	};

    this.start = function () {

		TWEEN.add( this );

		_startTime = new Date().getTime() + _delayTime;

		for ( const property in _valuesEnd ) {

			// Again, prevent dealing with null values
			if ( _object[ property ] === null ) {

				continue;

			}

			_valuesStart[ property ] = _object[ property ];
			_valuesDelta[ property ] = _valuesEnd[ property ] - _object[ property ];

		}

		return this;
	};

    this.stop = function () {

		TWEEN.remove( this );
		return this;

	};

    this.delay = function ( amount ) {

		_delayTime = amount;
		return this;

	};

    this.easing = function ( easing ) {

		_easingFunction = easing;
		return this;

	};

    this.chain = chainedTween => {

		_chainedTween = chainedTween;

	};

    this.onUpdate = function ( onUpdateCallback ) {

		_onUpdateCallback = onUpdateCallback;
		return this;

	};

    this.onComplete = function ( onCompleteCallback ) {

		_onCompleteCallback = onCompleteCallback;
		return this;

	};

    this.update = time => {
        let property;
        let elapsed;
        let value;

        if ( time < _startTime ) {

			return true;

		}

        elapsed = ( time - _startTime ) / _duration;
        elapsed = elapsed > 1 ? 1 : elapsed;

        value = _easingFunction( elapsed );

        for ( property in _valuesDelta ) {

			_object[ property ] = _valuesStart[ property ] + _valuesDelta[ property ] * value;

		}

        if ( _onUpdateCallback !== null ) {

			_onUpdateCallback.call( _object, value );

		}

        if ( elapsed == 1 ) {

			if ( _onCompleteCallback !== null ) {

				_onCompleteCallback.call( _object );

			}

			if ( _chainedTween !== null ) {

				_chainedTween.start();

			}

			return false;

		}

        return true;
    };

    /*
	this.destroy = function () {

		TWEEN.remove( this );

	};
	*/
}

TWEEN.Easing = { Linear: {}, Quadratic: {}, Cubic: {}, Quartic: {}, Quintic: {}, Sinusoidal: {}, Exponential: {}, Circular: {}, Elastic: {}, Back: {}, Bounce: {} };


TWEEN.Easing.Linear.EaseNone = k => k;

//

TWEEN.Easing.Quadratic.EaseIn = k => k * k;

TWEEN.Easing.Quadratic.EaseOut = k => - k * ( k - 2 );

TWEEN.Easing.Quadratic.EaseInOut = k => {

	if ( ( k *= 2 ) < 1 ) return 0.5 * k * k;
	return - 0.5 * ( --k * ( k - 2 ) - 1 );

};

//

TWEEN.Easing.Cubic.EaseIn = k => k * k * k;

TWEEN.Easing.Cubic.EaseOut = k => --k * k * k + 1;

TWEEN.Easing.Cubic.EaseInOut = k => {

	if ( ( k *= 2 ) < 1 ) return 0.5 * k * k * k;
	return 0.5 * ( ( k -= 2 ) * k * k + 2 );

};

//

TWEEN.Easing.Quartic.EaseIn = k => k * k * k * k;

TWEEN.Easing.Quartic.EaseOut = k => - ( --k * k * k * k - 1 )

TWEEN.Easing.Quartic.EaseInOut = k => {

	if ( ( k *= 2 ) < 1) return 0.5 * k * k * k * k;
	return - 0.5 * ( ( k -= 2 ) * k * k * k - 2 );

};

//

TWEEN.Easing.Quintic.EaseIn = k => k * k * k * k * k;

TWEEN.Easing.Quintic.EaseOut = k => ( k = k - 1 ) * k * k * k * k + 1;

TWEEN.Easing.Quintic.EaseInOut = k => {

	if ( ( k *= 2 ) < 1 ) return 0.5 * k * k * k * k * k;
	return 0.5 * ( ( k -= 2 ) * k * k * k * k + 2 );

};

// 

TWEEN.Easing.Sinusoidal.EaseIn = k => - Math.cos( k * Math.PI / 2 ) + 1;

TWEEN.Easing.Sinusoidal.EaseOut = k => Math.sin( k * Math.PI / 2 );

TWEEN.Easing.Sinusoidal.EaseInOut = k => - 0.5 * ( Math.cos( Math.PI * k ) - 1 );

//

TWEEN.Easing.Exponential.EaseIn = k => k == 0 ? 0 : 2 ** (10 * (k - 1));

TWEEN.Easing.Exponential.EaseOut = k => k == 1 ? 1 : - (2 ** (- 10 * k)) + 1;

TWEEN.Easing.Exponential.EaseInOut = k => {

	if ( k == 0 ) return 0;
        if ( k == 1 ) return 1;
        if ( ( k *= 2 ) < 1 ) return 0.5 * (2 ** (10 * (k - 1)));
        return 0.5 * ( - (2 ** (- 10 * (k - 1))) + 2 );

};

// 

TWEEN.Easing.Circular.EaseIn = k => - ( Math.sqrt( 1 - k * k ) - 1);

TWEEN.Easing.Circular.EaseOut = k => Math.sqrt( 1 - --k * k );

TWEEN.Easing.Circular.EaseInOut = k => {

	if ( ( k /= 0.5 ) < 1) return - 0.5 * ( Math.sqrt( 1 - k * k) - 1);
	return 0.5 * ( Math.sqrt( 1 - ( k -= 2) * k) + 1);

};

//

TWEEN.Easing.Elastic.EaseIn = k => {
    let s;
    let a = 0.1;
    let p = 0.4;
    if ( k == 0 ) return 0;if ( k == 1 ) return 1;if ( !p ) p = 0.3;
    if ( !a || a < 1 ) { a = 1; s = p / 4; }
	else s = p / ( 2 * Math.PI ) * Math.asin( 1 / a );
    return - ( a * (2 ** (10 * (k -= 1))) * Math.sin( ( k - s ) * ( 2 * Math.PI ) / p ) );
};

TWEEN.Easing.Elastic.EaseOut = k => {
    let s;
    let a = 0.1;
    let p = 0.4;
    if ( k == 0 ) return 0;if ( k == 1 ) return 1;if ( !p ) p = 0.3;
    if ( !a || a < 1 ) { a = 1; s = p / 4; }
	else s = p / ( 2 * Math.PI ) * Math.asin( 1 / a );
    return a * (2 ** (- 10 * k)) * Math.sin( ( k - s ) * ( 2 * Math.PI ) / p ) + 1;
};

TWEEN.Easing.Elastic.EaseInOut = k => {
    let s;
    let a = 0.1;
    let p = 0.4;
    if ( k == 0 ) return 0;if ( k == 1 ) return 1;if ( !p ) p = 0.3;
    if ( !a || a < 1 ) { a = 1; s = p / 4; }
    else s = p / ( 2 * Math.PI ) * Math.asin( 1 / a );
    if ( ( k *= 2 ) < 1 ) return - 0.5 * ( a * (2 ** (10 * (k -= 1))) * Math.sin( ( k - s ) * ( 2 * Math.PI ) / p ) );
    return a * (2 ** (-10 * (k -= 1))) * Math.sin( ( k - s ) * ( 2 * Math.PI ) / p ) * 0.5 + 1;
};

//

TWEEN.Easing.Back.EaseIn = k => {

	const s = 1.70158;
	return k * k * ( ( s + 1 ) * k - s );

};

TWEEN.Easing.Back.EaseOut = k => {

	const s = 1.70158;
	return ( k = k - 1 ) * k * ( ( s + 1 ) * k + s ) + 1;

};

TWEEN.Easing.Back.EaseInOut = k => {

	const s = 1.70158 * 1.525;
	if ( ( k *= 2 ) < 1 ) return 0.5 * ( k * k * ( ( s + 1 ) * k - s ) );
	return 0.5 * ( ( k -= 2 ) * k * ( ( s + 1 ) * k + s ) + 2 );

};

// 

TWEEN.Easing.Bounce.EaseIn = k => 1 - TWEEN.Easing.Bounce.EaseOut( 1 - k );

TWEEN.Easing.Bounce.EaseOut = k => {

	if ( ( k /= 1 ) < ( 1 / 2.75 ) ) {

		return 7.5625 * k * k;

	} else if ( k < ( 2 / 2.75 ) ) {

		return 7.5625 * ( k -= ( 1.5 / 2.75 ) ) * k + 0.75;

	} else if ( k < ( 2.5 / 2.75 ) ) {

		return 7.5625 * ( k -= ( 2.25 / 2.75 ) ) * k + 0.9375;

	} else {

		return 7.5625 * ( k -= ( 2.625 / 2.75 ) ) * k + 0.984375;

	}

};

TWEEN.Easing.Bounce.EaseInOut = k => {

	if ( k < 0.5 ) return TWEEN.Easing.Bounce.EaseIn( k * 2 ) * 0.5;
	return TWEEN.Easing.Bounce.EaseOut( k * 2 - 1 ) * 0.5 + 0.5;

};
