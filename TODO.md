# TODO

- [ ] Two wavetable version changes on reset
- [ ] Multiple invocations of AudioNode constructor
      - (?) Destroy on power off
      - (?) Make singleton
- [ ] Power-on/power-off is resetting the plugs
      - [ ] Reinitialise OSC and LFO and redraw

- [ ] Page transitions
- [ ] Only redraw visible page
- [ ] https://stackoverflow.com/questions/32723167/how-to-programmatically-skip-a-test-in-mocha

- [ ] Set LFO plug drop target area to whole plug
- [ ] Firefox fonts
- [ ] Brighten LFO buttons
- [ ] Velocity sensitive knobs
- [ ] Envelope scrubbers are pernickety - use horizontal only
- [ ] Use object.onload to cache radii
- [ ] alt-click to use initial value

- [ ] AA
      - [ ] alt-click: 24dB
      - [ ] include in settings

- [ ] Restore settings
      - [ ] Make sure DD/wavetable also get initialised
      - [ ] LFOs start erratically
      - [ ] Optimise the controlsets restore - accumulate/set-all/clone-and-set ?

- [ ] Restructure _sn_ to generate an array of values
      - [ ] Optimize wavetable genfn for array
            - [ ] Use slice/shallow copy to map SAB to wavetable
                  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/slice
            - [ ] Reoptimise genfn
            - [ ] Commonalise parameters SAB
            - [ ] Commonalise DDS and wavetable

- [ ] Load/overrun 
      - [ ] Sort by level/onset and drop quiet/old notes
            - [ ] 'policy' settings
            - [ ] FN1: Use sine wave
      - [ ] Convert to Float32 throughout
      - [ ] Convert to TypedArrays throughout
      - [ ] Optimize envelope
            - [ ] Use frames rather than (potentially) erratic currentTime
      - [ ] Replace map/reduce with for loop
      - [ ] Update pre-allocated/static FloatArray

- [ ] eventbus: publish in Promise


## All The Other To Be Done Stuff

- [ ] Rework eventbus using signals a la [Motion Canvas](https://github.com/motion-canvas/motion-canvas)
- [ ] Initialise controlsets from HTML
- [ ] Bar graph of note count and max note count
- [ ] Format MIDI export data all nicely
- [ ] Loop
      - [ ] Thinner icon lines

- [ ] Play 
      - [ ] Ramp volume up/down on pause/play/stop

- [ ] Power off/on
      - [ ] Ramp volume up/down on power on/off
      - (?) alt-power-on to reset everything

- [ ] Keyboard web component

- [ ] Better MIDI file parser

## Notes

1. [autoplay warning](https://developer.chrome.com/blog/autoplay/#webaudio)
2. [Google Chrome Labs WebAudio samples](https://github.com/GoogleChromeLabs/web-audio-samples/tree/main/src/audio-worklet)
3. [MDN: simple synth](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Simple_synth)
4. [soft clipping](https://ccrma.stanford.edu/~jos/pasp/Soft_Clipping.html)
5. https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Advanced_techniques
6. https://web.dev/audio-scheduling/
7. https://cprimozic.net/blog/buliding-a-wavetable-synthesizer-with-rust-wasm-and-webaudio/
8. https://developer.chrome.com/blog/audio-worklet-design-pattern/
9. https://github.com/superpoweredSDK/web-audio-javascript-webassembly-SDK-interactive-audio

### CSS
1. https://accessiblepalette.com
2. https://neumorphism.io/#e0e0e0
3. https://webdesignledger.com/30-examples-of-neumorphism-design/
4. https://www.betterneumorphism.com/
5. https://css-tricks.com/neumorphism-and-css/
6. https://css-tricks.com/snippets/css/animated-grainy-texture/
7. https://www.toptal.com/designers/subtlepatterns/paper-1/
8. https://br.pinterest.com/pin/824510644280132365/


