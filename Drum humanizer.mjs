/*
With Scripter, you can use JavaScript to create your own custom MIDI processing 
effects, including slider controls for real-time interaction.

For detailed information about using Scripter, including code samples, 
see the MIDI plug-ins chapter of the Logic Pro X Effects or 
MainStage 3 Effects manual.
*/

// example: simple pass through and MIDI monitor

const C1Pitch = 36
const D1Pitch = 38

var NeedsTimingInfo = true; /* set to true if you want to use GetTimingInfo, it's required */

// The following lines are used to setup the counters and various memories to decouples the different pitch from each other
let C1Humanizer = getHumanizer();
let D1Humanizer = getHumanizer();

function HandleMIDI(event)
{
	if (event instanceof NoteOff) {
		return event.send();
	}

	if (event.pitch === C1Pitch) {
        const C1_BASE_DELAY = 0.02;
        const C1_BASE_DELAY_ONE_OUT_OF_TWO = 0.01; // Constant delay applied to one out of two events
        const C1_ONE_OUT_OF_TWO_RANDOM_DELAY_SCALE = 0.01; // Randomized delay value applied to one out of two events
        const C1_VELOCITY_CHANGE_PERCENTAGE = 0.8;
        const C1_RESET_AFTER_MS = 500;

		return C1Humanizer(event, C1_BASE_DELAY, C1_BASE_DELAY_ONE_OUT_OF_TWO, C1_ONE_OUT_OF_TWO_RANDOM_DELAY_SCALE, C1_VELOCITY_CHANGE_PERCENTAGE, C1_RESET_AFTER_MS);
  	}
      
    if (event.pitch === D1Pitch) {
        const D1_DELAY_ONE_OUT_OF_TWO = 0.005;
        const D1_ONE_OUT_OF_TWO_RANDOM_DELAY_SCALE = 0.012;
        const D1_VELOCITY_CHANGE_PERCENTAGE = 0.85 ;
        const D1_RESET_AFTER_MS = 350;

		return D1Humanizer(event, 0, D1_DELAY_ONE_OUT_OF_TWO, D1_ONE_OUT_OF_TWO_RANDOM_DELAY_SCALE, D1_VELOCITY_CHANGE_PERCENTAGE, D1_RESET_AFTER_MS);
  	}
  	return event.send();
}

// This function is just used as a setup tool to make sure that different pitch won't share the same counter
function getHumanizer() {
    const state = {
        counter: 0,
        previousEvent: null,
    };

    return (event, baseDelay, oneOutOfTwoDelay, oneOutOfTwoRandomDelayScale, velocityChangePercentage, resetAfterMs) => humanize(state, event, baseDelay, oneOutOfTwoDelay, oneOutOfTwoRandomDelayScale, velocityChangePercentage, resetAfterMs)
}

function humanize(state, event, baseDelay, oneOutOfTwoDelay, oneOutOfTwoRandomDelayScale, velocityChangePercentage, resetAfterMs) {
    const info = GetTimingInfo();
    
    if (state.previousEvent === null) { 
        state.previousEvent = event;
	return event.sendAtBeat(event.beatPos + baseDelay );
	}
    // event.trace()
    state.counter += 1;
    
	const millisecondsPerBeat = 1000 / (info.tempo / 60);

    if ((event.beatPos - state.previousEvent.beatPos) * millisecondsPerBeat > resetAfterMs) {
        state.counter = 0;
        Trace("Reset for " + (event.beatPos - state.previousEvent.beatPos) * millisecondsPerBeat + "ms")
    } 
    // Warning, keep this before any return
	state.previousEvent = event;

	if (state.counter % 2 == 0) {
		return event.sendAtBeat(event.beatPos + baseDelay);
	}
	
  //  Trace("Initial velocity is " + event.velocity);
	event.velocity = state.previousEvent.velocity * ( velocityChangePercentage + 0.06 * Math.random());
  //  Trace("Target velocity is " + event.velocity); 
 
    // Trace("Initial beat is " + event.beatPos);
	const targetBeat = event.beatPos + baseDelay + getOneOutOfTwoDelay(state, oneOutOfTwoDelay, oneOutOfTwoRandomDelayScale);
	// Trace( "Target beat is " + targetBeat);
	return event.sendAtBeat(targetBeat);
}

// Math.random returns a random value between 0 and 1
// Use the value below to fine tune the scale of the delay 
function getOneOutOfTwoDelay(state, oneOutOfTwoDelay, oneOutOfTwoRandomDelayScale) {
	return oneOutOfTwoDelay + Math.random() * oneOutOfTwoRandomDelayScale * (
        1 - Math.exp(- ( state.counter + 6) / 12)
    );
}


function Reset() {
    // Reset by reinitializing the state
    C1Humanizer = getHumanizer();
    D1Humanizer = getHumanizer();
} 