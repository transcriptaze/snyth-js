# Notes

1. https://github.com/WebAudio/web-audio-api-v2/issues/109
2. https://bugzilla.mozilla.org/show_bug.cgi?id=1636121
3. https://stackoverflow.com/questions/61070615/how-can-i-import-a-module-into-an-audioworkletprocessor-that-is-changed-elsewher

## DC blocking

1. https://developer.mozilla.org/en-US/docs/Web/API/BiquadFilterNode
2. https://www.embedded.com/dsp-tricks-dc-removal/
3. https://www.musicdsp.org/en/latest/Filters/index.html
4. https://www.musicdsp.org/en/latest/Filters/135-dc-filter.html?highlight=dc%20blocking
5. http://www.dspguru.com/comp.dsp/tricks/alg/dc_block.htm
6. https://stackoverflow.com/questions/6994020/remove-unknown-dc-offset-from-a-non-periodic-discrete-time-signal

## AudioParams

An audio param mixes the default value (1) with the LFO range [-1,+1] to give a value range [0,2]. Not at all 
obvious from the documentation.

Ref. https://developer.mozilla.org/en-US/docs/Web/API/AudioNode/connect

> An AudioParam will take the rendered audio data from any AudioNode output connected
> to it  and convert it to mono by down-mixing (if it is not already mono). Next, it
> will mix it together with any other such outputs, and the intrinsic parameter value
> (the value the AudioParam would normally have without any audio connections), including
> any timeline changes scheduled for the parameter.
